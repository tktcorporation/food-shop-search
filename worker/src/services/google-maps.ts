import { Effect, Schema } from 'effect';
import { GoogleMapsApiError } from '../errors';
import {
  GoogleNearbySearchResponse,
  GoogleAutocompleteResponse,
  GoogleTextSearchResponse,
  GoogleGeocodeResponse,
  type GooglePlaceResult,
  type GoogleAutocompletePrediction,
  type GoogleGeocodeResult,
} from '../schema/google';

const MAPS_BASE_URL = 'https://maps.googleapis.com';

/** Google Nearby Search API の最大ページ数（API上限は3ページ = 60件） */
const MAX_PAGES = 3;

/** next_page_token が有効になるまでの待機時間 (ms) */
const PAGE_TOKEN_DELAY_MS = 2000;

/** next_page_token 使用時の INVALID_REQUEST に対するリトライ回数 */
const PAGE_TOKEN_MAX_RETRIES = 3;

/** next_page_token リトライ間隔 (ms) */
const PAGE_TOKEN_RETRY_DELAY_MS = 1000;

/** searchNearbyPlaces の戻り値。complete が false の場合、結果が不完全なためキャッシュすべきでない */
export interface NearbySearchResult {
  readonly results: readonly GooglePlaceResult[];
  readonly complete: boolean;
}

/**
 * fetch → JSON → Schema.decode。失敗時は GoogleMapsApiError。
 */
const fetchGoogleApi = <A, I>(
  url: string,
  label: string,
  schema: Schema.Schema<A, I>,
): Effect.Effect<A, GoogleMapsApiError> =>
  Effect.gen(function* () {
    const response = yield* Effect.tryPromise({
      try: () => fetch(url),
      catch: () => new GoogleMapsApiError({ message: `${label} fetch failed` }),
    });

    if (!response.ok) {
      return yield* Effect.fail(
        new GoogleMapsApiError({
          message: `${label} request failed: ${response.status} ${response.statusText}`,
        }),
      );
    }

    const raw = yield* Effect.tryPromise({
      try: () => response.json(),
      catch: () =>
        new GoogleMapsApiError({ message: `${label} JSON parse failed` }),
    });

    return yield* Schema.decodeUnknown(schema)(raw).pipe(
      Effect.mapError(
        (error) =>
          new GoogleMapsApiError({
            message: `${label} response schema mismatch: ${String(error)}`,
          }),
      ),
    );
  });

/**
 * Google API のステータスを検証する
 */
const validateStatus = (
  status: string,
  label: string,
): Effect.Effect<void, GoogleMapsApiError> =>
  status === 'OK' || status === 'ZERO_RESULTS'
    ? Effect.void
    : Effect.fail(
        new GoogleMapsApiError({ message: `${label} error: ${status}` }),
      );

/**
 * Search for nearby places using Google Maps Nearby Search REST API.
 * Automatically fetches subsequent pages via next_page_token (up to 60 results).
 */
export const searchNearbyPlaces = (
  apiKey: string,
  lat: number,
  lng: number,
  radius: number,
  keyword: string,
  type?: string,
): Effect.Effect<NearbySearchResult, GoogleMapsApiError> =>
  Effect.gen(function* () {
    const baseParams = new URLSearchParams({
      location: `${lat},${lng}`,
      radius: String(radius),
      keyword,
      language: 'ja',
      key: apiKey,
    });
    if (type) {
      baseParams.set('type', type);
    }

    const allResults: GooglePlaceResult[] = [];
    let pageToken: string | undefined;

    for (let page = 0; page < MAX_PAGES; page++) {
      const params = new URLSearchParams(baseParams);
      if (pageToken) {
        params.set('pagetoken', pageToken);
      }

      const url = `${MAPS_BASE_URL}/maps/api/place/nearbysearch/json?${params.toString()}`;

      if (!pageToken) {
        const data = yield* fetchGoogleApi(
          url,
          'Google Nearby Search API',
          GoogleNearbySearchResponse,
        );
        yield* validateStatus(data.status, 'Google Nearby Search API');

        allResults.push(...data.results);

        if (!data.next_page_token) {
          break;
        }

        pageToken = data.next_page_token;
        yield* Effect.sleep(PAGE_TOKEN_DELAY_MS);
        continue;
      }

      let fetched = false;
      for (let retry = 0; retry <= PAGE_TOKEN_MAX_RETRIES; retry++) {
        const result = yield* Effect.either(
          fetchGoogleApi(
            url,
            'Google Nearby Search API',
            GoogleNearbySearchResponse,
          ),
        );

        if (result._tag === 'Left') {
          return { results: allResults, complete: false };
        }

        const data = result.right;

        if (
          data.status === 'INVALID_REQUEST' &&
          retry < PAGE_TOKEN_MAX_RETRIES
        ) {
          yield* Effect.sleep(PAGE_TOKEN_RETRY_DELAY_MS);
          continue;
        }

        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
          return { results: allResults, complete: false };
        }

        allResults.push(...data.results);
        pageToken = data.next_page_token;
        fetched = true;
        break;
      }

      if (!fetched || !pageToken) {
        break;
      }

      yield* Effect.sleep(PAGE_TOKEN_DELAY_MS);
    }

    return { results: allResults, complete: true };
  });

