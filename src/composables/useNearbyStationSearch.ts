import { useEffect, useMemo } from 'react';
import type { Station } from './useStationSearch/types';
import { searchNearbyStationsProgram } from '../programs/searchNearbyStations';
import { useEffectRunner } from '../hooks/useEffectRunner';

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
  const runner = useEffectRunner<Station[]>({
    initialData: [],
    errorFallback: '近くの駅を見つけることができませんでした。',
    onSuccess: (stations) => {
      if (stations.length > 0 && onStationFound) {
        onStationFound(stations[0]);
      }
    },
  });

  useEffect(() => {
    runner.run(searchNearbyStationsProgram());
  }, []); // oxlint-disable-line react-hooks/exhaustive-deps -- mount時に一度だけ実行

  return useMemo(
    () => ({
      nearbyStations: runner.data ?? [],
      isLoading: runner.isLoading,
      error: runner.error,
    }),
    [runner.data, runner.isLoading, runner.error],
  );
};

export default useNearbyStationSearch;
