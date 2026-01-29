import { useState, useEffect, useCallback } from 'react';
import { Effect } from 'effect';
import type { Station } from './useStationSearch/types';
import { searchStationsProgram } from '../programs/searchStations';
import { extractFirstFailure } from '../utils/effectErrors';
import { AppLive } from '../services';
import { STATION_SEARCH_DEBOUNCE_MS } from '../constants';

const useStationSearch = (initialStation = '') => {
  const [station, setStation] = useState(initialStation);
  const [stationCandidates, setStationCandidates] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

  const handleStationInput = useCallback(
    (input: string) => {
      if (
        !input.trim() ||
        (selectedStation && selectedStation.name === input)
      ) {
        return;
      }

      // Effect プログラムを構築して AppLive レイヤーで提供
      const runnable = Effect.provide(searchStationsProgram(input), AppLive);

      void Effect.runPromiseExit(runnable).then((exit) => {
        if (exit._tag === 'Success') {
          setStationCandidates(exit.value);
        } else {
          // 駅検索のエラーは静かに処理（空リストを表示）
          const firstFailure = extractFirstFailure(exit.cause);
          if (firstFailure) {
            console.warn('駅検索エラー:', firstFailure);
          }
          setStationCandidates([]);
        }
      });
    },
    [selectedStation],
  );

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      handleStationInput(station);
    }, STATION_SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(debounceTimer);
  }, [station, handleStationInput]);

  const selectStation = (candidate: Station) => {
    setStation(candidate.name);
    setSelectedStation(candidate);
    setStationCandidates([]);
  };

  return {
    station,
    setStation,
    stationCandidates,
    selectedStation,
    selectStation,
  };
};

export default useStationSearch;
