import { Hono } from 'hono';
import { Effect } from 'effect';
import { createDb } from '../db';
import { getCache, setCache, CACHE_TTL } from '../services/cache';
import { geocodeForward, geocodeReverse } from '../services/google-maps';
import type {
  ForwardGeocodeRequest,
  ReverseGeocodeRequest,
  GoogleGeocodeResult,
} from '../types';

type Bindings = {
  DB: D1Database;
  GOOGLE_MAPS_API_KEY: string;
};

export const geocodeRoutes = new Hono<{ Bindings: Bindings }>();

/**
 * POST /api/geocode/forward
 * Convert an address to coordinates.
 */
geocodeRoutes.post('/geocode/forward', async (c) => {
  const body = await c.req.json<ForwardGeocodeRequest>();

  if (!body.address || body.address.trim().length === 0) {
    return c.json({ success: false, error: 'address is required' }, 400);
  }

  const db = createDb(c.env.DB);
  const apiKey = c.env.GOOGLE_MAPS_API_KEY;
  const address = body.address.trim();

  const cacheKey = address;

  // Check cache
  const cached = await getCache<GoogleGeocodeResult[]>(
    db,
    'geocode_forward',
    cacheKey,
  );

  let results: GoogleGeocodeResult[];
  if (cached) {
    results = cached;
  } else {
    const exit = await Effect.runPromiseExit(geocodeForward(apiKey, address));

    if (exit._tag === 'Failure') {
      const error = exit.cause;
      const message =
        error._tag === 'Fail'
          ? error.error.message
          : '位置を取得できませんでした';
      return c.json({ success: false, error: message }, 500);
    }

    results = exit.value;

    // Store in cache
    await setCache(
      db,
      'geocode_forward',
      cacheKey,
      results,
      CACHE_TTL.geocode_forward,
    );
  }

  if (results.length === 0) {
    return c.json(
      { success: false, error: 'No results found for the given address' },
      404,
    );
  }

  const first = results[0];
  return c.json({
    success: true,
    data: {
      lat: first.geometry.location.lat,
      lng: first.geometry.location.lng,
      formatted_address: first.formatted_address,
    },
  });
});

/**
 * POST /api/geocode/reverse
 * Convert coordinates to an address.
 */
geocodeRoutes.post('/geocode/reverse', async (c) => {
  const body = await c.req.json<ReverseGeocodeRequest>();

  if (body.lat == null || body.lng == null) {
    return c.json({ success: false, error: 'lat and lng are required' }, 400);
  }

  const db = createDb(c.env.DB);
  const apiKey = c.env.GOOGLE_MAPS_API_KEY;
  const { lat, lng } = body;

  const cacheKey = `${lat}-${lng}`;

  // Check cache
  const cached = await getCache<GoogleGeocodeResult[]>(
    db,
    'geocode_reverse',
    cacheKey,
  );

  let results: GoogleGeocodeResult[];
  if (cached) {
    results = cached;
  } else {
    const exit = await Effect.runPromiseExit(geocodeReverse(apiKey, lat, lng));

    if (exit._tag === 'Failure') {
      const error = exit.cause;
      const message =
        error._tag === 'Fail'
          ? error.error.message
          : '住所を取得できませんでした';
      return c.json({ success: false, error: message }, 500);
    }

    results = exit.value;

    // Store in cache
    await setCache(
      db,
      'geocode_reverse',
      cacheKey,
      results,
      CACHE_TTL.geocode_reverse,
    );
  }

  if (results.length === 0) {
    return c.json(
      {
        success: false,
        error: 'No results found for the given coordinates',
      },
      404,
    );
  }

  const first = results[0];
  return c.json({
    success: true,
    data: {
      lat,
      lng,
      address: first.formatted_address,
    },
  });
});
