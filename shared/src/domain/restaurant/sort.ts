import type { Location } from '../../schema/location';
import type { Restaurant } from '../../schema/restaurant';
import { haversineDistance } from '../geo/haversine';

export type SortType = 'distance' | 'distanceFromCurrentLocation' | 'rating';

export const sortByDistance = (
  restaurants: readonly Restaurant[],
): Restaurant[] => {
  return [...restaurants].sort((a, b) => {
    if (a.distance === undefined && b.distance === undefined) return 0;
    if (a.distance === undefined) return 1;
    if (b.distance === undefined) return -1;
    return a.distance - b.distance;
  });
};

export const sortByDistanceFromLocation = (
  restaurants: readonly Restaurant[],
  location: Location,
): Restaurant[] => {
  return [...restaurants].sort((a, b) => {
    if (a.lat == null || a.lng == null) return 1;
    if (b.lat == null || b.lng == null) return -1;
    const distA = haversineDistance(location.lat, location.lng, a.lat, a.lng);
    const distB = haversineDistance(location.lat, location.lng, b.lat, b.lng);
    return distA - distB;
  });
};

export const sortByRating = (
  restaurants: readonly Restaurant[],
): Restaurant[] => {
  return [...restaurants].sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    return b.user_ratings_total - a.user_ratings_total;
  });
};

export const sortRestaurants = (
  restaurants: readonly Restaurant[],
  sortType: SortType,
  currentLocation?: Location | null,
): Restaurant[] => {
  switch (sortType) {
    case 'distanceFromCurrentLocation':
      if (currentLocation) {
        return sortByDistanceFromLocation(restaurants, currentLocation);
      }
      return sortByDistance(restaurants);
    case 'rating':
      return sortByRating(restaurants);
    case 'distance':
    default:
      return sortByDistance(restaurants);
  }
};
