import { Hono } from 'hono';
import { createDb } from '../db';
import { getCache, setCache, CACHE_TTL } from '../services/cache';
import {
  getAutocompletePredictions,
  searchNearbyPlaces,
} from '../services/google-maps';
import { haversineDistance } from '../lib/haversine';
import { isStation } from '../lib/station-filter';
import type {
  StationSearchRequest,
  NearbyStationsRequest,
  Station,
  GoogleAutocompletePrediction,
  GooglePlaceResult,
} from '../types';

type Bindings = {
  DB: D1Database;
  GOOGLE_MAPS_API_KEY: string;
};

export const stationRoutes = new Hono<{ Bindings: Bindings }>();

/**
 * Extract prefecture from a description string like "日本、東京都渋谷区..." or secondary_text.
 */
function extractPrefecture(text: string): string {
  // Match Japanese prefecture names (ending with 都/道/府/県)
  const match = text.match(/(北海道|東京都|(?:京都|大阪)府|.{2,3}県)/);
  return match ? match[1] : '';
}

/**
 * Convert an autocomplete prediction to a Station.
 */
function predictionToStation(
  prediction: GoogleAutocompletePrediction,
): Station {
  const mainText = prediction.structured_formatting.main_text;
  const secondaryText = prediction.structured_formatting.secondary_text ?? '';

  return {
    name: mainText,
    prefecture: extractPrefecture(secondaryText),
    address: secondaryText,
    placeId: prediction.place_id,
  };
}

/**
 * Convert a nearby place result to a Station.
 */
function placeToStation(
  place: GooglePlaceResult,
  searchLat: number,
  searchLng: number,
): Station {
  let distance: number | undefined;
  if (place.geometry?.location) {
    distance = haversineDistance(
      searchLat,
      searchLng,
      place.geometry.location.lat,
      place.geometry.location.lng,
    );
  }

  return {
    name: place.name,
    prefecture: extractPrefecture(place.vicinity ?? ''),
    address: place.vicinity ?? '',
    distance,
    placeId: place.place_id,
  };
}

/**
 * POST /api/stations/search
 * Search for stations by name using autocomplete.
 */
stationRoutes.post('/stations/search', async (c) => {
  const body = await c.req.json<StationSearchRequest>();

  if (!body.input || body.input.trim().length === 0) {
    return c.json({ success: false, error: 'input is required' }, 400);
  }

  const db = createDb(c.env.DB);
  const apiKey = c.env.GOOGLE_MAPS_API_KEY;
  const input = body.input.trim();

  const cacheKey = input;

  // Check cache
  const cached = await getCache<GoogleAutocompletePrediction[]>(
    db,
    'station_predictions',
    cacheKey,
  );

  let predictions: GoogleAutocompletePrediction[];
  if (cached) {
    predictions = cached;
  } else {
    // Call Google Autocomplete API
    const result = await getAutocompletePredictions(apiKey, input);

    if (!result.ok) {
      return c.json({ success: false, error: result.error }, 500);
    }

    predictions = result.data;

    // Store in cache
    await setCache(
      db,
      'station_predictions',
      cacheKey,
      predictions,
      CACHE_TTL.station_predictions,
    );
  }

  const stations: Station[] = predictions
    .filter((p) => isStation(p.types))
    .map(predictionToStation);

  return c.json({ success: true, data: stations });
});

/**
 * POST /api/stations/nearby
 * Find nearby stations from a given location.
 */
stationRoutes.post('/stations/nearby', async (c) => {
  const body = await c.req.json<NearbyStationsRequest>();

  if (body.lat == null || body.lng == null) {
    return c.json({ success: false, error: 'lat and lng are required' }, 400);
  }

  const db = createDb(c.env.DB);
  const apiKey = c.env.GOOGLE_MAPS_API_KEY;
  const { lat, lng } = body;

  // Coarse location for cache key (2 decimal places ~ 1.1km precision)
  const cacheKey = `${lat.toFixed(2)}-${lng.toFixed(2)}`;

  // Check cache
  const cached = await getCache<GooglePlaceResult[]>(
    db,
    'nearby_stations',
    cacheKey,
  );

  let places: GooglePlaceResult[];
  if (cached) {
    places = cached;
  } else {
    // Search for train stations within 5km
    const result = await searchNearbyPlaces(
      apiKey,
      lat,
      lng,
      5000,
      '駅',
      'train_station',
    );

    if (!result.ok) {
      return c.json({ success: false, error: result.error }, 500);
    }

    places = result.data;

    // Store in cache
    await setCache(
      db,
      'nearby_stations',
      cacheKey,
      places,
      CACHE_TTL.nearby_stations,
    );
  }

  // Convert to Station[], filter to actual stations, sort by distance, take top 5
  const stations: Station[] = places
    .filter((p) => isStation(p.types))
    .map((place) => placeToStation(place, lat, lng))
    .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
    .slice(0, 5);

  return c.json({ success: true, data: stations });
});
