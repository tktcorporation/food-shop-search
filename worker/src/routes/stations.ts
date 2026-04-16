import { Hono } from 'hono';
import { Effect } from 'effect';
import { createDb } from '../db';
import { getCache, setCache, CACHE_TTL } from '../services/cache';
import {
  getAutocompletePredictions,
  searchNearbyPlaces,
  searchStationByText,
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
 * Convert a place result (Nearby Search or Text Search) to a Station.
 */
function placeToStation(
  place: GooglePlaceResult,
  searchLat?: number,
  searchLng?: number,
): Station {
  let distance: number | undefined;
  if (searchLat != null && searchLng != null && place.geometry?.location) {
    distance = haversineDistance(
      searchLat,
      searchLng,
      place.geometry.location.lat,
      place.geometry.location.lng,
    );
  }

  const addressSource = place.vicinity ?? place.formatted_address ?? '';

  return {
    name: place.name,
    prefecture: extractPrefecture(addressSource),
    address: addressSource,
    distance,
    placeId: place.place_id,
    lat: place.geometry?.location.lat,
    lng: place.geometry?.location.lng,
  };
}

/**
 * POST /api/stations/search
 * Search for stations by name using autocomplete, supplemented with
 * Text Search to ensure exact station matches (e.g. "新宿駅") appear.
 */
stationRoutes.post('/stations/search', async (c) => {
  const body = await c.req.json<StationSearchRequest>();

  if (!body.input || body.input.trim().length === 0) {
    return c.json({ success: false, error: 'input is required' }, 400);
  }

  const db = createDb(c.env.DB);
  const apiKey = c.env.GOOGLE_MAPS_API_KEY;
  // 末尾の「駅」を除去して正規化（「新宿駅」→「新宿」）
  const input = body.input.trim().replace(/駅$/, '');
  const textSearchQuery = `${input}駅`;

  // --- Autocomplete predictions (cache check) ---
  const cachedPredictions = await getCache<GoogleAutocompletePrediction[]>(
    db,
    'station_predictions',
    input,
  );

  // --- Text Search exact match (cache check) ---
  const cachedTextSearch = await getCache<GooglePlaceResult[]>(
    db,
    'station_text_search',
    input,
  );

  // Fetch uncached results in parallel via Effect.all
  const predictionsEffect = cachedPredictions
    ? Effect.succeed(null)
    : Effect.either(getAutocompletePredictions(apiKey, input));

  const textSearchEffect = cachedTextSearch
    ? Effect.succeed(null)
    : Effect.either(searchStationByText(apiKey, textSearchQuery));

  const [predictionsResult, textSearchResult] = await Effect.runPromise(
    Effect.all([predictionsEffect, textSearchEffect], {
      concurrency: 'unbounded',
    }),
  );

  // Process autocomplete predictions
  let predictions: GoogleAutocompletePrediction[];
  if (cachedPredictions) {
    predictions = cachedPredictions;
  } else if (predictionsResult && predictionsResult._tag === 'Right') {
    predictions = predictionsResult.right;
    await setCache(
      db,
      'station_predictions',
      input,
      predictions,
      CACHE_TTL.station_predictions,
    );
  } else {
    // Autocomplete failed — return error only if text search also fails
    predictions = [];
  }

  // Process text search results (take first match only)
  let exactMatches: GooglePlaceResult[];
  if (cachedTextSearch) {
    exactMatches = cachedTextSearch;
  } else if (textSearchResult && textSearchResult._tag === 'Right') {
    // Keep only the first result — the most relevant exact match
    exactMatches = textSearchResult.right.slice(0, 1);
    await setCache(
      db,
      'station_text_search',
      input,
      exactMatches,
      CACHE_TTL.station_text_search,
    );
  } else {
    // Text search failed — continue with autocomplete results only
    exactMatches = [];
  }

  // Convert to Station[]
  const autocompleteStations = predictions.map(predictionToStation);
  const exactStations = exactMatches.map((p) => placeToStation(p));

  // Merge: exact matches first, then autocomplete (deduplicated by place_id)
  const seenPlaceIds = new Set(exactStations.map((s) => s.placeId));
  const deduped = autocompleteStations.filter(
    (s) => !seenPlaceIds.has(s.placeId),
  );
  const stations = [...exactStations, ...deduped];

  if (
    stations.length === 0 &&
    predictionsResult &&
    predictionsResult._tag === 'Left'
  ) {
    return c.json(
      { success: false, error: predictionsResult.left.message },
      500,
    );
  }

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
    // type を指定しないことで subway_station のみの駅も漏れなく取得し、
    // isStation フィルタで train_station / subway_station に絞る
    const exit = await Effect.runPromiseExit(
      searchNearbyPlaces(apiKey, lat, lng, 5000, '駅'),
    );

    if (exit._tag === 'Failure') {
      const error = exit.cause;
      const message =
        error._tag === 'Fail'
          ? error.error.message
          : '近くの駅の検索に失敗しました';
      return c.json({ success: false, error: message }, 500);
    }

    places = exit.value;

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
