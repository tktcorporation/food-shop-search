import { Schema } from 'effect';
import { Station } from './station';

/** 1検索あたりのキーワード上限（Nearby Search 課金抑制） — api.ts と一致 */
const MAX_KEYWORDS = 8;

/** レストラン（ドメインエンティティ / API DTO） */
export const Restaurant = Schema.Struct({
  place_id: Schema.String,
  name: Schema.String,
  vicinity: Schema.String,
  rating: Schema.Number,
  user_ratings_total: Schema.Number,
  price_level: Schema.Number,
  types: Schema.Array(Schema.String),
  photoUrls: Schema.Array(Schema.String),
  searchKeywords: Schema.Array(Schema.String),
  isOpenNow: Schema.optional(Schema.Boolean),
  distance: Schema.optional(Schema.Number),
  business_status: Schema.optional(Schema.String),
  lat: Schema.optional(Schema.Number),
  lng: Schema.optional(Schema.Number),
});
export type Restaurant = typeof Restaurant.Type;

/** レストラン検索のフィルター条件（UI / ドメイン） */
export const RestaurantFilterParams = Schema.Struct({
  minRating: Schema.Number,
  minReviews: Schema.Number,
  isOpenNow: Schema.Boolean,
  searchRadius: Schema.Number.pipe(Schema.positive()),
  selectedPriceLevels: Schema.Array(Schema.Number).pipe(Schema.minItems(1)),
});
export type RestaurantFilterParams = typeof RestaurantFilterParams.Type;

/** レストラン検索コマンド（FE → program 境界） */
export const RestaurantSearchParams = Schema.Struct({
  keywords: Schema.Array(Schema.String).pipe(
    Schema.minItems(1),
    Schema.maxItems(MAX_KEYWORDS),
  ),
  minRating: Schema.Number,
  minReviews: Schema.Number,
  searchLocation: Station,
  isOpenNow: Schema.Boolean,
  searchRadius: Schema.Number.pipe(Schema.positive()),
  selectedPriceLevels: Schema.Array(Schema.Number).pipe(Schema.minItems(1)),
});
export type RestaurantSearchParams = typeof RestaurantSearchParams.Type;
