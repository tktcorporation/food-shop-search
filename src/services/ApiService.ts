import { Context, Effect, Layer } from 'effect';
import { PlaceSearchError, GeocodeError } from '../errors';
import type { Restaurant } from '../composables/useRestaurantSearch/types';
import type { Station } from '../composables/useStationSearch/types';

export interface ApiService {
  readonly searchRestaurants: (params: {
    keywords: string[];
    location: { lat: number; lng: number };
    radius: number;
    stationPlaceId: string;
  }) => Effect.Effect<Restaurant[], PlaceSearchError>;

  readonly searchStations: (
    input: string,
  ) => Effect.Effect<Station[], PlaceSearchError>;

  readonly searchNearbyStations: (
    lat: number,
    lng: number,
  ) => Effect.Effect<Station[], PlaceSearchError>;

  readonly geocodeForward: (
    address: string,
  ) => Effect.Effect<
    { lat: number; lng: number; formatted_address: string },
    GeocodeError
  >;

  readonly geocodeReverse: (
    lat: number,
    lng: number,
  ) => Effect.Effect<
    { lat: number; lng: number; address: string },
    GeocodeError
  >;
}

export const ApiService = Context.GenericTag<ApiService>('ApiService');

/** fetch をラップして JSON を取得し、エラーハンドリングを行うヘルパー */
const fetchJson = <T, E>(
  url: string,
  body: unknown,
  onError: (message: string) => Effect.Effect<never, E>,
): Effect.Effect<T, E> =>
  Effect.tryPromise({
    try: async () => {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => 'Unknown error');
        // oxlint-disable-next-line effect-enforce/no-throw-statement -- tryPromise の try 内で Effect のエラーチャネルに変換される
        throw new Error(`HTTP ${response.status}: ${text}`);
      }

      const data = (await response.json()) as {
        success: boolean;
        data?: T;
        error?: string;
      };

      if (!data.success || !data.data) {
        // oxlint-disable-next-line effect-enforce/no-throw-statement -- tryPromise の try 内で Effect のエラーチャネルに変換される
        throw new Error(data.error ?? 'API returned unsuccessful response');
      }

      return data.data;
    },
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

export const ApiServiceLive = Layer.succeed(
  ApiService,
  ApiService.of({
    searchRestaurants: (params) =>
      fetchJson<Restaurant[], PlaceSearchError>(
        '/api/restaurants/search',
        params,
        (message) =>
          Effect.fail(
            new PlaceSearchError({
              message: `レストラン検索に失敗しました: ${message}`,
              keyword: params.keywords.join(', '),
            }),
          ),
      ),

    searchStations: (input) =>
      fetchJson<Station[], PlaceSearchError>(
        '/api/stations/search',
        { input },
        (message) =>
          Effect.fail(
            new PlaceSearchError({
              message: `駅の検索に失敗しました: ${message}`,
              keyword: input,
            }),
          ),
      ),

    searchNearbyStations: (lat, lng) =>
      fetchJson<Station[], PlaceSearchError>(
        '/api/stations/nearby',
        { lat, lng },
        (message) =>
          Effect.fail(
            new PlaceSearchError({
              message: `近くの駅の検索に失敗しました: ${message}`,
              keyword: '',
            }),
          ),
      ),

    geocodeForward: (address) =>
      fetchJson<
        { lat: number; lng: number; formatted_address: string },
        GeocodeError
      >('/api/geocode/forward', { address }, (message) =>
        Effect.fail(
          new GeocodeError({
            message: `位置を取得できませんでした: ${message}`,
          }),
        ),
      ),

    geocodeReverse: (lat, lng) =>
      fetchJson<{ lat: number; lng: number; address: string }, GeocodeError>(
        '/api/geocode/reverse',
        { lat, lng },
        (message) =>
          Effect.fail(
            new GeocodeError({
              message: `住所を取得できませんでした: ${message}`,
            }),
          ),
      ),
  }),
);
