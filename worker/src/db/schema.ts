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
