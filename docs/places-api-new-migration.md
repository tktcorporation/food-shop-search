# Places API (New) 移行調査

## 背景

旧 Places API は **2025年3月に「Legacy」ステータスに移行済み**。新規 Google Cloud Project では有効化できない。完全廃止は未定だが「数年以内」と示唆されており、廃止の12ヶ月前に通知される。

## エンドポイント対応表

| 用途               | 旧 API (Legacy)                   | 新 API (New)                                                  |
| ------------------ | --------------------------------- | ------------------------------------------------------------- |
| 近隣検索           | `GET .../place/nearbysearch/json` | `POST places.googleapis.com/v1/places:searchNearby`           |
| テキスト検索       | `GET .../place/textsearch/json`   | `POST places.googleapis.com/v1/places:searchText`             |
| オートコンプリート | `GET .../place/autocomplete/json` | `POST places.googleapis.com/v1/places:autocomplete`           |
| 写真               | `GET .../place/photo`             | `GET places.googleapis.com/v1/places/{id}/photos/{ref}/media` |
| ジオコーディング   | `GET .../geocode/json`            | **変更なし（別API）**                                         |

## 認証方式

```
旧: ?key=API_KEY (クエリパラメータ)
新: X-Goog-Api-Key ヘッダー + X-Goog-FieldMask ヘッダーで取得フィールド指定
```

## keyword パラメータの廃止（最大の影響）

旧 Nearby Search の `keyword` パラメータは新 API で廃止。`includedTypes` でのタイプフィルタのみ対応。

キーワード検索（「ラーメン」「寿司」等）が必要な場合は **Text Search (New)** (`places:searchText`) を使う必要がある。

### Text Search (New) リクエスト例

```
POST https://places.googleapis.com/v1/places:searchText
X-Goog-Api-Key: API_KEY
X-Goog-FieldMask: places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.priceLevel,places.photos,places.regularOpeningHours,places.location,places.businessStatus,places.types
```

```json
{
  "textQuery": "ラーメン",
  "includedType": "restaurant",
  "maxResultCount": 20,
  "rankPreference": "RELEVANCE",
  "languageCode": "ja",
  "locationBias": {
    "circle": {
      "center": { "latitude": 35.6762, "longitude": 139.6503 },
      "radius": 1000.0
    }
  }
}
```

## Nearby Search (New) リクエスト/レスポンス

### リクエスト

```
POST https://places.googleapis.com/v1/places:searchNearby
X-Goog-Api-Key: API_KEY
X-Goog-FieldMask: places.id,places.displayName,places.formattedAddress,...
```

```json
{
  "includedTypes": ["restaurant"],
  "maxResultCount": 20,
  "rankPreference": "POPULARITY",
  "languageCode": "ja",
  "locationRestriction": {
    "circle": {
      "center": { "latitude": 35.6762, "longitude": 139.6503 },
      "radius": 1000.0
    }
  }
}
```

| パラメータ            | 必須 | 説明                                   |
| --------------------- | ---- | -------------------------------------- |
| `locationRestriction` | 必須 | 検索範囲（center + radius、0-50000m）  |
| `includedTypes`       | 任意 | タイプフィルタ（例: `["restaurant"]`） |
| `excludedTypes`       | 任意 | 除外タイプ                             |
| `maxResultCount`      | 任意 | 1-20、デフォルト20                     |
| `rankPreference`      | 任意 | `POPULARITY` / `DISTANCE`              |
| `languageCode`        | 任意 | 言語コード                             |

### レスポンス

```json
{
  "places": [
    {
      "id": "ChIJ...",
      "displayName": { "text": "店名", "languageCode": "ja" },
      "formattedAddress": "東京都渋谷区...",
      "location": { "latitude": 35.6762, "longitude": 139.6503 },
      "rating": 4.2,
      "userRatingCount": 150,
      "priceLevel": "PRICE_LEVEL_MODERATE",
      "types": ["restaurant", "food"],
      "photos": [
        {
          "name": "places/ChIJ.../photos/ATJ83...",
          "widthPx": 4032,
          "heightPx": 3024,
          "authorAttributions": [...]
        }
      ],
      "regularOpeningHours": { "openNow": true },
      "businessStatus": "OPERATIONAL"
    }
  ]
}
```

