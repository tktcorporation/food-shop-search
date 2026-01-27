import React, { useState, useCallback } from 'react';
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  InfoWindow,
} from '@react-google-maps/api';
import { ArrowLeft, Star, DollarSign } from 'lucide-react';
import type { Restaurant } from '../schemas';

interface MapProps {
  restaurants: Restaurant[];
  setScreen: (screen: string) => void;
}

const containerStyle = {
  width: '100%',
  height: '400px',
};

const defaultCenter = { lat: 35.6762, lng: 139.6503 }; // デフォルトは東京

const Map: React.FC<MapProps> = ({ restaurants, setScreen }) => {
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<Restaurant | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const center =
    restaurants.length > 0 && restaurants[0].geometry
      ? {
          lat: restaurants[0].geometry.location.lat(),
          lng: restaurants[0].geometry.location.lng(),
        }
      : defaultCenter;

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const handleRestaurantSelect = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    if (map && restaurant.geometry) {
      map.panTo({
        lat: restaurant.geometry.location.lat(),
        lng: restaurant.geometry.location.lng(),
      });
      map.setZoom(16);
    }
  };

  const validRestaurants = restaurants.filter(
    (restaurant) => restaurant.geometry,
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-semibold text-primary-800">
          レストランマップ
        </h2>
        <button
          onClick={() => setScreen('results')}
          className="btn btn-secondary flex items-center"
        >
          <ArrowLeft size={20} className="mr-2" />
          結果に戻る
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/3">
          <h3 className="text-xl font-semibold mb-4">検索結果</h3>
          <div className="overflow-y-auto max-h-96 pr-4">
            {validRestaurants.map((restaurant) => (
              <div
                key={restaurant.place_id}
                className={`p-4 mb-4 rounded-lg cursor-pointer transition-colors ${
                  selectedRestaurant?.place_id === restaurant.place_id
                    ? 'bg-primary-100'
                    : 'bg-white hover:bg-gray-100'
                }`}
                onClick={() => handleRestaurantSelect(restaurant)}
              >
                <h4 className="font-semibold">{restaurant.name}</h4>
                <p className="text-sm text-gray-600">{restaurant.vicinity}</p>
                <div className="flex items-center mt-2">
                  <Star size={16} className="text-yellow-400 mr-1" />
                  <span className="text-sm">
                    {restaurant.rating} ({restaurant.user_ratings_total})
                  </span>
                  <DollarSign size={16} className="ml-2 mr-1" />
                  <span className="text-sm">
                    {'¥'.repeat(restaurant.price_level)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="md:w-2/3">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={center}
              zoom={14}
              onLoad={onLoad}
              onUnmount={onUnmount}
            >
              {validRestaurants.map((restaurant) => (
                <Marker
                  key={restaurant.place_id}
                  position={{
                    lat: restaurant.geometry!.location.lat(),
                    lng: restaurant.geometry!.location.lng(),
                  }}
                  onClick={() => handleRestaurantSelect(restaurant)}
                />
              ))}
              {selectedRestaurant && selectedRestaurant.geometry && (
                <InfoWindow
                  position={{
                    lat: selectedRestaurant.geometry.location.lat(),
                    lng: selectedRestaurant.geometry.location.lng(),
                  }}
                  onCloseClick={() => setSelectedRestaurant(null)}
                >
                  <div>
                    <h3 className="font-semibold">{selectedRestaurant.name}</h3>
                    <p className="text-sm">{selectedRestaurant.vicinity}</p>
                    <div className="flex items-center mt-2">
                      <Star size={16} className="text-yellow-400 mr-1" />
                      <span className="text-sm">
                        {selectedRestaurant.rating} (
                        {selectedRestaurant.user_ratings_total})
                      </span>
                      <DollarSign size={16} className="ml-2 mr-1" />
                      <span className="text-sm">
                        {'¥'.repeat(selectedRestaurant.price_level)}
                      </span>
                    </div>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          ) : (
            <div>Loading...</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Map;
