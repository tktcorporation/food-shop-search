import { Effect, Option } from 'effect';
import type {
  GoogleMapsAuthError,
  GeocodeError,
  PlaceSearchError,
} from '../errors';
import {
  GoogleMapsGeocoderService,
  GoogleMapsPlacesService,
  CacheService,
} from '../services';
import type {
  Restaurant,
  SearchParams,
} from '../composables/useRestaurantSearch/types';
import { generateCacheKey } from '../composables/useRestaurantSearch/utils';
import { CACHE_CONFIGS } from '../utils/cacheManager';
import { MAX_CONCURRENCY } from '../constants';

/** 駅名からジオコーディングで位置を取得 (キャッシュ対応) */
const geocodeStation = (
  stationName: string,
  prefecture: string,
): Effect.Effect<
  google.maps.LatLng,
  GoogleMapsAuthError | GeocodeError,
  GoogleMapsGeocoderService | CacheService
> =>
  Effect.gen(function* () {
    const geocoderService = yield* GoogleMapsGeocoderService;
    const cacheService = yield* CacheService;

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
  keyword: string,
  location: google.maps.LatLng,
  radius: number,
): Effect.Effect<
  google.maps.places.PlaceResult[],
  GoogleMapsAuthError | PlaceSearchError,
  GoogleMapsPlacesService | CacheService
> =>
  Effect.gen(function* () {
    const placesService = yield* GoogleMapsPlacesService;
    const cacheService = yield* CacheService;

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

/** PlaceResult から Restaurant への変換（Place Details 不要） */
const placeResultToRestaurant = (
  place: google.maps.places.PlaceResult & { searchKeywords: string[] },
  searchLocation: google.maps.LatLng,
): Restaurant | null => {
  // 非OPERATIONALな店舗は除外
  if (place.business_status && place.business_status !== 'OPERATIONAL') {
    return null;
  }

  // 距離計算
  let distance: number | undefined;
  if (place.geometry?.location) {
    distance = google.maps.geometry.spherical.computeDistanceBetween(
      searchLocation,
      place.geometry.location,
    );
  }

  // isOpen() から営業状態を取得
  let isOpenNow: boolean | undefined;
  if (place.opening_hours?.isOpen) {
    try {
      isOpenNow = place.opening_hours.isOpen();
    } catch {
      isOpenNow = undefined;
    }
  }

  return {
    place_id: place.place_id!,
    name: place.name!,
    vicinity: place.vicinity!,
    rating: place.rating || 0,
    user_ratings_total: place.user_ratings_total || 0,
    price_level: place.price_level || 1,
    types: place.types || [],
    photos: place.photos,
    searchKeywords: place.searchKeywords,
    isOpenNow,
    distance,
    geometry: place.geometry?.location
      ? { location: place.geometry.location }
      : undefined,
    business_status: place.business_status,
  };
};

/**
 * レストラン検索の Effect プログラム。
 * Nearby Search の結果を直接使用（Place Details 不要）。
 *
 * 1. 検索位置の解決 (LatLng or 駅ジオコーディング + キャッシュ)
 * 2. 全キーワードで並列検索
 * 3. 結果の重複排除
 * 4. Restaurant 型への変換
 */
export const searchRestaurantsProgram = (
  params: SearchParams,
): Effect.Effect<
  Restaurant[],
  GoogleMapsAuthError | GeocodeError | PlaceSearchError,
  GoogleMapsGeocoderService | GoogleMapsPlacesService | CacheService
> =>
  Effect.gen(function* () {
    const { keywords, searchLocation, searchRadius } = params;

    // 1. 検索位置の解決
    const location: google.maps.LatLng =
      'lat' in searchLocation
        ? new google.maps.LatLng(searchLocation.lat, searchLocation.lng)
        : yield* geocodeStation(searchLocation.name, searchLocation.prefecture);

    // 2. 全キーワードで並列検索
    const searchResults = yield* Effect.all(
      keywords.map((keyword) =>
        searchByKeyword(keyword, location, searchRadius),
      ),
      { concurrency: MAX_CONCURRENCY },
    );

    // 3. 結果の結合と重複排除
    const combinedResults = searchResults.flatMap((results, index) =>
      results.map((place) => ({
        ...place,
        searchKeywords: [keywords[index]],
      })),
    );
    const uniqueResults = deduplicateResults(combinedResults);

    // 4. Restaurant 型への変換（非OPERATIONALは除外）
    return uniqueResults
      .map((place) => placeResultToRestaurant(place, location))
      .filter((r): r is Restaurant => r !== null);
  });
