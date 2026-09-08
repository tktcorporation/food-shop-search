import { Hono } from 'hono';
import { Effect } from 'effect';
import {
  RestaurantSearchRequest,
  haversineDistance,
  type Restaurant,
} from '../../../shared/src';
import type { Bindings } from '../bindings';
import { parseJsonBody } from '../http/parse-body';
import { createDb } from '../db';
import {
  getCache,
  setCache,
  getPlacesByIds,
  upsertPlaces,
  CACHE_TTL,
  type PlaceCacheRow,
} from '../services/cache';
import { RestaurantSearchCachePayload } from '../schema/cache';
import { searchNearbyPlaces } from '../services/google-maps';
import { resolveCachedPhotoUrls } from '../services/photos';

/**
 * Google API 呼び出し時に使用する固定半径。
 * キャッシュを半径非依存にするため、常にこの値で検索し、
 * レスポンス時にリクエストされた半径で距離フィルタリングする。
 */
const SEARCH_MAX_RADIUS = 500;

/** 写真 CDN URL 解決の同時実行数（新規処理のため上限のみ） */
const PHOTO_RESOLVE_CONCURRENCY = 5;

export const restaurantRoutes = new Hono<{ Bindings: Bindings }>();

/**
 * Convert a PlaceCacheRow to our Restaurant type (photos resolved separately).
 */
function toRestaurantBase(
  place: PlaceCacheRow,
  keyword: string,
  searchLat: number,
  searchLng: number,
): Omit<Restaurant, 'photoUrls'> & { photoReferences: string[] } {
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
    types: place.types,
    photoReferences: place.photoReferences,
    searchKeywords: [keyword],
    isOpenNow: place.isOpenNow,
    distance,
    business_status: place.businessStatus,
    lat: place.lat,
    lng: place.lng,
  };
}

restaurantRoutes.post('/restaurants/search', async (c) => {
  const parsed = await parseJsonBody(c, RestaurantSearchRequest);
  if (!parsed.ok) {
    return parsed.response;
  }

  const { keywords, location, stationPlaceId } = parsed.data;
  const db = createDb(c.env.DB);
  const apiKey = c.env.GOOGLE_MAPS_API_KEY;

  // キーワードごとの検索を Effect で構築
  const fetchKeyword = (keyword: string) =>
    Effect.gen(function* () {
      const cacheKey = `${keyword}-${stationPlaceId}`;

      const cachedPlaceIds = yield* Effect.promise(() =>
        getCache(
          db,
          'restaurant_search',
          cacheKey,
          RestaurantSearchCachePayload,
        ),
      );

      if (cachedPlaceIds) {
        const placeMap = yield* Effect.promise(() =>
          getPlacesByIds(db, cachedPlaceIds),
        );
        return { keyword, placeMap };
      }

      const { results: places, complete } = yield* searchNearbyPlaces(
        apiKey,
        location.lat,
        location.lng,
        SEARCH_MAX_RADIUS,
        keyword,
      );

      yield* Effect.promise(() => upsertPlaces(db, places));

      const placeIds = places.map((p) => p.place_id);
      if (complete) {
        yield* Effect.promise(() =>
          setCache(
            db,
            'restaurant_search',
            cacheKey,
            placeIds,
            CACHE_TTL.restaurant_search,
          ),
        );
      }

      const placeMap = yield* Effect.promise(() =>
        getPlacesByIds(db, placeIds),
      );
      return { keyword, placeMap };
    });

  const program = Effect.all(keywords.map(fetchKeyword), {
    concurrency: 'unbounded',
  }).pipe(
    Effect.flatMap((keywordResults) => {
      // Combine and deduplicate by place_id
      type PendingRestaurant = Omit<Restaurant, 'photoUrls'> & {
        photoReferences: string[];
      };
      const restaurantMap = new Map<string, PendingRestaurant>();

      for (const { keyword, placeMap } of keywordResults) {
        for (const [placeId, place] of placeMap) {
          const existing = restaurantMap.get(placeId);
          if (existing) {
            if (!existing.searchKeywords.includes(keyword)) {
              restaurantMap.set(placeId, {
                ...existing,
                searchKeywords: [...existing.searchKeywords, keyword],
              });
            }
          } else {
            restaurantMap.set(
              placeId,
              toRestaurantBase(place, keyword, location.lat, location.lng),
            );
          }
        }
      }

      // Resolve photos to key-free CDN URLs (cached in D1)
      return Effect.all(
        Array.from(restaurantMap.values()).map((pending) =>
          Effect.gen(function* () {
            const photoUrls = yield* Effect.promise(() =>
              resolveCachedPhotoUrls(db, apiKey, pending.photoReferences),
            );
            return {
              place_id: pending.place_id,
              name: pending.name,
              vicinity: pending.vicinity,
              rating: pending.rating,
              user_ratings_total: pending.user_ratings_total,
              price_level: pending.price_level,
              types: pending.types,
              photoUrls,
              searchKeywords: pending.searchKeywords,
              isOpenNow: pending.isOpenNow,
              distance: pending.distance,
              business_status: pending.business_status,
              lat: pending.lat,
              lng: pending.lng,
            } satisfies Restaurant;
          }),
        ),
        { concurrency: PHOTO_RESOLVE_CONCURRENCY },
      );
    }),
  );

  const exit = await Effect.runPromiseExit(program);

  if (exit._tag === 'Failure') {
    const error = exit.cause;
    const message =
      error._tag === 'Fail'
        ? error.error.message
        : 'レストラン検索中にエラーが発生しました';
    return c.json({ success: false, error: message }, 500);
  }

  return c.json({ success: true, data: exit.value });
});
