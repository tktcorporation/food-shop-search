import { Hono } from 'hono';
import { createDb } from '../db';
import {
  getCache,
  setCache,
  getPlacesByIds,
  upsertPlaces,
  CACHE_TTL,
  type PlaceCacheRow,
} from '../services/cache';
import { searchNearbyPlaces, getPhotoUrl } from '../services/google-maps';
import { haversineDistance } from '../lib/haversine';
import type { RestaurantSearchRequest, Restaurant } from '../types';

type Bindings = {
  DB: D1Database;
  GOOGLE_MAPS_API_KEY: string;
};

export const restaurantRoutes = new Hono<{ Bindings: Bindings }>();

/**
 * Convert a PlaceCacheRow to our Restaurant type.
 */
function toRestaurantFromCache(
  place: PlaceCacheRow,
  apiKey: string,
  keyword: string,
  searchLat: number,
  searchLng: number,
): Restaurant {
  const photoUrls = place.photoReferences.map((ref) =>
    getPhotoUrl(apiKey, ref, 400),
  );

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

restaurantRoutes.post('/restaurants/search', async (c) => {
  const body = await c.req.json<RestaurantSearchRequest>();

  if (
    !body.keywords ||
    !Array.isArray(body.keywords) ||
    body.keywords.length === 0
  ) {
    return c.json(
      { success: false, error: 'keywords must be a non-empty array' },
      400,
    );
  }

  if (
    !body.location ||
    body.location.lat == null ||
    body.location.lng == null
  ) {
    return c.json(
      { success: false, error: 'location with lat and lng is required' },
      400,
    );
  }

  if (!body.radius || body.radius <= 0) {
    return c.json(
      { success: false, error: 'radius must be a positive number' },
      400,
    );
  }

  if (!body.stationPlaceId) {
    return c.json({ success: false, error: 'stationPlaceId is required' }, 400);
  }

  const db = createDb(c.env.DB);
  const apiKey = c.env.GOOGLE_MAPS_API_KEY;
  const { keywords, location, radius, stationPlaceId } = body;

  // Start all keyword fetches in parallel
  const pending = keywords.map(async (keyword) => {
    const cacheKey = `${keyword}-${stationPlaceId}-${radius}`;

    // Check search result cache (place_id list)
    const cachedPlaceIds = await getCache<string[]>(
      db,
      'restaurant_search',
      cacheKey,
    );

    if (cachedPlaceIds) {
      // Fetch details from place_cache
      const placeMap = await getPlacesByIds(db, cachedPlaceIds);
      return { keyword, placeMap, error: undefined };
    }

    // Cache miss - call Google Maps API
    const result = await searchNearbyPlaces(
      apiKey,
      location.lat,
      location.lng,
      radius,
      keyword,
    );

    if (!result.ok) {
      return {
        keyword,
        placeMap: new Map<string, PlaceCacheRow>(),
        error: result.error,
      };
    }

    // Upsert each place into place_cache
    await upsertPlaces(db, result.data);

    // Save place_id list to api_cache
    const placeIds = result.data.map((p) => p.place_id);
    await setCache(
      db,
      'restaurant_search',
      cacheKey,
      placeIds,
      CACHE_TTL.restaurant_search,
    );

    // Build map from fresh data
    const placeMap = await getPlacesByIds(db, placeIds);
    return { keyword, placeMap, error: undefined };
  });

  const keywordResults = [];
  for (const p of pending) {
    const result = await p;
    if (result.error) {
      return c.json({ success: false, error: result.error }, 500);
    }
    keywordResults.push(result);
  }

  // Combine and deduplicate results by place_id
  const restaurantMap = new Map<string, Restaurant>();

  for (const { keyword, placeMap } of keywordResults) {
    for (const [placeId, place] of placeMap) {
      const existing = restaurantMap.get(placeId);
      if (existing) {
        // Merge search keywords
        if (!existing.searchKeywords.includes(keyword)) {
          existing.searchKeywords.push(keyword);
        }
      } else {
        restaurantMap.set(
          placeId,
          toRestaurantFromCache(
            place,
            apiKey,
            keyword,
            location.lat,
            location.lng,
          ),
        );
      }
    }
  }

  const restaurants = Array.from(restaurantMap.values());

  return c.json({ success: true, data: restaurants });
});
