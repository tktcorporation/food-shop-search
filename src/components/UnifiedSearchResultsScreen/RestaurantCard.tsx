import React from 'react';
import { MapPin, Star, DollarSign, Tag, Clock, Image as ImageIcon, ExternalLink, Search } from 'lucide-react';
import { getKeywordLabel } from '../../utils/keywordOptions';
import { useOperatingHours } from '../../composables/useOperatingHours';

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
  distance?: number;
  searchKeywords: string[];
}

interface RestaurantCardProps {
  restaurant: Restaurant;
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant }) => {
  const { isOpen } = useOperatingHours(restaurant.opening_hours?.weekday_text);

  const openInGoogleMaps = (e: React.MouseEvent) => {
    e.stopPropagation();
    const searchQuery = encodeURIComponent(`${restaurant.name} ${restaurant.vicinity}`);
    const url = `https://www.google.com/maps/search/?api=1&query=${searchQuery}&query_place_id=${restaurant.place_id}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  return (
    <div
      onClick={openInGoogleMaps}
      className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer transition-transform duration-200 hover:scale-[1.02] hover:shadow-xl group"
    >
      <div className="relative">
        {restaurant.photos?.[0] ? (
          <div className="aspect-video w-full relative bg-gray-100">
            <img
              src={restaurant.photos[0].getUrl({ maxWidth: 400, maxHeight: 300 })}
              alt={restaurant.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="aspect-video w-full bg-gray-100 flex items-center justify-center">
            <ImageIcon size={40} className="text-gray-400" />
          </div>
        )}
        <div className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <ExternalLink size={16} className="text-primary-600" />
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors duration-200">
          {restaurant.name}
        </h3>
        
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center text-yellow-500">
            <Star className="inline-block mr-1" size={16} />
            <span className="font-medium">{restaurant.rating}</span>
          </div>
          <span className="text-xs text-gray-500">
            ({restaurant.user_ratings_total}件)
          </span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-600">
            {"¥".repeat(restaurant.price_level)}
          </span>
        </div>

        <div className="text-xs text-gray-500 mb-2 flex items-start">
          <MapPin className="inline-block mr-1 shrink-0" size={14} />
          <span className="line-clamp-2">
            {restaurant.vicinity}
            {restaurant.distance !== undefined && (
              <span className="ml-1 text-primary-600">
                ({formatDistance(restaurant.distance)})
              </span>
            )}
          </span>
        </div>

        {/* Matched Search Keywords */}
        {restaurant.searchKeywords && restaurant.searchKeywords.length > 0 && (
          <div className="mb-2">
            <div className="flex flex-wrap gap-1">
              {restaurant.searchKeywords.map((keyword, index) => (
                <span
                  key={index}
                  className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full"
                >
                  {getKeywordLabel(keyword)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Restaurant Types */}
        <div className="flex flex-wrap mb-2">
          {restaurant.types.map((type, index, array) => (
            <span
              key={index}
              className="text-xs text-gray-600 rounded-full"
            >
              {type}{index < array.length - 1 && ', '}
            </span>
          ))}
        </div>

        {restaurant.opening_hours?.weekday_text && (
          <div className="mt-2 border-t pt-2">
            {isOpen !== null && (
              <p className={`text-xs mb-1 ${isOpen ? 'text-green-600' : 'text-red-600'}`}>
                <Clock className="inline-block mr-1" size={14} />
                {isOpen ? '営業中' : '営業時間外'}
              </p>
            )}
            <details className="text-xs" onClick={e => e.stopPropagation()}>
              <summary className="cursor-pointer text-primary-600">
                営業時間を表示
              </summary>
              <ul className="mt-1 space-y-0.5 text-gray-600">
                {restaurant.opening_hours.weekday_text.map((day, index) => (
                  <li key={index}>{day}</li>
                ))}
              </ul>
            </details>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantCard;