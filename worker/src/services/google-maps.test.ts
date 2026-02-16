import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  searchNearbyPlaces,
  getAutocompletePredictions,
  geocodeForward,
  geocodeReverse,
  getPhotoUrl,
} from './google-maps';

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
  mockFetch.mockReset();
});

describe('searchNearbyPlaces', () => {
  it('returns ok result on OK status', async () => {
    const mockResults = [
      { place_id: 'p1', name: 'Restaurant A', vicinity: 'Tokyo' },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: mockResults, status: 'OK' }),
    });

    const result = await searchNearbyPlaces(
      'test-key',
      35.68,
      139.76,
      1000,
      'ramen',
    );
    expect(result).toEqual({ ok: true, data: mockResults });
    expect(mockFetch).toHaveBeenCalledOnce();

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('nearbysearch');
    expect(calledUrl).toContain('keyword=ramen');
    expect(calledUrl).toContain('key=test-key');
  });

  it('returns ok with empty array on ZERO_RESULTS', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [], status: 'ZERO_RESULTS' }),
    });

    const result = await searchNearbyPlaces(
      'test-key',
      35.68,
      139.76,
      1000,
      'ramen',
    );
    expect(result).toEqual({ ok: true, data: [] });
  });

  it('returns error on HTTP error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const result = await searchNearbyPlaces(
      'test-key',
      35.68,
      139.76,
      1000,
      'ramen',
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('request failed: 500');
    }
  });

  it('returns error on API error status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [], status: 'REQUEST_DENIED' }),
    });

    const result = await searchNearbyPlaces(
      'test-key',
      35.68,
      139.76,
      1000,
      'ramen',
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('REQUEST_DENIED');
    }
  });
});

describe('getAutocompletePredictions', () => {
  it('returns ok result on OK status', async () => {
    const mockPredictions = [
      {
        place_id: 'p1',
        description: '新宿駅',
        structured_formatting: {
          main_text: '新宿',
          secondary_text: '東京都',
        },
      },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        predictions: mockPredictions,
        status: 'OK',
      }),
    });

    const result = await getAutocompletePredictions('test-key', '新宿');
    expect(result).toEqual({ ok: true, data: mockPredictions });

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('autocomplete');
    expect(calledUrl).toContain('country%3Ajp');
  });
});

describe('geocodeForward', () => {
  it('returns ok result on OK status', async () => {
    const mockResults = [
      {
        formatted_address: '東京都新宿区',
        geometry: { location: { lat: 35.6896, lng: 139.7006 } },
      },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: mockResults, status: 'OK' }),
    });

    const result = await geocodeForward('test-key', '新宿駅');
    expect(result).toEqual({ ok: true, data: mockResults });
  });
});

describe('geocodeReverse', () => {
  it('returns ok result on OK status', async () => {
    const mockResults = [
      {
        formatted_address: '東京都千代田区丸の内',
        geometry: { location: { lat: 35.6812, lng: 139.7671 } },
      },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: mockResults, status: 'OK' }),
    });

    const result = await geocodeReverse('test-key', 35.6812, 139.7671);
    expect(result).toEqual({ ok: true, data: mockResults });

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('latlng=35.6812');
  });
});

describe('getPhotoUrl', () => {
  it('constructs a valid photo URL', () => {
    const url = getPhotoUrl('test-key', 'photo-ref-123', 400);
    expect(url).toContain('photo_reference=photo-ref-123');
    expect(url).toContain('maxwidth=400');
    expect(url).toContain('key=test-key');
    expect(url).toContain('maps.googleapis.com');
  });

  it('uses default maxWidth of 400', () => {
    const url = getPhotoUrl('test-key', 'photo-ref-123');
    expect(url).toContain('maxwidth=400');
  });
});
