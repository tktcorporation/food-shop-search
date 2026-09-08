import { Schema } from 'effect';

/**
 * ブラウザ向け店舗写真 URL。
 * Google Place Photo のキー付き URL / API エンドポイントは不合格。
 */
export const PhotoCdnUrl = Schema.String.pipe(
  Schema.filter(
    (url) =>
      (url.startsWith('https://') || url.startsWith('http://')) &&
      !url.includes('maps.googleapis.com') &&
      !/[?&]key=/.test(url),
    {
      message: () =>
        'PhotoCdnUrl must be a key-free http(s) CDN URL (not Place Photo API)',
    },
  ),
);
export type PhotoCdnUrl = typeof PhotoCdnUrl.Type;
