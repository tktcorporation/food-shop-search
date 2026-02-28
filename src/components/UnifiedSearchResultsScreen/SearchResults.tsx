import React, { useState, useMemo, lazy, Suspense } from 'react';
import {
  Settings,
  Search,
  List,
  Map,
  ArrowUpDown,
  Navigation,
  Loader2,
} from 'lucide-react';
import RestaurantCard from './RestaurantCard';
import type { Restaurant } from '../../composables/useRestaurantSearch/types';
import type { LocationData } from '../../programs/getLocation';
import {
  sortRestaurants,
  type SortType,
} from '../../composables/useRestaurantSearch/utils';

const MapView = lazy(() => import('../MapView'));

type ViewMode = 'list' | 'map';

interface SearchResultsProps {
  restaurants: Restaurant[];
  minRating: number;
  minReviews: number;
  searchRadius: number;
  isOpenNow: boolean;
  selectedPriceLevels: number[];
  currentLocation?: LocationData | null;
  getCurrentLocation?: () => void;
}

const SORT_OPTIONS: { value: SortType; label: string }[] = [
  { value: 'distance', label: '駅からの距離順' },
  { value: 'distanceFromCurrentLocation', label: '現在地からの距離順' },
  { value: 'rating', label: '評価順' },
];

const SearchResults: React.FC<SearchResultsProps> = ({
  restaurants,
  minRating,
  minReviews,
  searchRadius,
  isOpenNow,
  selectedPriceLevels,
  currentLocation,
  getCurrentLocation,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortType, setSortType] = useState<SortType>('distance');

  const sortedRestaurants = useMemo(
    () => sortRestaurants(restaurants, sortType, currentLocation),
    [restaurants, sortType, currentLocation],
  );

  const handleSortChange = (newSort: SortType) => {
    if (
      newSort === 'distanceFromCurrentLocation' &&
      !currentLocation &&
      getCurrentLocation
    ) {
      getCurrentLocation();
    }
    setSortType(newSort);
  };

  const getSuggestions = () => {
    const suggestions: string[] = [];

    if (minRating > 3.5) {
      suggestions.push('評価基準を下げる（現在: ★' + minRating + '以上）');
    }
    if (minReviews > 50) {
      suggestions.push(
        'レビュー数の条件を下げる（現在: ' + minReviews + '件以上）',
      );
    }
    if (searchRadius < 1000) {
      suggestions.push('検索範囲を広げる（現在: ' + searchRadius + 'm）');
    }
    if (isOpenNow) {
      suggestions.push('「営業中のみ表示」のチェックを外す');
    }
    if (selectedPriceLevels.length < 4) {
      suggestions.push('価格帯の選択を増やす');
    }

    return suggestions;
  };

  if (restaurants.length === 0) {
    const suggestions = getSuggestions();
    return (
      <div className="mt-6 card">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 bg-primary-100 rounded-full">
            <Search size={20} className="text-primary-600" />
          </div>
          <div>
            <h3 className="font-bold text-text mb-1">
              検索結果が見つかりませんでした
            </h3>
            <p className="text-sm text-text-muted">
              以下の条件を変更して再度お試しください
            </p>
          </div>
        </div>

        {suggestions.length > 0 && (
          <ul className="space-y-2 bg-surface-muted p-4 rounded-xl">
            {suggestions.map((suggestion, index) => (
              <li
                key={index}
                className="flex items-center gap-2 text-sm text-text"
              >
                <Settings size={14} className="text-primary-500 shrink-0" />
                {suggestion}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="mt-6">
      {/* Toolbar: count + sort + view toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <span className="badge-primary text-sm">
          {restaurants.length}件見つかりました
        </span>

        <div className="flex items-center gap-2">
          {/* Sort selector */}
          <div className="flex items-center gap-1.5">
            <ArrowUpDown size={14} className="text-text-muted" />
            <select
              value={sortType}
              onChange={(e) => handleSortChange(e.target.value as SortType)}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-text cursor-pointer focus:border-primary-500 focus:outline-hidden focus:ring-2 focus:ring-primary-500/20"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* View toggle */}
          <div className="flex bg-gray-100 p-0.5 rounded-lg">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors duration-200 cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <List size={14} />
              <span className="hidden sm:inline">リスト</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors duration-200 cursor-pointer ${
                viewMode === 'map'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Map size={14} />
              <span className="hidden sm:inline">マップ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Current location hint for distance sort */}
      {sortType === 'distanceFromCurrentLocation' && !currentLocation && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-primary-50 rounded-lg text-sm text-primary-700">
          <Navigation size={14} className="shrink-0" />
          <span>現在地を取得中です。位置情報の許可をお願いします。</span>
        </div>
      )}

      {/* Map view */}
      {viewMode === 'map' && (
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 text-primary-500 animate-spin" />
              <span className="ml-3 text-text-muted text-sm">
                マップを読み込み中...
              </span>
            </div>
          }
        >
          <MapView
            restaurants={sortedRestaurants}
            currentLocation={currentLocation}
          />
        </Suspense>
      )}

      {/* List view */}
      {viewMode === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sortedRestaurants.map((restaurant) => (
            <RestaurantCard key={restaurant.place_id} restaurant={restaurant} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchResults;
