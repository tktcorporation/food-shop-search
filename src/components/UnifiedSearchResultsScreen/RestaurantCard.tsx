import React from 'react';
import { Star, Image as ImageIcon, AlertCircle } from 'lucide-react';
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
      className={`bg-white rounded-lg border border-primary-100 overflow-hidden cursor-pointer
        transition-all duration-200 hover:border-primary-200 hover:shadow-md
        ${businessStatusInfo ? 'opacity-70' : ''}`}
    >
      {/* Image Section */}
      <div className="relative aspect-[4/3] bg-primary-50">
        {restaurant.photos?.[0] ? (
          <img
            src={restaurant.photos[0].getUrl({
              maxWidth: 400,
              maxHeight: 300,
            })}
            alt={restaurant.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon size={32} className="text-primary-200" />
          </div>
        )}

        {/* Business Status Badge */}
        {businessStatusInfo && (
          <div
            className={`absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 ${businessStatusInfo.className}`}
          >
            <AlertCircle size={12} />
            {businessStatusInfo.message}
          </div>
        )}

        {/* Distance Badge */}
        {restaurant.distance !== undefined && (
          <div className="absolute top-2 right-2 bg-white/90 px-2 py-0.5 rounded text-xs font-medium text-text">
            {formatDistance(restaurant.distance)}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-3">
        {/* Name */}
        <h3 className="font-semibold text-text line-clamp-1 mb-1.5">
          {restaurant.name}
        </h3>

        {/* Rating & Price */}
        <div className="flex items-center gap-2 mb-1.5 text-sm">
          <div className="flex items-center gap-0.5">
            <Star className="text-primary-500" size={14} fill="currentColor" />
            <span className="font-medium text-text">{restaurant.rating}</span>
            <span className="text-text-muted text-xs">
              ({restaurant.user_ratings_total})
            </span>
          </div>
          <span className="text-text-muted">
            {'¥'.repeat(restaurant.price_level)}
          </span>
          {isOpen !== null && !businessStatusInfo && (
            <span
              className={`text-xs font-medium ${isOpen ? 'text-success' : 'text-text-muted'}`}
            >
              {isOpen ? '営業中' : '営業時間外'}
            </span>
          )}
        </div>

        {/* Address */}
        <p className="text-xs text-text-muted line-clamp-1 mb-2">
          {restaurant.vicinity}
        </p>

        {/* Search Keywords */}
        {restaurant.searchKeywords && restaurant.searchKeywords.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {restaurant.searchKeywords.slice(0, 3).map((keyword, index) => (
              <span
                key={index}
                className="text-xs bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded"
              >
                {getKeywordLabel(keyword)}
              </span>
            ))}
            {restaurant.searchKeywords.length > 3 && (
              <span className="text-xs text-text-muted">
                +{restaurant.searchKeywords.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantCard;
