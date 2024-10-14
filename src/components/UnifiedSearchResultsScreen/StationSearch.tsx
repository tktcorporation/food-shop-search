import React from 'react';
import { Search } from 'lucide-react';

interface StationSearchProps {
  station: string;
  setStation: (station: string) => void;
  stationCandidates: any[];
  selectStation: (station: any) => void;
}

const StationSearch: React.FC<StationSearchProps> = ({
  station,
  setStation,
  stationCandidates,
  selectStation,
}) => {
  return (
    <div className="mb-6">
      <label htmlFor="station" className="block text-sm font-medium text-gray-700 mb-2">
        駅名
      </label>
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