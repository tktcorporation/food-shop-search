import React from 'react';
import { Navigation, Loader2, AlertCircle, Lock } from 'lucide-react';
import ErrorAlert from '../ui/ErrorAlert';

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
  const isHttps =
    typeof window !== 'undefined' &&
    (window.location.protocol === 'https:' ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1');

  return (
    <div>
      {!isHttps && (
        <div className="alert-info mb-3 text-xs">
          <Lock className="shrink-0" size={14} />
          <p>HTTPS接続が必要です</p>
        </div>
      )}

      {isIOS && !currentLocation && (
        <details className="mb-3">
          <summary className="text-xs text-text-muted cursor-pointer hover:text-text">
            <AlertCircle className="inline mr-1" size={12} />
            iOSをご利用の方へ（タップで詳細）
          </summary>
          <div className="mt-2 p-3 bg-primary-50 rounded-lg text-xs text-text-muted">
            <p className="mb-2">
              位置情報の許可を求められた際に「許可」を選択してください。
            </p>
            <p className="mb-1">既に「許可しない」を選択された場合:</p>
            <ol className="list-decimal ml-4 space-y-0.5">
              <li>iOSの設定アプリを開く</li>
              <li>プライバシーとセキュリティ - 位置情報サービス</li>
              <li>Safari - 「このWebサイトの使用中のみ許可」を選択</li>
            </ol>
          </div>
        </details>
      )}

      {/* Current Location Display + Button */}
      <div className="flex items-center gap-2">
        <button
          onClick={onGetCurrentLocation}
          disabled={isLoading || !isHttps}
          className="btn-secondary flex-shrink-0 !py-2 !px-3"
        >
          {isLoading ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <Navigation size={16} />
          )}
        </button>

        <div className="flex-1 min-w-0">
          {currentLocation ? (
            <p className="text-sm text-text truncate">{currentLocation.address}</p>
          ) : (
            <p className="text-sm text-text-muted">
              {isLoading ? '取得中...' : '現在地を取得'}
            </p>
          )}
        </div>
      </div>

      {error && <ErrorAlert message={error} className="mt-2 text-xs" />}
    </div>
  );
};

export default LocationSearch;
