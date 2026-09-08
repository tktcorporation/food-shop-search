import type { Station } from '../../schema/station';
import { haversineDistance } from '../geo/haversine';
import { extractPrefecture } from './normalize';

/** Autocomplete prediction の最小形（インフラ型に依存しない） */
export interface AutocompletePredictionLike {
  readonly place_id: string;
  readonly structured_formatting: {
    readonly main_text: string;
    readonly secondary_text?: string;
  };
}

/** Place result の最小形（Nearby / Text Search） */
export interface PlaceResultLike {
  readonly place_id: string;
  readonly name: string;
  readonly vicinity?: string;
  readonly formatted_address?: string;
  readonly geometry?: {
    readonly location: { readonly lat: number; readonly lng: number };
  };
}

/**
 * Autocomplete prediction → Station ドメインエンティティ。
 */
export const stationFromPrediction = (
  prediction: AutocompletePredictionLike,
): Station => {
  const mainText = prediction.structured_formatting.main_text;
  const secondaryText = prediction.structured_formatting.secondary_text ?? '';

  return {
    name: mainText,
    prefecture: extractPrefecture(secondaryText),
    address: secondaryText,
    placeId: prediction.place_id,
  };
};

/**
 * Google Place result → Station ドメインエンティティ。
 */
export const stationFromPlace = (
  place: PlaceResultLike,
  searchLat?: number,
  searchLng?: number,
): Station => {
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
};

/**
 * place_id で重複除去しつつ、優先リストを先頭に配置する。
 */
export const mergeStationsByPlaceId = (
  preferred: readonly Station[],
  rest: readonly Station[],
): Station[] => {
  const seen = new Set(preferred.map((s) => s.placeId));
  const deduped = rest.filter((s) => !seen.has(s.placeId));
  return [...preferred, ...deduped];
};
