import { Effect } from 'effect';
import type {
  GeocodeError,
  GeolocationError,
  HttpsRequiredError,
  GeolocationUnsupportedError,
} from '../errors';
import { GeolocationService, ApiService } from '../services';
import type { LocationWithAddress } from '@shared';

/** @deprecated Prefer LocationWithAddress from @shared */
export type LocationData = LocationWithAddress;

/**
 * 現在地取得の Effect プログラム。
 *
 * 1. ブラウザから位置情報を取得
 * 2. Worker API で逆ジオコーディングして住所を取得
 */
export const getLocationProgram = (): Effect.Effect<
  LocationWithAddress,
  | GeolocationError
  | HttpsRequiredError
  | GeolocationUnsupportedError
  | GeocodeError,
  GeolocationService | ApiService
> =>
  Effect.gen(function* () {
    const geolocationService = yield* GeolocationService;
    const api = yield* ApiService;

    const position = yield* geolocationService.getCurrentPosition();
    const { latitude, longitude } = position.coords;

    const result = yield* api.geocodeReverse(latitude, longitude);

    return {
      lat: latitude,
      lng: longitude,
      address: result.address,
    };
  });
