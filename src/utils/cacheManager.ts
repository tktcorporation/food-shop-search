export interface CacheConfig {
  key: string;
  version: string;
  expiry: number;
}

export interface CacheData<T> {
  data: T;
  timestamp: number;
}

export interface CacheEntry<T> {
  version: string;
  data: { [key: string]: CacheData<T> };
}

// キャッシュの設定
export const CACHE_CONFIGS = {
  STATION_PREDICTIONS: {
    key: 'stationPredictionsCache',
    version: '1',
    expiry: 24 * 60 * 60 * 1000, // 24時間
  },
  NEARBY_STATIONS: {
    key: 'nearbyStationsCache',
    version: '1',
    expiry: 12 * 60 * 60 * 1000, // 12時間
  },
  GEOCODE: {
    key: 'geocodeCache',
    version: '1',
    expiry: 24 * 60 * 60 * 1000, // 24時間
  },
  RESTAURANT_SEARCH: {
    key: 'restaurantSearchCache',
    version: '1',
    expiry: 48 * 60 * 60 * 1000, // 48時間
  },
  RESTAURANT_DETAILS: {
    key: 'restaurantDetailsCache',
    version: '1',
    expiry: 48 * 60 * 60 * 1000, // 48時間
  },
  GEOCODE_FORWARD: {
    key: 'geocodeForwardCache',
    version: '1',
    expiry: 7 * 24 * 60 * 60 * 1000, // 7日間（駅の座標はほぼ変わらない）
  },
} as const;
