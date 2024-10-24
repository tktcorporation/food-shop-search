import { useState, useCallback } from 'react';
import { useCache, CACHE_CONFIGS } from '../utils/cacheManager';

interface Location {
  lat: number;
  lng: number;
  address: string;
}

export const useLocationSearch = () => {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermissionError, setHasPermissionError] = useState(false);

  const geocodeCache = useCache<Location>(CACHE_CONFIGS.GEOCODE);

  const checkHttps = useCallback(() => {
    if (typeof window !== 'undefined' && window.location.protocol !== 'https:') {
      if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        setError('位置情報の取得には HTTPS 接続が必要です。');
        return false;
      }
    }
    return true;
  }, []);

  const getCurrentLocation = useCallback(() => {
    if (!checkHttps()) return;
    if (hasPermissionError) return;
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('お使いのブラウザは位置情報をサポートしていません。');
      setIsLoading(false);
      return;
    }

    const handleError = (error: GeolocationPositionError) => {
      setIsLoading(false);
      switch (error.code) {
        case error.PERMISSION_DENIED:
          setHasPermissionError(true);
          if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
            setError(
              '位置情報の利用が許可されていません。\n' +
              '1. iOSの設定アプリを開く\n' +
              '2. プライバシーとセキュリティ > 位置情報サービス\n' +
              '3. Safari > 「このWebサイトの使用中のみ許可」を選択'
            );
          } else {
            setError('位置情報の利用が許可されていません。ブラウザの設定から位置情報の利用を許可してください。');
          }
          break;
        case error.POSITION_UNAVAILABLE:
          setError('位置情報を取得できませんでした。電波の良い場所で再度お試しください。');
          break;
        case error.TIMEOUT:
          setError('位置情報の取得がタイムアウトしました。再度お試しください。');
          break;
        default:
          setError('位置情報の取得に失敗しました。再度お試しください。');
      }
    };

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const cacheKey = `${latitude},${longitude}`;

          const cached = geocodeCache.getCached(cacheKey);
          if (cached) {
            setCurrentLocation(cached);
            setIsLoading(false);
            setError(null);
            setHasPermissionError(false);
            return;
          }

          const geocoder = new google.maps.Geocoder();
          
          const result = await new Promise<google.maps.GeocoderResult>((resolve, reject) => {
            geocoder.geocode(
              { location: { lat: latitude, lng: longitude } },
              (results, status) => {
                if (status === google.maps.GeocoderStatus.OK && results?.[0]) {
                  resolve(results[0]);
                } else {
                  reject(new Error('住所の取得に失敗しました。'));
                }
              }
            );
          });

          const locationData = {
            lat: latitude,
            lng: longitude,
            address: result.formatted_address
          };

          geocodeCache.setCached(cacheKey, locationData);
          setCurrentLocation(locationData);
          setIsLoading(false);
          setError(null);
          setHasPermissionError(false);
        } catch (err) {
          handleError({
            code: 2,
            message: '位置情報の取得に失敗しました。',
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3
          });
        }
      },
      handleError,
      options
    );
  }, [checkHttps, hasPermissionError, isLoading, geocodeCache]);

  return {
    currentLocation,
    setCurrentLocation,
    isLoading,
    error,
    hasPermissionError,
    getCurrentLocation
  };
};