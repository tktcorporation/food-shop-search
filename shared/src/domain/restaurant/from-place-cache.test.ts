import { describe, it, expect } from 'vitest';
import { Effect, Schema } from 'effect';
import { PhotoCdnUrl } from '../../schema/photo';
import {
  restaurantFromPlaceCache,
  mergeRestaurantKeyword,
  withRestaurantPhotos,
} from './from-place-cache';

describe('PhotoCdnUrl', () => {
  it('accepts key-free https CDN URLs', async () => {
    const url = 'https://lh3.googleusercontent.com/places/abc';
    const result = await Effect.runPromise(
      Schema.decodeUnknown(PhotoCdnUrl)(url),
    );
    expect(result).toBe(url);
  });

  it('rejects Place Photo API URLs', async () => {
    const exit = await Effect.runPromiseExit(
      Schema.decodeUnknown(PhotoCdnUrl)(
        'https://maps.googleapis.com/maps/api/place/photo?key=secret&photo_reference=x',
      ),
    );
    expect(exit._tag).toBe('Failure');
  });

  it('rejects URLs that embed an API key', async () => {
    const exit = await Effect.runPromiseExit(
      Schema.decodeUnknown(PhotoCdnUrl)(
        'https://lh3.googleusercontent.com/p/abc?key=leaked',
      ),
    );
    expect(exit._tag).toBe('Failure');
  });
});

describe('restaurantFromPlaceCache', () => {
  const place = {
    placeId: 'p1',
    name: 'Test Ramen',
    vicinity: 'Tokyo',
    rating: 4.2,
    userRatingsTotal: 100,
    priceLevel: 2,
    types: ['restaurant'],
    isOpenNow: true,
    lat: 35.68,
    lng: 139.76,
    businessStatus: 'OPERATIONAL',
  };

  it('maps place cache fields to Restaurant domain', () => {
    const restaurant = restaurantFromPlaceCache(
      place,
      'ラーメン',
      35.68,
      139.76,
    );
    expect(restaurant.place_id).toBe('p1');
    expect(restaurant.searchKeywords).toEqual(['ラーメン']);
    expect(restaurant.photoUrls).toEqual([]);
    expect(restaurant.distance).toBeDefined();
  });

  it('merges keywords without duplicating', () => {
    const base = restaurantFromPlaceCache(place, 'ラーメン', 35.68, 139.76);
    const merged = mergeRestaurantKeyword(base, 'ランチ');
    const again = mergeRestaurantKeyword(merged, 'ラーメン');
    expect(again.searchKeywords).toEqual(['ラーメン', 'ランチ']);
  });

  it('attaches parsed photo URLs', () => {
    const base = restaurantFromPlaceCache(place, 'ラーメン', 35.68, 139.76);
    const withPhotos = withRestaurantPhotos(base, [
      'https://lh3.googleusercontent.com/places/abc',
    ]);
    expect(withPhotos.photoUrls).toHaveLength(1);
  });
});
