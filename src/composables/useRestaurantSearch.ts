import { useState, useCallback, useEffect } from 'react';

interface Restaurant {
  place_id: string;
  name: string;
  vicinity: string;
  rating: number;
  user_ratings_total: number;
  price_level: number;
  types: string[];
  photos?: google.maps.places.PlacePhoto[];
  searchKeywords: string[];
  opening_hours?: {
    weekday_text?: string[];
  };
  distance?: number;
  geometry?: {
    location: google.maps.LatLng;
  };
  business_status?: string;
}

interface Station {
  name: string;
  prefecture: string;
}

interface Location {
  lat: number;
  lng: number;
}

const useRestaurantSearch = () => {
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cache, setCache] = useState<Map<string, google.maps.places.PlaceResult[]>>(() => {
    const cachedData = localStorage.getItem('restaurantCache');
    return cachedData ? new Map(JSON.parse(cachedData)) : new Map();
  });

  useEffect(() => {
    localStorage.setItem('restaurantCache', JSON.stringify(Array.from(cache.entries())));
  }, [cache]);

  const generateCacheKey = (request: google.maps.places.PlaceSearchRequest) => {
    return `${request.keyword}-${request.location.lat()}-${request.location.lng()}-${request.radius}`;
  };

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
          if (cache.has(cacheKey)) {
            resolve(cache.get(cacheKey)!);
            return;
          }

          service.nearbySearch(request, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
              setCache(prevCache => {
                const newCache = new Map(prevCache);
                newCache.set(cacheKey, []);
                return newCache;
              });
              resolve([]);
            } else if (status === google.maps.places.PlacesServiceStatus.OK && results) {
              // Filter out permanently closed places
              const activeResults = results.filter(place => 
                place.business_status === 'OPERATIONAL' || place.business_status === undefined
              );
              setCache(prevCache => {
                const newCache = new Map(prevCache);
                newCache.set(cacheKey, activeResults);
                return newCache;
              });
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
          new Promise<Restaurant>((resolve, reject) => {
            service.getDetails({
              placeId: place.place_id,
              fields: ['place_id', 'name', 'vicinity', 'rating', 'user_ratings_total', 'price_level', 'types', 'opening_hours', 'photos', 'geometry', 'business_status']
            }, (result, status) => {
              if (status === google.maps.places.PlacesServiceStatus.OK && result) {
                // Only include operational businesses
                if (result.business_status && result.business_status !== 'OPERATIONAL') {
                  resolve({} as Restaurant); // This will be filtered out later
                  return;
                }

                let distance: number | undefined;
                if (result.geometry?.location) {
                  distance = google.maps.geometry.spherical.computeDistanceBetween(
                    location,
                    result.geometry.location
                  );
                }

                resolve({
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
                });
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
          })
        )
      );

      const filteredResults = detailedResults
        .filter(place => 
          // Filter out empty results and non-operational businesses
          Object.keys(place).length > 0 &&
          (place.business_status === 'OPERATIONAL' || place.business_status === undefined)
        )
        .filter(place => {
          const meetsBasicCriteria = 
            place.rating >= minRating &&
            place.user_ratings_total >= minReviews &&
            selectedPriceLevels.includes(place.price_level);

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
  }, [cache]);

  return {
    allRestaurants,
    filteredRestaurants,
    isLoading,
    error,
    searchNearbyRestaurants
  };
};

export default useRestaurantSearch;
