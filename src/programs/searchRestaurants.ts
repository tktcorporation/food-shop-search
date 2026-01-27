import { Effect, Option } from 'effect';
import type {
  GoogleMapsAuthError,
  GeocodeError,
  PlaceSearchError,
  PlaceDetailsError,
} from '../errors';
import type { GoogleMapsGeocoderService } from '../services/GoogleMapsGeocoderService';
import type { GoogleMapsPlacesService } from '../services/GoogleMapsPlacesService';
import type { CacheService } from '../services/CacheService';
import type {
  Restaurant,
  SearchParams,
} from '../composables/useRestaurantSearch/types';
import { generateCacheKey } from '../composables/useRestaurantSearch/utils';
import { getPlaceDetailsEffect } from '../composables/useRestaurantSearch/getPlaceDetails';
import { CACHE_CONFIGS } from '../utils/cacheManager';

/** getDetailsの最大呼び出し数（コスト制御） */
const MAX_DETAILS_REQUESTS = 20;

/** 駅名からジオコーディングで位置を取得 (キャッシュ対応) */
const geocodeStation = (
  geocoderService: GoogleMapsGeocoderService,
  cacheService: CacheService,
  stationName: string,
  prefecture: string,
): Effect.Effect<google.maps.LatLng, GoogleMapsAuthError | GeocodeError> =>
  Effect.gen(function* () {
    const cacheKey = `${stationName}_${prefecture}`;
    const cached = yield* cacheService.get<{
      lat: number;
      lng: number;
    }>(CACHE_CONFIGS.GEOCODE_FORWARD, cacheKey);

    if (Option.isSome(cached)) {
      return new google.maps.LatLng(cached.value.lat, cached.value.lng);
    }

    const result = yield* geocoderService.geocode({
      address: `${stationName}駅,${prefecture}`,
    });
    const location = result.geometry.location;

    yield* cacheService.set(CACHE_CONFIGS.GEOCODE_FORWARD, cacheKey, {
      lat: location.lat(),
      lng: location.lng(),
    });

    return location;
  });

/** 単一キーワードの近隣検索 (キャッシュ対応) */
const searchByKeyword = (
  placesService: GoogleMapsPlacesService,
  cacheService: CacheService,
  keyword: string,
  location: google.maps.LatLng,
  radius: number,
): Effect.Effect<
  google.maps.places.PlaceResult[],
  GoogleMapsAuthError | PlaceSearchError
> =>
  Effect.gen(function* () {
    const request: google.maps.places.PlaceSearchRequest = {
      keyword,
      location,
      radius,
    };
    const cacheKey = generateCacheKey(request);

    const cached = yield* cacheService.get<google.maps.places.PlaceResult[]>(
      CACHE_CONFIGS.RESTAURANT_SEARCH,
      cacheKey,
    );

    if (Option.isSome(cached)) {
      return cached.value;
    }

    const results = yield* placesService.nearbySearch(request);

    yield* cacheService.set(CACHE_CONFIGS.RESTAURANT_SEARCH, cacheKey, results);

    return results;
  });

/** 検索結果を place_id で重複排除 */
const deduplicateResults = (
  combinedResults: (google.maps.places.PlaceResult & {
    searchKeywords: string[];
  })[],
): (google.maps.places.PlaceResult & { searchKeywords: string[] })[] =>
  combinedResults.reduce(
    (acc, current) => {
      const existing = acc.find((item) => item.place_id === current.place_id);
      if (!existing) {
        return acc.concat([current]);
      }
      existing.searchKeywords = [
        ...new Set([...existing.searchKeywords, ...current.searchKeywords]),
      ];
      return acc;
    },
    [] as (google.maps.places.PlaceResult & {
      searchKeywords: string[];
    })[],
  );

/**
 * レストラン検索の Effect プログラム。
 * 全詳細結果を返す（フィルタリングは呼び出し側で行う）。
 *
 * 1. 検索位置の解決 (LatLng or 駅ジオコーディング + キャッシュ)
 * 2. 全キーワードで並列検索
 * 3. 結果の重複排除
 * 4. 各場所の詳細情報取得 (MAX_DETAILS_REQUESTS で制限)
 */
export const searchRestaurantsProgram = (
  geocoderService: GoogleMapsGeocoderService,
  placesService: GoogleMapsPlacesService,
  cacheService: CacheService,
  params: SearchParams,
): Effect.Effect<
  Restaurant[],
  GoogleMapsAuthError | GeocodeError | PlaceSearchError | PlaceDetailsError
> =>
  Effect.gen(function* () {
    const { keywords, searchLocation, searchRadius } = params;

    // 1. 検索位置の解決
    const location: google.maps.LatLng =
      'lat' in searchLocation
        ? new google.maps.LatLng(searchLocation.lat, searchLocation.lng)
        : yield* geocodeStation(
            geocoderService,
            cacheService,
            searchLocation.name,
            searchLocation.prefecture,
          );

    // 2. 全キーワードで並列検索
    const searchResults = yield* Effect.all(
      keywords.map((keyword) =>
        searchByKeyword(
          placesService,
          cacheService,
          keyword,
          location,
          searchRadius,
        ),
      ),
      { concurrency: 'unbounded' },
    );

    // 3. 結果の結合と重複排除
    const combinedResults = searchResults.flatMap((results, index) =>
      results.map((place) => ({
        ...place,
        searchKeywords: [keywords[index]],
      })),
    );
    const uniqueResults = deduplicateResults(combinedResults);

    // 4. 各場所の詳細情報を並列取得 (コスト制限)
    const limitedResults = uniqueResults.slice(0, MAX_DETAILS_REQUESTS);

    const detailedResults = yield* Effect.all(
      limitedResults.map((place) =>
        getPlaceDetailsEffect(placesService, cacheService, place, location),
      ),
      { concurrency: 'unbounded' },
    );

    return detailedResults;
  });
