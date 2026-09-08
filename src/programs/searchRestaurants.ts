import { Effect } from 'effect';
import type { PlaceSearchError, GeocodeError } from '../errors';
import { ApiService } from '../services';
import {
  ensureStationSuffix,
  type Restaurant,
  type RestaurantSearchParams,
} from '@shared';

/**
 * レストラン検索の Effect プログラム。
 * Worker API を呼び出し、サーバー側でキーワード並列検索・重複排除・距離計算・写真URL解決を行う。
 *
 * 1. 駅からジオコーディングして位置を取得
 * 2. stationPlaceId と共に API呼び出し
 */
export const searchRestaurantsProgram = (
  params: RestaurantSearchParams,
): Effect.Effect<
  ReadonlyArray<Restaurant>,
  PlaceSearchError | GeocodeError,
  ApiService
> =>
  Effect.gen(function* () {
    const api = yield* ApiService;
    const { keywords, searchLocation, searchRadius } = params;

    let location: { lat: number; lng: number };
    if (searchLocation.lat != null && searchLocation.lng != null) {
      location = { lat: searchLocation.lat, lng: searchLocation.lng };
    } else {
      const stationName = ensureStationSuffix(searchLocation.name);
      location = yield* api.geocodeForward(
        `${stationName},${searchLocation.prefecture}`,
      );
    }

    return yield* api.searchRestaurants({
      keywords: [...keywords],
      location,
      radius: searchRadius,
      stationPlaceId: searchLocation.placeId,
    });
  });
