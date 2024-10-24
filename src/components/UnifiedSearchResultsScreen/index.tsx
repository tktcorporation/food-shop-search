import React, { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import StationSearch from './StationSearch';
import StoreTypeSelection from './StoreTypeSelection';
import SearchFilters from './SearchFilters';
import SearchResults from './SearchResults';
import CustomKeywordModal from './CustomKeywordModal';
import useStationSearch from '../../composables/useStationSearch';
import { keyWordOptions, addCustomKeyword, removeCustomKeyword } from '../../utils/keywordOptions';

interface UnifiedSearchResultsScreenProps {
  initialStation: string;
  restaurants: any[];
  setScreen: (screen: string) => void;
  searchNearbyRestaurants: (types: string[], minRating: number, minReviews: number, selectedStation: { name: string; prefecture: string }, isOpenNow: boolean) => void;
  isLoading: boolean;
  error: string | null;
}

const UnifiedSearchResultsScreen: React.FC<UnifiedSearchResultsScreenProps> = ({
  initialStation,
  restaurants,
  setScreen,
  searchNearbyRestaurants,
  isLoading,
  error,
}) => {
  const { station, setStation, stationCandidates, selectedStation, selectStation } = useStationSearch(initialStation);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>(keyWordOptions.map(option => option.value));
  const [selectedPriceLevels, setSelectedPriceLevels] = useState<number[]>([1, 2, 3, 4]);
  const [minRating, setMinRating] = useState<number>(3.5);
  const [minReviews, setMinReviews] = useState<number>(100);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customKeywords, setCustomKeywords] = useState<string[]>([]);
  const [isOpenNow, setIsOpenNow] = useState(false);
  const [filteredRestaurants, setFilteredRestaurants] = useState(restaurants);

  const toggleKeyword = (keyword: string) => {
    setSelectedKeywords(prev =>
      prev.includes(keyword)
        ? prev.filter(k => k !== keyword)
        : [...prev, keyword]
    );
  };

  const toggleAllKeywords = () => {
    const allKeywords = [...keyWordOptions, ...customKeywords.map(k => ({ value: k }))];
    if (selectedKeywords.length === allKeywords.length) {
      setSelectedKeywords([]);
    } else {
      setSelectedKeywords(allKeywords.map(option => option.value));
    }
  };

  const handleAddCustomKeyword = (keyword: string) => {
    if (keyword && !keyWordOptions.some(option => option.value === keyword) && !customKeywords.includes(keyword)) {
      setCustomKeywords(prev => [...prev, keyword]);
      setSelectedKeywords(prev => [...prev, keyword]);
      addCustomKeyword(keyword);
    }
  };

  const handleRemoveCustomKeyword = (keyword: string) => {
    setCustomKeywords(prev => prev.filter(k => k !== keyword));
    setSelectedKeywords(prev => prev.filter(k => k !== keyword));
    removeCustomKeyword(keyword);
  };

  const handleSearch = () => {
    if (selectedStation) {
      searchNearbyRestaurants(selectedKeywords, minRating, minReviews, selectedStation, isOpenNow);
    }
  };

  useEffect(() => {
    if (selectedStation) {
      handleSearch();
    }
  }, [selectedKeywords, minRating, minReviews, selectedStation, isOpenNow]);

  // 価格帯フィルターの適用
  useEffect(() => {
    const filtered = restaurants.filter(restaurant => 
      selectedPriceLevels.length === 0 || selectedPriceLevels.includes(restaurant.price_level)
    );
    setFilteredRestaurants(filtered);
  }, [restaurants, selectedPriceLevels]);

  return (
    <div className="max-w-4xl mx-auto p-6 relative pb-20">
      <StationSearch
        station={station}
        setStation={setStation}
        stationCandidates={stationCandidates}
        selectStation={selectStation}
      />

      <StoreTypeSelection
        selectedKeywords={selectedKeywords}
        customKeywords={customKeywords}
        toggleAllKeywords={toggleAllKeywords}
        toggleKeyword={toggleKeyword}
        removeCustomKeyword={handleRemoveCustomKeyword}
        setIsModalOpen={setIsModalOpen}
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
      />


        
        {isLoading && <p>検索中...</p>}

      {error && <p className="mt-4 text-red-500">{error}</p>}

      {filteredRestaurants.length > 0 && (
        <div className="mt-8">
          <SearchResults restaurants={filteredRestaurants} />
        </div>
      )}

      <CustomKeywordModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        addCustomKeyword={handleAddCustomKeyword}
      />
    </div>
  );
};

export default UnifiedSearchResultsScreen;