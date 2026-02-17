import { describe, it, expect } from 'vitest';
import { isStation } from './station-filter';

describe('isStation', () => {
  it('returns true for train_station', () => {
    expect(isStation(['train_station', 'point_of_interest'])).toBe(true);
  });

  it('returns true for subway_station', () => {
    expect(isStation(['subway_station', 'transit_station'])).toBe(true);
  });

  it('returns true for transit_station', () => {
    expect(isStation(['transit_station', 'point_of_interest'])).toBe(true);
  });

  it('returns false for non-station types', () => {
    expect(isStation(['parking', 'point_of_interest'])).toBe(false);
  });

  it('returns false for convenience_store', () => {
    expect(isStation(['convenience_store', 'establishment'])).toBe(false);
  });

  it('returns false for empty array', () => {
    expect(isStation([])).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isStation(undefined)).toBe(false);
  });

  it('returns true when station type is among many types', () => {
    expect(
      isStation([
        'point_of_interest',
        'establishment',
        'train_station',
        'transit_station',
      ]),
    ).toBe(true);
  });
});
