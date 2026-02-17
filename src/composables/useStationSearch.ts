import { useState, useEffect, useCallback, useRef } from 'react';
import { Effect } from 'effect';
import type { Station } from './useStationSearch/types';
import { searchStationsProgram } from '../programs/searchStations';
import { searchNearbyStationsProgram } from '../programs/searchNearbyStations';
import { extractFirstFailure } from '../utils/effectErrors';
import { AppLive } from '../services';
import { STATION_SEARCH_DEBOUNCE_MS } from '../constants';

const useStationSearch = () => {
  const [station, setStation] = useState('');
  const [stationCandidates, setStationCandidates] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const hasInitialized = useRef(false);

  // マウント時に最寄り駅を自動検出
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const runnable = Effect.provide(searchNearbyStationsProgram(), AppLive);

    void Effect.runPromiseExit(runnable).then((exit) => {
      if (exit._tag === 'Success' && exit.value.length > 0) {
        const nearest = exit.value[0];
        setStation(nearest.name);
        setSelectedStation(nearest);
      } else {
        setInitError(
          '最寄り駅を取得できませんでした。駅名を入力してください。',
        );
      }
      setIsInitializing(false);
    });
  }, []);

  // テキスト入力による駅検索
  const handleStationInput = useCallback(
    (input: string) => {
      if (
        !input.trim() ||
        (selectedStation && selectedStation.name === input)
      ) {
        return;
      }

      const runnable = Effect.provide(searchStationsProgram(input), AppLive);

      void Effect.runPromiseExit(runnable).then((exit) => {
        if (exit._tag === 'Success') {
          setStationCandidates(exit.value);
        } else {
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
    isInitializing,
    initError,
  };
};

export default useStationSearch;
