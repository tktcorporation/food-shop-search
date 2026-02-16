import { Effect } from 'effect';
import type { PlaceSearchError } from '../errors';
import { ApiService } from '../services';
import type { Station } from '../composables/useStationSearch/types';

/**
 * 駅検索の Effect プログラム。
 * Worker API を呼び出し、サーバー側でキャッシュ・検索を行う。
 */
export const searchStationsProgram = (
  input: string,
): Effect.Effect<Station[], PlaceSearchError, ApiService> =>
  Effect.gen(function* () {
    const api = yield* ApiService;
    return yield* api.searchStations(input);
  });
