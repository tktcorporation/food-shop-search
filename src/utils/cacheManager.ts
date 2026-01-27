import { useState, useEffect } from 'react';

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

export function useCache<T>(config: CacheConfig) {
  const [cache, setCache] = useState<Map<string, CacheData<T>>>(() => {
    try {
      const cached = localStorage.getItem(config.key);
      if (!cached) return new Map();

      const parsed = JSON.parse(cached) as CacheEntry<T>;
      if (parsed.version !== config.version) return new Map();

      return new Map(Object.entries(parsed.data));
    } catch {
      return new Map();
    }
  });

  useEffect(() => {
    const cacheEntry: CacheEntry<T> = {
      version: config.version,
      data: Object.fromEntries(cache),
    };
    localStorage.setItem(config.key, JSON.stringify(cacheEntry));
  }, [cache, config.key, config.version]);

  const getCached = (key: string): T | null => {
    const now = Date.now();
    const cached = cache.get(key);

    if (cached && now - cached.timestamp < config.expiry) {
      return cached.data;
    }

    if (cached) {
      // 期限切れのエントリーを削除
      const newCache = new Map(cache);
      newCache.delete(key);
      setCache(newCache);
    }

    return null;
  };

  const setCached = (key: string, data: T) => {
    setCache((prev) => {
      const newCache = new Map(prev);
      newCache.set(key, { data, timestamp: Date.now() });
      return newCache;
    });
  };

  const clearCache = () => {
    setCache(new Map());
    localStorage.removeItem(config.key);
  };

  return {
    getCached,
    setCached,
    clearCache,
  };
}
