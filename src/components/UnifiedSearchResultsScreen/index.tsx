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
import {
  MapPin,
  Train,
  Loader2,
  SlidersHorizontal,
  Settings2,
} from 'lucide-react';
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

  // UI state - panels
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<
    'filters' | 'types'
  >('filters');

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

  // Count active filters
  const activeFilterCount = [
    minRating > 0,
    minReviews > 0,
    isOpenNow,
    selectedPriceLevels.length < 4,
  ].filter(Boolean).length;

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* ===== Header: Location Bar (Compact) ===== */}
      <div className="sticky top-0 z-20 bg-surface border-b border-primary-100">
        <div className="p-3 sm:p-4">
          {/* Search Method Toggle - Compact */}
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => setSearchMethod('location')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                searchMethod === 'location'
                  ? 'bg-primary-600 text-white'
                  : 'bg-primary-50 text-text-muted hover:bg-primary-100'
              }`}
            >
              <MapPin size={14} />
              <span>現在地</span>
            </button>
            <button
              onClick={() => setSearchMethod('station')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                searchMethod === 'station'
                  ? 'bg-primary-600 text-white'
                  : 'bg-primary-50 text-text-muted hover:bg-primary-100'
              }`}
            >
              <Train size={14} />
              <span>駅名</span>
            </button>

            {/* Settings toggle - Right aligned */}
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                isSettingsOpen
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-text-muted hover:bg-primary-50'
              }`}
            >
              <Settings2 size={14} />
              <span className="hidden sm:inline">設定</span>
              {activeFilterCount > 0 && (
                <span className="bg-primary-600 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[18px]">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Location Input */}
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
        </div>

        {/* Settings Panel - Slide down */}
        {isSettingsOpen && (
          <div className="border-t border-primary-100 bg-white animate-fadeIn">
            {/* Settings Tabs */}
            <div className="flex border-b border-primary-100">
              <button
                onClick={() => setActiveSettingsTab('filters')}
                className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                  activeSettingsTab === 'filters'
                    ? 'text-primary-700 border-b-2 border-primary-600 -mb-px'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                <SlidersHorizontal size={14} className="inline mr-1.5" />
                フィルター
                {activeFilterCount > 0 && (
                  <span className="ml-1.5 bg-primary-100 text-primary-700 text-xs px-1.5 py-0.5 rounded">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveSettingsTab('types')}
                className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                  activeSettingsTab === 'types'
                    ? 'text-primary-700 border-b-2 border-primary-600 -mb-px'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                店舗タイプ
                <span className="ml-1.5 text-xs text-text-muted">
                  ({selectedKeywords.length})
                </span>
              </button>
            </div>

            {/* Settings Content */}
            <div className="p-4 max-h-[50vh] overflow-y-auto">
              {activeSettingsTab === 'filters' ? (
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
              ) : (
                <StoreTypeSelection
                  selectedKeywords={selectedKeywords}
                  setSelectedKeywords={setSelectedKeywords}
                  customKeywords={customKeywords}
                  onAddCustomKeyword={() => setIsModalOpen(true)}
                  onRemoveCustomKeyword={handleRemoveCustomKeyword}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* ===== Main Content: Results ===== */}
      <div className="p-4 sm:p-6">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 text-primary-500 animate-spin" />
            <span className="ml-3 text-text-muted">検索中...</span>
          </div>
        )}

        {/* Error State */}
        {searchError && <ErrorAlert message={searchError} />}

        {/* Results */}
        {!isLoading && (
          <SearchResults
            restaurants={restaurants}
            minRating={minRating}
            minReviews={minReviews}
            searchRadius={searchRadius}
            isOpenNow={isOpenNow}
            selectedPriceLevels={selectedPriceLevels}
          />
        )}
      </div>

      {/* Modal */}
      <CustomKeywordModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        addCustomKeyword={handleAddCustomKeyword}
      />
    </div>
  );
};

export default UnifiedSearchResultsScreen;
