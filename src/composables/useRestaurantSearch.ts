import { useState, useCallback } from 'react';
import { useCache, CACHE_CONFIGS } from '../utils/cacheManager';
import { calculateOperatingHours } from '../utils/operatingHours';
import { Restaurant } from './useRestaurantSearch/types';
import { Station } from './useStationSearch/types';

// ... (前のインターフェース定義は同じ)

const useRestaurantSearch = () => {
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchCache = useCache<google.maps.places.PlaceResult[]>(CACHE_CONFIGS.RESTAURANT_SEARCH);
  const detailsCache = useCache<Restaurant>(CACHE_CONFIGS.RESTAURANT_DETAILS);

  const generateCacheKey = (request: google.maps.places.PlaceSearchRequest) => {
    return `${request.keyword}-${request.location.lat()}-${request.location.lng()}-${request.radius}`;
  };

  const getPlaceDetails = useCallback(async (
    service: google.maps.places.PlacesService,
    place: google.maps.places.PlaceResult & { searchKeywords: string[] },
    location: google.maps.LatLng
  ): Promise<Restaurant> => {
    const cached = detailsCache.getCached(place.place_id!);
    if (cached) {
      return {
        ...cached,
        searchKeywords: place.searchKeywords
      };
    }

    return new Promise<Restaurant>((resolve, reject) => {
      service.getDetails({
        placeId: place.place_id,
        fields: [
          'place_id',
          'name',
          'vicinity',
          'rating',
          'user_ratings_total',
          'price_level',
          'types',
          'opening_hours',
          'photos',
          'geometry',
          'business_status'
        ]
      }, (result, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && result) {
          if (result.business_status && result.business_status !== 'OPERATIONAL') {
            resolve({} as Restaurant);
            return;
          }

          let distance: number | undefined;
          if (result.geometry?.location) {
            distance = google.maps.geometry.spherical.computeDistanceBetween(
              location,
              result.geometry.location
            );
          }

          const restaurantData: Restaurant = {
            place_id: result.place_id!,
            name: result.name!,
            vicinity: result.vicinity!,
            rating: result.rating || 0,
            user_ratings_total: result.user_ratings_total || 0,
            price_level: result.price_level || 1,
            types: result.types || [],
            photos: result.photos,
            searchKeywords: place.searchKeywords,
            opening_hours: result.opening_hours ? {
              weekday_text: result.opening_hours.weekday_text
            } : undefined,
            distance,
            geometry: result.geometry ? {
              location: result.geometry.location
            } : undefined,
            business_status: result.business_status
          };

          detailsCache.setCached(result.place_id!, restaurantData);
          resolve(restaurantData);
        } else if (status === google.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
          reject(new Error('Google Maps APIの認証に失敗しました。APIキーを確認してください。'));
        } else {
          resolve({
            place_id: place.place_id!,
            name: place.name!,
            vicinity: place.vicinity!,
            rating: place.rating || 0,
            user_ratings_total: place.user_ratings_total || 0,
            price_level: place.price_level || 1,
            types: place.types || [],
            searchKeywords: place.searchKeywords,
            opening_hours: undefined,
            business_status: place.business_status
          });
        }
      });
    });
  }, [detailsCache]);

  const searchNearbyRestaurants = useCallback(async (
    keywords: string[],
    minRating: number,
    minReviews: number,
    searchLocation: Station | Location,
    isOpenNow: boolean,
    searchRadius: number,
    selectedPriceLevels: number[]
  ) => {
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
        uniqueResults.map(place => getPlaceDetails(service, place, location))
      );

      const filteredResults = detailedResults
        .filter(place => 
          Object.keys(place).length > 0 &&
          (place.business_status === 'OPERATIONAL' || place.business_status === undefined)
        )
        .filter(place => {
          const meetsBasicCriteria = 
            place.rating >= minRating &&
            place.user_ratings_total >= minReviews &&
            selectedPriceLevels.includes(place.price_level);

          if (isOpenNow && !calculateOperatingHours(place.opening_hours?.weekday_text)) {
            return false;
          }

          if (searchRadius <= 100 && place.distance !== undefined) {
            return meetsBasicCriteria && place.distance <= searchRadius;
          }

          return meetsBasicCriteria;
        });

      const sortedResults = filteredResults.sort((a, b) => {
        if (a.distance === undefined && b.distance === undefined) return 0;
        if (a.distance === undefined) return 1;
        if (b.distance === undefined) return -1;
        return a.distance - b.distance;
      });

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
  }, [searchCache, detailsCache, getPlaceDetails]);

  return {
    allRestaurants,
    filteredRestaurants,
    isLoading,
    error,
    searchNearbyRestaurants
  };
};

export default useRestaurantSearch;