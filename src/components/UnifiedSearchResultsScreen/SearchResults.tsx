import type React from 'react';
import { AlertCircle, Settings } from 'lucide-react';
import RestaurantCard from './RestaurantCard';
import type { Restaurant } from '../../composables/useRestaurantSearch/types';

interface SearchResultsProps {
  restaurants: Restaurant[];
  minRating: number;
  minReviews: number;
  searchRadius: number;
  isOpenNow: boolean;
  selectedPriceLevels: number[];
}

const SearchResults: React.FC<SearchResultsProps> = ({
  restaurants,
  minRating,
  minReviews,
  searchRadius,
  isOpenNow,
  selectedPriceLevels,
}) => {
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
      <div className="p-4 bg-white rounded-lg shadow-lg">
        <div className="flex items-start gap-3 text-amber-600 mb-3">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-sm mb-1">
              検索結果が見つかりませんでした
            </h3>
            <p className="text-xs text-gray-600">
              以下の条件を変更して再度お試しください
            </p>
          </div>
        </div>

        {suggestions.length > 0 && (
          <ul className="space-y-1.5 pl-8">
            {suggestions.map((suggestion, index) => (
              <li
                key={index}
                className="flex items-center gap-2 text-xs text-gray-600"
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
    <div>
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
          {restaurants.length}件
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {restaurants.map((restaurant) => (
          <RestaurantCard key={restaurant.place_id} restaurant={restaurant} />
        ))}
      </div>
    </div>
  );
};

export default SearchResults;
