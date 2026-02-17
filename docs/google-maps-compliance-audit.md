# Google Maps Platform 利用規約コンプライアンス監査レポート

- **対象**: pekonavi (グルメスポット検索アプリケーション)
- **監査日**: 2026-02-17
- **参照規約**: [Google Maps Platform Terms of Service](https://cloud.google.com/maps-platform/terms) (2025-11-18 改訂版)

---

## 概要

本レポートは、pekonavi で使用している Google Maps Platform API が利用規約に準拠しているかを監査した結果です。**4件の重大な違反リスク**、**2件の高リスク項目**、**1件の中リスク項目** を検出しました。

### リスクサマリー

| リスク | 件数 | 概要 |
|--------|------|------|
| CRITICAL | 4 | サーバーサイドキャッシュ、帰属表示欠落 |
| HIGH | 2 | Autocomplete / 駅検索結果のキャッシュ |
| MEDIUM | 1 | 営業状態のキャッシュによる陳腐化 |
| OK | 4 | 適切に実装されている項目 |

---

## 使用している Google Maps API

| API | 用途 | 呼び出し元 |
|-----|------|-----------|
| Nearby Search API | レストラン・駅の近隣検索 | `worker/src/services/google-maps.ts:16` |
| Places Autocomplete API | 駅名入力予測 | `worker/src/services/google-maps.ts:60` |
| Geocoding API (Forward) | 住所→座標変換 | `worker/src/services/google-maps.ts:97` |
| Geocoding API (Reverse) | 座標→住所変換 | `worker/src/services/google-maps.ts:129` |
| Place Photo API | 店舗写真の取得 | `worker/src/services/google-maps.ts:166` |

---

## CRITICAL: 重大な違反リスク

### C1. `place_cache` テーブルによる Google Maps コンテンツの永続保存

**規約条項**: Section 3.2.3(a) - No Scraping / No Caching

> Customer will not cache Google Maps Content except as expressly permitted under the Maps Service Specific Terms.

**現状**: `place_cache` テーブル（`worker/src/db/schema.ts:28-53`）に以下のデータを TTL 14日間で保存している。

| カラム | 保存内容 | キャッシュ可否 |
|--------|---------|---------------|
| `placeId` | Place ID | **可** (唯一の例外) |
| `name` | 店舗名 | **不可** |
| `vicinity` | 住所 | **不可** |
| `rating` | 平均評価 | **不可** |
| `userRatingsTotal` | レビュー数 | **不可** |
| `priceLevel` | 価格帯 | **不可** |
| `types` | 場所タイプ (JSON) | **不可** |
| `photoReferences` | 写真参照 (JSON) | **不可** (後述) |
| `isOpenNow` | 営業状態 | **不可** |
| `lat` / `lng` | 緯度経度 | **EEA のみ最大30日** |
| `businessStatus` | 営業ステータス | **不可** |

**該当コード**: `worker/src/services/cache.ts:172-229` (`upsertPlaces` 関数)

**影響**: Google Maps コンテンツの大部分をサーバーサイドのデータベース（Cloudflare D1）に保存しており、規約の「No Caching」条項に直接抵触する。

---

### C2. Photo Reference のサーバーサイド保存

**規約条項**: Maps Service Specific Terms - Places API

> Photo references are not permanent and may expire. Do not cache photo references.

**現状**: `place_cache.photoReferences` カラムに Photo Reference 文字列を JSON 配列として保存し、リクエスト時に URL を動的生成している。

```typescript
// worker/src/services/cache.ts:184
const photoReferences = place.photos?.map((p) => p.photo_reference) ?? [];
```

```typescript
// worker/src/routes/restaurants.ts:39
const photoUrls = place.photoReferences.map((ref) =>
  getPhotoUrl(apiKey, ref, 400),
);
```

**影響**: Photo Reference は有効期限があり、キャッシュ後に期限切れになった場合、ユーザーに壊れた画像が表示される。規約上も明確に禁止されている。

---

### C3. 「Powered by Google」帰属表示の完全欠落

**規約条項**: [Places API Policies](https://developers.google.com/maps/documentation/places/web-service/policies)

> You must display a "Powered by Google" logo or text adjacent to the search box and/or the search results.

**現状**: フロントエンド全体を grep した結果、「Powered by Google」「Google ロゴ」「attribution」に関する実装が**一切存在しない**。

- `src/components/UnifiedSearchResultsScreen/index.tsx` - 検索結果画面に帰属表示なし
- `src/components/UnifiedSearchResultsScreen/RestaurantCard.tsx` - カードに帰属表示なし
- `src/App.tsx` - フッターに帰属表示なし

**影響**: Places API のデータ（店舗名、評価、写真等）をユーザーに表示しているにもかかわらず、Google への帰属表示が完全に欠如しており、規約違反。

---

### C4. ジオコーディング結果のサーバーサイドキャッシュ

**規約条項**: Section 3.2.3(a) - No Caching

**現状**: ジオコーディング結果を D1 にキャッシュしている。

| キャッシュタイプ | TTL | 保存内容 |
|-----------------|-----|---------|
| `geocode_forward` | 7日間 | 住所→座標変換結果 |
| `geocode_reverse` | 24時間 | 座標→住所変換結果 |

**該当コード**:
- `worker/src/routes/geocode.ts` - キャッシュ読み書き
- `worker/src/services/cache.ts:9,12` - TTL 定義

**影響**: Geocoding API の結果はキャッシュ禁止対象。

---

## HIGH: 高リスク項目

### H1. Autocomplete 予測結果のキャッシュ

**規約条項**: Section 3.2.3(a) - No Caching

**現状**: Places Autocomplete API の予測結果を `station_predictions` として 24時間キャッシュ。

**該当コード**: `worker/src/routes/stations.ts` (キャッシュキー: 入力文字列)

---

### H2. Nearby Stations 検索結果のキャッシュ

**規約条項**: Section 3.2.3(a) - No Caching

**現状**: 近隣駅検索の結果を `nearby_stations` として 7日間キャッシュ。

**該当コード**: `worker/src/routes/stations.ts` (キャッシュキー: `${lat.toFixed(2)}-${lng.toFixed(2)}`)

---

## MEDIUM: 中リスク項目

### M1. 営業状態 (`isOpenNow`) のキャッシュによる陳腐化

**現状**: `isOpenNow`（現在営業中かどうか）を 14日間キャッシュしたデータで表示している。

```tsx
// src/components/UnifiedSearchResultsScreen/RestaurantCard.tsx:131-137
{restaurant.isOpenNow !== undefined && !businessStatusInfo && (
  <span className={`text-xs font-medium ${
    restaurant.isOpenNow ? 'text-success' : 'text-text-muted'
  }`}>
    {restaurant.isOpenNow ? '営業中' : '営業時間外'}
  </span>
)}
```

**影響**: リアルタイム性が求められる営業状態を古いキャッシュデータで表示するため、ユーザーに誤った情報を提供するリスクがある。規約違反とユーザー体験の両面で問題。

---

## OK: 適切に実装されている項目

### OK1. `place_id` の保存

`api_cache` の `restaurant_search` キャッシュに `place_id` のリストのみを保存している部分は、規約上許可されている。

```typescript
// worker/src/routes/restaurants.ts:143
const placeIds = result.data.map((p) => p.place_id);
await setCache(db, 'restaurant_search', cacheKey, placeIds, ...);
```

### OK2. 写真の配信方式

写真自体は再ホスティングせず、Google Maps Place Photo API のエンドポイント URL を動的生成してブラウザから直接取得している。

```typescript
// worker/src/services/google-maps.ts:166-178
export function getPhotoUrl(apiKey, photoReference, maxWidth) {
  return `${MAPS_BASE_URL}/maps/api/place/photo?...`;
}
```

### OK3. Google Maps へのディープリンク

レストランカードから Google Maps への遷移は公式の URL スキームを使用しており、適切。

```typescript
// src/components/UnifiedSearchResultsScreen/RestaurantCard.tsx:54
const url = `https://www.google.com/maps/search/?api=1&query=${searchQuery}&query_place_id=${restaurant.place_id}`;
```

### OK4. API キーのセキュリティ

API キーはフロントエンドに公開せず、バックエンド（Cloudflare Workers）の Secrets として管理。すべての API 呼び出しはサーバーサイド経由。

---

## 推奨対応策

### 優先度 1: 帰属表示の追加 (C3)

検索結果画面に「Powered by Google」ロゴを追加する。

```tsx
// 例: src/components/UnifiedSearchResultsScreen/index.tsx のフッター部分
<div className="flex items-center justify-center py-2">
  <img
    src="https://developers.google.com/static/maps/documentation/images/powered_by_google_on_white.png"
    alt="Powered by Google"
    height="16"
    translate="no"
  />
</div>
```

**対応コスト**: 低 / **リスク軽減効果**: 高

### 優先度 2: キャッシュ戦略の見直し (C1, C2, C4, H1, H2)

#### 選択肢 A: キャッシュの完全廃止（規約厳密準拠）

- `place_cache` テーブルから `place_id` 以外のカラムを削除
- `api_cache` に保存するのは `place_id` リストのみ
- 毎回 Google API を呼び出して最新データを取得
- **デメリット**: API コスト大幅増、レスポンス速度低下

#### 選択肢 B: クライアントサイドセッションキャッシュのみ（推奨）

- サーバーサイドの `place_cache` テーブルを廃止
- `api_cache` には `place_id` リストのみ保存（これは許可されている）
- Google API レスポンスはクライアントに直接返し、ブラウザのセッション中のみメモリキャッシュ
- Geocoding / Autocomplete のキャッシュも廃止
- **デメリット**: 同じ検索で毎回 API 呼び出しが発生

#### 選択肢 C: キャッシュ TTL の大幅短縮 + 利用規約の許容範囲内での運用

- Google の規約は「HTTP cache headers に従った短期キャッシュ」を暗黙的に許容している解釈がある
- TTL を API レスポンスの Cache-Control ヘッダーに準拠させる（通常数分〜数時間）
- Photo Reference は毎回 API から取得
- **注意**: この解釈は規約のグレーゾーンであり、完全な安全は保証されない

**対応コスト**: 中〜高 / **リスク軽減効果**: 高

### 優先度 3: 営業状態の表示方法改善 (M1)

- キャッシュデータからの `isOpenNow` 表示を廃止
- リアルタイムで取得できない場合は「営業時間は Google Maps で確認」のようなリンクに変更

---

## キャッシュの現状と規約の対応表

| キャッシュタイプ | 現在の TTL | 保存内容 | 規約上の可否 | 推奨アクション |
|----------------|-----------|---------|-------------|--------------|
| `restaurant_search` | 48h | place_id リスト | **OK** | 維持可 |
| `place_cache` | 14d | 店舗詳細全体 | **NG** | 廃止 or place_id のみに |
| `geocode_forward` | 7d | 座標変換結果 | **NG** | 廃止 |
| `geocode_reverse` | 24h | 住所変換結果 | **NG** | 廃止 |
| `station_predictions` | 24h | Autocomplete結果 | **NG** | 廃止 |
| `nearby_stations` | 7d | 近隣駅結果 | **NG** | 廃止 |

---

## 参考資料

- [Google Maps Platform Terms of Service](https://cloud.google.com/maps-platform/terms)
- [Google Maps Platform Service Specific Terms](https://cloud.google.com/maps-platform/terms/maps-service-terms)
- [Places API Policies](https://developers.google.com/maps/documentation/places/web-service/policies)
- [Attribution Requirements](https://developers.google.com/maps/documentation/places/web-service/attributions)
- [Google Maps APIs Terms of Service (2018)](https://developers.google.com/maps/terms-20180207)

---

## 免責事項

本レポートは Google Maps Platform の利用規約に基づく技術的な分析であり、法的助言ではありません。最終的な判断については法律の専門家にご相談ください。Google の規約は随時更新されるため、最新版を定期的に確認することを推奨します。
