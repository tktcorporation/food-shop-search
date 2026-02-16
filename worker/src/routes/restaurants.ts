import { Hono } from 'hono';
import { createDb } from '../db';
import { getCache, setCache, CACHE_TTL } from '../services/cache';
import { searchNearbyPlaces, getPhotoUrl } from '../services/google-maps';
import { haversineDistance } from '../lib/haversine';
import type {
  RestaurantSearchRequest,
  Restaurant,
  GooglePlaceResult,
} from '../types';

type Bindings = {
  DB: D1Database;
  GOOGLE_MAPS_API_KEY: string;
};

export const restaurantRoutes = new Hono<{ Bindings: Bindings }>();

/**
 * Convert a Google Place result to our Restaurant type.
 */
function toRestaurant(
  place: GooglePlaceResult,
  apiKey: string,
  keyword: string,
  searchLat: number,
  searchLng: number,
): Restaurant {
  const photoUrls = (place.photos ?? []).map((photo) =>
    getPhotoUrl(apiKey, photo.photo_reference, 400),
  );

  let distance: number | undefined;
  if (place.geometry?.location) {
    distance = haversineDistance(
      searchLat,
      searchLng,
      place.geometry.location.lat,
      place.geometry.location.lng,
    );
  }

  return {
    place_id: place.place_id,
    name: place.name,
    vicinity: place.vicinity,
    rating: place.rating ?? 0,
    user_ratings_total: place.user_ratings_total ?? 0,
    price_level: place.price_level ?? -1,
    types: place.types ?? [],
    photoUrls,
    searchKeywords: [keyword],
    isOpenNow: place.opening_hours?.open_now,
    distance,
    business_status: place.business_status,
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

  const db = createDb(c.env.DB);
  const apiKey = c.env.GOOGLE_MAPS_API_KEY;
  const { keywords, location, radius } = body;

  // Start all keyword fetches in parallel, then await sequentially
  const pending = keywords.map(async (keyword) => {
    const cacheKey = `${keyword}-${location.lat}-${location.lng}-${radius}`;

    // Check cache first
    const cached = await getCache<GooglePlaceResult[]>(
      db,
      'restaurant_search',
      cacheKey,
    );

    if (cached) {
      return { keyword, places: cached, error: undefined };
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
        places: [] as GooglePlaceResult[],
        error: result.error,
      };
    }

    // Store in cache
    await setCache(
      db,
      'restaurant_search',
      cacheKey,
      result.data,
      CACHE_TTL.restaurant_search,
    );

    return { keyword, places: result.data, error: undefined };
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

  for (const { keyword, places } of keywordResults) {
    for (const place of places) {
      const existing = restaurantMap.get(place.place_id);
      if (existing) {
        // Merge search keywords
        if (!existing.searchKeywords.includes(keyword)) {
          existing.searchKeywords.push(keyword);
        }
      } else {
        restaurantMap.set(
          place.place_id,
          toRestaurant(place, apiKey, keyword, location.lat, location.lng),
        );
      }
    }
  }

  const restaurants = Array.from(restaurantMap.values());

  return c.json({ success: true, data: restaurants });
});
