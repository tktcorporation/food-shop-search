import React, { useState, useEffect, useRef, useCallback } from 'react';
import StationSearch from './StationSearch';
import StoreTypeSelection from './StoreTypeSelection';
import SearchFilters from './SearchFilters';
import SearchResults from './SearchResults';
import CustomKeywordModal from './CustomKeywordModal';
import useStationSearch from '../../composables/useStationSearch';
import { keyWordOptions, getKeywordLabel } from '../../utils/keywordOptions';
import {
  Train,
  Loader2,
  SlidersHorizontal,
  ChevronRight,
  X,
} from 'lucide-react';
import ErrorAlert from '../ui/ErrorAlert';
import type { Restaurant } from '../../composables/useRestaurantSearch/types';
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
    searchLocation: Station,
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
    isInitializing,
    initError,
  } = useStationSearch();
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

  // UI state - panels
  const [isStoreTypesOpen, setIsStoreTypesOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // 初回検索済みフラグ
  const hasSearchedRef = useRef(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // API呼び出しが必要な検索（キーワード・位置・半径変更時）
  const triggerSearch = useCallback(() => {
    if (selectedStation) {
      searchNearbyRestaurants(
        selectedKeywords,
        minRating,
        minReviews,
        selectedStation,
        isOpenNow,
        searchRadius,
        selectedPriceLevels,
      );
      hasSearchedRef.current = true;
    }
  }, [
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
  useEffect(() => {
    if (!selectedStation) return;

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(
      () => {
        triggerSearch();
      },
      hasSearchedRef.current ? SEARCH_DEBOUNCE_MS : 0,
    );

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKeywords, selectedStation]);

  // フィルターのみの変更時
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
  }, [minRating, minReviews, isOpenNow, searchRadius, selectedPriceLevels]);

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

  const toggleKeyword = (keyword: string) => {
    setSelectedKeywords((prev) =>
      prev.includes(keyword)
        ? prev.filter((k) => k !== keyword)
        : [...prev, keyword],
    );
  };

  // Count active filters
  const activeFilterCount = [
    minRating > 0,
    minReviews > 0,
    isOpenNow,
    selectedPriceLevels.length < 4,
  ].filter(Boolean).length;

  const allKeywordsCount = keyWordOptions.length + customKeywords.length;
  const isAllSelected = selectedKeywords.length === allKeywordsCount;

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* ===== Header ===== */}
      <div className="sticky top-0 z-20 bg-surface">
        {/* Location Bar */}
        <div className="p-4 border-b border-primary-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-2 bg-primary-600 text-white rounded-full text-sm font-medium">
              <Train size={18} />
              <span className="hidden sm:inline">駅名</span>
            </div>

            <div className="flex-1 min-w-0">
              {isInitializing ? (
                <div className="flex items-center gap-2 text-text-muted text-sm">
                  <Loader2 size={16} className="animate-spin" />
                  <span>最寄り駅を検索中...</span>
                </div>
              ) : (
                <StationSearch
                  station={station}
                  setStation={setStation}
                  stationCandidates={stationCandidates}
                  selectStation={selectStation}
                />
              )}
            </div>
          </div>
          {initError && (
            <p className="mt-2 text-sm text-red-600">{initError}</p>
          )}
        </div>

        {/* Store Types - Core Feature (Always Visible) */}
        <div className="px-4 py-3 bg-white border-b border-primary-100">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-text shrink-0">
              食べたいもの
            </span>

            {/* Horizontal scrollable chips */}
            <div className="flex-1 overflow-x-auto scrollbar-hide">
              <div className="flex gap-2 pb-1">
                {selectedKeywords.length === 0 ? (
                  <span className="text-sm text-text-muted italic">
                    選択してください
                  </span>
                ) : isAllSelected ? (
                  <span className="text-sm text-primary-600 font-medium">
                    すべて選択中
                  </span>
                ) : (
                  selectedKeywords.slice(0, 5).map((keyword) => (
                    <button
                      key={keyword}
                      onClick={() => toggleKeyword(keyword)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-primary-100 text-primary-700 rounded-full text-sm font-medium whitespace-nowrap hover:bg-primary-200 transition-colors"
                    >
                      {getKeywordLabel(keyword)}
                      <X size={14} className="opacity-60" />
                    </button>
                  ))
                )}
                {!isAllSelected && selectedKeywords.length > 5 && (
                  <span className="text-sm text-text-muted self-center">
                    +{selectedKeywords.length - 5}
                  </span>
                )}
              </div>
            </div>

            {/* Edit Button */}
            <button
              onClick={() => setIsStoreTypesOpen(true)}
              className="shrink-0 flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            >
              編集
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Filters Toggle - Secondary */}
        <button
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          className="w-full px-4 py-3 flex items-center justify-between bg-primary-50/50 border-b border-primary-100 text-sm hover:bg-primary-50 transition-colors"
        >
          <div className="flex items-center gap-2 text-text-muted">
            <SlidersHorizontal size={18} />
            <span>フィルター</span>
            {activeFilterCount > 0 && (
              <span className="bg-primary-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </div>
          <ChevronRight
            size={16}
            className={`text-text-muted transition-transform ${isFiltersOpen ? 'rotate-90' : ''}`}
          />
        </button>

        {/* Filters Panel */}
        {isFiltersOpen && (
          <div className="p-4 bg-white border-b border-primary-100 animate-fadeIn">
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
          </div>
        )}
      </div>

      {/* ===== Main Content: Results ===== */}
      <div className="p-4">
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

      {/* ===== Store Types Modal (Full Screen) ===== */}
      {isStoreTypesOpen && (
        <div className="fixed inset-0 z-50 bg-surface">
          <div className="sticky top-0 bg-white border-b border-primary-100 px-4 py-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text">
              食べたいものを選ぶ
            </h2>
            <button
              onClick={() => setIsStoreTypesOpen(false)}
              className="p-2 -mr-2 text-text-muted hover:text-text transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          <div className="p-4 overflow-y-auto h-[calc(100vh-60px)]">
            <StoreTypeSelection
              selectedKeywords={selectedKeywords}
              setSelectedKeywords={setSelectedKeywords}
              customKeywords={customKeywords}
              onAddCustomKeyword={() => setIsModalOpen(true)}
              onRemoveCustomKeyword={handleRemoveCustomKeyword}
            />
          </div>
        </div>
      )}

      {/* Custom Keyword Modal */}
      <CustomKeywordModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        addCustomKeyword={handleAddCustomKeyword}
      />
    </div>
  );
};

export default UnifiedSearchResultsScreen;
