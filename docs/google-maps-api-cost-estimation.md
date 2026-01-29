# Google Maps API 料金試算

このドキュメントは、グルメスポット検索アプリで使用しているGoogle Maps APIの料金試算をまとめたものです。

> 最終更新: 2026-01-29

## 使用しているAPI一覧

| API | 用途 | 料金 (/1,000回) | 月間無料枠 |
|-----|------|-----------------|-----------|
| Maps JavaScript API | 地図表示 | $7.00 | 10,000回 |
| Places API - Nearby Search (Pro) | レストラン検索 | $32.00 | 5,000回 |
| Places API - Place Details (Pro) | 詳細情報取得 | $17.00 | 5,000回 |
| Places API - Autocomplete | 駅名補完 | $2.83 | 10,000回 |
| Geocoding API | 座標変換 | $5.00 | 10,000回 |

※ 料金は2025年3月以降のGoogle Maps Platform料金体系に基づく

## Place Details で取得しているフィールド

`src/composables/useRestaurantSearch/getPlaceDetails.ts` で定義:

```typescript
const DETAILS_FIELDS = [
  'place_id',           // Essentials
  'name',               // Essentials
  'vicinity',           // Basic (Pro)
  'rating',             // Atmosphere (Pro)
  'user_ratings_total', // Atmosphere (Pro)
  'price_level',        // Atmosphere (Pro)
  'types',              // Essentials
  'opening_hours',      // Atmosphere (Pro) ← 高コスト要因
  'photos',             // Atmosphere (Pro) ← 高コスト要因
  'geometry',           // Basic (Pro)
  'business_status',    // Essentials
];
```

### Place Details API の料金体系

| SKU | 含まれるフィールド | 料金 (/1,000) |
|-----|-------------------|--------------|
| **Essentials** | place_id, name, types, business_status | $5.00 |
| **Pro** | + vicinity, geometry, rating, price_level, opening_hours, photos | $17.00 |
| **Enterprise** | + reviews, editorial_summary | $20.00 |

**現状: `opening_hours` と `photos` を取得 → Pro料金（$17/1,000）が適用**

## 1回の検索操作でのAPI呼び出し

### キャッシュなし（最悪ケース）

| 操作 | API | 呼び出し数 |
|------|-----|-----------|
| ページ表示 | Maps JavaScript | 1回 |
| 駅名入力 | Autocomplete | 1回 |
| 駅選択 | Geocoding | 1回 |
| キーワード検索（5個） | Nearby Search | 5回 |
| 詳細取得（上限20件） | Place Details | 20回 |

### コスト制御パラメータ

`src/constants.ts` で定義:

```typescript
MAX_DETAILS_REQUESTS = 20;  // Place Details の最大呼び出し数
MAX_CONCURRENCY = 5;        // API並列リクエストの最大数
```

## コスト内訳（1回の検索あたり）

| API | 呼び出し数 | 単価 | 費用 | 割合 |
|-----|-----------|------|------|------|
| **Place Details (Pro)** | 20回 | $0.017 | $0.34 | 67% |
| **Nearby Search (Pro)** | 5回 | $0.032 | $0.16 | 31% |
| Geocoding | 1回 | $0.005 | $0.005 | 1% |
| Autocomplete | 1回 | $0.00283 | $0.003 | 1% |
| Maps JS Load | 1回 | $0.007 | $0.007 | 1% |
| **合計** | | | **$0.51** | 100% |

## キャッシュによるコスト削減

`src/utils/cacheManager.ts` で定義されたキャッシュ設定:

| キャッシュ | 有効期限 | 効果 |
|-----------|---------|------|
| GEOCODE_FORWARD | 7日間 | 同じ駅の再検索でGeocoding不要 |
| RESTAURANT_SEARCH | 48時間 | 同条件の再検索でNearby Search不要 |
| RESTAURANT_DETAILS | 48時間 | 同店舗の再取得でPlace Details不要 |
| STATION_PREDICTIONS | 24時間 | 駅検索候補のキャッシュ |

### キャッシュヒット率の影響

| キャッシュ率 | 月2,500検索時の費用 |
|------------|-------------------|
| 0%（なし） | 約$1,275 |
| 30% | 約$890 |
| 50% | 約$640 |
| 70% | 約$380 |

## 月間料金試算

### シナリオ別試算（キャッシュヒット率30%想定）

| 利用規模 | ユーザー数 | 検索/人 | 月間検索 | 月額費用 |
|---------|-----------|--------|---------|---------|
| 個人利用 | 1人 | 50回 | 50回 | 無料枠内 |
| 小規模 | 50人 | 10回 | 500回 | 約$150 |
| 中規模 | 250人 | 10回 | 2,500回 | 約$1,000 |
| 大規模 | 1,000人 | 10回 | 10,000回 | 約$4,500 |

### 無料で使える範囲

月間無料枠を超えないための目安: **約200〜250回の検索**

## コスト削減オプション

### オプション1: Place Details のフィールド削減

| 削除候補 | 影響 | 料金変化 |
|---------|------|---------|
| `photos` | 写真非表示 | Pro → Essentials可能 |
| `opening_hours` | 営業時間非表示、「営業中」フィルター不可 | Pro → Essentials可能 |

**両方削除: $17/1,000 → $5/1,000（70%削減）**

### オプション2: MAX_DETAILS_REQUESTS を減らす

| 設定値 | Place Details費用/検索 | 削減率 |
|--------|----------------------|--------|
| 20件（現状） | $0.34 | - |
| 15件 | $0.26 | 24% |
| 10件 | $0.17 | 50% |
| 5件 | $0.09 | 74% |

### オプション3: キーワード数を減らす

| キーワード数 | Nearby Search費用/検索 | 削減率 |
|-------------|----------------------|--------|
| 5個（現状） | $0.16 | - |
| 3個 | $0.096 | 40% |
| 2個 | $0.064 | 60% |

### 最適化後の試算（Essentials + MAX_DETAILS=10）

| 利用規模 | 月間検索 | 現状費用 | 最適化後 | 削減額 |
|---------|---------|---------|---------|-------|
| 小規模 | 500回 | $150 | $50 | -$100 |
| 中規模 | 2,500回 | $1,000 | $350 | -$650 |
| 大規模 | 10,000回 | $4,500 | $1,500 | -$3,000 |

## 参考リンク

- [Google Maps Platform Pricing](https://mapsplatform.google.com/pricing/)
- [Places API Usage and Billing](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing)
- [Geocoding API Usage and Billing](https://developers.google.com/maps/documentation/geocoding/usage-and-billing)
- [Google Maps Platform 2025年3月の変更](https://developers.google.com/maps/billing-and-pricing/march-2025)

## 注意事項

- 料金は2025年3月以降のGoogle Maps Platform料金体系に基づいています
- 実際の料金はGoogleの価格改定により変動する可能性があります
- キャッシュヒット率は実際の利用パターンにより異なります
- 大量利用時はGoogleとの個別契約によるボリュームディスカウントが適用される場合があります
