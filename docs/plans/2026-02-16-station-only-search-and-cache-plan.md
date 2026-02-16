# Station-Only Search & Place Cache Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Simplify search to station-only mode with nearest-station auto-detection, filter stations to train/subway only, and add place_id-level caching to minimize Google Maps API calls.

**Architecture:** The app will always search from a station (never raw GPS coordinates). On startup, browser GPS finds the nearest train station via Worker API, auto-selects it, and triggers restaurant search. The Worker stores each restaurant by place_id in a new `place_cache` table, so repeated searches across different keywords reuse cached restaurant data. Search result cache keys are normalized by station place_id (not GPS) for stable hits.

**Tech Stack:** React 18 + TypeScript + Vite (frontend), Cloudflare Workers + Hono + Drizzle ORM + D1 (backend), Vitest (tests), Effect (frontend service layer)

---

### Task 1: Add `place_cache` table to DB schema

**Files:**
- Modify: `worker/src/db/schema.ts`

**Step 1: Add place_cache table definition**

Add after the existing `apiCache` table in `worker/src/db/schema.ts`:

```typescript
export const placeCache = sqliteTable(
  'place_cache',
  {
    placeId: text('place_id').primaryKey(),
    name: text('name').notNull(),
    vicinity: text('vicinity').notNull(),
    rating: integer('rating', { mode: 'number' }).notNull().default(0),
    userRatingsTotal: integer('user_ratings_total', { mode: 'number' }).notNull().default(0),
    priceLevel: integer('price_level', { mode: 'number' }).notNull().default(-1),
    types: text('types').notNull(), // JSON array
    photoReferences: text('photo_references').notNull(), // JSON array of photo_reference strings
    isOpenNow: integer('is_open_now', { mode: 'number' }),
    lat: integer('lat', { mode: 'number' }),
    lng: integer('lng', { mode: 'number' }),
    businessStatus: text('business_status'),
    createdAt: integer('created_at', { mode: 'number' })
      .notNull()
      .default(sql`(unixepoch())`),
    expiresAt: integer('expires_at', { mode: 'number' }).notNull(),
  },
  (table) => [index('idx_place_expires').on(table.expiresAt)],
);
```

**Step 2: Generate migration**

Run: `npx drizzle-kit generate`
Expected: New migration file in `drizzle/` directory

**Step 3: Commit**

```bash
git add worker/src/db/schema.ts drizzle/
git commit -m "feat: add place_cache table for place_id-level caching"
```

---

### Task 2: Add place cache service functions

**Files:**
- Modify: `worker/src/services/cache.ts`
- Modify: `worker/src/services/cache.test.ts`

**Step 1: Update CACHE_TTL and add place cache functions**

In `worker/src/services/cache.ts`:

1. Add import for `placeCache` from schema and `inArray` from drizzle-orm
2. Add `place_detail: 1209600` (14 days) to `CACHE_TTL`
3. Update `nearby_stations` TTL from `43200` to `604800` (7 days)
4. Add two new functions:

