import { Context, Effect, Layer, Option } from 'effect';
import type { CacheConfig, CacheData, CacheEntry } from '../utils/cacheManager';

export interface CacheService {
  readonly get: <T>(
    config: CacheConfig,
    key: string,
  ) => Effect.Effect<Option.Option<T>>;
  readonly set: <T>(
    config: CacheConfig,
    key: string,
    data: T,
  ) => Effect.Effect<void>;
  readonly clear: (config: CacheConfig) => Effect.Effect<void>;
}

export const CacheService = Context.GenericTag<CacheService>('CacheService');

const readCacheStore = <T>(config: CacheConfig): Map<string, CacheData<T>> => {
  try {
    const cached = localStorage.getItem(config.key);
    if (!cached) return new Map();

    const parsed = JSON.parse(cached) as CacheEntry<T>;
    if (parsed.version !== config.version) return new Map();

    return new Map(Object.entries(parsed.data));
  } catch {
    return new Map();
  }
};

const writeCacheStore = <T>(
  config: CacheConfig,
  store: Map<string, CacheData<T>>,
): void => {
  const cacheEntry: CacheEntry<T> = {
    version: config.version,
    data: Object.fromEntries(store),
  };
  localStorage.setItem(config.key, JSON.stringify(cacheEntry));
};

export const CacheServiceLive = Layer.succeed(
  CacheService,
  CacheService.of({
    get: <T>(config: CacheConfig, key: string) =>
      Effect.sync(() => {
        const store = readCacheStore<T>(config);
        const cached = store.get(key);
        const now = Date.now();

        if (cached && now - cached.timestamp < config.expiry) {
          return Option.some(cached.data);
        }

        if (cached) {
          store.delete(key);
          writeCacheStore(config, store);
        }

        return Option.none();
      }),

    set: <T>(config: CacheConfig, key: string, data: T) =>
      Effect.sync(() => {
        const store = readCacheStore<T>(config);
        store.set(key, { data, timestamp: Date.now() });
        writeCacheStore(config, store);
      }),

    clear: (config: CacheConfig) =>
      Effect.sync(() => {
        localStorage.removeItem(config.key);
      }),
  }),
);
