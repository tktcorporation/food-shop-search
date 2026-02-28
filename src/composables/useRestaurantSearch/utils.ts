import type { Restaurant } from './types';
import { haversineDistance } from '../../utils/haversine';

export type SortType = 'distance' | 'distanceFromCurrentLocation' | 'rating';

export const filterRestaurants = (
  restaurants: Restaurant[],
  {
    minRating,
    minReviews,
    isOpenNow,
    searchRadius,
    selectedPriceLevels,
  }: {
    minRating: number;
    minReviews: number;
    isOpenNow: boolean;
    searchRadius: number;
    selectedPriceLevels: number[];
  },
): Restaurant[] => {
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

      // isOpenNow フィルター
      if (isOpenNow && place.isOpenNow !== true) {
        return false;
      }

      // 距離フィルター（バックエンドは常に最大半径で検索するためフロントで絞り込む）
      if (place.distance !== undefined && place.distance > searchRadius) {
        return false;
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

export const sortByDistanceFromLocation = (
  restaurants: Restaurant[],
  location: { lat: number; lng: number },
): Restaurant[] => {
  return [...restaurants].sort((a, b) => {
    if (a.lat == null || a.lng == null) return 1;
    if (b.lat == null || b.lng == null) return -1;
    const distA = haversineDistance(location.lat, location.lng, a.lat, a.lng);
    const distB = haversineDistance(location.lat, location.lng, b.lat, b.lng);
    return distA - distB;
  });
};

export const sortByRating = (restaurants: Restaurant[]): Restaurant[] => {
  return [...restaurants].sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    return b.user_ratings_total - a.user_ratings_total;
  });
};

export const sortRestaurants = (
  restaurants: Restaurant[],
  sortType: SortType,
  currentLocation?: { lat: number; lng: number } | null,
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
