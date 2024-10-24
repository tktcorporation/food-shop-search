import React from 'react';
import { Navigation, Loader2, AlertCircle, Lock } from 'lucide-react';

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
  const isHttps = typeof window !== 'undefined' && 
    (window.location.protocol === 'https:' || 
     window.location.hostname === 'localhost' || 
     window.location.hostname === '127.0.0.1');

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        現在地から検索
      </label>

      {!isHttps && (
        <div className="mb-3 p-3 bg-yellow-50 text-yellow-700 rounded-md text-sm flex items-start">
          <Lock className="shrink-0 mt-0.5 mr-2" size={16} />
          <p>
            位置情報の取得には HTTPS 接続が必要です。
            現在のページは安全な接続ではないため、位置情報を取得できません。
          </p>
        </div>
      )}

      {isIOS && !currentLocation && (
        <div className="mb-3 p-3 bg-blue-50 text-blue-700 rounded-md text-sm flex items-start">
          <AlertCircle className="shrink-0 mt-0.5 mr-2" size={16} />
          <div>
            <p className="font-medium mb-1">iOSをご利用の方へ</p>
            <p>位置情報の許可を求められた際に「許可」を選択してください。</p>
            <p className="mt-2">既に「許可しない」を選択された場合:</p>
            <ol className="list-decimal ml-5 mt-1">
              <li>iOSの設定アプリを開く</li>
              <li>プライバシーとセキュリティ - 位置情報サービス</li>
              <li>Safari - 「このWebサイトの使用中のみ許可」を選択</li>
            </ol>
          </div>
        </div>
      )}

      <button
        onClick={onGetCurrentLocation}
        disabled={isLoading || !isHttps}
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
          <div className="whitespace-pre-line">{error}</div>
        </div>
      )}
    </div>
  );
};

export default LocationSearch;