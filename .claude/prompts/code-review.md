# コードレビュープロンプトテンプレート

このテンプレートを使用して、コードレビューをClaude Codeに依頼してください。

## テンプレート

```markdown
<instructions>
以下のコードをレビューしてください：

レビュー観点：
- [ ] TypeScript型安全性
- [ ] エラーハンドリング
- [ ] パフォーマンス
- [ ] コーディング規約の遵守
- [ ] セキュリティ
- [ ] 保守性・可読性
</instructions>

<code_context>
ファイルパス: [ファイルパス]
変更理由: [なぜこの変更が必要か]
関連Issue/PR: [該当する場合]
</code_context>

<project_standards>
このプロジェクトの規約：
- TypeScript厳格モード
- `any` 型の使用禁止
- コンポーネントは単一責任
- XMLタグでのコメント構造化
- エラー時はユーザーフレンドリーなメッセージ
- API呼び出しは必ずキャッシュを検討
</project_standards>

<review_format>
以下の形式で回答してください：

## 良い点
[コードの優れている部分]

## 改善提案
### 重要度: 高
[必ず修正すべき問題]

### 重要度: 中
[修正を推奨する問題]

### 重要度: 低
[任意の改善提案]

## 代替実装案
[より良い実装方法があれば提示]
</review_format>
```

## 使用例

```markdown
<instructions>
以下のコードをレビューしてください：

レビュー観点：
- [x] TypeScript型安全性
- [x] エラーハンドリング
- [x] パフォーマンス
- [x] コーディング規約の遵守
- [x] セキュリティ
- [x] 保守性・可読性
</instructions>

<code_context>
ファイルパス: src/composables/useRestaurantSearch.ts
変更理由: レストラン検索のパフォーマンス改善とキャッシュ機能の追加
関連Issue/PR: #42
</code_context>

<code>
```typescript
// src/composables/useRestaurantSearch.ts の変更部分
export const useRestaurantSearch = () => {
  const searchRestaurants = async (location: google.maps.LatLng, radius: number) => {
    const cacheKey = `${location.lat()},${location.lng()},${radius}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const service = new google.maps.places.PlacesService(map);
    const results = await new Promise((resolve) => {
      service.nearbySearch({
        location,
        radius,
        type: 'restaurant'
      }, (results) => {
        resolve(results);
      });
    });

    localStorage.setItem(cacheKey, JSON.stringify(results));
    return results;
  };

  return { searchRestaurants };
};
```
</code>

<project_standards>
このプロジェクトの規約：
- TypeScript厳格モード
- `any` 型の使用禁止
- キャッシュは src/utils/cacheManager.ts を使用
- エラーハンドリングは必須
- Google Maps APIの呼び出しは適切にラップ
</project_standards>

<review_format>
以下の形式で回答してください：

## 良い点
[コードの優れている部分]

## 改善提案
### 重要度: 高
[必ず修正すべき問題]

### 重要度: 中
[修正を推奨する問題]

### 重要度: 低
[任意の改善提案]

## 代替実装案
[より良い実装方法があれば提示]
</review_format>
```

## 期待されるレビュー例

```markdown
## 良い点
- キャッシュ機能の導入でAPI呼び出し回数を削減
- 座標と半径をキーにした適切なキャッシュキー設計

## 改善提案

### 重要度: 高
1. **エラーハンドリングの欠如**
   - PlacesServiceのエラーケースが処理されていない
   - ネットワークエラーやAPI制限に対応する必要がある

2. **型安全性の問題**
   - `results` の型が `any` になっている
   - 適切な型定義が必要

3. **プロジェクト規約違反**
   - 直接 `localStorage` を使用している
   - `src/utils/cacheManager.ts` を使用すべき

### 重要度: 中
1. **キャッシュの有効期限がない**
   - 古いデータが永続的に残る
   - TTL（Time To Live）の実装が必要

2. **Promise のエラーハンドリング**
   - `reject` が定義されていない

### 重要度: 低
1. **コードの可読性**
   - 関数が複数の責務を持っている
   - キャッシュロジックを分離すると保守性向上

## 代替実装案

```typescript
import { cacheManager } from '@/utils/cacheManager';

interface RestaurantSearchParams {
  location: google.maps.LatLng;
  radius: number;
}

interface RestaurantSearchResult {
  // 適切な型定義
}

export const useRestaurantSearch = () => {
  const searchRestaurants = async (
    params: RestaurantSearchParams
  ): Promise<RestaurantSearchResult[]> => {
    const { location, radius } = params;
    const cacheKey = `restaurant_search:${location.lat()},${location.lng()},${radius}`;

    // キャッシュをチェック
    const cached = cacheManager.get<RestaurantSearchResult[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const service = new google.maps.places.PlacesService(map);

      const results = await new Promise<RestaurantSearchResult[]>((resolve, reject) => {
        service.nearbySearch(
          {
            location,
            radius,
            type: 'restaurant'
          },
          (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
              resolve(results as RestaurantSearchResult[]);
            } else {
              reject(new Error(`Places API error: ${status}`));
            }
          }
        );
      });

      // 24時間キャッシュ
      cacheManager.set(cacheKey, results, 24 * 60 * 60 * 1000);
      return results;

    } catch (error) {
      console.error('Restaurant search failed:', error);
      throw new Error('レストランの検索に失敗しました。もう一度お試しください。');
    }
  };

  return { searchRestaurants };
};
```
```
