import { useState, useEffect, useCallback } from 'react';
import { Effect, Cause } from 'effect';
import type { Station } from './useStationSearch/types';
import { searchStationsProgram } from '../programs/searchStations';
import { GoogleMapsPlacesService, CacheService, AppLive } from '../services';

const useStationSearch = (initialStation: string) => {
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

      // Effect プログラムを構築して実行
      const program = Effect.gen(function* () {
        const placesService = yield* GoogleMapsPlacesService;
        const cacheService = yield* CacheService;
        return yield* searchStationsProgram(placesService, cacheService, input);
      });

      const runnable = Effect.provide(program, AppLive);

      void Effect.runPromiseExit(runnable).then((exit) => {
        if (exit._tag === 'Success') {
          setStationCandidates(exit.value);
        } else {
          // 駅検索のエラーは静かに処理（空リストを表示）
          const failures = Cause.failures(exit.cause);
          const firstFailure = Array.from(failures)[0];
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
    }, 300);

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
