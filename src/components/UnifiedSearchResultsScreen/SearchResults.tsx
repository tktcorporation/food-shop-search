import type React from 'react';
import { Settings, Search } from 'lucide-react';
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
      <div className="flex justify-between items-center mb-5">
        <span className="badge-primary text-sm">
          {restaurants.length}件見つかりました
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {restaurants.map((restaurant) => (
          <RestaurantCard key={restaurant.place_id} restaurant={restaurant} />
        ))}
      </div>
    </div>
  );
};

export default SearchResults;
