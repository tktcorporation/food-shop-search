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
  const { currentLocation, isLoading: isLocationLoading, error: locationError, getCurrentLocation } = useLocationSearch();
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>(keyWordOptions.map(option => option.value));
  const [minRating, setMinRating] = useState<number>(3.5);
  const [minReviews, setMinReviews] = useState<number>(100);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customKeywords, setCustomKeywords] = useState<string[]>([]);
  const [isOpenNow, setIsOpenNow] = useState(false);
  const [selectedPriceLevels, setSelectedPriceLevels] = useState<number[]>([1, 2, 3, 4]);
  const [searchRadius, setSearchRadius] = useState<number>(800);

  const handleSearch = () => {
    const searchLocation = currentLocation || selectedStation;
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
    const searchLocation = currentLocation || selectedStation;
    if (searchLocation) {
      handleSearch();
    }
  }, [selectedKeywords, minRating, minReviews, selectedStation, currentLocation, isOpenNow, searchRadius, selectedPriceLevels]);

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

  return (
    <div className="max-w-4xl mx-auto p-6 relative pb-20">
      <div className="flex flex-col gap-6">
        <LocationSearch
          isLoading={isLocationLoading}
          error={locationError}
          currentLocation={currentLocation}
          onGetCurrentLocation={getCurrentLocation}
        />

        <div className="relative">
          <div className="absolute inset-x-0 -top-3 text-center">
            <span className="bg-white px-4 text-sm text-gray-500">または</span>
          </div>
          <div className="pt-4 border-t border-gray-200">
            <StationSearch
              station={station}
              setStation={setStation}
              stationCandidates={stationCandidates}
              selectStation={selectStation}
            />
          </div>
        </div>

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