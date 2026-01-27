import { useState, useCallback, useRef } from 'react';
import { Effect } from 'effect';
import type { Restaurant, Location } from './useRestaurantSearch/types';
import type { Station } from './useStationSearch/types';
import { filterRestaurants, sortByDistance } from './useRestaurantSearch/utils';
import { searchRestaurantsProgram } from '../programs/searchRestaurants';
import { extractErrorMessage } from '../utils/effectErrors';
import {
  GoogleMapsGeocoderService,
  GoogleMapsPlacesService,
  CacheService,
  AppLive,
} from '../services';

interface FilterParams {
  minRating: number;
  minReviews: number;
  isOpenNow: boolean;
  searchRadius: number;
  selectedPriceLevels: number[];
}

const useRestaurantSearch = () => {
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastFilterParamsRef = useRef<FilterParams | null>(null);

  // フィルターのみ再適用（API呼び出しなし）
  const reapplyFilters = useCallback(
    (filterParams: FilterParams) => {
      lastFilterParamsRef.current = filterParams;
      const filtered = filterRestaurants(allRestaurants, filterParams);
      const sorted = sortByDistance(filtered);
      setFilteredRestaurants(sorted);
    },
    [allRestaurants],
  );

  // Effect プログラムによる検索実行
  const searchNearbyRestaurants = useCallback(
    (
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

      const filterParams: FilterParams = {
        minRating,
        minReviews,
        isOpenNow,
        searchRadius,
        selectedPriceLevels,
      };
      lastFilterParamsRef.current = filterParams;

      // Effect プログラムを構築: サービスを取得して検索を実行
      const program = Effect.gen(function* () {
        const geocoderService = yield* GoogleMapsGeocoderService;
        const placesService = yield* GoogleMapsPlacesService;
        const cacheService = yield* CacheService;

        return yield* searchRestaurantsProgram(
          geocoderService,
          placesService,
          cacheService,
          {
            keywords,
            minRating,
            minReviews,
            searchLocation,
            isOpenNow,
            searchRadius,
            selectedPriceLevels,
          },
        );
      });

      // AppLive レイヤーで全サービスを提供して実行
      const runnable = Effect.provide(program, AppLive);

      void Effect.runPromiseExit(runnable).then((exit) => {
        if (exit._tag === 'Success') {
          const detailedResults = exit.value;
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
