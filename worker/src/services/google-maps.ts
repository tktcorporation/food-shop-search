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

/**
 * Google Nearby Search API のデフォルト最大ページ数。
 * 課金抑制のため 1 ページ（最大20件）を既定とする。
 * API上限は 3 ページ = 60件。
 */
const DEFAULT_MAX_PAGES = 1;

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
 * Optionally fetches subsequent pages via next_page_token (up to maxPages).
 */
export const searchNearbyPlaces = (
  apiKey: string,
  lat: number,
  lng: number,
  radius: number,
  keyword: string,
  type?: string,
  maxPages: number = DEFAULT_MAX_PAGES,
): Effect.Effect<NearbySearchResult, GoogleMapsApiError> =>
  Effect.gen(function* () {
    const pageLimit = Math.min(Math.max(maxPages, 1), 3);
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

    for (let page = 0; page < pageLimit; page++) {
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

        // これ以上ページを取らない場合はトークン待機をスキップ
        if (page + 1 >= pageLimit) {
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

      if (page + 1 >= pageLimit) {
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
 * Build the Google Place Photo request URL (includes API key).
 * Prefer resolvePhotoUrl for client-facing URLs — never expose this to browsers.
 */
export function buildPhotoRequestUrl(
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

/**
 * Resolve a Place Photo to a key-free CDN URL by following the redirect.
 * Billed once per successful resolution; cache the result to avoid repeat charges.
 */
export const resolvePhotoUrl = (
  apiKey: string,
  photoReference: string,
  maxWidth: number = 400,
): Effect.Effect<string | null, never> =>
  Effect.gen(function* () {
    const url = buildPhotoRequestUrl(apiKey, photoReference, maxWidth);

    const response = yield* Effect.tryPromise({
      try: () => fetch(url, { redirect: 'manual' }),
      catch: () => null as Response | null,
    }).pipe(Effect.catchAll(() => Effect.succeed(null as Response | null)));

    if (!response) {
      return null;
    }

    // Place Photo returns 302/301 to lh3.googleusercontent.com (etc.)
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('Location');
      if (
        location &&
        location.startsWith('http') &&
        !location.includes('maps.googleapis.com')
      ) {
        return location;
      }
    }

    // Some runtimes may auto-follow; accept final CDN URL if present
    if (
      response.url &&
      response.url.startsWith('http') &&
      !response.url.includes('maps.googleapis.com') &&
      !response.url.includes('key=')
    ) {
      return response.url;
    }

    return null;
  });

/** @deprecated Use buildPhotoRequestUrl / resolvePhotoUrl instead */
export const getPhotoUrl = buildPhotoRequestUrl;