```typescript
import { eq, lt, sql, inArray } from 'drizzle-orm';
import { apiCache, placeCache } from '../db/schema';

export interface PlaceCacheRow {
  placeId: string;
  name: string;
  vicinity: string;
  rating: number;
  userRatingsTotal: number;
  priceLevel: number;
  types: string[];
  photoReferences: string[];
  isOpenNow: boolean | undefined;
  lat: number | undefined;
  lng: number | undefined;
  businessStatus: string | undefined;
}

/**
 * Retrieve multiple places from place_cache by their IDs.
 * Returns only non-expired entries.
 */
export async function getPlacesByIds(
  db: Database,
  placeIds: string[],
): Promise<Map<string, PlaceCacheRow>> {
  if (placeIds.length === 0) return new Map();

  const now = Math.floor(Date.now() / 1000);
  const rows = await db
    .select()
    .from(placeCache)
    .where(inArray(placeCache.placeId, placeIds));

  const result = new Map<string, PlaceCacheRow>();
  for (const row of rows) {
    if (row.expiresAt <= now) continue; // skip expired
    result.set(row.placeId, {
      placeId: row.placeId,
      name: row.name,
      vicinity: row.vicinity,
      rating: row.rating,
      userRatingsTotal: row.userRatingsTotal,
      priceLevel: row.priceLevel,
      types: JSON.parse(row.types) as string[],
      photoReferences: JSON.parse(row.photoReferences) as string[],
      isOpenNow: row.isOpenNow == null ? undefined : row.isOpenNow === 1,
      lat: row.lat ?? undefined,
      lng: row.lng ?? undefined,
      businessStatus: row.businessStatus ?? undefined,
    });
  }
  return result;
}

/**
 * Upsert multiple places into place_cache.
 */
export async function upsertPlaces(
  db: Database,
  places: GooglePlaceResult[],
  ttlSeconds: number,
): Promise<void> {
  if (places.length === 0) return;

  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + ttlSeconds;

  for (const place of places) {
    const photoRefs = (place.photos ?? []).map((p) => p.photo_reference);
    await db
      .insert(placeCache)
      .values({
        placeId: place.place_id,
        name: place.name,
        vicinity: place.vicinity,
        rating: place.rating ?? 0,
        userRatingsTotal: place.user_ratings_total ?? 0,
        priceLevel: place.price_level ?? -1,
        types: JSON.stringify(place.types ?? []),
        photoReferences: JSON.stringify(photoRefs),
        isOpenNow:
          place.opening_hours?.open_now == null
            ? null
            : place.opening_hours.open_now
              ? 1
              : 0,
        lat: place.geometry?.location.lat ?? null,
        lng: place.geometry?.location.lng ?? null,
        businessStatus: place.business_status ?? null,
        createdAt: now,
        expiresAt,
      })
      .onConflictDoUpdate({
        target: placeCache.placeId,
        set: {
          name: place.name,
          vicinity: place.vicinity,
          rating: place.rating ?? 0,
          userRatingsTotal: place.user_ratings_total ?? 0,
          priceLevel: place.price_level ?? -1,
          types: JSON.stringify(place.types ?? []),
          photoReferences: JSON.stringify(photoRefs),
          isOpenNow:
            place.opening_hours?.open_now == null
              ? null
              : place.opening_hours.open_now
                ? 1
                : 0,
          lat: place.geometry?.location.lat ?? null,
          lng: place.geometry?.location.lng ?? null,
          businessStatus: place.business_status ?? null,
          createdAt: now,
          expiresAt,
        },
      });
  }
}
```

Note: `GooglePlaceResult` needs to be imported from `../types`.

**Step 2: Update cache.test.ts**

Update TTL test values to match new values:

```typescript
it('has correct TTL values', () => {
  expect(CACHE_TTL.restaurant_search).toBe(172800); // 48h
  expect(CACHE_TTL.geocode_forward).toBe(604800); // 7d
  expect(CACHE_TTL.station_predictions).toBe(86400); // 24h
  expect(CACHE_TTL.nearby_stations).toBe(604800); // 7d (updated)
  expect(CACHE_TTL.geocode_reverse).toBe(86400); // 24h
  expect(CACHE_TTL.place_detail).toBe(1209600); // 14d (new)
});
```

Update the "longest TTL" and "shortest TTL" tests accordingly since `place_detail` is now the longest.

**Step 3: Run tests**

Run: `npx vitest run worker/src/services/cache.test.ts`
Expected: PASS

**Step 4: Commit**

```bash
git add worker/src/services/cache.ts worker/src/services/cache.test.ts
git commit -m "feat: add place_cache service functions and update TTLs"
```

---

### Task 3: Filter stations to train/subway only

**Files:**
- Modify: `worker/src/services/google-maps.ts`
- Modify: `worker/src/routes/stations.ts`
- Modify: `worker/src/services/google-maps.test.ts`

**Step 1: Update Autocomplete types**

In `worker/src/services/google-maps.ts`, change `getAutocompletePredictions` function's `types` parameter from:
```
'transit_station|train_station|airport|subway_station'
```
to:
```
'train_station|subway_station'
```

**Step 2: Add `type` parameter to `searchNearbyPlaces`**

In `worker/src/services/google-maps.ts`, add an optional `type` parameter to `searchNearbyPlaces`:

```typescript
export async function searchNearbyPlaces(
  apiKey: string,
  lat: number,
  lng: number,
  radius: number,
  keyword: string,
  type?: string,
): Promise<Result<GooglePlaceResult[]>> {
  const params = new URLSearchParams({
    location: `${lat},${lng}`,
    radius: String(radius),
    keyword,
    language: 'ja',
    key: apiKey,
  });
  if (type) {
    params.set('type', type);
  }
  // ... rest unchanged
```

**Step 3: Update stations route to use type filter**

