import { Hono } from 'hono';
import { Effect } from 'effect';
import { createDb } from '../db';
import {
  getCache,
  setCache,
  getPlacesByIds,
  upsertPlaces,
  CACHE_TTL,
  type PlaceCacheRow,
} from '../services/cache';
import { searchNearbyPlaces, getPhotoUrl } from '../services/google-maps';
import { haversineDistance } from '../lib/haversine';
import type { RestaurantSearchRequest, Restaurant } from '../types';

/**
 * Google API 呼び出し時に使用する固定半径。
 * キャッシュを半径非依存にするため、常にこの値で検索し、
 * レスポンス時にリクエストされた半径で距離フィルタリングする。
 */
const SEARCH_MAX_RADIUS = 500;

type Bindings = {
  DB: D1Database;
  GOOGLE_MAPS_API_KEY: string;
};

export const restaurantRoutes = new Hono<{ Bindings: Bindings }>();

/**
 * Convert a PlaceCacheRow to our Restaurant type.
 */
function toRestaurantFromCache(
  place: PlaceCacheRow,
  apiKey: string,
  keyword: string,
  searchLat: number,
  searchLng: number,
): Restaurant {
  const photoUrls = place.photoReferences.map((ref) =>
    getPhotoUrl(apiKey, ref, 400),
  );

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
    photoUrls,
    searchKeywords: [keyword],
    isOpenNow: place.isOpenNow,
    distance,
    business_status: place.businessStatus,
    lat: place.lat,
    lng: place.lng,
  };
}

restaurantRoutes.post('/restaurants/search', async (c) => {
  const body = await c.req.json<RestaurantSearchRequest>();

  if (
    !body.keywords ||
    !Array.isArray(body.keywords) ||
    body.keywords.length === 0
  ) {
    return c.json(
      { success: false, error: 'keywords must be a non-empty array' },
      400,
    );
  }

  if (
    !body.location ||
    body.location.lat == null ||
    body.location.lng == null
  ) {
    return c.json(
      { success: false, error: 'location with lat and lng is required' },
      400,
    );
  }

  if (!body.radius || body.radius <= 0) {
    return c.json(
      { success: false, error: 'radius must be a positive number' },
      400,
    );
  }

  if (!body.stationPlaceId) {
    return c.json({ success: false, error: 'stationPlaceId is required' }, 400);
  }

  const db = createDb(c.env.DB);
  const apiKey = c.env.GOOGLE_MAPS_API_KEY;
  const { keywords, location, stationPlaceId } = body;

  // キーワードごとの検索を Effect で構築
  const fetchKeyword = (keyword: string) =>
    Effect.gen(function* () {
      const cacheKey = `${keyword}-${stationPlaceId}`;

      // Check search result cache (place_id list)
      const cachedPlaceIds = yield* Effect.promise(() =>
        getCache<string[]>(db, 'restaurant_search', cacheKey),
      );

      if (cachedPlaceIds) {
        const placeMap = yield* Effect.promise(() =>
          getPlacesByIds(db, cachedPlaceIds),
        );
        return { keyword, placeMap };
      }

      // Cache miss - call Google Maps API（常に最大半径で検索）
      const { results: places, complete } = yield* searchNearbyPlaces(
        apiKey,
        location.lat,
        location.lng,
        SEARCH_MAX_RADIUS,
        keyword,
      );

      // Upsert each place into place_cache
      yield* Effect.promise(() => upsertPlaces(db, places));

      // 完全な結果のみキャッシュ（不完全な結果は次回再取得させる）
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

      // Build map from fresh data
      const placeMap = yield* Effect.promise(() =>
        getPlacesByIds(db, placeIds),
      );
      return { keyword, placeMap };
    });

  // 全キーワードを並列実行
  const program = Effect.all(keywords.map(fetchKeyword), {
    concurrency: 'unbounded',
  });

  const exit = await Effect.runPromiseExit(program);

  if (exit._tag === 'Failure') {
    const error = exit.cause;
    const message =
      error._tag === 'Fail'
        ? error.error.message
        : 'レストラン検索中にエラーが発生しました';
    return c.json({ success: false, error: message }, 500);
  }

  const keywordResults = exit.value;

  // Combine and deduplicate results by place_id
  const restaurantMap = new Map<string, Restaurant>();

  for (const { keyword, placeMap } of keywordResults) {
    for (const [placeId, place] of placeMap) {
      const existing = restaurantMap.get(placeId);
      if (existing) {
        // Merge search keywords
        if (!existing.searchKeywords.includes(keyword)) {
          existing.searchKeywords.push(keyword);
        }
      } else {
        restaurantMap.set(
          placeId,
          toRestaurantFromCache(
            place,
            apiKey,
            keyword,
            location.lat,
            location.lng,
          ),
        );
      }
    }
  }

  const restaurants = Array.from(restaurantMap.values());

  return c.json({ success: true, data: restaurants });
});
