import { Schema } from 'effect';

/** 地理座標（ドメイン VO） */
export const Location = Schema.Struct({
  lat: Schema.Number,
  lng: Schema.Number,
});
export type Location = typeof Location.Type;

/** 住所付き位置（現在地取得結果） */
export const LocationWithAddress = Schema.Struct({
  lat: Schema.Number,
  lng: Schema.Number,
  address: Schema.String,
});
export type LocationWithAddress = typeof LocationWithAddress.Type;
