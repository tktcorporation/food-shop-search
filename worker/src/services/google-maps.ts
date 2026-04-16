import type {
  Result,
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

function delay(ms: number): Promise<void> {
  // oxlint-disable-next-line effect-enforce/no-promise-constructor -- Worker側はEffectを使用しない
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Search for nearby places using Google Maps Nearby Search REST API.
 * Automatically fetches subsequent pages via next_page_token (up to 60 results).
 */
export async function searchNearbyPlaces(
  apiKey: string,
  lat: number,
  lng: number,
  radius: number,
  keyword: string,
  type?: string,
): Promise<Result<GooglePlaceResult[]>> {
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
    const response = await fetch(url);

    if (!response.ok) {
      return {
        ok: false,
        error: `Google Nearby Search API request failed: ${response.status} ${response.statusText}`,
      };
    }

    const data: GoogleNearbySearchResponse = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      return {
        ok: false,
        error: `Google Nearby Search API error: ${data.status}`,
      };
    }

    allResults.push(...data.results);

    if (!data.next_page_token) {
      break;
    }

    pageToken = data.next_page_token;
    await delay(PAGE_TOKEN_DELAY_MS);
  }

  return { ok: true, data: allResults };
}

/**
 * Get autocomplete predictions for station search using Google Places Autocomplete REST API.
 */
export async function getAutocompletePredictions(
  apiKey: string,
  input: string,
): Promise<Result<GoogleAutocompletePrediction[]>> {
  const params = new URLSearchParams({
    input,
    types: 'transit_station',
    components: 'country:jp',
    language: 'ja',
    key: apiKey,
  });

  const url = `${MAPS_BASE_URL}/maps/api/place/autocomplete/json?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    return {
      ok: false,
      error: `Google Autocomplete API request failed: ${response.status} ${response.statusText}`,
    };
  }

  const data: GoogleAutocompleteResponse = await response.json();

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    return {
      ok: false,
      error: `Google Autocomplete API error: ${data.status}`,
    };
  }

  return { ok: true, data: data.predictions };
}

/**
 * Search for a station by name using Google Places Text Search REST API.
 * Used to supplement autocomplete results with exact station matches.
 */
export async function searchStationByText(
  apiKey: string,
  query: string,
): Promise<Result<GooglePlaceResult[]>> {
  const params = new URLSearchParams({
    query,
    type: 'train_station',
    language: 'ja',
    region: 'jp',
    key: apiKey,
  });

  const url = `${MAPS_BASE_URL}/maps/api/place/textsearch/json?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    return {
      ok: false,
      error: `Google Text Search API request failed: ${response.status} ${response.statusText}`,
    };
  }

  const data: GoogleTextSearchResponse = await response.json();

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    return {
      ok: false,
      error: `Google Text Search API error: ${data.status}`,
    };
  }

  return { ok: true, data: data.results };
}

/**
 * Forward geocode: convert address to coordinates using Google Geocoding REST API.
 */
export async function geocodeForward(
  apiKey: string,
  address: string,
): Promise<Result<GoogleGeocodeResult[]>> {
  const params = new URLSearchParams({
    address,
    language: 'ja',
    key: apiKey,
  });

  const url = `${MAPS_BASE_URL}/maps/api/geocode/json?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    return {
      ok: false,
      error: `Google Geocoding API request failed: ${response.status} ${response.statusText}`,
    };
  }

  const data: GoogleGeocodeResponse = await response.json();

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    return { ok: false, error: `Google Geocoding API error: ${data.status}` };
  }

  return { ok: true, data: data.results };
}

/**
 * Reverse geocode: convert coordinates to address using Google Geocoding REST API.
 */
export async function geocodeReverse(
  apiKey: string,
  lat: number,
  lng: number,
): Promise<Result<GoogleGeocodeResult[]>> {
  const params = new URLSearchParams({
    latlng: `${lat},${lng}`,
    language: 'ja',
    key: apiKey,
  });

  const url = `${MAPS_BASE_URL}/maps/api/geocode/json?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    return {
      ok: false,
      error: `Google Geocoding API (reverse) request failed: ${response.status} ${response.statusText}`,
    };
  }

  const data: GoogleGeocodeResponse = await response.json();

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    return {
      ok: false,
      error: `Google Geocoding API (reverse) error: ${data.status}`,
    };
  }

  return { ok: true, data: data.results };
}

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
