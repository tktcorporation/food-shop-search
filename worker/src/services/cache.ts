import { eq, lt, sql } from 'drizzle-orm';
import type { Database } from '../db';
import { apiCache } from '../db/schema';

/** Cache TTL values in seconds */
export const CACHE_TTL = {
  restaurant_search: 172800, // 48h
  geocode_forward: 604800, // 7d
  station_predictions: 86400, // 24h
  nearby_stations: 43200, // 12h
  geocode_reverse: 86400, // 24h
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
