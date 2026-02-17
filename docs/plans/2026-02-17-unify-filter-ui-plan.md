# フィルターサマリーUI統一 実装計画

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** フィルターの「すべて」表示を廃止し、常に実際のラベルを表示する

**Architecture:** サマリーテキスト生成を純粋関数として抽出し、テスト可能にする。コンポーネントの変更は抽出した関数の呼び出しに差し替えるのみ。

**Tech Stack:** React, TypeScript, Vitest

---

### Task 1: キーワードサマリー関数の作成

**Files:**

- Create: `src/utils/formatFilterSummary.ts`
- Create: `src/utils/formatFilterSummary.test.ts`

**Step 1: テストを書く**

`src/utils/formatFilterSummary.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { formatKeywordSummary } from './formatFilterSummary';
import { getKeywordLabel } from './keywordOptions';

describe('formatKeywordSummary', () => {
  it('returns 未選択 when no keywords selected', () => {
    expect(formatKeywordSummary([], getKeywordLabel)).toBe('未選択');
  });

  it('returns single label when 1 keyword selected', () => {
    expect(formatKeywordSummary(['和食'], getKeywordLabel)).toBe('和食');
  });

  it('returns comma-separated labels when 2-3 keywords selected', () => {
    expect(formatKeywordSummary(['和食', 'ラーメン'], getKeywordLabel)).toBe(
      '和食、ラーメン',
    );
    expect(
      formatKeywordSummary(['和食', 'ラーメン', 'カフェ'], getKeywordLabel),
    ).toBe('和食、ラーメン、カフェ');
  });

  it('returns first 3 labels + count when more than 3 keywords selected', () => {
    const keywords = ['和食', 'ラーメン', 'カフェ', '焼肉', 'ステーキ'];
    expect(formatKeywordSummary(keywords, getKeywordLabel)).toBe(
      '和食、ラーメン、カフェ 他2件',
    );
  });

  it('shows actual labels even when all keywords are selected (no すべて)', () => {
    const allKeywords = [
      '和食',
      '中華料理',
      '韓国料理',
      'イタリアン',
      'フレンチ',
      'タイ料理',
      'ベトナム料理',
      'インド料理',
      '定食',
      'ファストフード',
      'ファミレス',
      'カフェ',
      'ラーメン',
      'うどん,そば',
      '天ぷら',
      'とんかつ',
      '焼き鳥',
      '海鮮',
      '焼肉',
      'ステーキ',
      'ハンバーグ',
    ];
    expect(formatKeywordSummary(allKeywords, getKeywordLabel)).toBe(
      '和食、中華料理、韓国料理 他18件',
    );
  });

  it('uses getKeywordLabel to resolve custom keywords', () => {
    const customLabel = (v: string) => (v === 'custom' ? 'カスタム' : v);
    expect(formatKeywordSummary(['custom', '和食'], customLabel)).toBe(
      'カスタム、和食',
    );
  });
});
```

**Step 2: テストが失敗することを確認**

Run: `npx vitest run src/utils/formatFilterSummary.test.ts`
Expected: FAIL - module not found

**Step 3: 関数を実装**

`src/utils/formatFilterSummary.ts`:

```typescript
const MAX_VISIBLE_LABELS = 3;

export const formatKeywordSummary = (
  selectedKeywords: string[],
  getLabel: (value: string) => string,
): string => {
  if (selectedKeywords.length === 0) return '未選択';

  const visibleLabels = selectedKeywords
    .slice(0, MAX_VISIBLE_LABELS)
    .map(getLabel)
    .join('、');

  const remaining = selectedKeywords.length - MAX_VISIBLE_LABELS;
  return remaining > 0 ? `${visibleLabels} 他${remaining}件` : visibleLabels;
};
```

**Step 4: テストが通ることを確認**

Run: `npx vitest run src/utils/formatFilterSummary.test.ts`
Expected: All 6 tests PASS

**Step 5: コミット**

```bash
jj commit -m "feat: キーワードサマリーのフォーマット関数を追加"
```

---

### Task 2: コンポーネントのサマリー表示を差し替え

**Files:**

- Modify: `src/components/UnifiedSearchResultsScreen/index.tsx:8,220-231,266-272`

**Step 1: import を追加**

`index.tsx` の行8付近、既存の `keywordOptions` import の隣に追加:

```typescript
import { formatKeywordSummary } from '../../utils/formatFilterSummary';
```

**Step 2: 食べたいものサマリーを差し替え**

`index.tsx` 行220-231 の三項演算子を、`formatKeywordSummary` 呼び出しに置き換え:

```tsx
// 変更前（行220-231）:
<span className="text-xs text-text-muted truncate">
  {selectedKeywords.length === 0
    ? '未選択'
    : isAllSelected
      ? 'すべて'
      : selectedKeywords
          .slice(0, 3)
          .map((k) => getKeywordLabel(k))
          .join('、') +
        (selectedKeywords.length > 3
          ? ` 他${selectedKeywords.length - 3}件`
          : '')}
</span>

// 変更後:
<span className="text-xs text-text-muted truncate">
  {formatKeywordSummary(selectedKeywords, getKeywordLabel)}
</span>
```

**Step 3: 条件サマリーにレビュー数を追加**

`index.tsx` 行266-272 に `minReviews` 表示を追加:

```tsx
// 変更前（行266-272）:
<span className="text-xs text-text-muted truncate">
  {searchRadius}m
  {selectedPriceLevels.length < 4 &&
    ` · ${selectedPriceLevels.map((l) => '¥'.repeat(l)).join(' ')}`}
  {minRating > 0 && ` · ${minRating}+`}
  {isOpenNow && ' · 営業中'}
</span>

// 変更後:
<span className="text-xs text-text-muted truncate">
  {searchRadius}m
  {selectedPriceLevels.length < 4 &&
    ` · ${selectedPriceLevels.map((l) => '¥'.repeat(l)).join(' ')}`}
  {minRating > 0 && ` · ${minRating}+`}
  {minReviews > 0 && ` · ${minReviews}+件`}
  {isOpenNow && ' · 営業中'}
</span>
```

**Step 4: 不要になった変数を確認**

`isAllSelected` 変数（行169-170）がサマリー以外で使われているか確認。

- 行215: バッジ表示の条件 `!isAllSelected && selectedKeywords.length > 0` → **まだ使用中**
- `allKeywordsCount`（行169）も `isAllSelected` の計算に必要 → **維持**

→ `isAllSelected` と `allKeywordsCount` はそのまま残す。

**Step 5: lint・型チェック・テスト実行**

Run: `npm run check && npm run test`
Expected: ALL PASS

**Step 6: コミット**

```bash
jj commit -m "feat: フィルターサマリーの「すべて」表示を実際のラベルに統一"
```

---

### Task 3: プッシュ

**Step 1: プッシュ**

```bash
jj git push
```

または（jj未インストール環境の場合）:

```bash
git push -u origin claude/unify-filter-ui-DKG3z
```
