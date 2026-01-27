import type { Restaurant } from './types';
import { FilterParamsSchema } from './types';
import { calculateOperatingHours } from '../../utils/operatingHours';

export const generateCacheKey = (
  request: google.maps.places.PlaceSearchRequest,
): string => {
  const loc = request.location;
  if (!loc) return `${request.keyword}-unknown-${request.radius}`;
  const lat = typeof loc.lat === 'function' ? loc.lat() : loc.lat;
  const lng = typeof loc.lng === 'function' ? loc.lng() : loc.lng;
  return `${request.keyword}-${lat}-${lng}-${request.radius}`;
};

export const filterRestaurants = (
  restaurants: Restaurant[],
  rawParams: {
    minRating: number;
    minReviews: number;
    isOpenNow: boolean;
    searchRadius: number;
    selectedPriceLevels: number[];
  },
): Restaurant[] => {
  const {
    minRating,
    minReviews,
    isOpenNow,
    searchRadius,
    selectedPriceLevels,
  } = FilterParamsSchema.parse(rawParams);

  return restaurants
    .filter(
      (place) =>
        place.business_status === 'OPERATIONAL' ||
        place.business_status === undefined,
    )
    .filter((place) => {
      const meetsBasicCriteria =
        place.rating >= minRating &&
        place.user_ratings_total >= minReviews &&
        selectedPriceLevels.includes(place.price_level);

      if (
        isOpenNow &&
        !calculateOperatingHours(place.opening_hours?.weekday_text)
      ) {
        return false;
      }

      if (searchRadius <= 100 && place.distance !== undefined) {
        return meetsBasicCriteria && place.distance <= searchRadius;
      }

      return meetsBasicCriteria;
    });
};

export const sortByDistance = (restaurants: Restaurant[]): Restaurant[] => {
  return [...restaurants].sort((a, b) => {
    if (a.distance === undefined && b.distance === undefined) return 0;
    if (a.distance === undefined) return 1;
    if (b.distance === undefined) return -1;
    return a.distance - b.distance;
  });
};
