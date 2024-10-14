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
  priceLevel: string;
  setPriceLevel: (priceLevel: string) => void;
  searchNearbyRestaurants: (types: string[], minRating: number, minReviews: number, selectedStation: { name: string; prefecture: string }, isOpenNow: boolean, priceLevel: string) => void;
  isLoading: boolean;
  error: string | null;
}

const UnifiedSearchResultsScreen: React.FC<UnifiedSearchResultsScreenProps> = ({
  initialStation,
  restaurants,
  setScreen,
  priceLevel,
  setPriceLevel,
  searchNearbyRestaurants,
  isLoading,
  error,
}) => {
  const { station, setStation, stationCandidates, selectedStation, selectStation } = useStationSearch(initialStation);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>(keyWordOptions.map(option => option.value));
  const [minRating, setMinRating] = useState<number>(3.5);
  const [minReviews, setMinReviews] = useState<number>(100);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customKeywords, setCustomKeywords] = useState<string[]>([]);
  const [isOpenNow, setIsOpenNow] = useState(false);

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
      searchNearbyRestaurants(selectedKeywords, minRating, minReviews, selectedStation, isOpenNow, priceLevel);
    }
  };

  useEffect(() => {
    if (selectedStation) {
      handleSearch();
    }
  }, [selectedKeywords, minRating, minReviews, selectedStation, isOpenNow, priceLevel]);

  return (
    <div className="max-w-4xl mx-auto p-6 relative pb-20">
      <h1 className="text-3xl font-bold text-primary-800 mb-8">駅周辺のレストラン検索</h1>
      
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
        priceLevel={priceLevel}
        setPriceLevel={setPriceLevel}
        minRating={minRating}
        setMinRating={setMinRating}
        minReviews={minReviews}
        setMinReviews={setMinReviews}
        isOpenNow={isOpenNow}
        setIsOpenNow={setIsOpenNow}
      />

      <button
        onClick={handleSearch}
        disabled={!selectedStation || isLoading}
        className="w-full btn btn-primary mb-6"
      >
        {isLoading ? '検索中...' : '検索'}
      </button>

      {error && <p className="mt-4 text-red-500">{error}</p>}

      {restaurants.length > 0 && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">検索結果</h2>
            <button
              onClick={() => setScreen('map')}
              className="btn btn-secondary flex items-center"
            >
              <MapPin size={20} className="mr-2" />
              地図で見る
            </button>
          </div>
          <SearchResults restaurants={restaurants} />
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