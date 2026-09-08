import { Effect, Option } from 'effect';
import type { PhotoCdnUrl } from '../../../shared/src/schema/photo';
import type { Database } from '../db';
import { getCache, setCache, CACHE_TTL } from './cache';
import { PlacePhotoCachePayload } from '../schema/cache';
import { resolvePhotoUrl } from './google-maps';

/** カード表示用に解決する写真枚数（課金抑制） */
const MAX_PHOTOS_PER_PLACE = 1;

/**
 * photo_reference を CDN URL に解決し、D1 にキャッシュする。
 * APIキー付き URL をクライアントへ渡さない。
 * 失敗・未解決はスキップ（photoUrls=[] は正当）。
 */
export const resolveCachedPhotoUrls = (
  db: Database,
  apiKey: string,
  photoReferences: readonly string[],
): Effect.Effect<readonly PhotoCdnUrl[], never> =>
  Effect.gen(function* () {
    const refs = photoReferences.slice(0, MAX_PHOTOS_PER_PLACE);
    if (refs.length === 0) {
      return [];
    }

    const urls: PhotoCdnUrl[] = [];

    for (const ref of refs) {
      const cached = yield* Effect.promise(() =>
        getCache(db, 'place_photo', ref, PlacePhotoCachePayload),
      );
      if (cached) {
        urls.push(cached);
        continue;
      }

      const resolved = yield* resolvePhotoUrl(apiKey, ref, 400);
      if (Option.isNone(resolved)) {
        continue;
      }

      const cdnUrl = resolved.value;
      yield* Effect.promise(() =>
        setCache(db, 'place_photo', ref, cdnUrl, CACHE_TTL.place_photo),
      );
      urls.push(cdnUrl);
    }

    return urls;
  });
