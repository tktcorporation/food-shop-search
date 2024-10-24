import React from 'react';
import { MapPin, Star, DollarSign, Tag, Clock, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { getKeywordLabel } from '../../utils/keywordOptions';

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
  const isCurrentlyOpen = (weekdayText?: string[]) => {
    if (!weekdayText) return null;

    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[now.getDay()];
    const currentTime = now.getHours() * 100 + now.getMinutes();

    const todaySchedule = weekdayText.find(text => text.startsWith(currentDay));
    if (!todaySchedule) return null;

    const timeRanges = todaySchedule
      .replace(`${currentDay}: `, '')
      .split(', ')
      .map(range => {
        if (range.toLowerCase() === 'closed') return null;
        const [start, end] = range.split('–').map(time => {
          const [hours, minutes = '00'] = time.replace(/\s*(AM|PM)/i, '').split(':');
          let hour = parseInt(hours);
          if (time.toLowerCase().includes('pm') && hour !== 12) hour += 12;
          if (time.toLowerCase().includes('am') && hour === 12) hour = 0;
          return hour * 100 + parseInt(minutes);
        });
        return { start, end };
      })
      .filter(Boolean);

    return timeRanges.some(range => {
      if (!range) return false;
      if (range.end < range.start) {
        return currentTime >= range.start || currentTime <= range.end;
      }
      return currentTime >= range.start && currentTime <= range.end;
    });
  };

  const openInGoogleMaps = (restaurant: Restaurant) => {
    const searchQuery = encodeURIComponent(`${restaurant.name} ${restaurant.vicinity}`);
    const url = `https://www.google.com/maps/search/?api=1&query=${searchQuery}&query_place_id=${restaurant.place_id}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (restaurants.length === 0) return null;

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-6">
        <span className="text-gray-600 bg-gray-100 px-3 py-1 rounded-full text-sm">
          {restaurants.length}件見つかりました
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {restaurants.map((restaurant) => {
          const isOpen = isCurrentlyOpen(restaurant.opening_hours?.weekday_text);

          return (
            <div
              key={restaurant.place_id}
              onClick={() => openInGoogleMaps(restaurant)}
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
                  <span className="line-clamp-2">{restaurant.vicinity}</span>
                </div>

                <div className="flex flex-wrap gap-1 mb-2">
                  {restaurant.types.slice(0, 3).map((type, index) => (
                    <span
                      key={index}
                      className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full"
                    >
                      {getKeywordLabel(type)}
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
        })}
      </div>
    </div>
  );
};

export default SearchResults;