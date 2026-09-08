import { Effect, Schema } from 'effect';
import type { Database } from '../db';
import { getCache, setCache, CACHE_TTL } from './cache';
import { resolvePhotoUrl } from './google-maps';

/** カード表示用に解決する写真枚数（課金抑制） */
const MAX_PHOTOS_PER_PLACE = 1;

/**
 * photo_reference を CDN URL に解決し、D1 にキャッシュする。
 * APIキー付き URL をクライアントへ渡さない。
 */
export async function resolveCachedPhotoUrls(
  db: Database,
  apiKey: string,
  photoReferences: readonly string[],
): Promise<string[]> {
  const refs = photoReferences.slice(0, MAX_PHOTOS_PER_PLACE);
  if (refs.length === 0) {
    return [];
  }

  const urls: string[] = [];

  for (const ref of refs) {
    const cached = await getCache(db, 'place_photo', ref, Schema.String);
    if (cached) {
      urls.push(cached);
      continue;
    }

    const resolved = await Effect.runPromise(resolvePhotoUrl(apiKey, ref, 400));
    if (!resolved) {
      continue;
    }

    await setCache(db, 'place_photo', ref, resolved, CACHE_TTL.place_photo);
    urls.push(resolved);
  }

  return urls;
}
