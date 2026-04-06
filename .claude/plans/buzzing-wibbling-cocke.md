# 駅検索で「新宿駅」が候補に表示されない問題の修正

## Context

ユーザーが「新宿」や「新宿駅」と入力しても、候補リストにメインの「新宿駅」が表示されない。
Google Places Autocomplete API は「予測補完」APIであり、「新宿」に対してより具体的な駅名（新宿三丁目駅、新宿西口駅等）を優先的に返す。
これは API の仕様上の挙動であり、パラメータ調整では根本解決できない。

**修正方針**: Autocomplete 結果を Text Search API で補完し、入力に直接マッチする駅を確実に候補に含める。

## 変更内容

### 1. `worker/src/services/google-maps.ts` - Text Search 関数の追加

新関数 `searchStationByText` を追加:
- API: `/maps/api/place/textsearch/json`
- パラメータ: `query="{input}駅"`, `type=train_station`, `language=ja`
- 戻り値: `Result<GooglePlaceResult[]>`（既存型を再利用）
- 既存の `searchNearbyPlaces` と同じエラーハンドリングパターンに従う

また、`types` パラメータを `train_station|subway_station|transit_station` → `transit_station` に簡素化。
（`transit_station` は `train_station`/`subway_station` の上位型。Legacy API ではパイプ区切り複数指定の挙動が不安定）

### 2. `worker/src/types.ts` - 型の拡張

`GooglePlaceResult` に `formatted_address?: string` を追加。
Text Search API は `vicinity` の代わりに `formatted_address` を返すため。

Text Search レスポンス型を追加:
```ts
export interface GoogleTextSearchResponse {
  results: GooglePlaceResult[];
  status: string;
}
```

### 3. `worker/src/services/cache.ts` - キャッシュTTL追加

`CACHE_TTL` に `station_text_search: 86400` (24h) を追加。

### 4. `worker/src/routes/stations.ts` - マージロジック

`POST /api/stations/search` ハンドラを修正:

```
入力: "新宿"（/駅$/ 除去は維持）

1. D1キャッシュをそれぞれチェック
2. キャッシュミス分のみ Promise.all で並列実行:
   - Autocomplete API("新宿")
   - Text Search API("新宿駅", type=train_station)
3. 各結果をD1キャッシュに保存
4. Text Search 結果を Station に変換（placeToStation 的な関数）
5. place_id で重複除去し、Text Search の完全一致を先頭に配置
6. 最大10件程度で返却
```

**エラーハンドリング**: Text Search が失敗しても Autocomplete 結果のみで応答（デグレードしない）

### 5. `worker/src/lib/station-filter.ts` - transit_station 追加

`STATION_TYPES` に `'transit_station'` を追加。nearby search のフィルタにも対応。

## 修正ファイル一覧

| ファイル | 変更内容 |
|---|---|
| `worker/src/types.ts` | `GooglePlaceResult` に `formatted_address?` 追加、`GoogleTextSearchResponse` 追加 |
| `worker/src/services/cache.ts` | `station_text_search` TTL追加 |
| `worker/src/services/google-maps.ts` | `searchStationByText` 関数追加、`types` 簡素化 |
| `worker/src/routes/stations.ts` | マージロジック実装 |
| `worker/src/lib/station-filter.ts` | `transit_station` を STATION_TYPES に追加 |

## 検証方法

1. `npm run typecheck` でビルドエラーがないことを確認
2. Chrome DevTools MCP で実際に駅検索を実行:
   - 「新宿」→ 候補に「新宿駅」が含まれること
   - 「新宿駅」→ 候補に「新宿駅」が含まれること
   - 「渋谷」→ 候補に「渋谷駅」が含まれること
   - 既存の周辺駅（新宿三丁目駅等）も引き続き表示されること
3. Worker の開発サーバーでAPIレスポンスを直接確認
