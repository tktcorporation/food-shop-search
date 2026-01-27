import { useState, useCallback } from 'react';
import { Effect } from 'effect';
import { getLocationProgram } from '../programs/getLocation';
import type { LocationData } from '../programs/getLocation';
import {
  extractErrorMessage,
  extractFirstFailure,
  getErrorCode,
} from '../utils/effectErrors';
import {
  GeolocationService,
  GoogleMapsGeocoderService,
  CacheService,
  AppLive,
} from '../services';

export const useLocationSearch = () => {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermissionError, setHasPermissionError] = useState(false);

  const getCurrentLocation = useCallback(() => {
    if (hasPermissionError) return;
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    // Effect プログラムを構築して実行
    const program = Effect.gen(function* () {
      const geolocationService = yield* GeolocationService;
      const geocoderService = yield* GoogleMapsGeocoderService;
      const cacheService = yield* CacheService;
      return yield* getLocationProgram(
        geolocationService,
        geocoderService,
        cacheService,
      );
    });

    const runnable = Effect.provide(program, AppLive);

    void Effect.runPromiseExit(runnable).then((exit) => {
      if (exit._tag === 'Success') {
        setCurrentLocation(exit.value);
        setError(null);
        setHasPermissionError(false);
      } else {
        const errorMessage = extractErrorMessage(
          exit.cause,
          '位置情報の取得に失敗しました。再度お試しください。',
        );

        // GeolocationError の場合、PERMISSION_DENIED (code: 1) をチェック
        const firstFailure = extractFirstFailure(exit.cause);
        const code = getErrorCode(firstFailure);
        if (code === 1) {
          setHasPermissionError(true);
        }

        setError(errorMessage);
      }
      setIsLoading(false);
    });
  }, [hasPermissionError, isLoading]);

  return {
    currentLocation,
    setCurrentLocation,
    isLoading,
    error,
    hasPermissionError,
    getCurrentLocation,
  };
};