## Autocomplete (New) リクエスト/レスポンス

### リクエスト

```
POST https://places.googleapis.com/v1/places:autocomplete
X-Goog-Api-Key: API_KEY
```

```json
{
  "input": "東京駅",
  "includedPrimaryTypes": [
    "transit_station",
    "train_station",
    "airport",
    "subway_station"
  ],
  "includedRegionCodes": ["jp"],
  "languageCode": "ja"
}
```

### レスポンス

```json
{
  "suggestions": [
    {
      "placePrediction": {
        "place": "places/ChIJ...",
        "placeId": "ChIJ...",
        "text": { "text": "東京駅, 千代田区, 東京都" },
        "structuredFormat": {
          "mainText": { "text": "東京駅" },
          "secondaryText": { "text": "千代田区, 東京都" }
        },
        "types": ["transit_station"],
        "distanceMeters": 1500
      }
    }
  ]
}
```

## Place Photo (New)

### リクエスト

```
GET https://places.googleapis.com/v1/{photos[].name}/media?maxWidthPx=400&key=API_KEY
```

- `photos[].name` は Nearby/Text Search のレスポンスから取得
- `skipHttpRedirect=true` で JSON（photoUri）を返す、`false`（デフォルト）で画像にリダイレクト
- photo name にはキャッシュ有効期限がある

## フィールド名マッピング

| 旧フィールド                | 新フィールド                                 |
| --------------------------- | -------------------------------------------- |
| `results`                   | `places`                                     |
| `place_id`                  | `id`                                         |
| `name`                      | `displayName.text`                           |
| `vicinity`                  | `formattedAddress` / `shortFormattedAddress` |
| `user_ratings_total`        | `userRatingCount`                            |
| `price_level` (数値 0-4)    | `priceLevel` (文字列 enum)                   |
| `photos[].photo_reference`  | `photos[].name` (リソースパス)               |
| `opening_hours.open_now`    | `regularOpeningHours.openNow`                |
| `geometry.location.lat/lng` | `location.latitude/longitude`                |
| `status: "OK"`              | HTTPステータスコードで判定                   |
| `next_page_token`           | 廃止                                         |
| `predictions`               | `suggestions[].placePrediction`              |
| `structured_formatting`     | `structuredFormat`                           |

## priceLevel の値

| 旧 (数値) | 新 (文字列)                  |
| --------- | ---------------------------- |
| 0         | `PRICE_LEVEL_FREE`           |
| 1         | `PRICE_LEVEL_INEXPENSIVE`    |
| 2         | `PRICE_LEVEL_MODERATE`       |
| 3         | `PRICE_LEVEL_EXPENSIVE`      |
| 4         | `PRICE_LEVEL_VERY_EXPENSIVE` |

## 料金比較

rating, userRatingCount, priceLevel, regularOpeningHours を取得する場合は Enterprise ティア:

| API                | 旧料金 (/1K) | 新料金 (/1K)        |
| ------------------ | ------------ | ------------------- |
| Nearby/Text Search | $32.00       | $35.00 (Enterprise) |
| Autocomplete       | $2.83        | $2.83 (Essentials)  |
| Place Photo        | $7.00        | $7.00 (Enterprise)  |

FieldMask で要求フィールドを絞ると低いティア（安い料金）になる。

## 移行作業まとめ

1. `google-maps.ts`: 全関数を新エンドポイント + POST + ヘッダー認証に変更
2. `types.ts`: レスポンス型を新形式に書き換え
3. `searchNearbyPlaces` → Text Search (New) に切り替え（keyword 対応のため）
4. ルートハンドラ: フィールド名マッピング調整
5. テスト: モックレスポンスを新形式に更新
