import React from 'react';
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
}

const SearchResults: React.FC<SearchResultsProps> = ({ restaurants }) => {
  if (restaurants.length === 0) return null;

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