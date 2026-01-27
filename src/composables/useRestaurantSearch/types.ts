import { Schema } from 'effect';
import type { Station } from '../useStationSearch/types';

export const LocationSchema = Schema.Struct({
  lat: Schema.Number,
  lng: Schema.Number,
});
// oxlint-disable-next-line import/namespace
export interface Location extends Schema.Schema.Type<typeof LocationSchema> {}

export const RestaurantSchema = Schema.Struct({
  place_id: Schema.String,
  name: Schema.String,
  vicinity: Schema.String,
  rating: Schema.Number,
  user_ratings_total: Schema.Number,
  price_level: Schema.Number,
  types: Schema.Array(Schema.String),
  searchKeywords: Schema.Array(Schema.String),
  distance: Schema.optional(Schema.Number),
  business_status: Schema.optional(Schema.String),
});

/** Google Maps APIのオブジェクト参照を含むフル型 */
export interface Restaurant {
  place_id: string;
  name: string;
  vicinity: string;
  rating: number;
  user_ratings_total: number;
  price_level: number;
  types: string[];
  photos?: google.maps.places.PlacePhoto[];
  searchKeywords: string[];
  opening_hours?: {
    weekday_text?: string[];
  };
  distance?: number;
  geometry?: {
    location: google.maps.LatLng;
  };
  business_status?: string;
}

export const SearchParamsSchema = Schema.Struct({
  keywords: Schema.Array(Schema.String),
  minRating: Schema.Number,
  minReviews: Schema.Number,
  isOpenNow: Schema.Boolean,
  searchRadius: Schema.Number,
  selectedPriceLevels: Schema.Array(Schema.Number),
});

export interface SearchParams {
  keywords: string[];
  minRating: number;
  minReviews: number;
  searchLocation: Station | Location;
  isOpenNow: boolean;
  searchRadius: number;
  selectedPriceLevels: number[];
}
