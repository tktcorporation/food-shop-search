import { useCallback, useState, useRef } from 'react';
import type React from 'react';
import { Search, X } from 'lucide-react';
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
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onStationFound = useCallback(
    (found: Station) => {
      setStation(found.name);
      selectStation(found);
    },
    [setStation, selectStation],
  );

  const { nearbyStations } = useNearbyStationSearch(onStationFound);

  const handleSelect = (s: Station) => {
    selectStation(s);
    setStation(s.name);
    setIsFocused(false);
  };

  const showDropdown =
    isFocused && (stationCandidates.length > 0 || nearbyStations.length > 0);

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={station}
            onChange={(e) => setStation(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            className="w-full pl-3 pr-9 py-2 text-base border border-primary-200 rounded-lg focus:border-primary-500 focus:outline-hidden"
            placeholder="駅名を入力"
            autoComplete="off"
            data-1p-ignore
          />
          {station ? (
            <button
              onClick={() => setStation('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
            >
              <X size={18} />
            </button>
          ) : (
            <Search
              size={18}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted"
            />
          )}
        </div>
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-primary-200 rounded-lg shadow-lg z-30 max-h-60 overflow-y-auto">
          {/* Search candidates */}
          {stationCandidates.length > 0 && (
            <div>
              {stationCandidates.map((candidate, index) => (
                <button
                  key={index}
                  onClick={() => handleSelect(candidate)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-primary-50 border-b border-primary-100 last:border-b-0"
                >
                  <span className="font-medium text-text">
                    {candidate.name}
                  </span>
                  <span className="text-text-muted ml-2 text-xs">
                    {candidate.address}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Nearby stations */}
          {stationCandidates.length === 0 && nearbyStations.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-xs text-text-muted bg-primary-50">
                近くの駅
              </div>
              {nearbyStations.map((s) => (
                <button
                  key={s.name}
                  onClick={() => handleSelect(s)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-primary-50 border-b border-primary-100 last:border-b-0"
                >
                  <span className="font-medium text-text">{s.name}</span>
                  {s.distance && (
                    <span className="text-text-muted ml-2 text-xs">
                      {(s.distance / 1000).toFixed(1)}km
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StationSearch;