In `worker/src/routes/stations.ts`, line 159, change:
```typescript
const result = await searchNearbyPlaces(apiKey, lat, lng, 5000, '駅');
```
to:
```typescript
const result = await searchNearbyPlaces(apiKey, lat, lng, 5000, '駅', 'train_station');
```

**Step 4: Update google-maps tests**

In `worker/src/services/google-maps.test.ts`, update the autocomplete test to verify the new types:

```typescript
const calledUrl = mockFetch.mock.calls[0][0] as string;
expect(calledUrl).toContain('autocomplete');
expect(calledUrl).toContain('train_station');
expect(calledUrl).not.toContain('airport');
```

Add a test for `searchNearbyPlaces` with type parameter:

```typescript
it('includes type parameter when provided', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ results: [], status: 'ZERO_RESULTS' }),
  });

  await searchNearbyPlaces('test-key', 35.68, 139.76, 5000, '駅', 'train_station');

  const calledUrl = mockFetch.mock.calls[0][0] as string;
  expect(calledUrl).toContain('type=train_station');
});
```

**Step 5: Run tests**

Run: `npx vitest run worker/src/services/google-maps.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add worker/src/services/google-maps.ts worker/src/routes/stations.ts worker/src/services/google-maps.test.ts
git commit -m "feat: filter station search to train/subway only"
```

---

### Task 4: Refactor restaurant search to use place_id cache

**Files:**
- Modify: `worker/src/types.ts` (add `stationPlaceId` to `RestaurantSearchRequest`)
- Modify: `worker/src/routes/restaurants.ts`

**Step 1: Add `stationPlaceId` to RestaurantSearchRequest**

In `worker/src/types.ts`, update:

```typescript
export interface RestaurantSearchRequest {
  keywords: string[];
  location: Location;
  radius: number;
  stationPlaceId: string; // new: for stable cache key
}
```

**Step 2: Rewrite restaurant search route**

Replace the handler in `worker/src/routes/restaurants.ts` with new logic that:

1. Validates `stationPlaceId` is present
2. Uses `stationPlaceId` in cache key: `${keyword}-${stationPlaceId}-${radius}`
3. On cache hit: reads place_id list from api_cache, then fetches details from place_cache
4. On cache miss: calls Google API, upserts into place_cache, saves place_id list to api_cache
5. Builds Restaurant objects from place_cache data + photo URL construction

Key changes to the route handler:

```typescript
import { getCache, setCache, getPlacesByIds, upsertPlaces, CACHE_TTL } from '../services/cache';

// In the handler:
const { keywords, location, radius, stationPlaceId } = body;

// Validate stationPlaceId
if (!stationPlaceId) {
  return c.json({ success: false, error: 'stationPlaceId is required' }, 400);
}

const pending = keywords.map(async (keyword) => {
  const cacheKey = `${keyword}-${stationPlaceId}-${radius}`;

  // Check search result cache (place_id list)
  const cachedPlaceIds = await getCache<string[]>(db, 'restaurant_search', cacheKey);

  if (cachedPlaceIds) {
    // Fetch details from place_cache
    const placeMap = await getPlacesByIds(db, cachedPlaceIds);
    return { keyword, placeMap, error: undefined };
  }

  // Cache miss - call Google Maps API
  const result = await searchNearbyPlaces(apiKey, location.lat, location.lng, radius, keyword);

  if (!result.ok) {
    return { keyword, placeMap: new Map(), error: result.error };
  }

  // Upsert each place into place_cache
  await upsertPlaces(db, result.data, CACHE_TTL.place_detail);

  // Save place_id list to api_cache
  const placeIds = result.data.map((p) => p.place_id);
  await setCache(db, 'restaurant_search', cacheKey, placeIds, CACHE_TTL.restaurant_search);

  // Build map from fresh data
  const placeMap = await getPlacesByIds(db, placeIds);
  return { keyword, placeMap, error: undefined };
});
```

Update `toRestaurant` to work from `PlaceCacheRow` instead of `GooglePlaceResult`:

