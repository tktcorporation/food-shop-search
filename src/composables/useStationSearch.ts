import { useState, useEffect, useCallback } from 'react';

interface Station {
  name: string;
  address: string;
  rawPrediction: google.maps.places.AutocompletePrediction;
}

const useStationSearch = (initialStation: string) => {
  const [station, setStation] = useState(initialStation);
  const [stationCandidates, setStationCandidates] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

  // 駅名の入力を処理する関数
  const handleStationInput = useCallback(async (input: string) => {
    if (selectedStation && selectedStation.name === input) {
      // 選択された駅が入力と同じ場合は検索を行わない
      return;
    }

    const service = new google.maps.places.AutocompleteService();
    const request = {
      input: `${input}`,
      types: ['transit_station', 'train_station', 'airport', 'subway_station'],
      componentRestrictions: { country: 'jp' },
    };

    service.getPlacePredictions(request, (predictions, status) => {
      if (status !== google.maps.places.PlacesServiceStatus.OK || !predictions) {
        setStationCandidates([]);
        return;
      }

      // 検索結果を格納して、建物名と住所を分割
      const candidates = predictions.map(prediction => {
        const name = prediction.structured_formatting.main_text;
        const address = prediction.structured_formatting.secondary_text || '';
        return { name, address, rawPrediction: prediction };
      });

      setStationCandidates(candidates);
    });
  }, [selectedStation]);

  // 入力値が変更されたときのディバウンス処理
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      handleStationInput(station);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [station, handleStationInput]);

  // 駅を選択する関数
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