import { Effect, Option } from 'effect';
import type {
  GeocodeError,
  GeolocationError,
  GoogleMapsAuthError,
  HttpsRequiredError,
  GeolocationUnsupportedError,
} from '../errors';
import type { GeolocationService } from '../services/GeolocationService';
import type { GoogleMapsGeocoderService } from '../services/GoogleMapsGeocoderService';
import type { CacheService } from '../services/CacheService';
import { CACHE_CONFIGS } from '../utils/cacheManager';

export interface LocationData {
  lat: number;
  lng: number;
  address: string;
}

/**
 * 現在地取得の Effect プログラム。
 *
 * 1. ブラウザから位置情報を取得
 * 2. キャッシュチェック
 * 3. 逆ジオコーディングで住所を取得
 * 4. キャッシュに保存
 */
export const getLocationProgram = (
  geolocationService: GeolocationService,
  geocoderService: GoogleMapsGeocoderService,
  cacheService: CacheService,
): Effect.Effect<
  LocationData,
  | GeolocationError
  | HttpsRequiredError
  | GeolocationUnsupportedError
  | GoogleMapsAuthError
  | GeocodeError
> =>
  Effect.gen(function* () {
    // 1. ブラウザから位置情報を取得
    const position = yield* geolocationService.getCurrentPosition();
    const { latitude, longitude } = position.coords;
    const cacheKey = `${latitude},${longitude}`;

    // 2. キャッシュチェック
    const cached = yield* cacheService.get<LocationData>(
      CACHE_CONFIGS.GEOCODE,
      cacheKey,
    );

    if (Option.isSome(cached)) {
      return cached.value;
    }

    // 3. 逆ジオコーディングで住所を取得
    const result = yield* geocoderService.geocode({
      location: { lat: latitude, lng: longitude },
    });

    const locationData: LocationData = {
      lat: latitude,
      lng: longitude,
      address: result.formatted_address,
    };

    // 4. キャッシュに保存
    yield* cacheService.set(CACHE_CONFIGS.GEOCODE, cacheKey, locationData);

    return locationData;
  });
