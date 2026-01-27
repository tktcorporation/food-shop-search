import { Context, Effect, Layer } from 'effect';
import {
  GoogleMapsAuthError,
  PlaceDetailsError,
  PlaceSearchError,
} from '../errors';

export interface GoogleMapsPlacesService {
  readonly nearbySearch: (
    request: google.maps.places.PlaceSearchRequest,
  ) => Effect.Effect<
    google.maps.places.PlaceResult[],
    GoogleMapsAuthError | PlaceSearchError
  >;

  readonly getDetails: (
    request: google.maps.places.PlaceDetailsRequest,
  ) => Effect.Effect<
    google.maps.places.PlaceResult,
    GoogleMapsAuthError | PlaceDetailsError
  >;

  readonly getAutocompletePredictions: (
    request: google.maps.places.AutocompletionRequest,
  ) => Effect.Effect<
    google.maps.places.AutocompletePrediction[],
    PlaceSearchError
  >;
}

export const GoogleMapsPlacesService =
  Context.GenericTag<GoogleMapsPlacesService>('GoogleMapsPlacesService');

const createPlacesService = (): google.maps.places.PlacesService =>
  new google.maps.places.PlacesService(document.createElement('div'));

export const GoogleMapsPlacesServiceLive = Layer.succeed(
  GoogleMapsPlacesService,
  GoogleMapsPlacesService.of({
    nearbySearch: (request) =>
      Effect.async<
        google.maps.places.PlaceResult[],
        GoogleMapsAuthError | PlaceSearchError
      >((resume) => {
        const service = createPlacesService();
        service.nearbySearch(request, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            resume(Effect.succeed([]));
          } else if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            results
          ) {
            const activeResults = results.filter(
              (place) =>
                place.business_status === 'OPERATIONAL' ||
                place.business_status === undefined,
            );
            resume(Effect.succeed(activeResults));
          } else if (
            status === google.maps.places.PlacesServiceStatus.REQUEST_DENIED
          ) {
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
                new PlaceSearchError({
                  message: `${request.keyword ?? ''}の検索に失敗しました。`,
                  keyword: request.keyword ?? '',
                }),
              ),
            );
          }
        });
      }),

    getDetails: (request) =>
      Effect.async<
        google.maps.places.PlaceResult,
        GoogleMapsAuthError | PlaceDetailsError
      >((resume) => {
        const service = createPlacesService();
        service.getDetails(request, (result, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && result) {
            resume(Effect.succeed(result));
          } else if (
            status === google.maps.places.PlacesServiceStatus.REQUEST_DENIED
          ) {
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
                new PlaceDetailsError({
                  message: '詳細情報の取得に失敗しました。',
                  placeId: request.placeId,
                }),
              ),
            );
          }
        });
      }),

    getAutocompletePredictions: (request) =>
      Effect.async<
        google.maps.places.AutocompletePrediction[],
        PlaceSearchError
      >((resume) => {
        const service = new google.maps.places.AutocompleteService();
        void service.getPlacePredictions(request, (predictions, status) => {
          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            predictions
          ) {
            resume(Effect.succeed(predictions));
          } else {
            resume(
              Effect.fail(
                new PlaceSearchError({
                  message: '駅の検索に失敗しました。',
                  keyword: request.input,
                }),
              ),
            );
          }
        });
      }),
  }),
);
