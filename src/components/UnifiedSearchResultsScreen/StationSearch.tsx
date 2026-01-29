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
      <div className="relative">
        <input
          type="text"
          id="station"
          value={station}
          onChange={(e) => setStation(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          placeholder="駅名を入力してください"
        />
        <Search className="absolute right-3 top-2.5 text-gray-400" size={20} />
      </div>

      <div className="mt-3">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Loader2 className="animate-spin" size={14} />
            近くの駅を検索中...
          </div>
        ) : (
          nearbyStations.length > 0 && (
            <div className="w-full">
              <p className="text-sm text-gray-600 mb-2">近くの駅:</p>
              <div className="flex flex-wrap gap-2">
                {nearbyStations.map((nearbyStation) => (
                  <button
                    key={nearbyStation.name}
                    onClick={() => selectStation(nearbyStation)}
                    className={`px-3 py-1 text-sm rounded-full transition-colors duration-200 flex items-center gap-1
                      ${
                        station === nearbyStation.name
                          ? 'bg-primary-500 text-white'
                          : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
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
        <ul className="mt-2 bg-white border border-gray-300 rounded-md shadow-sm">
          {stationCandidates.map((candidate, index) => (
            <li
              key={index}
              onClick={() => selectStation(candidate)}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
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
