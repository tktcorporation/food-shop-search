import type { Restaurant } from './types';

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
