import React from 'react';
import {
  MapPin,
  Star,
  Clock,
  Image as ImageIcon,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { getKeywordLabel } from '../../utils/keywordOptions';
import { useOperatingHours } from '../../composables/useOperatingHours';
import { useAnalytics } from '../../hooks/useAnalytics';

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
  business_status?: string;
}

interface RestaurantCardProps {
  restaurant: Restaurant;
}

const getBusinessStatusInfo = (status?: string) => {
  switch (status) {
    case 'OPERATIONAL':
      return null;
    case 'CLOSED_TEMPORARILY':
      return {
        message: '一時休業中',
        className: 'bg-primary-100 text-primary-700',
      };
    case 'CLOSED_PERMANENTLY':
      return {
        message: '閉店',
        className: 'bg-error-light text-error',
      };
    default:
      return null;
  }
};

const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant }) => {
  const { isOpen } = useOperatingHours(restaurant.opening_hours);
  const { trackEvent } = useAnalytics();
  const businessStatusInfo = getBusinessStatusInfo(restaurant.business_status);

  const openInGoogleMaps = (e: React.MouseEvent) => {
    e.stopPropagation();
    const searchQuery = encodeURIComponent(
      `${restaurant.name} ${restaurant.vicinity}`,
    );
    const url = `https://www.google.com/maps/search/?api=1&query=${searchQuery}&query_place_id=${restaurant.place_id}`;

    trackEvent({
      action: 'view_restaurant',
      category: 'Restaurant',
      label: restaurant.name,
    });

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
      className={`card-interactive overflow-hidden group
        ${businessStatusInfo ? 'opacity-70' : ''}`}
    >
      {/* Image Section */}
      <div className="relative -mx-5 -mt-5 mb-4">
        {restaurant.photos?.[0] ? (
          <div className="aspect-video w-full relative bg-surface-muted">
            <img
              src={restaurant.photos[0].getUrl({
                maxWidth: 400,
                maxHeight: 300,
              })}
              alt={restaurant.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="aspect-video w-full bg-surface-muted flex items-center justify-center">
            <ImageIcon size={40} className="text-text-muted" />
          </div>
        )}

        {/* External Link Icon */}
        <div className="absolute top-3 right-3 bg-surface-card/95 backdrop-blur-sm rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:scale-105">
          <ExternalLink size={16} className="text-primary-600" />
        </div>

        {/* Business Status Badge */}
        {businessStatusInfo && (
          <div
            className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-sm ${businessStatusInfo.className}`}
          >
            <AlertCircle size={14} />
            {businessStatusInfo.message}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div>
        <h3 className="text-lg font-bold mb-2 line-clamp-2 text-text group-hover:text-primary-600 transition-colors duration-200">
          {restaurant.name}
        </h3>

        {/* Rating & Price */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-1 bg-primary-50 px-2 py-1 rounded-full">
            <Star className="text-primary-500" size={16} fill="currentColor" />
            <span className="font-bold text-primary-700 text-sm">
              {restaurant.rating}
            </span>
            <span className="text-xs text-text-muted">
              ({restaurant.user_ratings_total})
            </span>
          </div>
          <span className="text-text-muted font-medium">
            {'¥'.repeat(restaurant.price_level)}
          </span>
        </div>

        {/* Address & Distance */}
        <div className="text-sm text-text-muted mb-3 flex items-start gap-1.5">
          <MapPin className="shrink-0 mt-0.5" size={14} />
          <span className="line-clamp-2">
            {restaurant.vicinity}
            {restaurant.distance !== undefined && (
              <span className="ml-1 text-primary-600 font-semibold">
                ({formatDistance(restaurant.distance)})
              </span>
            )}
          </span>
        </div>

        {/* Search Keywords */}
        {restaurant.searchKeywords && restaurant.searchKeywords.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1.5">
              {restaurant.searchKeywords.map((keyword, index) => (
                <span key={index} className="badge-primary">
                  {getKeywordLabel(keyword)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Types */}
        {restaurant.types && restaurant.types.length > 0 && (
          <div className="flex flex-wrap mb-3">
            {restaurant.types.map((type, index, array) => (
              <span key={index} className="text-xs text-text-muted">
                {type}
                {index < array.length - 1 && ', '}
              </span>
            ))}
          </div>
        )}

        {/* Operating Hours */}
        {restaurant.opening_hours?.weekday_text && !businessStatusInfo && (
          <div className="mt-3 pt-3 border-t border-primary-100">
            {isOpen !== null && (
              <p
                className={`text-sm mb-2 font-semibold flex items-center gap-1.5 ${
                  isOpen ? 'text-success' : 'text-primary-600'
                }`}
              >
                <Clock size={14} />
                {isOpen ? '営業中' : '営業時間外'}
              </p>
            )}
            <details className="text-sm" onClick={(e) => e.stopPropagation()}>
              <summary className="cursor-pointer text-primary-600 hover:text-primary-700 font-medium transition-colors">
                営業時間を表示
              </summary>
              <ul className="mt-2 space-y-1 text-text-muted bg-surface-muted p-3 rounded-lg">
                {restaurant.opening_hours.weekday_text.map((day, index) => (
                  <li key={index} className="text-sm">
                    {day}
                  </li>
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
