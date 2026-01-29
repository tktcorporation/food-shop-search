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
  currentLocation,
  onGetCurrentLocation,
}) => {
  const isHttps =
    typeof window !== 'undefined' &&
    (window.location.protocol === 'https:' ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1');

  if (!isHttps) {
    return (
      <span className="text-xs text-text-muted">HTTPS接続が必要です</span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onGetCurrentLocation}
        disabled={isLoading}
        className="p-1.5 rounded-full hover:bg-primary-50 transition-colors disabled:opacity-50"
      >
        {isLoading ? (
          <Loader2 className="animate-spin text-primary-500" size={16} />
        ) : (
          <Navigation size={16} className="text-primary-600" />
        )}
      </button>

      <span className="text-sm text-text truncate">
        {isLoading
          ? '取得中...'
          : currentLocation
            ? currentLocation.address
            : '現在地を取得'}
      </span>
    </div>
  );
};

export default LocationSearch;
