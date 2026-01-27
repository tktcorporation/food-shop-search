import { useState, useEffect, useCallback } from 'react';
import { Effect } from 'effect';
import type { Station } from './useStationSearch/types';
import { searchNearbyStationsProgram } from '../programs/searchNearbyStations';
import { extractErrorMessage } from '../utils/effectErrors';
import {
  GeolocationService,
  GoogleMapsPlacesService,
  CacheService,
  AppLive,
} from '../services';

interface UseNearbyStationSearchResult {
  nearbyStations: Station[];
  isLoading: boolean;
  error: string | null;
}

/**
 * 現在地周辺の駅を検索する composable。
 * マウント時に自動的に検索を開始する。
 *
 * @param onStationFound 最寄り駅が見つかった時のコールバック
 */
const useNearbyStationSearch = (
  onStationFound?: (station: Station) => void,
): UseNearbyStationSearchResult => {
  const [nearbyStations, setNearbyStations] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findNearbyStations = useCallback(() => {
    setIsLoading(true);
    setError(null);

    const program = Effect.gen(function* () {
      const geolocationService = yield* GeolocationService;
      const placesService = yield* GoogleMapsPlacesService;
      const cacheService = yield* CacheService;
      return yield* searchNearbyStationsProgram(
        geolocationService,
        placesService,
        cacheService,
      );
    });

    const runnable = Effect.provide(program, AppLive);

    void Effect.runPromiseExit(runnable).then((exit) => {
      setIsLoading(false);
      if (exit._tag === 'Success') {
        setNearbyStations(exit.value);
        if (exit.value.length > 0 && onStationFound) {
          onStationFound(exit.value[0]);
        }
      } else {
        const errorMessage = extractErrorMessage(
          exit.cause,
          '近くの駅を見つけることができませんでした。',
        );
        setError(errorMessage);
      }
    });
  }, [onStationFound]);

  useEffect(() => {
    findNearbyStations();
  }, []); // oxlint-disable-line react-hooks/exhaustive-deps -- mount時に一度だけ実行

  return { nearbyStations, isLoading, error };
};

export default useNearbyStationSearch;
