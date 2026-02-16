import type {
  Result,
  GoogleNearbySearchResponse,
  GoogleAutocompleteResponse,
  GoogleGeocodeResponse,
  GooglePlaceResult,
  GoogleAutocompletePrediction,
  GoogleGeocodeResult,
} from '../types';

const MAPS_BASE_URL = 'https://maps.googleapis.com';

/**
 * Search for nearby places using Google Maps Nearby Search REST API.
 */
export async function searchNearbyPlaces(
  apiKey: string,
  lat: number,
  lng: number,
  radius: number,
  keyword: string,
): Promise<Result<GooglePlaceResult[]>> {
  const params = new URLSearchParams({
    location: `${lat},${lng}`,
    radius: String(radius),
    keyword,
    language: 'ja',
    key: apiKey,
  });

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

  return { ok: true, data: data.results };
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
    types: 'transit_station|train_station|airport|subway_station',
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
