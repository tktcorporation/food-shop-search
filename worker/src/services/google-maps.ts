import { Effect } from 'effect';
import { GoogleMapsApiError } from '../errors';
import type {
  GoogleNearbySearchResponse,
  GoogleAutocompleteResponse,
  GoogleTextSearchResponse,
  GoogleGeocodeResponse,
  GooglePlaceResult,
  GoogleAutocompletePrediction,
  GoogleGeocodeResult,
} from '../types';

const MAPS_BASE_URL = 'https://maps.googleapis.com';

/** Google Nearby Search API の最大ページ数（API上限は3ページ = 60件） */
const MAX_PAGES = 3;

/** next_page_token が有効になるまでの待機時間 (ms) */
const PAGE_TOKEN_DELAY_MS = 2000;

/** next_page_token 使用時の INVALID_REQUEST に対するリトライ回数 */
const PAGE_TOKEN_MAX_RETRIES = 3;

/** next_page_token リトライ間隔 (ms) */
const PAGE_TOKEN_RETRY_DELAY_MS = 1000;

/**
 * fetch して JSON をパースし、失敗時は GoogleMapsApiError にする共通ヘルパー
 */
const fetchGoogleApi = <T>(
  url: string,
  label: string,
): Effect.Effect<T, GoogleMapsApiError> =>
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

    return yield* Effect.tryPromise({
      try: () => response.json() as Promise<T>,
      catch: () =>
        new GoogleMapsApiError({ message: `${label} JSON parse failed` }),
    });
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
): Effect.Effect<GooglePlaceResult[], GoogleMapsApiError> =>
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

      // 1ページ目は通常通りfetch & validate
      if (!pageToken) {
        const data = yield* fetchGoogleApi<GoogleNearbySearchResponse>(
          url,
          'Google Nearby Search API',
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

      // 2ページ目以降: INVALID_REQUEST はリトライ、それ以外のエラーは取得済み結果を返す
      let fetched = false;
      for (let retry = 0; retry <= PAGE_TOKEN_MAX_RETRIES; retry++) {
        const result = yield* Effect.either(
          fetchGoogleApi<GoogleNearbySearchResponse>(
            url,
            'Google Nearby Search API',
          ),
        );

        if (result._tag === 'Left') {
          // fetch/parse 自体が失敗 → 取得済み結果を返す
          return allResults;
        }

        const data = result.right;

        if (
          data.status === 'INVALID_REQUEST' &&
          retry < PAGE_TOKEN_MAX_RETRIES
        ) {
          // トークンがまだ有効化されていない → リトライ
          yield* Effect.sleep(PAGE_TOKEN_RETRY_DELAY_MS);
          continue;
        }

        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
          // 回復不能なエラー → 取得済み結果を返す
          return allResults;
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

    return allResults;
  });

/**
 * Get autocomplete predictions for station search using Google Places Autocomplete REST API.
 */
export const getAutocompletePredictions = (
  apiKey: string,
  input: string,
): Effect.Effect<GoogleAutocompletePrediction[], GoogleMapsApiError> =>
  Effect.gen(function* () {
    const params = new URLSearchParams({
      input,
      types: 'transit_station',
      components: 'country:jp',
      language: 'ja',
      key: apiKey,
    });

    const url = `${MAPS_BASE_URL}/maps/api/place/autocomplete/json?${params.toString()}`;
    const data = yield* fetchGoogleApi<GoogleAutocompleteResponse>(
      url,
      'Google Autocomplete API',
    );
    yield* validateStatus(data.status, 'Google Autocomplete API');

    return data.predictions;
  });

/**
 * Search for a station by name using Google Places Text Search REST API.
 * Used to supplement autocomplete results with exact station matches.
 */
export const searchStationByText = (
  apiKey: string,
  query: string,
): Effect.Effect<GooglePlaceResult[], GoogleMapsApiError> =>
  Effect.gen(function* () {
    const params = new URLSearchParams({
      query,
      type: 'train_station',
      language: 'ja',
      region: 'jp',
      key: apiKey,
    });

    const url = `${MAPS_BASE_URL}/maps/api/place/textsearch/json?${params.toString()}`;
    const data = yield* fetchGoogleApi<GoogleTextSearchResponse>(
      url,
      'Google Text Search API',
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
): Effect.Effect<GoogleGeocodeResult[], GoogleMapsApiError> =>
  Effect.gen(function* () {
    const params = new URLSearchParams({
      address,
      language: 'ja',
      key: apiKey,
    });

    const url = `${MAPS_BASE_URL}/maps/api/geocode/json?${params.toString()}`;
    const data = yield* fetchGoogleApi<GoogleGeocodeResponse>(
      url,
      'Google Geocoding API',
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
): Effect.Effect<GoogleGeocodeResult[], GoogleMapsApiError> =>
  Effect.gen(function* () {
    const params = new URLSearchParams({
      latlng: `${lat},${lng}`,
      language: 'ja',
      key: apiKey,
    });

    const url = `${MAPS_BASE_URL}/maps/api/geocode/json?${params.toString()}`;
    const data = yield* fetchGoogleApi<GoogleGeocodeResponse>(
      url,
      'Google Geocoding API (reverse)',
    );
    yield* validateStatus(data.status, 'Google Geocoding API (reverse)');

    return data.results;
  });

/**
 * Construct a Google Maps Place Photo URL.
 * Returns the URL string directly without following redirects.
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
