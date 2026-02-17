import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const apiCache = sqliteTable(
  'api_cache',
  {
    cacheKey: text('cache_key').primaryKey(),
    cacheType: text('cache_type').notNull(),
    responseData: text('response_data').notNull(),
    createdAt: integer('created_at', { mode: 'number' })
      .notNull()
      .default(sql`(unixepoch())`),
    expiresAt: integer('expires_at', { mode: 'number' }).notNull(),
    hitCount: integer('hit_count').notNull().default(0),
  },
  (table) => [
    index('idx_cache_type').on(table.cacheType),
    index('idx_expires_at').on(table.expiresAt),
  ],
);

export const placeCache = sqliteTable(
  'place_cache',
  {
    placeId: text('place_id').primaryKey(),
    name: text('name').notNull(),
    vicinity: text('vicinity').notNull(),
    rating: integer('rating', { mode: 'number' }).notNull().default(0),
    userRatingsTotal: integer('user_ratings_total', { mode: 'number' }).notNull().default(0),
    priceLevel: integer('price_level', { mode: 'number' }).notNull().default(-1),
    types: text('types').notNull(), // JSON array
    photoReferences: text('photo_references').notNull(), // JSON array of photo_reference strings
    isOpenNow: integer('is_open_now', { mode: 'number' }),
    lat: integer('lat', { mode: 'number' }),
    lng: integer('lng', { mode: 'number' }),
    businessStatus: text('business_status'),
    createdAt: integer('created_at', { mode: 'number' })
      .notNull()
      .default(sql`(unixepoch())`),
    expiresAt: integer('expires_at', { mode: 'number' }).notNull(),
  },
  (table) => [index('idx_place_expires').on(table.expiresAt)],
);
