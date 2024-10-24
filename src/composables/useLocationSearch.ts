import { useState } from 'react';

interface Location {
  lat: number;
  lng: number;
  address: string;
}

export const useLocationSearch = () => {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentLocation = () => {
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
          if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
            setError('位置情報の利用が許可されていません。iOSの設定アプリから「Safari」→「位置情報」を「許可」に変更してください。');
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

          setCurrentLocation({
            lat: latitude,
            lng: longitude,
            address: result.formatted_address
          });
          setIsLoading(false);
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
  };

  return {
    currentLocation,
    setCurrentLocation,
    isLoading,
    error,
    getCurrentLocation
  };
};