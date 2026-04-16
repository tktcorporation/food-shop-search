import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Effect } from 'effect';
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
  it('returns results on OK status', async () => {
    const mockResults = [
      { place_id: 'p1', name: 'Restaurant A', vicinity: 'Tokyo' },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: mockResults, status: 'OK' }),
    });

    const result = await Effect.runPromise(
      searchNearbyPlaces('test-key', 35.68, 139.76, 1000, 'ramen'),
    );
    expect(result).toEqual(mockResults);
    expect(mockFetch).toHaveBeenCalledOnce();

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('nearbysearch');
    expect(calledUrl).toContain('keyword=ramen');
    expect(calledUrl).toContain('key=test-key');
  });

  it('returns empty array on ZERO_RESULTS', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [], status: 'ZERO_RESULTS' }),
    });

    const result = await Effect.runPromise(
      searchNearbyPlaces('test-key', 35.68, 139.76, 1000, 'ramen'),
    );
    expect(result).toEqual([]);
  });

  it('fails on HTTP error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const exit = await Effect.runPromiseExit(
      searchNearbyPlaces('test-key', 35.68, 139.76, 1000, 'ramen'),
    );
    expect(exit._tag).toBe('Failure');
  });

  it('fails on API error status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [], status: 'REQUEST_DENIED' }),
    });

    const exit = await Effect.runPromiseExit(
      searchNearbyPlaces('test-key', 35.68, 139.76, 1000, 'ramen'),
    );
    expect(exit._tag).toBe('Failure');
  });

  it('includes type parameter when provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [], status: 'ZERO_RESULTS' }),
    });

    await Effect.runPromise(
      searchNearbyPlaces(
        'test-key',
        35.68,
        139.76,
        5000,
        '駅',
        'train_station',
      ),
    );

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('type=train_station');
  });

  it('does not include type parameter when not provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [], status: 'ZERO_RESULTS' }),
    });

    await Effect.runPromise(
      searchNearbyPlaces('test-key', 35.68, 139.76, 1000, 'ramen'),
    );

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).not.toContain('type=');
  });

  it('fetches multiple pages when next_page_token is present', async () => {
    const page1Results = [{ place_id: 'p1', name: 'A', vicinity: 'Tokyo' }];
    const page2Results = [{ place_id: 'p2', name: 'B', vicinity: 'Tokyo' }];

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: page1Results,
          status: 'OK',
          next_page_token: 'token123',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: page2Results,
          status: 'OK',
        }),
      });

    const result = await Effect.runPromise(
      searchNearbyPlaces('test-key', 35.68, 139.76, 1000, 'ramen'),
    );
    expect(result).toEqual([...page1Results, ...page2Results]);
    expect(mockFetch).toHaveBeenCalledTimes(2);

    const secondUrl = mockFetch.mock.calls[1][0] as string;
    expect(secondUrl).toContain('pagetoken=token123');
  });
});

describe('getAutocompletePredictions', () => {
  it('returns predictions on OK status', async () => {
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

    const result = await Effect.runPromise(
      getAutocompletePredictions('test-key', '新宿'),
    );
    expect(result).toEqual(mockPredictions);

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('autocomplete');
    expect(calledUrl).toContain('country%3Ajp');
    expect(calledUrl).toContain('transit_station');
    expect(calledUrl).not.toContain('airport');
  });
});

describe('geocodeForward', () => {
  it('returns results on OK status', async () => {
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

    const result = await Effect.runPromise(
      geocodeForward('test-key', '新宿駅'),
    );
    expect(result).toEqual(mockResults);
  });
});

describe('geocodeReverse', () => {
  it('returns results on OK status', async () => {
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

    const result = await Effect.runPromise(
      geocodeReverse('test-key', 35.6812, 139.7671),
    );
    expect(result).toEqual(mockResults);

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
