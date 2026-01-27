import { Context, Effect, Layer } from 'effect';
import { GeocodeError, GoogleMapsAuthError } from '../errors';

export interface GoogleMapsGeocoderService {
  readonly geocode: (
    request: google.maps.GeocoderRequest,
  ) => Effect.Effect<
    google.maps.GeocoderResult,
    GoogleMapsAuthError | GeocodeError
  >;
}

export const GoogleMapsGeocoderService =
  Context.GenericTag<GoogleMapsGeocoderService>('GoogleMapsGeocoderService');

export const GoogleMapsGeocoderServiceLive = Layer.succeed(
  GoogleMapsGeocoderService,
  GoogleMapsGeocoderService.of({
    geocode: (request) =>
      Effect.async<
        google.maps.GeocoderResult,
        GoogleMapsAuthError | GeocodeError
      >((resume) => {
        const geocoder = new google.maps.Geocoder();
        void geocoder.geocode(request, (results, status) => {
          if (status === google.maps.GeocoderStatus.OK && results?.[0]) {
            resume(Effect.succeed(results[0]));
          } else if (status === google.maps.GeocoderStatus.REQUEST_DENIED) {
            resume(
              Effect.fail(
                new GoogleMapsAuthError({
                  message:
                    'Google Maps APIの認証に失敗しました。APIキーを確認してください。',
                }),
              ),
            );
          } else {
            resume(
              Effect.fail(
                new GeocodeError({
                  message: '位置を取得できませんでした。',
                }),
              ),
            );
          }
        });
      }),
  }),
);
