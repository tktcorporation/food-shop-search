import { describe, it, expect } from 'vitest';
import { Effect, Schema } from 'effect';
import {
  GoogleNearbySearchResponse,
  GoogleAutocompleteResponse,
  GoogleGeocodeResponse,
  GooglePlaceResult,
} from './google';
import { StringArrayJson } from './cache';

describe('GoogleNearbySearchResponse Schema', () => {
  it('decodes a valid Nearby Search payload', async () => {
    const decoded = await Effect.runPromise(
      Schema.decodeUnknown(GoogleNearbySearchResponse)({
        status: 'OK',
        results: [
          {
            place_id: 'p1',
            name: 'ラーメン屋',
            vicinity: '東京都',
            rating: 4.2,
          },
        ],
        next_page_token: 'token',
      }),
    );
    expect(decoded.status).toBe('OK');
    expect(decoded.results[0].place_id).toBe('p1');
    expect(decoded.next_page_token).toBe('token');
  });

  it('rejects missing place_id', async () => {
    const exit = await Effect.runPromiseExit(
      Schema.decodeUnknown(GoogleNearbySearchResponse)({
        status: 'OK',
        results: [{ name: 'no-id' }],
      }),
    );
    expect(exit._tag).toBe('Failure');
  });

  it('allows missing vicinity (Text Search style)', async () => {
    const place = await Effect.runPromise(
      Schema.decodeUnknown(GooglePlaceResult)({
        place_id: 'p2',
        name: '新宿駅',
        formatted_address: '東京都新宿区',
      }),
    );
    expect(place.vicinity).toBeUndefined();
    expect(place.formatted_address).toBe('東京都新宿区');
  });
});

describe('GoogleAutocompleteResponse Schema', () => {
  it('decodes predictions with optional secondary_text', async () => {
    const decoded = await Effect.runPromise(
      Schema.decodeUnknown(GoogleAutocompleteResponse)({
        status: 'OK',
        predictions: [
          {
            place_id: 'a1',
            description: '新宿駅',
            structured_formatting: { main_text: '新宿駅' },
          },
        ],
      }),
    );
    expect(decoded.predictions[0].structured_formatting.main_text).toBe(
      '新宿駅',
    );
  });
});

describe('GoogleGeocodeResponse Schema', () => {
  it('decodes geocode results', async () => {
    const decoded = await Effect.runPromise(
      Schema.decodeUnknown(GoogleGeocodeResponse)({
        status: 'OK',
        results: [
          {
            formatted_address: '東京都千代田区',
            geometry: { location: { lat: 35.68, lng: 139.76 } },
          },
        ],
      }),
    );
    expect(decoded.results[0].geometry.location.lat).toBe(35.68);
  });
});

describe('StringArrayJson Schema', () => {
  it('parses JSON array strings', () => {
    expect(Schema.decodeUnknownSync(StringArrayJson)('["a","b"]')).toEqual([
      'a',
      'b',
    ]);
  });

  it('rejects invalid JSON', () => {
    expect(() =>
      Schema.decodeUnknownSync(StringArrayJson)('not-json'),
    ).toThrow();
  });
});
