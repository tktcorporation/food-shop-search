import React, { useState, useEffect } from 'react';
import { Search, Navigation, Loader2 } from 'lucide-react';

interface Station {
  name: string;
  address: string;
  distance?: number;
  rawPrediction: google.maps.places.AutocompletePrediction;
}

interface StationSearchProps {
  station: string;
  setStation: (station: string) => void;
  stationCandidates: Station[];
  selectStation: (station: Station) => void;
}

const StationSearch: React.FC<StationSearchProps> = ({
  station,
  setStation,
  stationCandidates,
  selectStation,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nearbyStations, setNearbyStations] = useState<Station[]>([]);

  const findNearbyStations = () => {
    setIsLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('お使いのブラウザは位置情報をサポートしていません。');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation = new google.maps.LatLng(
          position.coords.latitude,
          position.coords.longitude
        );

        const service = new google.maps.places.PlacesService(document.createElement('div'));
        const request = {
          location: userLocation,
          radius: 5000, // 5km
          type: 'train_station'
        };

        service.nearbySearch(request, (results, status) => {
          setIsLoading(false);
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            const stations = results.map(place => {
              const placeLocation = place.geometry?.location;
              let distance = 0;
              
              if (placeLocation && google.maps.geometry) {
                distance = google.maps.geometry.spherical.computeDistanceBetween(
                  userLocation,
                  placeLocation
                );
              }

              return {
                name: place.name?.replace(/駅$/, '') || '',
                address: place.vicinity || '',
                distance: Math.round(distance),
                rawPrediction: {
                  place_id: place.place_id || '',
                  description: place.name || '',
                  structured_formatting: {
                    main_text: place.name || '',
                    secondary_text: place.vicinity || ''
                  }
                } as google.maps.places.AutocompletePrediction
              };
            });

            // 距離でソート
            const sortedStations = stations.sort((a, b) => (a.distance || 0) - (b.distance || 0));
            const nearestStations = sortedStations.slice(0, 5);
            setNearbyStations(nearestStations);

            // 最寄り駅を自動選択
            if (nearestStations.length > 0) {
              setStation(nearestStations[0].name);
              selectStation(nearestStations[0]);
            }
          } else {
            setError('近くの駅を見つけることができませんでした。');
          }
        });
      },
      (err) => {
        setIsLoading(false);
        setError('位置情報の取得に失敗しました。');
        console.error('Geolocation error:', err);
      }
    );
  };

  // 初回レンダリング時に近くの駅を検索
  useEffect(() => {
    findNearbyStations();
  }, []);

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

      <div className="mt-3">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Loader2 className="animate-spin" size={14} />
            近くの駅を検索中...
          </div>
        ) : (
          nearbyStations.length > 0 && (
            <div className="w-full">
              <p className="text-sm text-gray-600 mb-2">近くの駅:</p>
              <div className="flex flex-wrap gap-2">
                {nearbyStations.map((nearbyStation) => (
                  <button
                    key={nearbyStation.name}
                    onClick={() => selectStation(nearbyStation)}
                    className={`px-3 py-1 text-sm rounded-full transition-colors duration-200 flex items-center gap-1
                      ${station === nearbyStation.name 
                        ? 'bg-primary-500 text-white' 
                        : 'bg-primary-100 text-primary-700 hover:bg-primary-200'}`}
                  >
                    <Navigation size={14} />
                    {nearbyStation.name}
                    {nearbyStation.distance && (
                      <span className="text-xs opacity-75">
                        ({(nearbyStation.distance / 1000).toFixed(1)}km)
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

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