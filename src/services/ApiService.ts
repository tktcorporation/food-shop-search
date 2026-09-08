import { Context, Effect, Layer, Schema } from 'effect';
import { PlaceSearchError, GeocodeError } from '../errors';
import {
  RestaurantListResponse,
  StationListResponse,
  ForwardGeocodeResponse,
  ReverseGeocodeResponse,
  RestaurantSearchRequest,
  decodeUnknown,
  formatParseError,
  type Restaurant,
  type Station,
  type ForwardGeocodeResult,
  type ReverseGeocodeResult,
} from '@shared';

export interface ApiService {
  readonly searchRestaurants: (
    params: typeof RestaurantSearchRequest.Type,
  ) => Effect.Effect<ReadonlyArray<Restaurant>, PlaceSearchError>;

  readonly searchStations: (
    input: string,
  ) => Effect.Effect<ReadonlyArray<Station>, PlaceSearchError>;

  readonly searchNearbyStations: (
    lat: number,
    lng: number,
  ) => Effect.Effect<ReadonlyArray<Station>, PlaceSearchError>;

  readonly geocodeForward: (
    address: string,
  ) => Effect.Effect<ForwardGeocodeResult, GeocodeError>;

  readonly geocodeReverse: (
    lat: number,
    lng: number,
  ) => Effect.Effect<ReverseGeocodeResult, GeocodeError>;
}

export const ApiService = Context.GenericTag<ApiService>('ApiService');

/**
 * fetch → JSON → Schema.decode（upstream-form）でドメイン型を得る。
 */
const fetchAndDecode = <A, I, E>(
  url: string,
  body: unknown,
  responseSchema: Schema.Schema<
    { success: true; data: A } | { success: false; error: string },
    I
  >,
  onError: (message: string) => Effect.Effect<never, E>,
): Effect.Effect<A, E> =>
  Effect.gen(function* () {
    const response = yield* Effect.tryPromise({
      try: () =>
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }),
      catch: (error) => error,
    }).pipe(
      Effect.catchAll((error) => {
        const message =
          error instanceof Error
            ? error.message
            : 'APIリクエストに失敗しました。';
        return onError(message);
      }),
    );

    if (!response.ok) {
      const text = yield* Effect.promise(() =>
        response.text().catch(() => 'Unknown error'),
      );
      return yield* onError(`HTTP ${response.status}: ${text}`);
    }

    const raw = yield* Effect.tryPromise({
      try: () => response.json(),
      catch: (error) => error,
    }).pipe(
      Effect.catchAll((error) => {
        const message =
          error instanceof Error ? error.message : 'Invalid JSON response';
        return onError(message);
      }),
    );

    const decoded = yield* decodeUnknown(responseSchema)(raw).pipe(
      Effect.catchAll((parseError) => onError(formatParseError(parseError))),
    );

    if (!decoded.success) {
      return yield* onError(decoded.error);
    }

    return decoded.data;
  });

export const ApiServiceLive = Layer.succeed(
  ApiService,
  ApiService.of({
    searchRestaurants: (params) =>
      fetchAndDecode(
        '/api/restaurants/search',
        params,
        RestaurantListResponse,
        (message) =>
          Effect.fail(
            new PlaceSearchError({
              message: `レストラン検索に失敗しました: ${message}`,
              keyword: params.keywords.join(', '),
            }),
          ),
      ),

    searchStations: (input) =>
      fetchAndDecode(
        '/api/stations/search',
        { input },
        StationListResponse,
        (message) =>
          Effect.fail(
            new PlaceSearchError({
              message: `駅の検索に失敗しました: ${message}`,
              keyword: input,
            }),
          ),
      ),

    searchNearbyStations: (lat, lng) =>
      fetchAndDecode(
        '/api/stations/nearby',
        { lat, lng },
        StationListResponse,
        (message) =>
          Effect.fail(
            new PlaceSearchError({
              message: `近くの駅の検索に失敗しました: ${message}`,
              keyword: '',
            }),
          ),
      ),

    geocodeForward: (address) =>
      fetchAndDecode(
        '/api/geocode/forward',
        { address },
        ForwardGeocodeResponse,
        (message) =>
          Effect.fail(
            new GeocodeError({
              message: `位置を取得できませんでした: ${message}`,
            }),
          ),
      ),

    geocodeReverse: (lat, lng) =>
      fetchAndDecode(
        '/api/geocode/reverse',
        { lat, lng },
        ReverseGeocodeResponse,
        (message) =>
          Effect.fail(
            new GeocodeError({
              message: `住所を取得できませんでした: ${message}`,
            }),
          ),
      ),
  }),
);
