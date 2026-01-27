import { z } from 'zod';

// =============================================================================
// Branded Primitive Schemas
// =============================================================================

/** Google Places ID */
export const PlaceIdSchema = z.string().min(1).brand<'PlaceId'>();
export type PlaceId = z.infer<typeof PlaceIdSchema>;

/** 緯度 (-90 ~ 90) */
export const LatitudeSchema = z.number().min(-90).max(90).brand<'Latitude'>();
export type Latitude = z.infer<typeof LatitudeSchema>;

/** 経度 (-180 ~ 180) */
export const LongitudeSchema = z
  .number()
  .min(-180)
  .max(180)
  .brand<'Longitude'>();
export type Longitude = z.infer<typeof LongitudeSchema>;

/** 評価 (0 ~ 5) */
export const RatingSchema = z.number().min(0).max(5).brand<'Rating'>();
export type Rating = z.infer<typeof RatingSchema>;

/** 価格帯 (1 ~ 4) */
export const PriceLevelSchema = z
  .number()
  .int()
  .min(1)
  .max(4)
  .brand<'PriceLevel'>();
export type PriceLevel = z.infer<typeof PriceLevelSchema>;

/** レビュー数 (0以上の整数) */
export const ReviewCountSchema = z.number().int().min(0).brand<'ReviewCount'>();
export type ReviewCount = z.infer<typeof ReviewCountSchema>;

/** 距離 (メートル, 0以上) */
export const DistanceSchema = z.number().min(0).brand<'Distance'>();
export type Distance = z.infer<typeof DistanceSchema>;

/** 検索半径 (メートル, 50 ~ 50000) */
export const SearchRadiusSchema = z
  .number()
  .int()
  .min(50)
  .max(50000)
  .brand<'SearchRadius'>();
export type SearchRadius = z.infer<typeof SearchRadiusSchema>;

// =============================================================================
// Domain Schemas
// =============================================================================

/** 座標 */
export const LocationSchema = z.object({
  lat: LatitudeSchema,
  lng: LongitudeSchema,
});
export type Location = z.infer<typeof LocationSchema>;

/** 座標 + 住所 (現在地検索用) */
export const GeoLocationSchema = LocationSchema.extend({
  address: z.string(),
});
export type GeoLocation = z.infer<typeof GeoLocationSchema>;

/** 営業時間 */
export const OpeningHoursSchema = z.object({
  weekday_text: z.array(z.string()).optional(),
});
export type OpeningHours = z.infer<typeof OpeningHoursSchema>;

/** レストラン */
export const RestaurantSchema = z.object({
  place_id: PlaceIdSchema,
  name: z.string().min(1),
  vicinity: z.string(),
  rating: RatingSchema,
  user_ratings_total: ReviewCountSchema,
  price_level: PriceLevelSchema,
  types: z.array(z.string()),
  photos: z.custom<google.maps.places.PlacePhoto[]>().optional(),
  searchKeywords: z.array(z.string()),
  opening_hours: OpeningHoursSchema.optional(),
  distance: DistanceSchema.optional(),
  geometry: z
    .object({
      location: z.custom<google.maps.LatLng>(),
    })
    .optional(),
  business_status: z.string().optional(),
});
export type Restaurant = z.infer<typeof RestaurantSchema>;

/** 駅 */
export const StationSchema = z.object({
  name: z.string().min(1),
  prefecture: z.string(),
  address: z.string(),
  distance: DistanceSchema.optional(),
  rawPrediction: z.custom<google.maps.places.AutocompletePrediction>(),
});
export type Station = z.infer<typeof StationSchema>;

/** フィルターパラメータ */
export const FilterParamsSchema = z.object({
  minRating: RatingSchema,
  minReviews: ReviewCountSchema,
  isOpenNow: z.boolean(),
  searchRadius: SearchRadiusSchema,
  selectedPriceLevels: z.array(PriceLevelSchema),
});
export type FilterParams = z.infer<typeof FilterParamsSchema>;

/** 検索パラメータ */
export const SearchParamsSchema = FilterParamsSchema.extend({
  keywords: z.array(z.string().min(1)),
  searchLocation: z.union([StationSchema, LocationSchema]),
});
export type SearchParams = z.infer<typeof SearchParamsSchema>;

// =============================================================================
// Cache Schemas
// =============================================================================

export const CacheConfigSchema = z.object({
  key: z.string(),
  version: z.string(),
  expiry: z.number().positive(),
});
export type CacheConfig = z.infer<typeof CacheConfigSchema>;

/** CacheData<T> のスキーマを生成 */
export function createCacheDataSchema<T>(dataSchema: z.ZodType<T>) {
  return z.object({
    data: dataSchema,
    timestamp: z.number(),
  });
}

/** CacheEntry<T> のスキーマを生成 */
export function createCacheEntrySchema<T>(dataSchema: z.ZodType<T>) {
  return z.object({
    version: z.string(),
    data: z.record(z.string(), createCacheDataSchema(dataSchema)),
  });
}

// =============================================================================
// Analytics Schema
// =============================================================================

export const AnalyticsEventSchema = z.object({
  action: z.string().min(1),
  category: z.string().min(1),
  label: z.string().optional(),
  value: z.number().optional(),
});
export type AnalyticsEvent = z.infer<typeof AnalyticsEventSchema>;
