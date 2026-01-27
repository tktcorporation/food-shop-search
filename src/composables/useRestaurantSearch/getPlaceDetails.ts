import { Effect, Option, pipe } from 'effect';
import type { Restaurant } from './types';
import type { GoogleMapsPlacesService } from '../../services/GoogleMapsPlacesService';
import type { CacheService } from '../../services/CacheService';
import type { GoogleMapsAuthError, PlaceDetailsError } from '../../errors';
import { CACHE_CONFIGS } from '../../utils/cacheManager';

const DETAILS_FIELDS = [
  'place_id',
  'name',
  'vicinity',
  'rating',
  'user_ratings_total',
  'price_level',
  'types',
  'opening_hours',
  'photos',
  'geometry',
  'business_status',
] as const;

const placeResultToRestaurant = (
  result: google.maps.places.PlaceResult,
  location: google.maps.LatLng,
  searchKeywords: string[],
): Restaurant => {
  let distance: number | undefined;
  if (result.geometry?.location) {
    distance = google.maps.geometry.spherical.computeDistanceBetween(
      location,
      result.geometry.location,
    );
  }

  return {
    place_id: result.place_id!,
    name: result.name!,
    vicinity: result.vicinity!,
    rating: result.rating || 0,
    user_ratings_total: result.user_ratings_total || 0,
    price_level: result.price_level || 1,
    types: result.types || [],
    photos: result.photos,
    searchKeywords,
    opening_hours: result.opening_hours
      ? { weekday_text: result.opening_hours.weekday_text }
      : undefined,
    distance,
    geometry: result.geometry?.location
      ? { location: result.geometry.location }
      : undefined,
    business_status: result.business_status,
  };
};

const fallbackRestaurant = (
  place: google.maps.places.PlaceResult & { searchKeywords: string[] },
): Restaurant => ({
  place_id: place.place_id!,
  name: place.name!,
  vicinity: place.vicinity!,
  rating: place.rating || 0,
  user_ratings_total: place.user_ratings_total || 0,
  price_level: place.price_level || 1,
  types: place.types || [],
  searchKeywords: place.searchKeywords,
  opening_hours: undefined,
  business_status: place.business_status,
});

/**
 * 場所の詳細情報を取得する Effect プログラム。
 * キャッシュがあればそれを返し、なければ Google Maps API を呼び出す。
 * API エラー時はフォールバックとして部分的なデータを返す。
 */
export const getPlaceDetailsEffect = (
  placesService: GoogleMapsPlacesService,
  cacheService: CacheService,
  place: google.maps.places.PlaceResult & { searchKeywords: string[] },
  location: google.maps.LatLng,
): Effect.Effect<Restaurant | null, GoogleMapsAuthError | PlaceDetailsError> =>
  Effect.gen(function* () {
    const cached = yield* cacheService.get<Restaurant>(
      CACHE_CONFIGS.RESTAURANT_DETAILS,
      place.place_id!,
    );

    if (Option.isSome(cached)) {
      return { ...cached.value, searchKeywords: place.searchKeywords };
    }

    const result = yield* pipe(
      placesService.getDetails({
        placeId: place.place_id!,
        fields: [...DETAILS_FIELDS],
      }),
      Effect.catchTag('PlaceDetailsError', () => Effect.succeed(null)),
    );

    if (!result) {
      return fallbackRestaurant(place);
    }

    if (result.business_status && result.business_status !== 'OPERATIONAL') {
      return null;
    }

    const restaurantData = placeResultToRestaurant(
      result,
      location,
      place.searchKeywords,
    );

    yield* cacheService.set(
      CACHE_CONFIGS.RESTAURANT_DETAILS,
      result.place_id!,
      restaurantData,
    );

    return restaurantData;
  });
