import { describe, it, expect } from 'vitest';
import { CACHE_TTL } from './cache';

describe('CACHE_TTL', () => {
  it('has correct TTL values', () => {
    expect(CACHE_TTL.restaurant_search).toBe(172800); // 48h
    expect(CACHE_TTL.geocode_forward).toBe(604800); // 7d
    expect(CACHE_TTL.station_predictions).toBe(86400); // 24h
    expect(CACHE_TTL.nearby_stations).toBe(604800); // 7d
    expect(CACHE_TTL.geocode_reverse).toBe(86400); // 24h
    expect(CACHE_TTL.place_detail).toBe(1209600); // 14d
  });

  it('place_detail is the longest TTL', () => {
    const values = Object.values(CACHE_TTL);
    expect(Math.max(...values)).toBe(CACHE_TTL.place_detail);
  });

  it('station_predictions and geocode_reverse are the shortest TTL', () => {
    const values = Object.values(CACHE_TTL);
    const minTTL = Math.min(...values);
    expect(minTTL).toBe(86400);
    expect(CACHE_TTL.station_predictions).toBe(minTTL);
    expect(CACHE_TTL.geocode_reverse).toBe(minTTL);
  });
});

// Note: getCache, setCache, cleanExpiredCache require a D1 database
// and Drizzle ORM to be instantiated, so they are better tested
// via integration tests with wrangler --local.