```typescript
function toRestaurantFromCache(
  place: PlaceCacheRow,
  apiKey: string,
  keyword: string,
  searchLat: number,
  searchLng: number,
): Restaurant {
  const photoUrls = place.photoReferences.map((ref) => getPhotoUrl(apiKey, ref, 400));
  let distance: number | undefined;
  if (place.lat != null && place.lng != null) {
    distance = haversineDistance(searchLat, searchLng, place.lat, place.lng);
  }
  return {
    place_id: place.placeId,
    name: place.name,
    vicinity: place.vicinity,
    rating: place.rating,
    user_ratings_total: place.userRatingsTotal,
    price_level: place.priceLevel,
    types: place.types,
    photoUrls,
    searchKeywords: [keyword],
    isOpenNow: place.isOpenNow,
    distance,
    business_status: place.businessStatus,
  };
}
```

**Step 3: Run lint and typecheck**

Run: `npm run check`
Expected: PASS

**Step 4: Commit**

```bash
git add worker/src/types.ts worker/src/routes/restaurants.ts
git commit -m "feat: refactor restaurant search to use place_id cache with station-based cache keys"
```

---

### Task 5: Update frontend API to pass stationPlaceId

**Files:**
- Modify: `src/services/ApiService.ts`
- Modify: `src/composables/useRestaurantSearch/types.ts`
- Modify: `src/programs/searchRestaurants.ts`
- Modify: `src/composables/useRestaurantSearch.ts`

**Step 1: Update ApiService interface**

In `src/services/ApiService.ts`, update `searchRestaurants` param type:

```typescript
readonly searchRestaurants: (params: {
  keywords: string[];
  location: { lat: number; lng: number };
  radius: number;
  stationPlaceId: string;
}) => Effect.Effect<Restaurant[], PlaceSearchError>;
```

And in `ApiServiceLive`, update the `searchRestaurants` implementation to pass `stationPlaceId` through.

**Step 2: Update SearchParams type**

In `src/composables/useRestaurantSearch/types.ts`, change `searchLocation` to always be a `Station`:

```typescript
export interface SearchParams {
  keywords: string[];
  minRating: number;
  minReviews: number;
  searchLocation: Station; // was: Station | Location
  isOpenNow: boolean;
  searchRadius: number;
  selectedPriceLevels: number[];
}
```

Remove the `Location` type import if no longer needed elsewhere (check usages first).

**Step 3: Update searchRestaurantsProgram**

In `src/programs/searchRestaurants.ts`, the program now always receives a Station (with placeId). Simplify:

```typescript
export const searchRestaurantsProgram = (
  params: SearchParams,
): Effect.Effect<Restaurant[], PlaceSearchError | GeocodeError, ApiService> =>
  Effect.gen(function* () {
    const api = yield* ApiService;
    const { keywords, searchLocation, searchRadius } = params;

    // Geocode station to get coordinates
    const geocoded = yield* api.geocodeForward(
      `${searchLocation.name}駅,${searchLocation.prefecture}`,
    );

    return yield* api.searchRestaurants({
      keywords,
      location: { lat: geocoded.lat, lng: geocoded.lng },
      radius: searchRadius,
      stationPlaceId: searchLocation.placeId,
    });
  });
```

**Step 4: Update useRestaurantSearch hook**

In `src/composables/useRestaurantSearch.ts`, change the `searchNearbyRestaurants` parameter from `Station | Location` to `Station`:

```typescript
const searchNearbyRestaurants = useCallback(
  (
    keywords: string[],
    minRating: number,
    minReviews: number,
    searchLocation: Station, // was: Station | Location
    isOpenNow: boolean,
    searchRadius: number,
    selectedPriceLevels: number[],
  ) => {
    // ... rest unchanged
```

**Step 5: Run typecheck**

Run: `npm run typecheck`
Expected: PASS (may show errors in UnifiedSearchResultsScreen which is fixed in Task 6)

**Step 6: Commit**

```bash
git add src/services/ApiService.ts src/composables/useRestaurantSearch/types.ts src/programs/searchRestaurants.ts src/composables/useRestaurantSearch.ts
git commit -m "feat: pass stationPlaceId through frontend API for stable cache keys"
```

---

### Task 6: Refactor UI to station-only mode with auto-init

**Files:**
- Modify: `src/composables/useStationSearch.ts`
- Modify: `src/components/UnifiedSearchResultsScreen/index.tsx`

**Step 1: Add auto-init to useStationSearch**

Rewrite `src/composables/useStationSearch.ts` to:
1. On mount, call `searchNearbyStationsProgram()` (browser GPS -> find nearest stations)
2. Auto-select the first (nearest) station
3. Expose `isInitializing` state for the loading indicator

