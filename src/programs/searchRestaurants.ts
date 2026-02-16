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
 * 1. 検索位置の解決 (LatLng or 駅ジオコーディング)
 * 2. API呼び出し
 */
export const searchRestaurantsProgram = (
  params: SearchParams,
): Effect.Effect<Restaurant[], PlaceSearchError | GeocodeError, ApiService> =>
  Effect.gen(function* () {
    const api = yield* ApiService;
    const { keywords, searchLocation, searchRadius } = params;

    // 検索位置の解決
    let location: { lat: number; lng: number };
    if ('lat' in searchLocation) {
      location = { lat: searchLocation.lat, lng: searchLocation.lng };
    } else {
      const geocoded = yield* api.geocodeForward(
        `${searchLocation.name}駅,${searchLocation.prefecture}`,
      );
      location = { lat: geocoded.lat, lng: geocoded.lng };
    }

    return yield* api.searchRestaurants({
      keywords,
      location,
      radius: searchRadius,
    });
  });
