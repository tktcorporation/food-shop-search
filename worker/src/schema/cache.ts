import { Schema } from 'effect';
import {
  GoogleAutocompletePrediction,
  GoogleGeocodeResult,
  GooglePlaceResult,
} from './google';
import { PhotoCdnUrl } from '../../../shared/src/schema/photo';

/** D1 api_cache に保存するペイロードの Schema（cacheType ごと） */
export const RestaurantSearchCachePayload = Schema.Array(Schema.String);
export type RestaurantSearchCachePayload =
  typeof RestaurantSearchCachePayload.Type;

export const StationPredictionsCachePayload = Schema.Array(
  GoogleAutocompletePrediction,
);
export type StationPredictionsCachePayload =
  typeof StationPredictionsCachePayload.Type;

export const StationTextSearchCachePayload = Schema.Array(GooglePlaceResult);
export type StationTextSearchCachePayload =
  typeof StationTextSearchCachePayload.Type;

export const NearbyStationsCachePayload = Schema.Array(GooglePlaceResult);
export type NearbyStationsCachePayload = typeof NearbyStationsCachePayload.Type;

export const GeocodeCachePayload = Schema.Array(GoogleGeocodeResult);
export type GeocodeCachePayload = typeof GeocodeCachePayload.Type;

/** Place Photo → CDN URL 解決キャッシュ */
export const PlacePhotoCachePayload = PhotoCdnUrl;
export type PlacePhotoCachePayload = typeof PlacePhotoCachePayload.Type;

/** place_cache の types / photoReferences 列（JSON 文字列） */
export const StringArrayJson = Schema.parseJson(Schema.Array(Schema.String));
