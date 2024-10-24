import React, { useState, useEffect } from 'react';
import StationSearch from './StationSearch';
import LocationSearch from './LocationSearch';
import StoreTypeSelection from './StoreTypeSelection';
import SearchFilters from './SearchFilters';
import SearchResults from './SearchResults';
import CustomKeywordModal from './CustomKeywordModal';
import useStationSearch from '../../composables/useStationSearch';
import { useLocationSearch } from '../../composables/useLocationSearch';
import { keyWordOptions } from '../../utils/keywordOptions';
import { MapPin, Train } from 'lucide-react';

interface UnifiedSearchResultsScreenProps {
  initialStation: string;
  restaurants: any[];
  setScreen: (screen: string) => void;
  searchNearbyRestaurants: (
    types: string[],
    minRating: number,
    minReviews: number,
    searchLocation: any,
    isOpenNow: boolean,
    searchRadius: number,
    selectedPriceLevels: number[]
  ) => void;
  isLoading: boolean;
  error: string | null;
}

const UnifiedSearchResultsScreen: React.FC<UnifiedSearchResultsScreenProps> = ({
  initialStation,
  restaurants,
  searchNearbyRestaurants,
  isLoading,
  error: searchError,
}) => {
  const { station, setStation, stationCandidates, selectedStation, selectStation } = useStationSearch(initialStation);
  const { currentLocation, isLoading: isLocationLoading, error: locationError, hasPermissionError, getCurrentLocation } = useLocationSearch();
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>(keyWordOptions.map(option => option.value));
  const [minRating, setMinRating] = useState<number>(3.5);
  const [minReviews, setMinReviews] = useState<number>(100);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customKeywords, setCustomKeywords] = useState<string[]>([]);
  const [isOpenNow, setIsOpenNow] = useState(false);
  const [selectedPriceLevels, setSelectedPriceLevels] = useState<number[]>([1, 2, 3, 4]);
  const [searchRadius, setSearchRadius] = useState<number>(100); // Changed default to 100m
  const [searchMethod, setSearchMethod] = useState<'location' | 'station'>('location');

  const handleSearch = () => {
    const searchLocation = searchMethod === 'location' ? currentLocation : selectedStation;
    if (searchLocation) {
      searchNearbyRestaurants(
        selectedKeywords,
        minRating,
        minReviews,
        searchLocation,
        isOpenNow,
        searchRadius,
        selectedPriceLevels
      );
    }
  };

  useEffect(() => {
    const searchLocation = searchMethod === 'location' ? currentLocation : selectedStation;
    if (searchLocation) {
      handleSearch();
    }
  }, [selectedKeywords, minRating, minReviews, selectedStation, currentLocation, isOpenNow, searchRadius, selectedPriceLevels, searchMethod]);

  useEffect(() => {
    if (searchMethod === 'location' && !currentLocation && !isLocationLoading && !hasPermissionError) {
      getCurrentLocation();
    }
  }, [searchMethod, currentLocation, isLocationLoading, hasPermissionError]);

  const handleAddCustomKeyword = (keyword: string) => {
    if (!customKeywords.includes(keyword)) {
      setCustomKeywords(prev => [...prev, keyword]);
      setSelectedKeywords(prev => [...prev, keyword]);
    }
  };

  const handleRemoveCustomKeyword = (keyword: string) => {
    setCustomKeywords(prev => prev.filter(k => k !== keyword));
    setSelectedKeywords(prev => prev.filter(k => k !== keyword));
  };

  const toggleSearchMethod = () => {
    setSearchMethod(prev => prev === 'location' ? 'station' : 'location');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 relative pb-20">
      <div className="flex flex-col gap-6">
        <div className="bg-white rounded-lg shadow-md p-4 mb-2">
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
            <button
              onClick={() => setSearchMethod('location')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                searchMethod === 'location'
                  ? 'bg-primary-500 text-white shadow-md transform -translate-y-0.5'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <MapPin size={20} />
              現在地で検索
            </button>
            <button
              onClick={() => setSearchMethod('station')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                searchMethod === 'station'
                  ? 'bg-primary-500 text-white shadow-md transform -translate-y-0.5'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Train size={20} />
              駅名で検索
            </button>
          </div>
        </div>

        {searchMethod === 'location' ? (
          <LocationSearch
            isLoading={isLocationLoading}
            error={locationError}
            currentLocation={currentLocation}
            onGetCurrentLocation={getCurrentLocation}
          />
        ) : (
          <StationSearch
            station={station}
            setStation={setStation}
            stationCandidates={stationCandidates}
            selectStation={selectStation}
          />
        )}

        <StoreTypeSelection
          selectedKeywords={selectedKeywords}
          setSelectedKeywords={setSelectedKeywords}
          customKeywords={customKeywords}
          onAddCustomKeyword={() => setIsModalOpen(true)}
          onRemoveCustomKeyword={handleRemoveCustomKeyword}
        />

        <SearchFilters
          selectedPriceLevels={selectedPriceLevels}
          setSelectedPriceLevels={setSelectedPriceLevels}
          minRating={minRating}
          setMinRating={setMinRating}
          minReviews={minReviews}
          setMinReviews={setMinReviews}
          isOpenNow={isOpenNow}
          setIsOpenNow={setIsOpenNow}
          searchRadius={searchRadius}
          setSearchRadius={setSearchRadius}
        />

        {isLoading && <p>Loading...</p>}

        {searchError && (
          <p className="text-red-500">{searchError}</p>
        )}

        {restaurants.length > 0 && (
          <SearchResults restaurants={restaurants} />
        )}

        <CustomKeywordModal
          isOpen={isModalOpen}
          setIsOpen={setIsModalOpen}
          addCustomKeyword={handleAddCustomKeyword}
        />
      </div>
    </div>
  );
};

export default UnifiedSearchResultsScreen;