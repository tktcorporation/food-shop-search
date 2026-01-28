import { Effect, Option } from 'effect';
import type {
  GeolocationError,
  GoogleMapsAuthError,
  HttpsRequiredError,
  GeolocationUnsupportedError,
  PlaceSearchError,
} from '../errors';
import {
  GeolocationService,
  GoogleMapsPlacesService,
  CacheService,
} from '../services';
import type { Station } from '../composables/useStationSearch/types';
import { CACHE_CONFIGS } from '../utils/cacheManager';
import {
  MAX_NEARBY_STATIONS,
  NEARBY_STATIONS_RADIUS,
  POSITION_CACHE_PRECISION,
} from '../constants';

/** 位置をキャッシュキーに変換（指定精度に丸めて近傍位置をまとめる） */
const positionToCacheKey = (lat: number, lng: number): string =>
  `${lat.toFixed(POSITION_CACHE_PRECISION)}_${lng.toFixed(POSITION_CACHE_PRECISION)}`;

/**
 * 現在地周辺の駅を検索する Effect プログラム。
 *
 * 1. ブラウザから位置情報を取得
 * 2. キャッシュチェック
 * 3. Google Maps Places API で近くの駅を検索
 * 4. 距離計算・ソート・上位N件を返却
 * 5. キャッシュに保存
 */
export const searchNearbyStationsProgram = (): Effect.Effect<
  Station[],
  | GeolocationError
  | HttpsRequiredError
  | GeolocationUnsupportedError
  | GoogleMapsAuthError
  | PlaceSearchError,
  GeolocationService | GoogleMapsPlacesService | CacheService
> =>
  Effect.gen(function* () {
    const geolocationService = yield* GeolocationService;
    const placesService = yield* GoogleMapsPlacesService;
    const cacheService = yield* CacheService;

    // 1. ブラウザから位置情報を取得
    const position = yield* geolocationService.getCurrentPosition();
    const { latitude, longitude } = position.coords;
    const cacheKey = positionToCacheKey(latitude, longitude);

    // 2. キャッシュチェック
    const cached = yield* cacheService.get<Station[]>(
      CACHE_CONFIGS.NEARBY_STATIONS,
      cacheKey,
    );

    if (Option.isSome(cached)) {
      return cached.value;
    }

    // 3. Google Maps Places API で近くの駅を検索
    const userLocation = new google.maps.LatLng(latitude, longitude);
    const results = yield* placesService.nearbySearch({
      location: userLocation,
      radius: NEARBY_STATIONS_RADIUS,
      type: 'train_station',
    });

    // 4. Station[] に変換（距離計算含む）
    const stations: Station[] = results.map((place) => {
      const placeLocation = place.geometry?.location;
      let distance = 0;

      if (placeLocation && google.maps.geometry) {
        distance = google.maps.geometry.spherical.computeDistanceBetween(
          userLocation,
          placeLocation,
        );
      }

      return {
        name: place.name?.replace(/駅$/, '') || '',
        prefecture: place.vicinity || '',
        address: place.vicinity || '',
        distance: Math.round(distance),
        rawPrediction: {
          place_id: place.place_id || '',
          description: place.name || '',
          structured_formatting: {
            main_text: place.name || '',
            secondary_text: place.vicinity || '',
          },
        } as google.maps.places.AutocompletePrediction,
      };
    });

    // 距離でソートして上位N件
    const sorted = stations.sort(
      (a, b) => (a.distance || 0) - (b.distance || 0),
    );
    const nearestStations = sorted.slice(0, MAX_NEARBY_STATIONS);

    // 5. キャッシュに保存
    yield* cacheService.set(
      CACHE_CONFIGS.NEARBY_STATIONS,
      cacheKey,
      nearestStations,
    );

    return nearestStations;
  });