/**
 * Get autocomplete predictions for station search using Google Places Autocomplete REST API.
 */
export const getAutocompletePredictions = (
  apiKey: string,
  input: string,
): Effect.Effect<readonly GoogleAutocompletePrediction[], GoogleMapsApiError> =>
  Effect.gen(function* () {
    const params = new URLSearchParams({
      input,
      types: 'transit_station',
      components: 'country:jp',
      language: 'ja',
      key: apiKey,
    });

    const url = `${MAPS_BASE_URL}/maps/api/place/autocomplete/json?${params.toString()}`;
    const data = yield* fetchGoogleApi(
      url,
      'Google Autocomplete API',
      GoogleAutocompleteResponse,
    );
    yield* validateStatus(data.status, 'Google Autocomplete API');

    return data.predictions;
  });

/**
 * Search for a station by name using Google Places Text Search REST API.
 */
export const searchStationByText = (
  apiKey: string,
  query: string,
): Effect.Effect<readonly GooglePlaceResult[], GoogleMapsApiError> =>
  Effect.gen(function* () {
    const params = new URLSearchParams({
      query,
      type: 'train_station',
      language: 'ja',
      region: 'jp',
      key: apiKey,
    });

    const url = `${MAPS_BASE_URL}/maps/api/place/textsearch/json?${params.toString()}`;
    const data = yield* fetchGoogleApi(
      url,
      'Google Text Search API',
      GoogleTextSearchResponse,
    );
    yield* validateStatus(data.status, 'Google Text Search API');

    return data.results;
  });

/**
 * Forward geocode: convert address to coordinates using Google Geocoding REST API.
 */
export const geocodeForward = (
  apiKey: string,
  address: string,
): Effect.Effect<readonly GoogleGeocodeResult[], GoogleMapsApiError> =>
  Effect.gen(function* () {
    const params = new URLSearchParams({
      address,
      language: 'ja',
      key: apiKey,
    });

    const url = `${MAPS_BASE_URL}/maps/api/geocode/json?${params.toString()}`;
    const data = yield* fetchGoogleApi(
      url,
      'Google Geocoding API',
      GoogleGeocodeResponse,
    );
    yield* validateStatus(data.status, 'Google Geocoding API');

    return data.results;
  });

/**
 * Reverse geocode: convert coordinates to address using Google Geocoding REST API.
 */
export const geocodeReverse = (
  apiKey: string,
  lat: number,
  lng: number,
): Effect.Effect<readonly GoogleGeocodeResult[], GoogleMapsApiError> =>
  Effect.gen(function* () {
    const params = new URLSearchParams({
      latlng: `${lat},${lng}`,
      language: 'ja',
      key: apiKey,
    });

    const url = `${MAPS_BASE_URL}/maps/api/geocode/json?${params.toString()}`;
    const data = yield* fetchGoogleApi(
      url,
      'Google Geocoding API (reverse)',
      GoogleGeocodeResponse,
    );
    yield* validateStatus(data.status, 'Google Geocoding API (reverse)');

    return data.results;
  });

/**
 * Construct a Google Maps Place Photo URL.
 */
export function getPhotoUrl(
  apiKey: string,
  photoReference: string,
  maxWidth: number = 400,
): string {
  const params = new URLSearchParams({
    maxwidth: String(maxWidth),
    photo_reference: photoReference,
    key: apiKey,
  });

  return `${MAPS_BASE_URL}/maps/api/place/photo?${params.toString()}`;
}
