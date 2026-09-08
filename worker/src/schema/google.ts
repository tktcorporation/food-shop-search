import { Schema } from 'effect';

/**
 * Google Maps Places / Geocoding REST API のレスポンス Schema。
 * インフラ境界で decode し、キャストを排除する。
 */

export const GoogleLatLng = Schema.Struct({
  lat: Schema.Number,
  lng: Schema.Number,
});

export const GooglePlacePhoto = Schema.Struct({
  photo_reference: Schema.String,
  width: Schema.Number,
  height: Schema.Number,
});

export const GooglePlaceResult = Schema.Struct({
  place_id: Schema.String,
  name: Schema.String,
  vicinity: Schema.optional(Schema.String),
  formatted_address: Schema.optional(Schema.String),
  rating: Schema.optional(Schema.Number),
  user_ratings_total: Schema.optional(Schema.Number),
  price_level: Schema.optional(Schema.Number),
  types: Schema.optional(Schema.Array(Schema.String)),
  photos: Schema.optional(Schema.Array(GooglePlacePhoto)),
  opening_hours: Schema.optional(
    Schema.Struct({
      open_now: Schema.optional(Schema.Boolean),
    }),
  ),
  geometry: Schema.optional(
    Schema.Struct({
      location: GoogleLatLng,
    }),
  ),
  business_status: Schema.optional(Schema.String),
});
export type GooglePlaceResult = typeof GooglePlaceResult.Type;

export const GoogleNearbySearchResponse = Schema.Struct({
  results: Schema.Array(GooglePlaceResult),
  status: Schema.String,
  next_page_token: Schema.optional(Schema.String),
});
export type GoogleNearbySearchResponse = typeof GoogleNearbySearchResponse.Type;

export const GoogleTextSearchResponse = Schema.Struct({
  results: Schema.Array(GooglePlaceResult),
  status: Schema.String,
});
export type GoogleTextSearchResponse = typeof GoogleTextSearchResponse.Type;

export const GoogleAutocompletePrediction = Schema.Struct({
  place_id: Schema.String,
  description: Schema.String,
  structured_formatting: Schema.Struct({
    main_text: Schema.String,
    secondary_text: Schema.optional(Schema.String),
  }),
  types: Schema.optional(Schema.Array(Schema.String)),
});
export type GoogleAutocompletePrediction =
  typeof GoogleAutocompletePrediction.Type;

export const GoogleAutocompleteResponse = Schema.Struct({
  predictions: Schema.Array(GoogleAutocompletePrediction),
  status: Schema.String,
});
export type GoogleAutocompleteResponse = typeof GoogleAutocompleteResponse.Type;

export const GoogleGeocodeResult = Schema.Struct({
  formatted_address: Schema.String,
  geometry: Schema.Struct({
    location: GoogleLatLng,
  }),
});
export type GoogleGeocodeResult = typeof GoogleGeocodeResult.Type;

export const GoogleGeocodeResponse = Schema.Struct({
  results: Schema.Array(GoogleGeocodeResult),
  status: Schema.String,
});
export type GoogleGeocodeResponse = typeof GoogleGeocodeResponse.Type;
