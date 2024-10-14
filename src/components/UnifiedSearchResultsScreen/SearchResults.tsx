import React from 'react';
import { MapPin, Star, DollarSign, Tag, Clock } from 'lucide-react';
import { getKeywordLabel } from '../../utils/keywordOptions';

interface Restaurant {
  place_id: string;
  name: string;
  vicinity: string;
  rating: number;
  user_ratings_total: number;
  price_level: number;
  types: string[];
  opening_hours?: {
    open_now: boolean;
    weekday_text?: string[];
  };
}

interface SearchResultsProps {
  restaurants: Restaurant[];
}

const SearchResults: React.FC<SearchResultsProps> = ({ restaurants }) => {
  if (restaurants.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold mb-4">検索結果</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {restaurants.map((restaurant) => (
          <div key={restaurant.place_id} className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">{restaurant.name}</h3>
              <p className="text-gray-600 mb-2">
                <MapPin className="inline-block mr-1" size={16} />
                {restaurant.vicinity}
              </p>
              <p className="text-gray-600 mb-2">
                <Star className="inline-block mr-1" size={16} />
                {restaurant.rating} ({restaurant.user_ratings_total} 件の評価)
              </p>
              <p className="text-gray-600 mb-2">
                <DollarSign className="inline-block mr-1" size={16} />
                {"¥".repeat(restaurant.price_level)}
              </p>
              <p className="text-gray-600 mb-2">
                <Tag className="inline-block mr-1" size={16} />
                {restaurant.types.map(getKeywordLabel).join(", ")}
              </p>
              {restaurant.opening_hours && (
                <>
                  <p className={`text-gray-600 mb-2 ${restaurant.opening_hours.open_now ? 'text-green-600' : 'text-red-600'}`}>
                    <Clock className="inline-block mr-1" size={16} />
                    {restaurant.opening_hours.open_now ? '営業中' : '営業時間外'}
                  </p>
                  {restaurant.opening_hours.weekday_text && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-primary-600">営業時間を表示</summary>
                      <ul className="mt-2 text-sm">
                        {restaurant.opening_hours.weekday_text.map((day, index) => (
                          <li key={index}>{day}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchResults;