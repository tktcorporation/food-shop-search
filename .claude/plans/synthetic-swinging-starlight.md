# Cloudflare Workers + D1 + Drizzle ORM 移行プラン

## Context

現在のグルメスポット検索アプリはクライアントサイドのみのSPAで、Google Maps JavaScript SDKを使ってブラウザから直接APIを呼び出している。APIキーがクライアントに露出し、キャッシュはlocalStorage（デバイス単位）のため、ユーザー間でキャッシュを共有できない。

**目的**: Cloudflare Workers + D1に移行し、Google Maps APIコールをサーバーサイドでキャッシュすることで、API呼び出し回数とコストを大幅に削減する。

## 技術選定

| 項目              | 選定                               |
| ----------------- | ---------------------------------- |
| Webフレームワーク | Hono                               |
| ORM               | Drizzle ORM (SQLite/D1)            |
| データベース      | Cloudflare D1                      |
| ホスティング      | Cloudflare Workers (SPA + API一体) |
| マイグレーション  | drizzle-kit                        |

## アーキテクチャ

```
Browser (React SPA)
  ├── fetch('/api/restaurants/search')  ──┐
  ├── fetch('/api/stations/search')     ──┤
  ├── fetch('/api/stations/nearby')     ──┤
  ├── fetch('/api/geocode/forward')     ──┤
  └── fetch('/api/geocode/reverse')     ──┘
                                          │
Cloudflare Worker (Hono)                  │
  ├── /api/* routes  ◄────────────────────┘
  │     ├── D1キャッシュ確認 (Drizzle ORM)
  │     ├── キャッシュHIT → 即レスポンス
  │     └── キャッシュMISS → Google Maps REST API → D1保存 → レスポンス
  ├── /* (静的アセット配信)
  └── D1 Database (api_cache テーブル)
```

## ファイル構成

```
worker/
  src/
    index.ts              # Hono app エントリー + 静的アセット配信
    db/
      schema.ts           # Drizzle ORMスキーマ定義
      index.ts            # DB初期化ヘルパー
    routes/
      restaurants.ts      # POST /api/restaurants/search
      stations.ts         # POST /api/stations/search, /nearby
      geocode.ts          # POST /api/geocode/forward, /reverse
    services/
      google-maps.ts      # Google Maps REST APIクライアント
      cache.ts            # D1キャッシュ読み書き (Drizzle使用)
    lib/
      haversine.ts        # 距離計算 (google.maps.geometry代替)
    types.ts              # APIリクエスト/レスポンス型定義
  tsconfig.json
drizzle/                  # マイグレーションファイル (drizzle-kit生成)
drizzle.config.ts         # drizzle-kit設定
```

## D1スキーマ (Drizzle ORM)

```typescript
// worker/src/db/schema.ts
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const apiCache = sqliteTable(
  'api_cache',
  {
    cacheKey: text('cache_key').primaryKey(),
    cacheType: text('cache_type').notNull(),
    responseData: text('response_data').notNull(), // JSON
    createdAt: integer('created_at', { mode: 'number' })
      .notNull()
      .default(sql`(unixepoch())`),
    expiresAt: integer('expires_at', { mode: 'number' }).notNull(),
    hitCount: integer('hit_count').notNull().default(0),
  },
  (table) => [
    index('idx_cache_type').on(table.cacheType),
    index('idx_expires_at').on(table.expiresAt),
  ],
);
```

キャッシュTTL（現行localStorage設定を踏襲）:

- `restaurant_search`: 48時間
- `geocode_forward`: 7日
- `station_predictions`: 24時間
- `nearby_stations`: 12時間
- `geocode_reverse`: 24時間

## APIルート設計

| エンドポイント            | メソッド | 説明                   | キャッシュキー                      |
| ------------------------- | -------- | ---------------------- | ----------------------------------- |
| `/api/restaurants/search` | POST     | レストラン検索         | `{keyword}-{lat}-{lng}-{radius}`    |
| `/api/stations/search`    | POST     | 駅名オートコンプリート | `{input}`                           |
| `/api/stations/nearby`    | POST     | 近隣駅検索             | `{lat.toFixed(2)}-{lng.toFixed(2)}` |
| `/api/geocode/forward`    | POST     | 駅名→座標              | `{address}`                         |
| `/api/geocode/reverse`    | POST     | 座標→住所              | `{lat}-{lng}`                       |

