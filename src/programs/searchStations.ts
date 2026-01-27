import { Effect, Option } from 'effect';
import type { PlaceSearchError } from '../errors';
import type { GoogleMapsPlacesService } from '../services/GoogleMapsPlacesService';
import type { CacheService } from '../services/CacheService';
import type { Station } from '../composables/useStationSearch/types';
import { CACHE_CONFIGS } from '../utils/cacheManager';

/**
 * 駅検索の Effect プログラム。
 * キャッシュがあればそれを返し、なければ Google Maps Autocomplete API を呼び出す。
 */
export const searchStationsProgram = (
  placesService: GoogleMapsPlacesService,
  cacheService: CacheService,
  input: string,
): Effect.Effect<Station[], PlaceSearchError> =>
  Effect.gen(function* () {
    const cached = yield* cacheService.get<Station[]>(
      CACHE_CONFIGS.STATION_PREDICTIONS,
      input,
    );

    if (Option.isSome(cached)) {
      return cached.value;
    }

    const predictions = yield* placesService.getAutocompletePredictions({
      input,
      types: ['transit_station', 'train_station', 'airport', 'subway_station'],
      componentRestrictions: { country: 'jp' },
    });

    const candidates: Station[] = predictions.map((prediction) => ({
      name: prediction.structured_formatting.main_text,
      prefecture: prediction.structured_formatting.secondary_text || '',
      address: prediction.structured_formatting.secondary_text || '',
      rawPrediction: prediction,
    }));

    yield* cacheService.set(
      CACHE_CONFIGS.STATION_PREDICTIONS,
      input,
      candidates,
    );

    return candidates;
  });
