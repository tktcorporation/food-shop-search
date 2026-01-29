import { useCallback } from 'react';
import type React from 'react';
import { Search, Navigation, Loader2 } from 'lucide-react';
import ErrorAlert from '../ui/ErrorAlert';
import useNearbyStationSearch from '../../composables/useNearbyStationSearch';
import type { Station } from '../../composables/useStationSearch/types';

interface StationSearchProps {
  station: string;
  setStation: (station: string) => void;
  stationCandidates: Station[];
  selectStation: (station: Station) => void;
}

const StationSearch: React.FC<StationSearchProps> = ({
  station,
  setStation,
  stationCandidates,
  selectStation,
}) => {
  const onStationFound = useCallback(
    (found: Station) => {
      setStation(found.name);
      selectStation(found);
    },
    [setStation, selectStation],
  );

  const { nearbyStations, isLoading, error } =
    useNearbyStationSearch(onStationFound);

  return (
    <div className="mb-6">
      <label
        htmlFor="station"
        className="block text-sm font-medium text-text mb-2"
      >
        駅名
      </label>
      <div className="relative">
        <input
          type="text"
          id="station"
          value={station}
          onChange={(e) => setStation(e.target.value)}
          className="input pr-10"
          placeholder="駅名を入力してください"
        />
        <Search className="absolute right-3 top-3 text-text-muted" size={20} />
      </div>

      <div className="mt-3">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Loader2 className="animate-spin" size={14} />
            近くの駅を検索中...
          </div>
        ) : (
          nearbyStations.length > 0 && (
            <div className="w-full">
              <p className="text-sm text-text-muted mb-2">近くの駅:</p>
              <div className="flex flex-wrap gap-2">
                {nearbyStations.map((nearbyStation) => (
                  <button
                    key={nearbyStation.name}
                    onClick={() => selectStation(nearbyStation)}
                    className={`chip flex items-center gap-1
                      ${
                        station === nearbyStation.name
                          ? 'chip-selected'
                          : 'bg-primary-100 text-primary-600 hover:bg-primary-200'
                      }`}
                  >
                    <Navigation size={14} />
                    {nearbyStation.name}
                    {nearbyStation.distance && (
                      <span className="text-xs opacity-75">
                        ({(nearbyStation.distance / 1000).toFixed(1)}km)
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )
        )}
      </div>

      {error && <ErrorAlert message={error} className="mt-2" />}

      {stationCandidates.length > 0 && (
        <ul className="mt-2 bg-surface-card border border-gray-200 rounded-lg shadow-md overflow-hidden">
          {stationCandidates.map((candidate, index) => (
            <li
              key={index}
              onClick={() => selectStation(candidate)}
              className="px-4 py-3 hover:bg-surface-muted cursor-pointer transition-colors duration-200 border-b border-gray-100 last:border-b-0"
            >
              {candidate.name} ({candidate.address})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default StationSearch;
