import { useState, useCallback } from 'react';
import { useCache, CACHE_CONFIGS } from '../../utils/cacheManager';
import { Restaurant, SearchParams } from './types';
import { generateCacheKey, filterRestaurants, sortByDistance } from './utils';
import { getPlaceDetails } from './getPlaceDetails';

const useRestaurantSearch = () => {
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchCache = useCache<google.maps.places.PlaceResult[]>(CACHE_CONFIGS.RESTAURANT_SEARCH);
  const detailsCache = useCache<Restaurant>(CACHE_CONFIGS.RESTAURANT_DETAILS);

  const searchNearbyRestaurants = useCallback(async ({
    keywords,
    minRating,
    minReviews,
    searchLocation,
    isOpenNow,
    searchRadius,
    selectedPriceLevels
  }: SearchParams) => {
    setIsLoading(true);
    setError(null);

    try {
      let location: google.maps.LatLng;

      if ('lat' in searchLocation) {
        location = new google.maps.LatLng(searchLocation.lat, searchLocation.lng);
      } else {
        const geocoder = new google.maps.Geocoder();
        const result = await new Promise<google.maps.GeocoderResult>((resolve, reject) => {
          geocoder.geocode(
            { address: `${searchLocation.name}駅,${searchLocation.prefecture}` },
            (results, status) => {
              if (status === google.maps.GeocoderStatus.OK && results?.[0]) {
                resolve(results[0]);
              } else if (status === google.maps.GeocoderStatus.REQUEST_DENIED) {
                reject(new Error('Google Maps APIの認証に失敗しました。APIキーを確認してください。'));
              } else {
                reject(new Error('位置を取得できませんでした。'));
              }
            }
          );
        });
        location = result.geometry.location;
      }

      const service = new google.maps.places.PlacesService(document.createElement('div'));

      const searchPromises = keywords.map(keyword => 
        new Promise<google.maps.places.PlaceResult[]>((resolve, reject) => {
          const request: google.maps.places.PlaceSearchRequest = {
            keyword: keyword,
            location: location,
            radius: searchRadius
          };

          const cacheKey = generateCacheKey(request);
          const cached = searchCache.getCached(cacheKey);
          if (cached) {
            resolve(cached);
            return;
          }

          service.nearbySearch(request, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
              searchCache.setCached(cacheKey, []);
              resolve([]);
            } else if (status === google.maps.places.PlacesServiceStatus.OK && results) {
              const activeResults = results.filter(place => 
                place.business_status === 'OPERATIONAL' || place.business_status === undefined
              );
              searchCache.setCached(cacheKey, activeResults);
              resolve(activeResults);
            } else if (status === google.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
              reject(new Error('Google Maps APIの認証に失敗しました。APIキーを確認してください。'));
            } else {
              reject(new Error(`${keyword}の検索に失敗しました。`));
            }
          });
        })
      );

      const searchResults = await Promise.all(searchPromises);
      const combinedResults = searchResults.flatMap((results, index) => 
        results.map(place => ({
          ...place,
          searchKeywords: [keywords[index]]
        }))
      );

      const uniqueResults = combinedResults.reduce((acc, current) => {
        const x = acc.find(item => item.place_id === current.place_id);
        if (!x) {
          return acc.concat([current]);
        } else {
          x.searchKeywords = [...new Set([...x.searchKeywords, ...current.searchKeywords])];
          return acc;
        }
      }, [] as (google.maps.places.PlaceResult & { searchKeywords: string[] })[]);

      const detailedResults = await Promise.all(
        uniqueResults.map(place => 
          getPlaceDetails(service, place, location, detailsCache)
        )
      );

      const filteredResults = filterRestaurants(detailedResults, {
        minRating,
        minReviews,
        isOpenNow,
        searchRadius,
        selectedPriceLevels
      });

      const sortedResults = sortByDistance(filteredResults);

      setAllRestaurants(sortedResults);
      setFilteredRestaurants(sortedResults);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '検索中にエラーが発生しました。';
      setError(errorMessage);
      setAllRestaurants([]);
      setFilteredRestaurants([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchCache, detailsCache]);

  return {
    allRestaurants,
    filteredRestaurants,
    isLoading,
    error,
    searchNearbyRestaurants
  };
};

export default useRestaurantSearch;