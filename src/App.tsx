import React, { useState } from 'react';
import { useLoadScript } from '@react-google-maps/api';
import UnifiedSearchResultsScreen from './components/UnifiedSearchResultsScreen';
import useRestaurantSearch from './composables/useRestaurantSearch';

const libraries: ("places" | "geometry")[] = ['places', 'geometry'];

function App() {
  const [initialStation, setInitialStation] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const {
    filteredRestaurants,
    isLoading,
    error,
    searchNearbyRestaurants,
  } = useRestaurantSearch();

  if (loadError) {
    return <div>Google Maps APIの読み込みに失敗しました。</div>;
  }

  if (!isLoaded) {
    return <div>読み込み中...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <UnifiedSearchResultsScreen
        initialStation={initialStation}
        restaurants={filteredRestaurants}
        setScreen={() => {}}
        searchNearbyRestaurants={searchNearbyRestaurants}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
}

export default App;