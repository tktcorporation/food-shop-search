import React from 'react';
import { Navigation, Loader2, AlertCircle } from 'lucide-react';

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
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        現在地から検索
      </label>
      {isIOS && !currentLocation && (
        <div className="mb-3 p-3 bg-blue-50 text-blue-700 rounded-md text-sm flex items-start">
          <AlertCircle className="shrink-0 mt-0.5 mr-2" size={16} />
          <p>
            iOSをご利用の方は、位置情報の許可を求められた際に「許可」を選択してください。
            既に「許可しない」を選択された場合は、設定アプリから変更が必要です。
          </p>
        </div>
      )}
      <button
        onClick={onGetCurrentLocation}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-md hover:bg-primary-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="mt-2 p-3 bg-red-50 text-red-700 rounded-md text-sm flex items-start">
          <AlertCircle className="shrink-0 mt-0.5 mr-2" size={16} />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default LocationSearch;