import { useState, useEffect, useCallback } from 'react';
import { useCache, CACHE_CONFIGS } from '../utils/cacheManager';

interface Station {
  name: string;
  address: string;
  rawPrediction: google.maps.places.AutocompletePrediction;
}

const useStationSearch = (initialStation: string) => {
  const [station, setStation] = useState(initialStation);
  const [stationCandidates, setStationCandidates] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

  const predictionsCache = useCache<Station[]>(CACHE_CONFIGS.STATION_PREDICTIONS);
  const nearbyStationsCache = useCache<Station[]>(CACHE_CONFIGS.NEARBY_STATIONS);

  const handleStationInput = useCallback(async (input: string) => {
    if (!input.trim() || (selectedStation && selectedStation.name === input)) {
      return;
    }

    const cached = predictionsCache.getCached(input);
    if (cached) {
      setStationCandidates(cached);
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

      const candidates = predictions.map(prediction => ({
        name: prediction.structured_formatting.main_text,
        address: prediction.structured_formatting.secondary_text || '',
        rawPrediction: prediction
      }));

      predictionsCache.setCached(input, candidates);
      setStationCandidates(candidates);
    });
  }, [selectedStation, predictionsCache]);

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