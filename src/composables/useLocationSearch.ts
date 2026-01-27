import { useState, useCallback } from 'react';
import { Effect, Cause } from 'effect';
import { getLocationProgram } from '../programs/getLocation';
import type { LocationData } from '../programs/getLocation';
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
        const failures = Cause.failures(exit.cause);
        const firstFailure = Array.from(failures)[0];
        let errorMessage = '位置情報の取得に失敗しました。再度お試しください。';

        if (
          firstFailure &&
          typeof firstFailure === 'object' &&
          firstFailure !== null
        ) {
          if ('message' in firstFailure) {
            errorMessage = (firstFailure as { message: string }).message;
          }
          // GeolocationError の場合、PERMISSION_DENIED (code: 1) をチェック
          if ('code' in firstFailure) {
            const code = (firstFailure as { code: number }).code;
            if (code === 1) {
              setHasPermissionError(true);
            }
          }
          // HttpsRequiredError / GeolocationUnsupportedError も message で対応済み
          if ('_tag' in firstFailure) {
            const tag = (firstFailure as { _tag: string })._tag;
            if (
              tag === 'HttpsRequiredError' ||
              tag === 'GeolocationUnsupportedError'
            ) {
              // これらは再試行不可のためフラグは不要
            }
          }
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
