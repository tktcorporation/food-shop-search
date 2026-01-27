import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import type {
  Restaurant,
  Location,
} from '../../composables/useRestaurantSearch/types';
import type { Station } from '../../composables/useStationSearch/types';

// API検索のデバウンス時間（ミリ秒）
const SEARCH_DEBOUNCE_MS = 500;

interface UnifiedSearchResultsScreenProps {
  restaurants: Restaurant[];
  searchNearbyRestaurants: (
    types: string[],
    minRating: number,
    minReviews: number,
    searchLocation: Station | Location,
    isOpenNow: boolean,
    searchRadius: number,
    selectedPriceLevels: number[],
  ) => void;
  reapplyFilters: (filterParams: {
    minRating: number;
    minReviews: number;
    isOpenNow: boolean;
    searchRadius: number;
    selectedPriceLevels: number[];
  }) => void;
  isLoading: boolean;
  error: string | null;
}

const UnifiedSearchResultsScreen: React.FC<UnifiedSearchResultsScreenProps> = ({
  restaurants,
  searchNearbyRestaurants,
  reapplyFilters,
  isLoading,
  error: searchError,
}) => {
  const {
    station,
    setStation,
    stationCandidates,
    selectedStation,
    selectStation,
  } = useStationSearch();
  const {
    currentLocation,
    isLoading: isLocationLoading,
    error: locationError,
    hasPermissionError,
    getCurrentLocation,
  } = useLocationSearch();
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>(
    keyWordOptions.map((option) => option.value),
  );
  const [minRating, setMinRating] = useState<number>(3.5);
  const [minReviews, setMinReviews] = useState<number>(100);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customKeywords, setCustomKeywords] = useState<string[]>([]);
  const [isOpenNow, setIsOpenNow] = useState(false);
  const [selectedPriceLevels, setSelectedPriceLevels] = useState<number[]>([
    1, 2, 3, 4,
  ]);
  const [searchRadius, setSearchRadius] = useState<number>(100);
  const [searchMethod, setSearchMethod] = useState<'location' | 'station'>(
    'location',
  );

  // 初回検索済みフラグ
  const hasSearchedRef = useRef(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // API呼び出しが必要な検索（キーワード・位置・半径変更時）
  const triggerSearch = useCallback(() => {
    const searchLocation =
      searchMethod === 'location' ? currentLocation : selectedStation;
    if (searchLocation) {
      searchNearbyRestaurants(
        selectedKeywords,
        minRating,
        minReviews,
        searchLocation,
        isOpenNow,
        searchRadius,
        selectedPriceLevels,
      );
      hasSearchedRef.current = true;
    }
  }, [
    searchMethod,
    currentLocation,
    selectedStation,
    selectedKeywords,
    minRating,
    minReviews,
    isOpenNow,
    searchRadius,
    selectedPriceLevels,
    searchNearbyRestaurants,
  ]);

  // API呼び出しが必要なパラメータ変更時（デバウンス付き）
  // triggerSearchは意図的に依存から除外: フィルター変更ではAPI再呼び出ししない
  useEffect(() => {
    const searchLocation =
      searchMethod === 'location' ? currentLocation : selectedStation;
    if (!searchLocation) return;

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(
      () => {
        triggerSearch();
      },
      hasSearchedRef.current ? SEARCH_DEBOUNCE_MS : 0,
    ); // 初回は即実行

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedKeywords,
    selectedStation,
    currentLocation,
    searchRadius,
    searchMethod,
  ]);

  // フィルターのみの変更時（API呼び出し不要、クライアント側で再フィルタリング）
  // searchRadiusはAPI検索でも使うため、ここではreapplyFiltersに渡すが依存には含めない
  useEffect(() => {
    if (!hasSearchedRef.current) return;

    reapplyFilters({
      minRating,
      minReviews,
      isOpenNow,
      searchRadius,
      selectedPriceLevels,
    });
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [minRating, minReviews, isOpenNow, selectedPriceLevels]);

  useEffect(() => {
    if (
      searchMethod === 'location' &&
      !currentLocation &&
      !isLocationLoading &&
      !hasPermissionError
    ) {
      getCurrentLocation();
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- getCurrentLocationは安定参照のため除外
  }, [searchMethod, currentLocation, isLocationLoading, hasPermissionError]);

  const handleAddCustomKeyword = (keyword: string) => {
    if (!customKeywords.includes(keyword)) {
      setCustomKeywords((prev) => [...prev, keyword]);
      setSelectedKeywords((prev) => [...prev, keyword]);
    }
  };

  const handleRemoveCustomKeyword = (keyword: string) => {
    setCustomKeywords((prev) => prev.filter((k) => k !== keyword));
    setSelectedKeywords((prev) => prev.filter((k) => k !== keyword));
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

        {searchError && <p className="text-red-500">{searchError}</p>}

        <SearchResults
          restaurants={restaurants}
          minRating={minRating}
          minReviews={minReviews}
          searchRadius={searchRadius}
          isOpenNow={isOpenNow}
          selectedPriceLevels={selectedPriceLevels}
        />

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
