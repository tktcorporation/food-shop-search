import { Effect } from 'effect';
import type { PlaceSearchError, GeocodeError } from '../errors';
import { ApiService } from '../services';
import type {
  Restaurant,
  SearchParams,
} from '../composables/useRestaurantSearch/types';

/**
 * レストラン検索の Effect プログラム。
 * Worker API を呼び出し、サーバー側でキーワード並列検索・重複排除・距離計算・写真URL解決を行う。
 *
 * 1. 駅からジオコーディングして位置を取得
 * 2. stationPlaceId と共に API呼び出し
 */
export const searchRestaurantsProgram = (
  params: SearchParams,
): Effect.Effect<Restaurant[], PlaceSearchError | GeocodeError, ApiService> =>
  Effect.gen(function* () {
    const api = yield* ApiService;
    const { keywords, searchLocation, searchRadius } = params;

    // 駅からジオコーディングして位置を取得
    const geocoded = yield* api.geocodeForward(
      `${searchLocation.name}駅,${searchLocation.prefecture}`,
    );

    return yield* api.searchRestaurants({
      keywords,
      location: { lat: geocoded.lat, lng: geocoded.lng },
      radius: searchRadius,
      stationPlaceId: searchLocation.placeId,
    });
  });
