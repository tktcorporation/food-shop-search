import { useState, useCallback } from 'react';
import { getLocationProgram } from '../programs/getLocation';
import type { LocationData } from '../programs/getLocation';
import { extractFirstFailure, getErrorCode } from '../utils/effectErrors';
import { useEffectRunner } from '../hooks/useEffectRunner';

export const useLocationSearch = () => {
  const [hasPermissionError, setHasPermissionError] = useState(false);

  const runner = useEffectRunner<LocationData>({
    errorFallback: '位置情報の取得に失敗しました。再度お試しください。',
    onError: (cause) => {
      // GeolocationError の場合、PERMISSION_DENIED (code: 1) をチェック
      const firstFailure = extractFirstFailure(cause);
      const code = getErrorCode(firstFailure);
      if (code === 1) {
        setHasPermissionError(true);
      }
    },
  });

  const getCurrentLocation = useCallback(() => {
    if (hasPermissionError) return;
    if (runner.isLoading) return;

    runner.run(getLocationProgram());
  }, [hasPermissionError, runner]);

  return {
    currentLocation: runner.data,
    isLoading: runner.isLoading,
    error: runner.error,
    hasPermissionError,
    getCurrentLocation,
  };
};
