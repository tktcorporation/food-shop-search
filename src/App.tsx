import React, { useState } from 'react';
import { useLoadScript } from '@react-google-maps/api';
import UnifiedSearchResultsScreen from './components/UnifiedSearchResultsScreen';
import RouletteScreen from './components/RouletteScreen';
import Map from './components/Map';
import useRestaurantSearch from './composables/useRestaurantSearch';

// Add geometry to the libraries array
const libraries: ("places" | "geometry")[] = ['places', 'geometry'];

function App() {
  const [screen, setScreen] = useState('search');
  const [initialStation, setInitialStation] = useState('');
  const [priceLevel, setPriceLevel] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const {
    allRestaurants,
    filteredRestaurants,
    isLoading,
    error,
    searchNearbyRestaurants,
    filterRestaurants,
  } = useRestaurantSearch();

  const handleSearch = async (types, minRating, minReviews, selectedStation, isOpenNow) => {
    await searchNearbyRestaurants(types, minRating, minReviews, selectedStation, isOpenNow, priceLevel);
  };

  const handlePriceLevelChange = (newPriceLevel) => {
    setPriceLevel(newPriceLevel);
    filterRestaurants(newPriceLevel);
  };

  const startRoulette = () => {
    if (filteredRestaurants.length === 0) return;
    setIsSpinning(true);

    const randomIndex = Math.floor(Math.random() * filteredRestaurants.length);
    const selectedRestaurant = filteredRestaurants[randomIndex];

    setTimeout(() => {
      setSelectedRestaurant(selectedRestaurant);
      setIsSpinning(false);
    }, 5000);
  };

  if (loadError) {
    return <div>Google Maps APIの読み込みに失敗しました。</div>;
  }

  if (!isLoaded) {
    return <div>読み込み中...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      {screen === 'search' && (
        <UnifiedSearchResultsScreen
          initialStation={initialStation}
          restaurants={filteredRestaurants}
          setScreen={setScreen}
          priceLevel={priceLevel}
          setPriceLevel={handlePriceLevelChange}
          searchNearbyRestaurants={handleSearch}
          isLoading={isLoading}
          error={error}
        />
      )}
      {screen === 'roulette' && (
        <RouletteScreen
          restaurants={filteredRestaurants}
          setScreen={setScreen}
          isSpinning={isSpinning}
          selectedRestaurant={selectedRestaurant}
          startRoulette={startRoulette}
        />
      )}
      {screen === 'map' && (
        <Map
          restaurants={filteredRestaurants}
          setScreen={setScreen}
        />
      )}
    </div>
  );
}

export default App;