import React from 'react';
import { Navigation, Loader2 } from 'lucide-react';

interface LocationSearchProps {
  isLoading: boolean;
  error: string | null;
  currentLocation: { address: string } | null;
  onGetCurrentLocation: () => void;
}

const LocationSearch: React.FC<LocationSearchProps> = ({
  isLoading,
  error,
  currentLocation,
  onGetCurrentLocation,
}) => {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        現在地から検索
      </label>
      <button
        onClick={onGetCurrentLocation}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-md hover:bg-primary-200 transition-colors duration-200"
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin" size={18} />
            位置情報を取得中...
          </>
        ) : (
          <>
            <Navigation size={18} />
            {currentLocation ? '現在地を更新' : '現在地を取得'}
          </>
        )}
      </button>

      {currentLocation && (
        <div className="mt-2 text-sm text-gray-600">
          <p className="font-medium">現在地:</p>
          <p>{currentLocation.address}</p>
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default LocationSearch;