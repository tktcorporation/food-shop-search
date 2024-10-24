import React from 'react';
import { AlertCircle, Settings } from 'lucide-react';
import RestaurantCard from './RestaurantCard';

interface Restaurant {
  place_id: string;
  name: string;
  vicinity: string;
  rating: number;
  user_ratings_total: number;
  price_level: number;
  types: string[];
  photos?: google.maps.places.PlacePhoto[];
  opening_hours?: {
    weekday_text?: string[];
  };
}

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
      suggestions.push("評価基準を下げる（現在: ★" + minRating + "以上）");
    }
    if (minReviews > 50) {
      suggestions.push("レビュー数の条件を下げる（現在: " + minReviews + "件以上）");
    }
    if (searchRadius < 1000) {
      suggestions.push("検索範囲を広げる（現在: " + searchRadius + "m）");
    }
    if (isOpenNow) {
      suggestions.push("「営業中のみ表示」のチェックを外す");
    }
    if (selectedPriceLevels.length < 4) {
      suggestions.push("価格帯の選択を増やす");
    }

    return suggestions;
  };

  if (restaurants.length === 0) {
    const suggestions = getSuggestions();
    return (
      <div className="mt-8 p-6 bg-white rounded-lg shadow-md">
        <div className="flex items-start gap-3 text-amber-600 mb-4">
          <AlertCircle size={24} className="shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold mb-2">検索結果が見つかりませんでした</h3>
            <p className="text-sm text-gray-600">以下の条件を変更して再度お試しください：</p>
          </div>
        </div>
        
        {suggestions.length > 0 && (
          <ul className="mt-4 space-y-2">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-center gap-2 text-sm text-gray-700">
                <Settings size={16} className="text-primary-500" />
                {suggestion}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-6">
        <span className="text-gray-600 bg-gray-100 px-3 py-1 rounded-full text-sm">
          {restaurants.length}件見つかりました
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {restaurants.map((restaurant) => (
          <RestaurantCard
            key={restaurant.place_id}
            restaurant={restaurant}
          />
        ))}
      </div>
    </div>
  );
};

export default SearchResults;