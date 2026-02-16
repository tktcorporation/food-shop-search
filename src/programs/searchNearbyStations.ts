import { Effect } from 'effect';
import type {
  GeolocationError,
  HttpsRequiredError,
  GeolocationUnsupportedError,
  PlaceSearchError,
} from '../errors';
import { GeolocationService, ApiService } from '../services';
import type { Station } from '../composables/useStationSearch/types';

/**
 * 現在地周辺の駅を検索する Effect プログラム。
 *
 * 1. ブラウザから位置情報を取得
 * 2. Worker API で近くの駅を検索
 */
export const searchNearbyStationsProgram = (): Effect.Effect<
  Station[],
  | GeolocationError
  | HttpsRequiredError
  | GeolocationUnsupportedError
  | PlaceSearchError,
  GeolocationService | ApiService
> =>
  Effect.gen(function* () {
    const geolocationService = yield* GeolocationService;
    const api = yield* ApiService;

    // ブラウザから位置情報を取得
    const position = yield* geolocationService.getCurrentPosition();
    const { latitude, longitude } = position.coords;

    return yield* api.searchNearbyStations(latitude, longitude);
  });
