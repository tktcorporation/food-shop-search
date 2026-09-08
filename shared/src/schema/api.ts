import { Schema } from 'effect';
import { Location } from './location';
import { Restaurant } from './restaurant';
import { Station } from './station';

/** API 成功レスポンス */
export const ApiSuccess = <A, I, R>(dataSchema: Schema.Schema<A, I, R>) =>
  Schema.Struct({
    success: Schema.Literal(true),
    data: dataSchema,
  });

/** API 失敗レスポンス */
export const ApiFailure = Schema.Struct({
  success: Schema.Literal(false),
  error: Schema.String,
});
export type ApiFailure = typeof ApiFailure.Type;

/** API レスポンス封筒（SSOT） */
export const ApiResponse = <A, I, R>(dataSchema: Schema.Schema<A, I, R>) =>
  Schema.Union(ApiSuccess(dataSchema), ApiFailure);

// --- Request schemas (Worker HTTP upstream-form) ---

/** 1検索あたりのキーワード上限（Nearby Search 課金抑制） */
export const MAX_KEYWORDS_PER_SEARCH = 8;

export const RestaurantSearchRequest = Schema.Struct({
  keywords: Schema.Array(Schema.String).pipe(
    Schema.minItems(1),
    Schema.maxItems(MAX_KEYWORDS_PER_SEARCH),
  ),
  location: Location,
  radius: Schema.Number.pipe(Schema.positive()),
  stationPlaceId: Schema.NonEmptyString,
});
export type RestaurantSearchRequest = typeof RestaurantSearchRequest.Type;

export const StationSearchRequest = Schema.Struct({
  input: Schema.Trim.pipe(Schema.nonEmptyString()),
});
export type StationSearchRequest = typeof StationSearchRequest.Type;

export const NearbyStationsRequest = Schema.Struct({
  lat: Schema.Number,
  lng: Schema.Number,
});
export type NearbyStationsRequest = typeof NearbyStationsRequest.Type;

export const ForwardGeocodeRequest = Schema.Struct({
  address: Schema.Trim.pipe(Schema.nonEmptyString()),
});
export type ForwardGeocodeRequest = typeof ForwardGeocodeRequest.Type;

export const ReverseGeocodeRequest = Schema.Struct({
  lat: Schema.Number,
  lng: Schema.Number,
});
export type ReverseGeocodeRequest = typeof ReverseGeocodeRequest.Type;

// --- Response payload schemas ---

export const ForwardGeocodeResult = Schema.Struct({
  lat: Schema.Number,
  lng: Schema.Number,
  formatted_address: Schema.String,
});
export type ForwardGeocodeResult = typeof ForwardGeocodeResult.Type;

export const ReverseGeocodeResult = Schema.Struct({
  lat: Schema.Number,
  lng: Schema.Number,
  address: Schema.String,
});
export type ReverseGeocodeResult = typeof ReverseGeocodeResult.Type;

export const RestaurantListResponse = ApiResponse(Schema.Array(Restaurant));
export type RestaurantListResponse = typeof RestaurantListResponse.Type;

export const StationListResponse = ApiResponse(Schema.Array(Station));
export type StationListResponse = typeof StationListResponse.Type;

export const ForwardGeocodeResponse = ApiResponse(ForwardGeocodeResult);
export type ForwardGeocodeResponse = typeof ForwardGeocodeResponse.Type;

export const ReverseGeocodeResponse = ApiResponse(ReverseGeocodeResult);
export type ReverseGeocodeResponse = typeof ReverseGeocodeResponse.Type;
