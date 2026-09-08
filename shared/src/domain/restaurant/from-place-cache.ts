import type { Restaurant } from '../../schema/restaurant';
import type { PhotoCdnUrl } from '../../schema/photo';
import { haversineDistance } from '../geo/haversine';

/**
 * place_cache / Nearby 由来の最小形（インフラ型に依存しない）。
 * station の PlaceResultLike と同型の anti-corruption 境界。
 */
export interface PlaceCacheLike {
  readonly placeId: string;
  readonly name: string;
  readonly vicinity: string;
  readonly rating: number;
  readonly userRatingsTotal: number;
  readonly priceLevel: number;
  readonly types: readonly string[];
  readonly isOpenNow?: boolean;
  readonly lat?: number;
  readonly lng?: number;
  readonly businessStatus?: string;
}

/**
 * Place cache 行 → Restaurant（写真は別途 attach）。
 * Google / D1 の都合はここで一度だけ正規化する。
 */
export const restaurantFromPlaceCache = (
  place: PlaceCacheLike,
  keyword: string,
  searchLat: number,
  searchLng: number,
  photoUrls: readonly PhotoCdnUrl[] = [],
): Restaurant => {
  let distance: number | undefined;
  if (place.lat != null && place.lng != null) {
    distance = haversineDistance(searchLat, searchLng, place.lat, place.lng);
  }

  return {
    place_id: place.placeId,
    name: place.name,
    vicinity: place.vicinity,
    rating: place.rating,
    user_ratings_total: place.userRatingsTotal,
    price_level: place.priceLevel,
    types: [...place.types],
    photoUrls: [...photoUrls],
    searchKeywords: [keyword],
    isOpenNow: place.isOpenNow,
    distance,
    business_status: place.businessStatus,
    lat: place.lat,
    lng: place.lng,
  };
};

/**
 * 同一 place を複数キーワードでヒットしたときに keywords をマージする。
 */
export const mergeRestaurantKeyword = (
  restaurant: Restaurant,
  keyword: string,
): Restaurant => {
  if (restaurant.searchKeywords.includes(keyword)) {
    return restaurant;
  }
  return {
    ...restaurant,
    searchKeywords: [...restaurant.searchKeywords, keyword],
  };
};

/**
 * 解決済み写真 URL を付与する（インフラ解決結果の取り付け専用）。
 */
export const withRestaurantPhotos = (
  restaurant: Restaurant,
  photoUrls: readonly PhotoCdnUrl[],
): Restaurant => ({
  ...restaurant,
  photoUrls: [...photoUrls],
});
