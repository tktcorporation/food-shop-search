import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculateOperatingHours } from './operatingHours';

describe('calculateOperatingHours', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns false when weekdayText is undefined', () => {
    expect(calculateOperatingHours(undefined)).toBe(false);
  });

  it('returns false when weekdayText is empty', () => {
    expect(calculateOperatingHours([])).toBe(false);
  });

  it('returns false when today is not in the schedule', () => {
    // Wednesday 14:00
    vi.setSystemTime(new Date(2026, 0, 28, 14, 0));
    const schedule = ['Monday: 9:00 AM–5:00 PM'];
    expect(calculateOperatingHours(schedule)).toBe(false);
  });

  it('returns true when current time is within operating hours', () => {
    // Wednesday 14:00
    vi.setSystemTime(new Date(2026, 0, 28, 14, 0));
    const schedule = ['Wednesday: 9:00 AM–5:00 PM'];
    expect(calculateOperatingHours(schedule)).toBe(true);
  });

  it('returns false when current time is outside operating hours', () => {
    // Wednesday 20:00
    vi.setSystemTime(new Date(2026, 0, 28, 20, 0));
    const schedule = ['Wednesday: 9:00 AM–5:00 PM'];
    expect(calculateOperatingHours(schedule)).toBe(false);
  });

  it('returns false when the day is marked as closed', () => {
    // Wednesday 14:00
    vi.setSystemTime(new Date(2026, 0, 28, 14, 0));
    const schedule = ['Wednesday: Closed'];
    expect(calculateOperatingHours(schedule)).toBe(false);
  });

  it('handles overnight hours (e.g. 10:00 PM to 6:00 AM)', () => {
    // Wednesday 23:00 - should be within 22:00-6:00
    vi.setSystemTime(new Date(2026, 0, 28, 23, 0));
    const schedule = ['Wednesday: 10:00 PM–6:00 AM'];
    expect(calculateOperatingHours(schedule)).toBe(true);
  });

  it('handles overnight hours - early morning side', () => {
    // Wednesday 3:00 AM - should be within 22:00-6:00
    vi.setSystemTime(new Date(2026, 0, 28, 3, 0));
    const schedule = ['Wednesday: 10:00 PM–6:00 AM'];
    expect(calculateOperatingHours(schedule)).toBe(true);
  });

  it('handles overnight hours - outside range', () => {
    // Wednesday 12:00 PM - should NOT be within 22:00-6:00
    vi.setSystemTime(new Date(2026, 0, 28, 12, 0));
    const schedule = ['Wednesday: 10:00 PM–6:00 AM'];
    expect(calculateOperatingHours(schedule)).toBe(false);
  });

  it('handles multiple time ranges in a day', () => {
    // Wednesday 15:00 - should be within second range
    vi.setSystemTime(new Date(2026, 0, 28, 15, 0));
    const schedule = ['Wednesday: 11:00 AM–2:00 PM, 5:00 PM–10:00 PM'];
    // 15:00 is between 14:00 and 17:00, so should be false
    expect(calculateOperatingHours(schedule)).toBe(false);
  });

  it('handles multiple time ranges - within second range', () => {
    // Wednesday 18:00 - should be within second range
    vi.setSystemTime(new Date(2026, 0, 28, 18, 0));
    const schedule = ['Wednesday: 11:00 AM–2:00 PM, 5:00 PM–10:00 PM'];
    expect(calculateOperatingHours(schedule)).toBe(true);
  });

  it('handles 12:00 PM correctly (noon)', () => {
    // Wednesday 12:30
    vi.setSystemTime(new Date(2026, 0, 28, 12, 30));
    const schedule = ['Wednesday: 11:00 AM–2:00 PM'];
    expect(calculateOperatingHours(schedule)).toBe(true);
  });

  it('handles 12:00 AM correctly (midnight)', () => {
    // Wednesday 0:30 AM
    vi.setSystemTime(new Date(2026, 0, 28, 0, 30));
    const schedule = ['Wednesday: 10:00 PM–2:00 AM'];
    expect(calculateOperatingHours(schedule)).toBe(true);
  });
});
