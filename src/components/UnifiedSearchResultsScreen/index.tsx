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
import { MapPin, Train, Loader2 } from 'lucide-react';
import ErrorAlert from '../ui/ErrorAlert';
import type {
  Restaurant,
  Location,
} from '../../composables/useRestaurantSearch/types';
import type { Station } from '../../composables/useStationSearch/types';
import {
  SEARCH_DEBOUNCE_MS,
  DEFAULT_MIN_RATING,
  DEFAULT_MIN_REVIEWS,
  DEFAULT_SEARCH_RADIUS,
  DEFAULT_PRICE_LEVELS,
} from '../../constants';

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
  const [minRating, setMinRating] = useState<number>(DEFAULT_MIN_RATING);
  const [minReviews, setMinReviews] = useState<number>(DEFAULT_MIN_REVIEWS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customKeywords, setCustomKeywords] = useState<string[]>([]);
  const [isOpenNow, setIsOpenNow] = useState(false);
  const [selectedPriceLevels, setSelectedPriceLevels] =
    useState<number[]>(DEFAULT_PRICE_LEVELS);
  const [searchRadius, setSearchRadius] = useState<number>(
    DEFAULT_SEARCH_RADIUS,
  );
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
    <div className="max-w-4xl mx-auto p-4 sm:p-6 relative pb-20">
      <div className="flex flex-col gap-5">
        {/* Search Method Toggle - Soft UI style */}
        <div className="card">
          <div className="flex flex-col sm:flex-row items-stretch gap-3">
            <button
              onClick={() => setSearchMethod('location')}
              className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-base font-semibold transition-all duration-200 cursor-pointer ${
                searchMethod === 'location'
                  ? 'bg-gradient-to-b from-primary-500 to-primary-600 text-white shadow-md'
                  : 'bg-surface-muted text-text-muted border border-primary-100 hover:bg-primary-50 hover:text-text hover:border-primary-200'
              }`}
            >
              <MapPin size={20} />
              現在地で検索
            </button>
            <button
              onClick={() => setSearchMethod('station')}
              className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-base font-semibold transition-all duration-200 cursor-pointer ${
                searchMethod === 'station'
                  ? 'bg-gradient-to-b from-primary-500 to-primary-600 text-white shadow-md'
                  : 'bg-surface-muted text-text-muted border border-primary-100 hover:bg-primary-50 hover:text-text hover:border-primary-200'
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

        {isLoading && (
          <div className="flex items-center justify-center py-10 card">
            <Loader2 className="h-6 w-6 text-primary-500 animate-spin" />
            <span className="ml-3 text-text-muted font-medium">検索中...</span>
          </div>
        )}

        {searchError && <ErrorAlert message={searchError} />}

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
