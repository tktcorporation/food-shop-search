import { Schema } from 'effect';

/** 駅（ドメインエンティティ / API DTO） */
export const Station = Schema.Struct({
  name: Schema.String,
  prefecture: Schema.String,
  address: Schema.String,
  distance: Schema.optional(Schema.Number),
  placeId: Schema.String,
  lat: Schema.optional(Schema.Number),
  lng: Schema.optional(Schema.Number),
});
export type Station = typeof Station.Type;
