import { Hono } from 'hono';
import { Effect, Schema } from 'effect';
import {
  RestaurantSearchRequest,
  Restaurant,
  restaurantFromPlaceCache,
  mergeRestaurantKeyword,
  withRestaurantPhotos,
  type Restaurant as RestaurantEntity,
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
} from '../services/cache';
import { RestaurantSearchCachePayload } from '../schema/cache';
import { searchNearbyPlaces } from '../services/google-maps';
import { resolveCachedPhotoUrls } from '../services/photos';

/**
 * Google API 呼び出し時に使用する固定半径。
 * キャッシュを半径非依存にするため、常にこの値で検索し、
 * クライアント側でリクエスト半径による距離フィルタを行う。
 * （RestaurantSearchRequest.radius は FE フィルタ用で Worker では未使用）
 */
const SEARCH_MAX_RADIUS = 500;

/** 写真 CDN URL 解決の同時実行数 */
const PHOTO_RESOLVE_CONCURRENCY = 5;

const RestaurantList = Schema.Array(Restaurant);

export const restaurantRoutes = new Hono<{ Bindings: Bindings }>();

restaurantRoutes.post('/restaurants/search', async (c) => {
  const parsed = await parseJsonBody(c, RestaurantSearchRequest);
  if (!parsed.ok) {
    return parsed.response;
  }

  const { keywords, location, stationPlaceId } = parsed.data;
  const db = createDb(c.env.DB);
  const apiKey = c.env.GOOGLE_MAPS_API_KEY;

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
      // Domains first; photo_reference は解決パイプラインの入力に閉じる
      const pending = new Map<
        string,
        {
          restaurant: RestaurantEntity;
          photoReferences: readonly string[];
        }
      >();

      for (const { keyword, placeMap } of keywordResults) {
        for (const [placeId, place] of placeMap) {
          const existing = pending.get(placeId);
          if (existing) {
            pending.set(placeId, {
              restaurant: mergeRestaurantKeyword(existing.restaurant, keyword),
              photoReferences: existing.photoReferences,
            });
          } else {
            pending.set(placeId, {
              restaurant: restaurantFromPlaceCache(
                place,
                keyword,
                location.lat,
                location.lng,
              ),
              photoReferences: place.photoReferences,
            });
          }
        }
      }

      return Effect.all(
        Array.from(pending.values()).map(({ restaurant, photoReferences }) =>
          Effect.gen(function* () {
            const photoUrls = yield* resolveCachedPhotoUrls(
              db,
              apiKey,
              photoReferences,
            );
            return withRestaurantPhotos(restaurant, photoUrls);
          }),
        ),
        { concurrency: PHOTO_RESOLVE_CONCURRENCY },
      );
    }),
    Effect.flatMap((restaurants) =>
      Schema.encode(RestaurantList)(restaurants).pipe(
        Effect.mapError(
          (error) =>
            new Error(`Restaurant response encode failed: ${String(error)}`),
        ),
      ),
    ),
  );

  const exit = await Effect.runPromiseExit(program);

  if (exit._tag === 'Failure') {
    const error = exit.cause;
    const message =
      error._tag === 'Fail'
        ? error.error instanceof Error
          ? error.error.message
          : typeof error.error === 'object' &&
              error.error !== null &&
              'message' in error.error
            ? String((error.error as { message: unknown }).message)
            : 'レストラン検索中にエラーが発生しました'
        : 'レストラン検索中にエラーが発生しました';
    return c.json({ success: false, error: message }, 500);
  }

  return c.json({ success: true, data: exit.value });
});
