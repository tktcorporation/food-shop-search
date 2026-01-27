import { Context, Effect, Layer } from 'effect';
import {
  GeolocationError,
  GeolocationUnsupportedError,
  HttpsRequiredError,
} from '../errors';

export interface GeolocationService {
  readonly getCurrentPosition: () => Effect.Effect<
    GeolocationPosition,
    GeolocationError | HttpsRequiredError | GeolocationUnsupportedError
  >;
}

export const GeolocationService =
  Context.GenericTag<GeolocationService>('GeolocationService');

const checkHttps = (): boolean => {
  if (typeof window !== 'undefined' && window.location.protocol !== 'https:') {
    return (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    );
  }
  return true;
};

const geolocationErrorToMessage = (error: GeolocationPositionError): string => {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
        return (
          '位置情報の利用が許可されていません。\n' +
          '1. iOSの設定アプリを開く\n' +
          '2. プライバシーとセキュリティ > 位置情報サービス\n' +
          '3. Safari > 「このWebサイトの使用中のみ許可」を選択'
        );
      }
      return '位置情報の利用が許可されていません。ブラウザの設定から位置情報の利用を許可してください。';
    case error.POSITION_UNAVAILABLE:
      return '位置情報を取得できませんでした。電波の良い場所で再度お試しください。';
    case error.TIMEOUT:
      return '位置情報の取得がタイムアウトしました。再度お試しください。';
    default:
      return '位置情報の取得に失敗しました。再度お試しください。';
  }
};

export const GeolocationServiceLive = Layer.succeed(
  GeolocationService,
  GeolocationService.of({
    getCurrentPosition: () =>
      Effect.gen(function* () {
        if (!checkHttps()) {
          return yield* Effect.fail(
            new HttpsRequiredError({
              message: '位置情報の取得には HTTPS 接続が必要です。',
            }),
          );
        }

        if (!navigator.geolocation) {
          return yield* Effect.fail(
            new GeolocationUnsupportedError({
              message: 'お使いのブラウザは位置情報をサポートしていません。',
            }),
          );
        }

        return yield* Effect.async<GeolocationPosition, GeolocationError>(
          (resume) => {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                resume(Effect.succeed(position));
              },
              (error) => {
                resume(
                  Effect.fail(
                    new GeolocationError({
                      message: geolocationErrorToMessage(error),
                      code: error.code,
                    }),
                  ),
                );
              },
              {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
              },
            );
          },
        );
      }),
  }),
);
