import { describe, it, expect, vi } from 'vitest';
import { filterRestaurants, sortByDistance } from './utils';
import type { Restaurant } from './types';

// calculateOperatingHours をモックして時間依存を排除
vi.mock('../../utils/operatingHours', () => ({
  calculateOperatingHours: vi.fn(() => true),
}));

const makeRestaurant = (overrides: Partial<Restaurant> = {}): Restaurant => ({
  place_id: 'test-id',
  name: 'Test Restaurant',
  vicinity: 'Test Address',
  rating: 4.0,
  user_ratings_total: 200,
  price_level: 2,
  types: ['restaurant'],
  searchKeywords: ['テスト'],
  ...overrides,
});

const defaultFilters = {
  minRating: 3.5,
  minReviews: 100,
  isOpenNow: false,
  searchRadius: 500,
  selectedPriceLevels: [1, 2, 3, 4],
};

describe('filterRestaurants', () => {
  it('returns restaurants matching all criteria', () => {
    const restaurants = [makeRestaurant()];
    const result = filterRestaurants(restaurants, defaultFilters);
    expect(result).toHaveLength(1);
  });

  it('filters out restaurants below minimum rating', () => {
    const restaurants = [makeRestaurant({ rating: 2.0 })];
    const result = filterRestaurants(restaurants, defaultFilters);
    expect(result).toHaveLength(0);
  });

  it('filters out restaurants below minimum reviews', () => {
    const restaurants = [makeRestaurant({ user_ratings_total: 50 })];
    const result = filterRestaurants(restaurants, defaultFilters);
    expect(result).toHaveLength(0);
  });

  it('filters out restaurants with non-selected price levels', () => {
    const restaurants = [makeRestaurant({ price_level: 4 })];
    const result = filterRestaurants(restaurants, {
      ...defaultFilters,
      selectedPriceLevels: [1, 2],
    });
    expect(result).toHaveLength(0);
  });

  it('filters out non-OPERATIONAL restaurants', () => {
    const restaurants = [
      makeRestaurant({ business_status: 'CLOSED_PERMANENTLY' }),
    ];
    const result = filterRestaurants(restaurants, defaultFilters);
    expect(result).toHaveLength(0);
  });

  it('includes restaurants with undefined business_status', () => {
    const restaurants = [makeRestaurant({ business_status: undefined })];
    const result = filterRestaurants(restaurants, defaultFilters);
    expect(result).toHaveLength(1);
  });

  it('filters by distance when searchRadius <= 100', () => {
    const restaurants = [
      makeRestaurant({ distance: 50 }),
      makeRestaurant({ place_id: 'far', distance: 200 }),
    ];
    const result = filterRestaurants(restaurants, {
      ...defaultFilters,
      searchRadius: 100,
    });
    expect(result).toHaveLength(1);
    expect(result[0].distance).toBe(50);
  });

  it('does not filter by distance when searchRadius > 100', () => {
    const restaurants = [makeRestaurant({ distance: 200 })];
    const result = filterRestaurants(restaurants, {
      ...defaultFilters,
      searchRadius: 500,
    });
    expect(result).toHaveLength(1);
  });

  it('handles isOpenNow filter', async () => {
    const { calculateOperatingHours } =
      await import('../../utils/operatingHours');
    const mockedCalc = vi.mocked(calculateOperatingHours);

    // Closed restaurant
    mockedCalc.mockReturnValueOnce(false);
    const restaurants = [makeRestaurant()];
    const result = filterRestaurants(restaurants, {
      ...defaultFilters,
      isOpenNow: true,
    });
    expect(result).toHaveLength(0);
  });
});

describe('sortByDistance', () => {
  it('sorts restaurants by distance ascending', () => {
    const restaurants = [
      makeRestaurant({ place_id: 'far', distance: 500 }),
      makeRestaurant({ place_id: 'near', distance: 100 }),
      makeRestaurant({ place_id: 'mid', distance: 300 }),
    ];
    const result = sortByDistance(restaurants);
    expect(result.map((r) => r.place_id)).toEqual(['near', 'mid', 'far']);
  });

  it('puts restaurants without distance at the end', () => {
    const restaurants = [
      makeRestaurant({ place_id: 'no-dist', distance: undefined }),
      makeRestaurant({ place_id: 'near', distance: 100 }),
    ];
    const result = sortByDistance(restaurants);
    expect(result.map((r) => r.place_id)).toEqual(['near', 'no-dist']);
  });

  it('does not mutate the original array', () => {
    const restaurants = [
      makeRestaurant({ place_id: 'b', distance: 500 }),
      makeRestaurant({ place_id: 'a', distance: 100 }),
    ];
    const result = sortByDistance(restaurants);
    expect(result).not.toBe(restaurants);
    expect(restaurants[0].place_id).toBe('b');
  });

  it('handles all undefined distances', () => {
    const restaurants = [
      makeRestaurant({ place_id: 'a', distance: undefined }),
      makeRestaurant({ place_id: 'b', distance: undefined }),
    ];
    const result = sortByDistance(restaurants);
    expect(result).toHaveLength(2);
  });
});
