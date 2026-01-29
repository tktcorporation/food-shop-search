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
    <div>
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={station}
          onChange={(e) => setStation(e.target.value)}
          className="input pr-10"
          placeholder="駅名を入力"
        />
        <Search
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
          size={18}
        />
      </div>

      {/* Nearby Stations */}
      {isLoading ? (
        <div className="flex items-center gap-2 mt-2 text-xs text-text-muted">
          <Loader2 className="animate-spin" size={12} />
          近くの駅を検索中...
        </div>
      ) : (
        nearbyStations.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {nearbyStations.map((nearbyStation) => (
              <button
                key={nearbyStation.name}
                onClick={() => selectStation(nearbyStation)}
                className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 transition-colors
                  ${
                    station === nearbyStation.name
                      ? 'bg-primary-600 text-white'
                      : 'bg-primary-50 text-text-muted hover:bg-primary-100'
                  }`}
              >
                <Navigation size={10} />
                {nearbyStation.name}
                {nearbyStation.distance && (
                  <span className="opacity-75">
                    {(nearbyStation.distance / 1000).toFixed(1)}km
                  </span>
                )}
              </button>
            ))}
          </div>
        )
      )}

      {error && <ErrorAlert message={error} className="mt-2 text-xs" />}

      {/* Station Candidates Dropdown */}
      {stationCandidates.length > 0 && (
        <ul className="mt-2 bg-white border border-primary-200 rounded-lg shadow-lg overflow-hidden">
          {stationCandidates.map((candidate, index) => (
            <li
              key={index}
              onClick={() => selectStation(candidate)}
              className="px-3 py-2 hover:bg-primary-50 cursor-pointer transition-colors text-sm border-b border-primary-100 last:border-b-0"
            >
              <span className="font-medium text-text">{candidate.name}</span>
              <span className="text-text-muted ml-2 text-xs">
                ({candidate.address})
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default StationSearch;
