import { useState, useCallback, useRef } from 'react';
import { useCache, CACHE_CONFIGS } from '../utils/cacheManager';
import { calculateOperatingHours } from '../utils/operatingHours';
import type { Restaurant } from './useRestaurantSearch/types';
import {
  RestaurantSchema,
  FilterParamsSchema,
} from './useRestaurantSearch/types';
import type { Station } from './useStationSearch/types';
import type { Location, FilterParams } from '../schemas';

// getDetailsの最大呼び出し数（コスト制御）
const MAX_DETAILS_REQUESTS = 20;

const useRestaurantSearch = () => {
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 最後のフィルターパラメータを保持（applyFilters用）
  const lastFilterParamsRef = useRef<FilterParams | null>(null);

  const searchCache = useCache<google.maps.places.PlaceResult[]>(
    CACHE_CONFIGS.RESTAURANT_SEARCH,
  );
  const detailsCache = useCache<Restaurant>(CACHE_CONFIGS.RESTAURANT_DETAILS);
  const geocodeForwardCache = useCache<{ lat: number; lng: number }>(
    CACHE_CONFIGS.GEOCODE_FORWARD,
  );

  const generateCacheKey = (request: google.maps.places.PlaceSearchRequest) => {
    const loc = request.location;
    if (!loc) return `${request.keyword}-unknown-${request.radius}`;
    const lat = typeof loc.lat === 'function' ? loc.lat() : loc.lat;
    const lng = typeof loc.lng === 'function' ? loc.lng() : loc.lng;
    return `${request.keyword}-${lat}-${lng}-${request.radius}`;
  };

  const getPlaceDetails = useCallback(
    async (
      service: google.maps.places.PlacesService,
      place: google.maps.places.PlaceResult & { searchKeywords: string[] },
      location: google.maps.LatLng,
    ): Promise<Restaurant | null> => {
      const cached = detailsCache.getCached(place.place_id!);
      if (cached) {
        return RestaurantSchema.parse({
          ...cached,
          searchKeywords: place.searchKeywords,
        });
      }

      return new Promise<Restaurant | null>((resolve, reject) => {
        service.getDetails(
          {
            placeId: place.place_id!,
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
              'business_status',
            ],
          },
          (result, status) => {
            if (
              status === google.maps.places.PlacesServiceStatus.OK &&
              result
            ) {
              if (
                result.business_status &&
                result.business_status !== 'OPERATIONAL'
              ) {
                resolve(null);
                return;
              }

              let distance: number | undefined;
              if (result.geometry?.location) {
                distance =
                  google.maps.geometry.spherical.computeDistanceBetween(
                    location,
                    result.geometry.location,
                  );
              }

              const restaurantData = RestaurantSchema.parse({
                place_id: result.place_id,
                name: result.name,
                vicinity: result.vicinity || '',
                rating: result.rating || 0,
                user_ratings_total: result.user_ratings_total || 0,
                price_level: result.price_level || 1,
                types: result.types || [],
                photos: result.photos,
                searchKeywords: place.searchKeywords,
                opening_hours: result.opening_hours
                  ? {
                      weekday_text: result.opening_hours.weekday_text,
                    }
                  : undefined,
                distance,
                geometry: result.geometry?.location
                  ? {
                      location: result.geometry.location,
                    }
                  : undefined,
                business_status: result.business_status,
              });

              detailsCache.setCached(result.place_id!, restaurantData);
              resolve(restaurantData);
            } else if (
              status === google.maps.places.PlacesServiceStatus.REQUEST_DENIED
            ) {
              reject(
                new Error(
                  'Google Maps APIの認証に失敗しました。APIキーを確認してください。',
                ),
              );
            } else {
              const fallback = RestaurantSchema.safeParse({
                place_id: place.place_id,
                name: place.name,
                vicinity: place.vicinity || '',
                rating: place.rating || 0,
                user_ratings_total: place.user_ratings_total || 0,
                price_level: place.price_level || 1,
                types: place.types || [],
                searchKeywords: place.searchKeywords,
                opening_hours: undefined,
                business_status: place.business_status,
              });
              resolve(fallback.success ? fallback.data : null);
            }
          },
        );
      });
    },
    [detailsCache],
  );

  // クライアント側フィルタリング（APIを呼ばない）
  const applyFilters = useCallback(
    (
      restaurants: Restaurant[],
      rawFilterParams: {
        minRating: number;
        minReviews: number;
        isOpenNow: boolean;
        searchRadius: number;
        selectedPriceLevels: number[];
      },
    ): Restaurant[] => {
      const {
        minRating,
        minReviews,
        isOpenNow,
        searchRadius,
        selectedPriceLevels,
      } = FilterParamsSchema.parse(rawFilterParams);

      const filtered = restaurants
        .filter(
          (place) =>
            place.business_status === 'OPERATIONAL' ||
            place.business_status === undefined,
        )
        .filter((place) => {
          const meetsBasicCriteria =
            place.rating >= minRating &&
            place.user_ratings_total >= minReviews &&
            selectedPriceLevels.includes(place.price_level);

          if (
            isOpenNow &&
            !calculateOperatingHours(place.opening_hours?.weekday_text)
          ) {
            return false;
          }

          if (searchRadius <= 100 && place.distance !== undefined) {
            return meetsBasicCriteria && place.distance <= searchRadius;
          }

          return meetsBasicCriteria;
        });

      return filtered.sort((a, b) => {
        if (a.distance === undefined && b.distance === undefined) return 0;
        if (a.distance === undefined) return 1;
        if (b.distance === undefined) return -1;
        return a.distance - b.distance;
      });
    },
    [],
  );

  // フィルターのみ再適用（API呼び出しなし）
  const reapplyFilters = useCallback(
    (filterParams: {
      minRating: number;
      minReviews: number;
      isOpenNow: boolean;
      searchRadius: number;
      selectedPriceLevels: number[];
    }) => {
      lastFilterParamsRef.current = FilterParamsSchema.parse(filterParams);
      const sorted = applyFilters(allRestaurants, filterParams);
      setFilteredRestaurants(sorted);
    },
    [allRestaurants, applyFilters],
  );

  // 検索実行（API呼び出しが必要なパラメータ変更時のみ）
  const searchNearbyRestaurants = useCallback(
    async (
      keywords: string[],
      minRating: number,
      minReviews: number,
      searchLocation: Station | Location,
      isOpenNow: boolean,
      searchRadius: number,
      selectedPriceLevels: number[],
    ) => {
      setIsLoading(true);
      setError(null);

      const filterParams = {
        minRating,
        minReviews,
        isOpenNow,
        searchRadius,
        selectedPriceLevels,
      };
      lastFilterParamsRef.current = FilterParamsSchema.parse(filterParams);

      try {
        let location: google.maps.LatLng;

        if ('lat' in searchLocation) {
          location = new google.maps.LatLng(
            searchLocation.lat,
            searchLocation.lng,
          );
        } else {
          // Forward geocodingをキャッシュで最適化
          const geocodeCacheKey = `${searchLocation.name}_${searchLocation.prefecture}`;
          const cachedGeocode = geocodeForwardCache.getCached(geocodeCacheKey);

          if (cachedGeocode) {
            location = new google.maps.LatLng(
              cachedGeocode.lat,
              cachedGeocode.lng,
            );
          } else {
            const geocoder = new google.maps.Geocoder();
            const result = await new Promise<google.maps.GeocoderResult>(
              (resolve, reject) => {
                void geocoder.geocode(
                  {
                    address: `${searchLocation.name}駅,${searchLocation.prefecture}`,
                  },
                  (results, status) => {
                    if (
                      status === google.maps.GeocoderStatus.OK &&
                      results?.[0]
                    ) {
                      resolve(results[0]);
                    } else if (
                      status === google.maps.GeocoderStatus.REQUEST_DENIED
                    ) {
                      reject(
                        new Error(
                          'Google Maps APIの認証に失敗しました。APIキーを確認してください。',
                        ),
                      );
                    } else {
                      reject(new Error('位置を取得できませんでした。'));
                    }
                  },
                );
              },
            );
            location = result.geometry.location;
            geocodeForwardCache.setCached(geocodeCacheKey, {
              lat: location.lat(),
              lng: location.lng(),
            });
          }
        }

        const service = new google.maps.places.PlacesService(
          document.createElement('div'),
        );

        const searchPromises = keywords.map(
          (keyword) =>
            new Promise<google.maps.places.PlaceResult[]>((resolve, reject) => {
              const request: google.maps.places.PlaceSearchRequest = {
                keyword: keyword,
                location: location,
                radius: searchRadius,
              };

              const cacheKey = generateCacheKey(request);
              const cached = searchCache.getCached(cacheKey);
              if (cached) {
                resolve(cached);
                return;
              }

              service.nearbySearch(request, (results, status) => {
                if (
                  status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS
                ) {
                  searchCache.setCached(cacheKey, []);
                  resolve([]);
                } else if (
                  status === google.maps.places.PlacesServiceStatus.OK &&
                  results
                ) {
                  const activeResults = results.filter(
                    (place) =>
                      place.business_status === 'OPERATIONAL' ||
                      place.business_status === undefined,
                  );
                  searchCache.setCached(cacheKey, activeResults);
                  resolve(activeResults);
                } else if (
                  status ===
                  google.maps.places.PlacesServiceStatus.REQUEST_DENIED
                ) {
                  reject(
                    new Error(
                      'Google Maps APIの認証に失敗しました。APIキーを確認してください。',
                    ),
                  );
                } else {
                  reject(new Error(`${keyword}の検索に失敗しました。`));
                }
              });
            }),
        );

        const searchResults = await Promise.all(searchPromises);
        const combinedResults = searchResults.flatMap((results, index) =>
          results.map((place) => ({
            ...place,
            searchKeywords: [keywords[index]],
          })),
        );

        const uniqueResults = combinedResults.reduce(
          (acc, current) => {
            const x = acc.find((item) => item.place_id === current.place_id);
            if (!x) {
              return acc.concat([current]);
            } else {
              x.searchKeywords = [
                ...new Set([...x.searchKeywords, ...current.searchKeywords]),
              ];
              return acc;
            }
          },
          [] as (google.maps.places.PlaceResult & {
            searchKeywords: string[];
          })[],
        );

        // getDetails呼び出し数を制限（コスト最適化）
        const limitedResults = uniqueResults.slice(0, MAX_DETAILS_REQUESTS);

        const detailedResultsRaw = await Promise.all(
          limitedResults.map((place) =>
            getPlaceDetails(service, place, location),
          ),
        );
        const detailedResults = detailedResultsRaw.filter(
          (r): r is Restaurant => r !== null,
        );

        setAllRestaurants(detailedResults);

        const sortedResults = applyFilters(detailedResults, filterParams);
        setFilteredRestaurants(sortedResults);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : '検索中にエラーが発生しました。';
        setError(errorMessage);
        setAllRestaurants([]);
        setFilteredRestaurants([]);
      } finally {
        setIsLoading(false);
      }
    },
    [searchCache, getPlaceDetails, geocodeForwardCache, applyFilters],
  );

  return {
    allRestaurants,
    filteredRestaurants,
    isLoading,
    error,
    searchNearbyRestaurants,
    reapplyFilters,
  };
};

export default useRestaurantSearch;
