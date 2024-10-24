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
        } catch (err) {
          setError(err instanceof Error ? err.message : '位置情報の取得に失敗しました。');
        } finally {
          setIsLoading(false);
        }
      },
      (err) => {
        setError('位置情報の取得に失敗しました。');
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
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