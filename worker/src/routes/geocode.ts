import { Hono } from 'hono';
import { Effect } from 'effect';
import {
  ForwardGeocodeRequest,
  ReverseGeocodeRequest,
} from '../../../shared/src';
import type { Bindings } from '../bindings';
import { parseJsonBody } from '../http/parse-body';
import { createDb } from '../db';
import { getCache, setCache, CACHE_TTL } from '../services/cache';
import { geocodeForward, geocodeReverse } from '../services/google-maps';
import type { GoogleGeocodeResult } from '../schema/google';
import { GeocodeCachePayload } from '../schema/cache';

export const geocodeRoutes = new Hono<{ Bindings: Bindings }>();

/**
 * POST /api/geocode/forward
 * Convert an address to coordinates.
 */
geocodeRoutes.post('/geocode/forward', async (c) => {
  const parsed = await parseJsonBody(c, ForwardGeocodeRequest);
  if (!parsed.ok) {
    return parsed.response;
  }

  const db = createDb(c.env.DB);
  const apiKey = c.env.GOOGLE_MAPS_API_KEY;
  const address = parsed.data.address;

  const cached = await getCache(
    db,
    'geocode_forward',
    address,
    GeocodeCachePayload,
  );

  let results: readonly GoogleGeocodeResult[];
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

    await setCache(
      db,
      'geocode_forward',
      address,
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
  const parsed = await parseJsonBody(c, ReverseGeocodeRequest);
  if (!parsed.ok) {
    return parsed.response;
  }

  const db = createDb(c.env.DB);
  const apiKey = c.env.GOOGLE_MAPS_API_KEY;
  const { lat, lng } = parsed.data;

  const cacheKey = `${lat}-${lng}`;

  const cached = await getCache(
    db,
    'geocode_reverse',
    cacheKey,
    GeocodeCachePayload,
  );

  let results: readonly GoogleGeocodeResult[];
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