```typescript
import { useState, useEffect, useCallback, useRef } from 'react';
import { Effect } from 'effect';
import type { Station } from './useStationSearch/types';
import { searchStationsProgram } from '../programs/searchStations';
import { searchNearbyStationsProgram } from '../programs/searchNearbyStations';
import { extractFirstFailure } from '../utils/effectErrors';
import { AppLive } from '../services';
import { STATION_SEARCH_DEBOUNCE_MS } from '../constants';

const useStationSearch = () => {
  const [station, setStation] = useState('');
  const [stationCandidates, setStationCandidates] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const hasInitialized = useRef(false);

  // Auto-detect nearest station on mount
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const runnable = Effect.provide(searchNearbyStationsProgram(), AppLive);

    void Effect.runPromiseExit(runnable).then((exit) => {
      if (exit._tag === 'Success' && exit.value.length > 0) {
        const nearest = exit.value[0];
        setStation(nearest.name);
        setSelectedStation(nearest);
      } else {
        setInitError('最寄り駅を取得できませんでした。駅名を入力してください。');
      }
      setIsInitializing(false);
    });
  }, []);

  // Manual station search (text input)
  const handleStationInput = useCallback(
    (input: string) => {
      if (!input.trim() || (selectedStation && selectedStation.name === input)) {
        return;
      }

      const runnable = Effect.provide(searchStationsProgram(input), AppLive);

      void Effect.runPromiseExit(runnable).then((exit) => {
        if (exit._tag === 'Success') {
          setStationCandidates(exit.value);
        } else {
          const firstFailure = extractFirstFailure(exit.cause);
          if (firstFailure) {
            console.warn('駅検索エラー:', firstFailure);
          }
          setStationCandidates([]);
        }
      });
    },
    [selectedStation],
  );

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      handleStationInput(station);
    }, STATION_SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(debounceTimer);
  }, [station, handleStationInput]);

  const selectStation = (candidate: Station) => {
    setStation(candidate.name);
    setSelectedStation(candidate);
    setStationCandidates([]);
  };

  return {
    station,
    setStation,
    stationCandidates,
    selectedStation,
    selectStation,
    isInitializing,
    initError,
  };
};

export default useStationSearch;
```

**Step 2: Simplify UnifiedSearchResultsScreen**

In `src/components/UnifiedSearchResultsScreen/index.tsx`:

1. Remove `useLocationSearch` import and all usages
2. Remove `searchMethod` state and location/station toggle buttons
3. Remove `LocationSearch` component import
4. Always use station search
5. Remove `currentLocation` from the `useEffect` dependency for search trigger
6. Change `searchLocation` to always be `selectedStation`
7. Use `isInitializing` from useStationSearch for initial loading state

Key changes:
- Remove `searchMethod` state (line 89-91)
- Remove location/station toggle buttons (lines 226-247)
- Remove `LocationSearch` component rendering
- The search `useEffect` (line 131) watches `selectedStation` only (not `currentLocation`)
- `triggerSearch` uses `selectedStation` directly
- Show loading during `isInitializing`

**Step 3: Run lint and typecheck**

Run: `npm run check`
Expected: PASS

**Step 4: Commit**

```bash
git add src/composables/useStationSearch.ts src/components/UnifiedSearchResultsScreen/index.tsx
git commit -m "feat: station-only UI with auto nearest station detection"
```

---

### Task 7: Generate D1 migration and deploy

**Step 1: Generate migration**

Run: `npx drizzle-kit generate`
Expected: New migration file in `drizzle/` directory with CREATE TABLE place_cache

**Step 2: Apply migration to remote D1**

Run: `npx wrangler d1 migrations apply pekonavi-cache --remote`
Expected: Migration applied successfully

**Step 3: Run full check**

Run: `npm run check`
Expected: All lint, format, typecheck pass

**Step 4: Run all tests**

Run: `npx vitest run`
Expected: All tests pass

**Step 5: Build**

Run: `npm run build`
Expected: Build succeeds

**Step 6: Commit and deploy**

```bash
git add drizzle/
git commit -m "feat: add place_cache migration"
npx wrangler deploy
```

---

## Parallel Execution Groups

Tasks that can run in parallel:
- **Group A (Backend):** Tasks 1, 2, 3 (DB schema, cache service, station filter) - independent of each other
- **Group B (Backend):** Task 4 (restaurant route) - depends on Tasks 1, 2
- **Group C (Frontend):** Tasks 5, 6 (API + UI) - depends on Task 4
- **Group D (Deploy):** Task 7 - depends on all above
