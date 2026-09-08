import { Hono } from 'hono';
import { Effect } from 'effect';
import {
  StationSearchRequest,
  NearbyStationsRequest,
  normalizeStationInput,
  isStation,
  stationFromPrediction,
  stationFromPlace,
  mergeStationsByPlaceId,
  type Station,
} from '../../../shared/src';
import type { Bindings } from '../bindings';
import { parseJsonBody } from '../http/parse-body';
import { createDb } from '../db';
import { getCache, setCache, CACHE_TTL } from '../services/cache';
import {
  getAutocompletePredictions,
  searchNearbyPlaces,
  searchStationByText,
} from '../services/google-maps';
import type {
  GoogleAutocompletePrediction,
  GooglePlaceResult,
} from '../schema/google';
import {
  StationPredictionsCachePayload,
  StationTextSearchCachePayload,
  NearbyStationsCachePayload,
} from '../schema/cache';

export const stationRoutes = new Hono<{ Bindings: Bindings }>();

/**
 * Autocomplete 結果に入力に対する完全一致駅名があるか。
 * ある場合は高価な Text Search を省略できる。
 */
function hasExactStationMatch(
  predictions: readonly GoogleAutocompletePrediction[],
  input: string,
): boolean {
  const exactName = `${input}駅`;
  return predictions.some((p) => {
    const main = p.structured_formatting.main_text;
    return main === exactName || main === input;
  });
}

/**
 * POST /api/stations/search
 * Search for stations by name using autocomplete, supplemented with
 * Text Search only when autocomplete lacks an exact station match.
 */
stationRoutes.post('/stations/search', async (c) => {
  const parsed = await parseJsonBody(c, StationSearchRequest);
  if (!parsed.ok) {
    return parsed.response;
  }

  const db = createDb(c.env.DB);
  const apiKey = c.env.GOOGLE_MAPS_API_KEY;
  const input = normalizeStationInput(parsed.data.input);
  const textSearchQuery = `${input}駅`;

  const cachedPredictions = await getCache(
    db,
    'station_predictions',
    input,
    StationPredictionsCachePayload,
  );

  const cachedTextSearch = await getCache(
    db,
    'station_text_search',
    input,
    StationTextSearchCachePayload,
  );

  // Autocomplete を先に解決（Text Search 要否の判定に使う）
  let predictions: readonly GoogleAutocompletePrediction[];
  let predictionsError: string | null = null;

  if (cachedPredictions) {
    predictions = cachedPredictions;
  } else {
    const predictionsResult = await Effect.runPromise(
      Effect.either(getAutocompletePredictions(apiKey, input)),
    );
    if (predictionsResult._tag === 'Right') {
      predictions = predictionsResult.right;
      await setCache(
        db,
        'station_predictions',
        input,
        predictions,
        CACHE_TTL.station_predictions,
      );
    } else {
      predictions = [];
      predictionsError = predictionsResult.left.message;
    }
  }

  let exactMatches: readonly GooglePlaceResult[];

  if (cachedTextSearch) {
    exactMatches = cachedTextSearch;
  } else if (hasExactStationMatch(predictions, input)) {
    // Autocomplete に完全一致がある → Text Search をスキップ（課金抑制）
    exactMatches = [];
  } else {
    const textSearchResult = await Effect.runPromise(
      Effect.either(searchStationByText(apiKey, textSearchQuery)),
    );
    if (textSearchResult._tag === 'Right') {
      exactMatches = textSearchResult.right.slice(0, 1);
      await setCache(
        db,
        'station_text_search',
        input,
        exactMatches,
        CACHE_TTL.station_text_search,
      );
    } else {
      exactMatches = [];
    }
  }

  const stations = mergeStationsByPlaceId(
    exactMatches.map((p) => stationFromPlace(p)),
    predictions.map(stationFromPrediction),
  );

  if (stations.length === 0 && predictionsError) {
    return c.json({ success: false, error: predictionsError }, 500);
  }

  return c.json({ success: true, data: stations });
});

/**
 * POST /api/stations/nearby
 * Find nearby stations from a given location.
 */
stationRoutes.post('/stations/nearby', async (c) => {
  const parsed = await parseJsonBody(c, NearbyStationsRequest);
  if (!parsed.ok) {
    return parsed.response;
  }

  const db = createDb(c.env.DB);
  const apiKey = c.env.GOOGLE_MAPS_API_KEY;
  const { lat, lng } = parsed.data;

  const cacheKey = `${lat.toFixed(2)}-${lng.toFixed(2)}`;

  const cached = await getCache(
    db,
    'nearby_stations',
    cacheKey,
    NearbyStationsCachePayload,
  );

  let places: readonly GooglePlaceResult[];
  if (cached) {
    places = cached;
  } else {
    // 近隣駅検索（上位5件）。ページングは既定どおり体験を維持
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

    places = exit.value.results;

    if (exit.value.complete) {
      await setCache(
        db,
        'nearby_stations',
        cacheKey,
        places,
        CACHE_TTL.nearby_stations,
      );
    }
  }

  const stations: Station[] = places
    .filter((p) => isStation(p.types))
    .map((place) => stationFromPlace(place, lat, lng))
    .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
    .slice(0, 5);

  return c.json({ success: true, data: stations });
});
