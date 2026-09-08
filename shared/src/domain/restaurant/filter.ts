import type {
  Restaurant,
  RestaurantFilterParams,
} from '../../schema/restaurant';

/**
 * レストラン一覧にドメインフィルターを適用する（純関数）。
 */
export const filterRestaurants = (
  restaurants: readonly Restaurant[],
  {
    minRating,
    minReviews,
    isOpenNow,
    searchRadius,
    selectedPriceLevels,
  }: RestaurantFilterParams,
): Restaurant[] => {
  return restaurants
    .filter(
      (place) =>
        place.business_status === 'OPERATIONAL' ||
        place.business_status === undefined,
    )
    .filter((place) => {
      // Google Nearby Search は price_level を返さないことがあり、
      // キャッシュ上は -1（不明）になる。不明な価格帯は除外しない。
      const hasKnownPriceLevel =
        typeof place.price_level === 'number' && place.price_level >= 0;
      const matchesPriceLevel =
        !hasKnownPriceLevel || selectedPriceLevels.includes(place.price_level);

      const meetsBasicCriteria =
        place.rating >= minRating &&
        place.user_ratings_total >= minReviews &&
        matchesPriceLevel;

      if (isOpenNow && place.isOpenNow !== true) {
        return false;
      }

      // 距離フィルター（バックエンドは常に最大半径で検索するためクライアントで絞り込む）
      if (place.distance !== undefined && place.distance > searchRadius) {
        return false;
      }

      return meetsBasicCriteria;
    });
};
