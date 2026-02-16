# Station-Only Search & Aggressive Cache Design

## Summary

Simplify search to station-only mode (removing current-location search) and add place_id-level caching to minimize Google Maps API calls.

## Goals

1. Search is always station-based; default to nearest train station on startup
2. Station search results limited to train/subway stations only (no airports, bus stops, convenience stores)
3. Cache restaurant data at place_id level so the same restaurant is never re-fetched across different keyword searches
4. Normalize cache keys by station place_id (not raw GPS) for stable cache hits

## Non-Goals

- Removing current-location code entirely (keep disabled for future use)
- Places API (New) migration (separate effort)
- Offline support

## Search Flow

```
App startup
  -> Browser GPS
  -> Worker: searchNearbyPlaces(lat, lng, 5000, type=train_station)
  -> Return top 5 nearest train/subway stations
  -> Auto-select #1, auto-trigger restaurant search
```

Manual flow: user types station name -> Autocomplete (types: train_station|subway_station) -> select -> search.

## UI Changes

- Remove location/station toggle from UnifiedSearchResultsScreen
- Always show station search UI
- On mount: get GPS -> find nearest stations -> auto-select first -> search
- useLocationSearch remains in codebase but unused by UI

## Station Filtering

### Autocomplete (text search)
- Change types from `transit_station|train_station|airport|subway_station` to `train_station|subway_station`

### NearbySearch (proximity search)
- Add `type=train_station` parameter alongside keyword "駅"
- Filter results to only include places with train_station or subway_station in their types

## Cache Architecture

### Existing table: `api_cache`
No schema change. Stores search result lists (place_id arrays instead of full restaurant data).

### New table: `place_cache`

```sql
CREATE TABLE place_cache (
  place_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  vicinity TEXT NOT NULL,
  rating REAL DEFAULT 0,
  user_ratings_total INTEGER DEFAULT 0,
  price_level INTEGER DEFAULT -1,
  types TEXT NOT NULL,
  photo_references TEXT NOT NULL,
  is_open_now INTEGER,
  lat REAL,
  lng REAL,
  business_status TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  expires_at INTEGER NOT NULL
);
CREATE INDEX idx_place_expires ON place_cache (expires_at);
```

### Cache Flow (restaurant search)

1. Build cache key: `{keyword}-{stationPlaceId}-{radius}`
2. Check api_cache for this key
   - HIT: get place_id list -> fetch each from place_cache -> return
   - MISS: call Google Nearby Search API
3. On API response:
   - Upsert each restaurant into place_cache (by place_id)
   - Save place_id list + station coordinate to api_cache
4. Build Restaurant objects from place_cache data and return

### Cache Key Normalization

Old: `ラーメン-35.6812362-139.7671248-1000` (GPS-based, unstable)
New: `ラーメン-ChIJ...stationPlaceId-1000` (station place_id, stable)

### TTL

| Data | TTL | Reason |
|------|-----|--------|
| place_cache (restaurant info) | 14 days | Name, address, photos rarely change |
| api_cache (search result lists) | 48 hours | Allow new restaurants to surface |
| nearby_stations | 7 days | Stations don't move |
| station_predictions | 24 hours | Low volatility |

## Files to Change

### Worker (backend)
- `worker/src/db/schema.ts` — add place_cache table
- `worker/src/services/cache.ts` — add getPlacesByIds / upsertPlaces functions
- `worker/src/routes/restaurants.ts` — use place_id cache, normalize cache key by station
- `worker/src/routes/stations.ts` — filter to train_station|subway_station
- `worker/src/services/google-maps.ts` — add type param to searchNearbyPlaces
- `drizzle/` — new migration

### Frontend
- `src/components/UnifiedSearchResultsScreen/index.tsx` — remove location/station toggle, auto-select nearest station
- `src/composables/useStationSearch.ts` — add auto-init with nearest station
- `src/programs/searchRestaurants.ts` — pass station placeId for cache key normalization
- `src/services/ApiService.ts` — add stationPlaceId to search params

## Risk

- D1 migration on production (low risk, additive only)
- place_cache staleness for opening hours (mitigated: isOpenNow is best-effort, TTL 14d acceptable since opening_hours from NearbySearch is approximate anyway)