## Google Maps REST API（サーバーサイド）

Worker → Google Maps REST API:

- **レストラン検索**: `GET https://maps.googleapis.com/maps/api/place/nearbysearch/json`
- **オートコンプリート**: `GET https://maps.googleapis.com/maps/api/place/autocomplete/json`
- **ジオコーディング**: `GET https://maps.googleapis.com/maps/api/geocode/json`
- **写真URL解決**: `GET https://maps.googleapis.com/maps/api/place/photo` → リダイレクト先CDN URLを返却

## フロントエンド変更

### 新規作成

- `src/services/ApiService.ts` - Worker APIへのfetchクライアント（Effect Service）

### 型変更

- `Restaurant.photos: PlacePhoto[]` → `Restaurant.photoUrls: string[]`
- `Restaurant.geometry.location: LatLng` → `Restaurant.location: { lat, lng }`
- `Station.rawPrediction` → `Station.placeId: string`

### プログラム修正

- `searchRestaurants.ts` - GoogleMapsPlacesService → ApiService
- `searchStations.ts` - GoogleMapsPlacesService → ApiService
- `searchNearbyStations.ts` - GoogleMapsPlacesService → ApiService
- `getLocation.ts` - GoogleMapsGeocoderService → ApiService

### 削除

- `src/services/GoogleMapsPlacesService.ts`
- `src/services/GoogleMapsGeocoderService.ts`
- `src/services/CacheService.ts`
- `src/utils/cacheManager.ts`
- `@react-google-maps/api` パッケージ（地図描画なし確認済み）

### コンポーネント修正

- `App.tsx` - useLoadScript削除、SDK読み込み不要に
- `main.tsx` - VITE_GOOGLE_MAPS_API_KEY チェック削除
- `RestaurantCard.tsx` - `photos[0].getUrl()` → `photoUrls[0]`
- `src/services/index.ts` - AppLive層をApiService + GeolocationServiceに簡素化

## 設定変更

### wrangler.toml

```toml
name = "pekonabi"
main = "worker/src/index.ts"
compatibility_date = "2026-02-16"
compatibility_flags = ["nodejs_compat"]

[assets]
directory = "./dist"

[[d1_databases]]
binding = "DB"
database_name = "gourmet-spot-cache"
database_id = "<wrangler d1 create後に設定>"
```

### vite.config.ts（開発時プロキシ追加）

```typescript
server: {
  proxy: { '/api': 'http://localhost:8787' }
}
```

### package.json スクリプト追加

```json
"dev:worker": "wrangler dev",
"dev:all": "npm run build:client && wrangler dev",
"deploy": "npm run build && wrangler deploy",
"db:generate": "drizzle-kit generate",
"db:migrate:local": "wrangler d1 migrations apply gourmet-spot-cache --local",
"db:migrate:remote": "wrangler d1 migrations apply gourmet-spot-cache --remote"
```

## 実装順序（チーム並列実行）

### チーム1: Worker基盤 + D1

1. 依存関係インストール (hono, drizzle-orm, drizzle-kit, @cloudflare/workers-types)
2. wrangler.toml更新
3. Drizzleスキーマ定義 + マイグレーション生成
4. Honoアプリエントリー作成
5. D1キャッシュサービス実装
6. Google Maps REST APIクライアント実装
7. haversine距離計算関数
8. 全APIルート実装

### チーム2: フロントエンド改修

1. ApiService (Effect Service) 作成
2. 型定義変更 (Restaurant, Station)
3. 全プログラム修正 (searchRestaurants等)
4. services/index.ts (AppLive)更新
5. App.tsx, main.tsx修正
6. RestaurantCard.tsx修正
7. 不要ファイル・パッケージ削除

## 検証手順

1. `npm install` - 依存関係インストール
2. `npm run db:generate` - マイグレーション生成
3. `npm run db:migrate:local` - ローカルD1にスキーマ適用
4. `npm run build` - Viteビルド成功確認
5. `npm run dev:worker` - Workerローカル起動
6. ブラウザで `http://localhost:8787` にアクセス
7. 駅検索 → レストラン検索のフロー確認
8. D1キャッシュヒット確認（2回目の同一検索が高速化）
9. `npm run check` - lint + format + typecheck
