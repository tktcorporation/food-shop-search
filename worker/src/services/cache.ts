import { eq, inArray, lt, sql } from 'drizzle-orm';
import type { Database } from '../db';
import { apiCache, placeCache } from '../db/schema';
import type { GooglePlaceResult } from '../types';

/** Cache TTL values in seconds */
export const CACHE_TTL = {
  restaurant_search: 172800, // 48h
  geocode_forward: 604800, // 7d
  station_predictions: 86400, // 24h
  nearby_stations: 604800, // 7d
  geocode_reverse: 86400, // 24h
  place_detail: 1209600, // 14d
} as const;

export type CacheType = keyof typeof CACHE_TTL;

/**
 * Retrieve a cached value from D1. Returns null if not found or expired.
 * Increments hitCount on cache hit.
 */
export async function getCache<T>(
  db: Database,
  cacheType: CacheType,
  cacheKey: string,
): Promise<T | null> {
  const now = Math.floor(Date.now() / 1000);
  const fullKey = `${cacheType}:${cacheKey}`;

  const rows = await db
    .select()
    .from(apiCache)
    .where(eq(apiCache.cacheKey, fullKey))
    .limit(1);

  if (rows.length === 0) {
    return null;
  }

  const row = rows[0];

  // Check expiration
  if (row.expiresAt <= now) {
    // Expired - delete it and return null
    await db.delete(apiCache).where(eq(apiCache.cacheKey, fullKey));
    return null;
  }

  // Increment hit count
  await db
    .update(apiCache)
    .set({ hitCount: sql`${apiCache.hitCount} + 1` })
    .where(eq(apiCache.cacheKey, fullKey));

  return JSON.parse(row.responseData) as T;
}

/**
 * Store a value in D1 cache with TTL. Uses upsert (insert or update on conflict).
 */
export async function setCache(
  db: Database,
  cacheType: CacheType,
  cacheKey: string,
  data: unknown,
  ttlSeconds: number,
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const fullKey = `${cacheType}:${cacheKey}`;

  await db
    .insert(apiCache)
    .values({
      cacheKey: fullKey,
      cacheType,
      responseData: JSON.stringify(data),
      createdAt: now,
      expiresAt: now + ttlSeconds,
      hitCount: 0,
    })
    .onConflictDoUpdate({
      target: apiCache.cacheKey,
      set: {
        responseData: JSON.stringify(data),
        createdAt: now,
        expiresAt: now + ttlSeconds,
        hitCount: 0,
      },
    });
}

/**
 * Delete all expired cache entries from D1.
 */
export async function cleanExpiredCache(db: Database): Promise<number> {
  const now = Math.floor(Date.now() / 1000);

  const result = await db
    .delete(apiCache)
    .where(lt(apiCache.expiresAt, now))
    .returning({ cacheKey: apiCache.cacheKey });

  return result.length;
}

/** PlaceCacheRow: place_cache テーブルから取得したレコードの型 */
export interface PlaceCacheRow {
  placeId: string;
  name: string;
  vicinity: string;
  rating: number;
  userRatingsTotal: number;
  priceLevel: number;
  types: string[];
  photoReferences: string[];
  isOpenNow: boolean | undefined;
  lat: number | undefined;
  lng: number | undefined;
  businessStatus: string | undefined;
}

/**
 * place_id の配列を受け取り、place_cache テーブルから非期限切れのレコードを取得
 * @returns Map<string, PlaceCacheRow>
 */
export async function getPlacesByIds(
  db: Database,
  placeIds: string[],
): Promise<Map<string, PlaceCacheRow>> {
  if (placeIds.length === 0) {
    return new Map();
  }

  const now = Math.floor(Date.now() / 1000);

  const rows = await db
    .select()
    .from(placeCache)
    .where(inArray(placeCache.placeId, placeIds));

  const result = new Map<string, PlaceCacheRow>();

  for (const row of rows) {
    // 期限切れチェック
    if (row.expiresAt <= now) {
      continue;
    }

    result.set(row.placeId, {
      placeId: row.placeId,
      name: row.name,
      vicinity: row.vicinity,
      rating: row.rating,
      userRatingsTotal: row.userRatingsTotal,
      priceLevel: row.priceLevel,
      types: JSON.parse(row.types) as string[],
      photoReferences: JSON.parse(row.photoReferences) as string[],
      isOpenNow:
        row.isOpenNow === null
          ? undefined
          : row.isOpenNow === 1
            ? true
            : false,
      lat: row.lat ?? undefined,
      lng: row.lng ?? undefined,
      businessStatus: row.businessStatus ?? undefined,
    });
  }

  return result;
}

/**
 * GooglePlaceResult[] を受け取り、place_cache テーブルに upsert
 */
export async function upsertPlaces(
  db: Database,
  places: GooglePlaceResult[],
): Promise<void> {
  if (places.length === 0) {
    return;
  }

  const now = Math.floor(Date.now() / 1000);
  const ttl = CACHE_TTL.place_detail;

  for (const place of places) {
    const photoReferences =
      place.photos?.map((p) => p.photo_reference) ?? [];

    const isOpenNowValue =
      place.opening_hours?.open_now === true
        ? 1
        : place.opening_hours?.open_now === false
          ? 0
          : null;

    await db
      .insert(placeCache)
      .values({
        placeId: place.place_id,
        name: place.name,
        vicinity: place.vicinity,
        rating: place.rating ?? 0,
        userRatingsTotal: place.user_ratings_total ?? 0,
        priceLevel: place.price_level ?? -1,
        types: JSON.stringify(place.types ?? []),
        photoReferences: JSON.stringify(photoReferences),
        isOpenNow: isOpenNowValue,
        lat: place.geometry?.location.lat ?? null,
        lng: place.geometry?.location.lng ?? null,
        businessStatus: place.business_status ?? null,
        createdAt: now,
        expiresAt: now + ttl,
      })
      .onConflictDoUpdate({
        target: placeCache.placeId,
        set: {
          name: place.name,
          vicinity: place.vicinity,
          rating: place.rating ?? 0,
          userRatingsTotal: place.user_ratings_total ?? 0,
          priceLevel: place.price_level ?? -1,
          types: JSON.stringify(place.types ?? []),
          photoReferences: JSON.stringify(photoReferences),
          isOpenNow: isOpenNowValue,
          lat: place.geometry?.location.lat ?? null,
          lng: place.geometry?.location.lng ?? null,
          businessStatus: place.business_status ?? null,
          createdAt: now,
          expiresAt: now + ttl,
        },
      });
  }
}
