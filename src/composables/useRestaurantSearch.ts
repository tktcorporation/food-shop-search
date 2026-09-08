import { useState, useCallback, useRef } from 'react';
import { Effect, ParseResult } from 'effect';
import {
  filterRestaurants,
  sortByDistance,
  decodeUnknown,
  formatParseError,
  RestaurantSearchParams,
  RestaurantFilterParams,
  type Restaurant,
  type Station,
} from '@shared';
import { searchRestaurantsProgram } from '../programs/searchRestaurants';
import { extractErrorMessage } from '../utils/effectErrors';
import { AppLive } from '../services';

/** 検索結果のインメモリキャッシュキーを生成 */
function buildCacheKey(
  stationPlaceId: string,
  keywords: readonly string[],
): string {
  return `${stationPlaceId}:${[...keywords].sort().join(',')}`;
}

const isParseError = (error: unknown): error is ParseResult.ParseError =>
  typeof error === 'object' &&
  error !== null &&
  '_tag' in error &&
  (error as { _tag: string })._tag === 'ParseError';

const useRestaurantSearch = () => {
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastFilterParamsRef = useRef<RestaurantFilterParams | null>(null);
  const searchCacheRef = useRef(new Map<string, Restaurant[]>());

  const reapplyFilters = useCallback(
    (rawFilterParams: {
      minRating: number;
      minReviews: number;
      isOpenNow: boolean;
      searchRadius: number;
      selectedPriceLevels: number[];
    }) => {
      void Effect.runPromiseExit(
        decodeUnknown(RestaurantFilterParams)(rawFilterParams),
      ).then((exit) => {
        if (exit._tag === 'Failure') {
          setError(
            exit.cause._tag === 'Fail' && isParseError(exit.cause.error)
              ? formatParseError(exit.cause.error)
              : 'フィルター条件が不正です。',
          );
          return;
        }
        const filterParams = exit.value;
        lastFilterParamsRef.current = filterParams;
        setFilteredRestaurants(
          sortByDistance(filterRestaurants(allRestaurants, filterParams)),
        );
      });
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
      setIsLoading(true);
      setError(null);

      const program = Effect.gen(function* () {
        // UI 境界: upstream-form decode
        const params = yield* decodeUnknown(RestaurantSearchParams)({
          keywords,
          minRating,
          minReviews,
          searchLocation,
          isOpenNow,
          searchRadius,
          selectedPriceLevels,
        });
        const filterParams = yield* decodeUnknown(RestaurantFilterParams)({
          minRating: params.minRating,
          minReviews: params.minReviews,
          isOpenNow: params.isOpenNow,
          searchRadius: params.searchRadius,
          selectedPriceLevels: params.selectedPriceLevels,
        });

        const cacheKey = buildCacheKey(
          params.searchLocation.placeId,
          params.keywords,
        );
        const cached = searchCacheRef.current.get(cacheKey);
        if (cached) {
          return {
            filterParams,
            restaurants: cached,
            fromCache: true as const,
          };
        }

        const restaurants = yield* searchRestaurantsProgram(params);
        return {
          filterParams,
          restaurants: [...restaurants],
          fromCache: false as const,
        };
      });

      void Effect.runPromiseExit(Effect.provide(program, AppLive)).then(
        (exit) => {
          if (exit._tag === 'Success') {
            const { filterParams, restaurants, fromCache } = exit.value;
            lastFilterParamsRef.current = filterParams;
            if (!fromCache) {
              searchCacheRef.current.set(
                buildCacheKey(searchLocation.placeId, keywords),
                restaurants,
              );
            }
            setAllRestaurants(restaurants);
            setFilteredRestaurants(
              sortByDistance(filterRestaurants(restaurants, filterParams)),
            );
          } else {
            const message =
              exit.cause._tag === 'Fail' && isParseError(exit.cause.error)
                ? formatParseError(exit.cause.error)
                : extractErrorMessage(
                    exit.cause,
                    '検索中にエラーが発生しました。',
                  );
            setError(message);
            setAllRestaurants([]);
            setFilteredRestaurants([]);
          }
          setIsLoading(false);
        },
      );
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
