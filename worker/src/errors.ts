import { Data } from 'effect';

/** Google Maps API呼び出しエラー */
export class GoogleMapsApiError extends Data.TaggedError('GoogleMapsApiError')<{
  readonly message: string;
}> {}
