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
    <div className="card">
      <label className="block text-sm font-semibold text-text mb-3">
        現在地から検索
      </label>

      {!isHttps && (
        <div className="alert-info mb-4">
          <Lock className="shrink-0 mt-0.5" size={18} />
          <p className="text-sm">
            位置情報の取得には HTTPS 接続が必要です。
            現在のページは安全な接続ではないため、位置情報を取得できません。
          </p>
        </div>
      )}

      {isIOS && !currentLocation && (
        <div className="alert-info mb-4">
          <AlertCircle className="shrink-0 mt-0.5 text-primary-500" size={18} />
          <div>
            <p className="font-semibold text-text mb-1">iOSをご利用の方へ</p>
            <p className="text-sm text-text-muted">
              位置情報の許可を求められた際に「許可」を選択してください。
            </p>
            <p className="text-sm text-text-muted mt-2">
              既に「許可しない」を選択された場合:
            </p>
            <ol className="list-decimal ml-5 mt-1 text-sm text-text-muted">
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
        className="btn-secondary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="mt-4 p-3 bg-surface-muted rounded-lg border border-primary-100">
          <p className="text-sm font-semibold text-text mb-1">現在地:</p>
          <p className="text-sm text-text-muted">{currentLocation.address}</p>
        </div>
      )}

      {error && <ErrorAlert message={error} className="mt-3" />}
    </div>
  );
};

export default LocationSearch;
