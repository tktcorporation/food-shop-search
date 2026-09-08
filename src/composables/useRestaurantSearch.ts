import { useState, useCallback, useRef } from 'react';
import { Effect } from 'effect';
import {
  filterRestaurants,
  sortByDistance,
  type Restaurant,
  type Station,
  type RestaurantFilterParams,
} from '@shared';
import { searchRestaurantsProgram } from '../programs/searchRestaurants';
import { extractErrorMessage } from '../utils/effectErrors';
import { AppLive } from '../services';

/** 検索結果のインメモリキャッシュキーを生成 */
function buildCacheKey(stationPlaceId: string, keywords: string[]): string {
  return `${stationPlaceId}:${[...keywords].sort().join(',')}`;
}

const useRestaurantSearch = () => {
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastFilterParamsRef = useRef<RestaurantFilterParams | null>(null);
  /** 検索結果のインメモリキャッシュ（駅+キーワード → レストラン配列） */
  const searchCacheRef = useRef(new Map<string, Restaurant[]>());

  const reapplyFilters = useCallback(
    (filterParams: RestaurantFilterParams) => {
      lastFilterParamsRef.current = filterParams;
      const filtered = filterRestaurants(allRestaurants, filterParams);
      const sorted = sortByDistance(filtered);
      setFilteredRestaurants(sorted);
    },
    [allRestaurants],
  );

  const searchNearbyRestaurants = useCallback(
    (
      keywords: string[],
      minRating: number,
      minReviews: number,
      searchLocation: Station,
      isOpenNow: boolean,
      searchRadius: number,
      selectedPriceLevels: number[],
    ) => {
      const filterParams: RestaurantFilterParams = {
        minRating,
        minReviews,
        isOpenNow,
        searchRadius,
        selectedPriceLevels,
      };
      lastFilterParamsRef.current = filterParams;

      const cacheKey = buildCacheKey(searchLocation.placeId, keywords);
      const cached = searchCacheRef.current.get(cacheKey);
      if (cached) {
        setAllRestaurants(cached);
        const filtered = filterRestaurants(cached, filterParams);
        setFilteredRestaurants(sortByDistance(filtered));
        return;
      }

      setIsLoading(true);
      setError(null);

      const program = searchRestaurantsProgram({
        keywords,
        minRating,
        minReviews,
        searchLocation,
        isOpenNow,
        searchRadius,
        selectedPriceLevels,
      });

      const runnable = Effect.provide(program, AppLive);

      void Effect.runPromiseExit(runnable).then((exit) => {
        if (exit._tag === 'Success') {
          const detailedResults = [...exit.value];
          searchCacheRef.current.set(cacheKey, detailedResults);
          setAllRestaurants(detailedResults);
          const filtered = filterRestaurants(detailedResults, filterParams);
          setFilteredRestaurants(sortByDistance(filtered));
        } else {
          const errorMessage = extractErrorMessage(
            exit.cause,
            '検索中にエラーが発生しました。',
          );
          setError(errorMessage);
          setAllRestaurants([]);
          setFilteredRestaurants([]);
        }
        setIsLoading(false);
      });
    },
    [],
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
