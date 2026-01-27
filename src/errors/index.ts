import { Data } from 'effect';

/** Google Maps API認証エラー */
export class GoogleMapsAuthError extends Data.TaggedError(
  'GoogleMapsAuthError',
)<{
  readonly message: string;
}> {}

/** ジオコーディングエラー */
export class GeocodeError extends Data.TaggedError('GeocodeError')<{
  readonly message: string;
}> {}

/** 場所検索エラー */
export class PlaceSearchError extends Data.TaggedError('PlaceSearchError')<{
  readonly message: string;
  readonly keyword: string;
}> {}

/** 場所詳細取得エラー */
export class PlaceDetailsError extends Data.TaggedError('PlaceDetailsError')<{
  readonly message: string;
  readonly placeId: string;
}> {}

/** ブラウザの位置情報取得エラー */
export class GeolocationError extends Data.TaggedError('GeolocationError')<{
  readonly message: string;
  readonly code: number;
}> {}

/** HTTPS必須エラー */
export class HttpsRequiredError extends Data.TaggedError('HttpsRequiredError')<{
  readonly message: string;
}> {}

/** ブラウザ非対応エラー */
export class GeolocationUnsupportedError extends Data.TaggedError(
  'GeolocationUnsupportedError',
)<{
  readonly message: string;
}> {}

/** 全てのアプリケーションエラーの union 型 */
export type AppError =
  | GoogleMapsAuthError
  | GeocodeError
  | PlaceSearchError
  | PlaceDetailsError
  | GeolocationError
  | HttpsRequiredError
  | GeolocationUnsupportedError;
