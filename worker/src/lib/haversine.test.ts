import { describe, it, expect } from 'vitest';
import { haversineDistance } from './haversine';

describe('haversineDistance', () => {
  it('returns 0 for the same point', () => {
    const distance = haversineDistance(35.6812, 139.7671, 35.6812, 139.7671);
    expect(distance).toBe(0);
  });

  it('calculates distance between Tokyo Station and Shibuya Station', () => {
    // Tokyo Station: 35.6812, 139.7671
    // Shibuya Station: 35.6580, 139.7016
    const distance = haversineDistance(35.6812, 139.7671, 35.658, 139.7016);
    // Expected: ~6.4km
    expect(distance).toBeGreaterThan(6000);
    expect(distance).toBeLessThan(7000);
  });

  it('calculates distance between Shinjuku and Ikebukuro stations', () => {
    // Shinjuku: 35.6896, 139.7006
    // Ikebukuro: 35.7295, 139.7109
    const distance = haversineDistance(35.6896, 139.7006, 35.7295, 139.7109);
    // Expected: ~4.5km
    expect(distance).toBeGreaterThan(4000);
    expect(distance).toBeLessThan(5000);
  });

  it('calculates short distances accurately', () => {
    // Two points ~100m apart
    const distance = haversineDistance(35.6812, 139.7671, 35.6821, 139.7671);
    expect(distance).toBeGreaterThan(90);
    expect(distance).toBeLessThan(110);
  });

  it('is symmetric', () => {
    const d1 = haversineDistance(35.6812, 139.7671, 35.658, 139.7016);
    const d2 = haversineDistance(35.658, 139.7016, 35.6812, 139.7671);
    expect(d1).toBeCloseTo(d2, 5);
  });

  it('handles negative coordinates', () => {
    // Sydney: -33.8688, 151.2093
    // Melbourne: -37.8136, 144.9631
    const distance = haversineDistance(-33.8688, 151.2093, -37.8136, 144.9631);
    // Expected: ~714km
    expect(distance).toBeGreaterThan(700000);
    expect(distance).toBeLessThan(730000);
  });
});
