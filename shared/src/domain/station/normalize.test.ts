import { describe, it, expect } from 'vitest';
import { Effect, Schema } from 'effect';
import {
  normalizeStationInput,
  ensureStationSuffix,
  extractPrefecture,
} from './normalize';
import {
  stationFromPrediction,
  stationFromPlace,
  mergeStationsByPlaceId,
} from './from-google';
import {
  RestaurantSearchRequest,
  decodeBody,
  formatParseError,
} from '../../index';

describe('normalizeStationInput', () => {
  it('strips trailing 駅', () => {
    expect(normalizeStationInput('新宿駅')).toBe('新宿');
  });

  it('trims whitespace', () => {
    expect(normalizeStationInput('  渋谷  ')).toBe('渋谷');
  });
});

describe('ensureStationSuffix', () => {
  it('appends 駅 when missing', () => {
    expect(ensureStationSuffix('新宿')).toBe('新宿駅');
  });

  it('keeps existing 駅', () => {
    expect(ensureStationSuffix('新宿駅')).toBe('新宿駅');
  });
});

describe('extractPrefecture', () => {
  it('extracts 東京都', () => {
    expect(extractPrefecture('東京都渋谷区')).toBe('東京都');
  });

  it('returns empty when missing', () => {
    expect(extractPrefecture('渋谷区道玄坂')).toBe('');
  });
});

describe('station mapping', () => {
  it('maps autocomplete prediction', () => {
    const station = stationFromPrediction({
      place_id: 'p1',
      structured_formatting: {
        main_text: '新宿駅',
        secondary_text: '東京都新宿区',
      },
    });
    expect(station).toEqual({
      name: '新宿駅',
      prefecture: '東京都',
      address: '東京都新宿区',
      placeId: 'p1',
    });
  });

  it('maps place result with distance', () => {
    const station = stationFromPlace(
      {
        place_id: 'p2',
        name: '渋谷駅',
        vicinity: '東京都渋谷区',
        geometry: { location: { lat: 35.658, lng: 139.7016 } },
      },
      35.658,
      139.7016,
    );
    expect(station.name).toBe('渋谷駅');
    expect(station.distance).toBe(0);
    expect(station.lat).toBe(35.658);
  });

  it('merges preferred stations first and dedupes by placeId', () => {
    const preferred = [
      {
        name: '新宿駅',
        prefecture: '東京都',
        address: '',
        placeId: 'a',
      },
    ];
    const rest = [
      {
        name: '新宿駅',
        prefecture: '東京都',
        address: '',
        placeId: 'a',
      },
      {
        name: '新宿三丁目駅',
        prefecture: '東京都',
        address: '',
        placeId: 'b',
      },
    ];
    expect(
      mergeStationsByPlaceId(preferred, rest).map((s) => s.placeId),
    ).toEqual(['a', 'b']);
  });
});

describe('upstream-form decode', () => {
  it('decodes valid RestaurantSearchRequest', async () => {
    const body = {
      keywords: ['ラーメン'],
      location: { lat: 35.6, lng: 139.7 },
      radius: 300,
      stationPlaceId: 'ChIJxxx',
    };
    const result = await Effect.runPromise(
      decodeBody(RestaurantSearchRequest)(body),
    );
    expect(result.keywords).toEqual(['ラーメン']);
  });

  it('rejects empty keywords', async () => {
    const body = {
      keywords: [],
      location: { lat: 35.6, lng: 139.7 },
      radius: 300,
      stationPlaceId: 'ChIJxxx',
    };
    const exit = await Effect.runPromiseExit(
      decodeBody(RestaurantSearchRequest)(body),
    );
    expect(exit._tag).toBe('Failure');
    if (exit._tag === 'Failure' && exit.cause._tag === 'Fail') {
      expect(formatParseError(exit.cause.error).length).toBeGreaterThan(0);
    }
  });

  it('rejects non-positive radius', async () => {
    const exit = await Effect.runPromiseExit(
      Schema.decodeUnknown(RestaurantSearchRequest)({
        keywords: ['a'],
        location: { lat: 1, lng: 2 },
        radius: 0,
        stationPlaceId: 'id',
      }),
    );
    expect(exit._tag).toBe('Failure');
  });
});
