import { describe, it, expect } from 'vitest';
import { CACHE_TTL } from './cache';

describe('CACHE_TTL', () => {
  it('has correct TTL values', () => {
    expect(CACHE_TTL.restaurant_search).toBe(172800); // 48h
    expect(CACHE_TTL.geocode_forward).toBe(604800); // 7d
    expect(CACHE_TTL.station_predictions).toBe(86400); // 24h
    expect(CACHE_TTL.nearby_stations).toBe(43200); // 12h
    expect(CACHE_TTL.geocode_reverse).toBe(86400); // 24h
  });

  it('geocode_forward is the longest TTL', () => {
    const values = Object.values(CACHE_TTL);
    expect(Math.max(...values)).toBe(CACHE_TTL.geocode_forward);
  });

  it('nearby_stations is the shortest TTL', () => {
    const values = Object.values(CACHE_TTL);
    expect(Math.min(...values)).toBe(CACHE_TTL.nearby_stations);
  });
});

// Note: getCache, setCache, cleanExpiredCache require a D1 database
// and Drizzle ORM to be instantiated, so they are better tested
// via integration tests with wrangler --local.
