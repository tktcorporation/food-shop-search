# UI実装の必須制約

IMPORTANT: このファイルはUI/UX実装時に自動適用される制約です。

## 視覚スタイル制約

### 角丸（Border Radius）
```
許可: rounded-sm, rounded, rounded-md, rounded-lg, rounded-full（チップのみ）
禁止: rounded-xl, rounded-2xl, rounded-3xl
```

### シャドウ（Box Shadow）
```
許可: shadow-sm, shadow, shadow-md, shadow-lg
禁止: shadow-xl, shadow-2xl, 色付きシャドウ（shadow-primary-500/50等）
```

### トランジション
```
許可: duration-150, duration-200
禁止: duration-300以上, 複数アニメーション同時使用
```

### カラー
```
許可: tailwind.config.js で定義されたカラーのみ
  - primary-*（メインアクション）
  - secondary-*（成功）
  - accent-*（警告/エラー）
  - gray-*（テキスト/背景）
禁止: 新規カラー追加, ネオンカラー, 虹色
```

### グラデーション
```
許可: 同系色2色まで（例: from-primary-50 to-primary-100）
禁止: 3色以上, 虹色, テキストへの適用
```

## 絶対禁止事項

```markdown
NEVER:
- グラデーションテキスト
- グロー/ネオン効果
- 装飾目的だけの要素
- カスタムCSS追加（index.css以外）
- 新しいデザインパターンの発明
- 既存コンポーネントと異なるスタイル
- 絵文字の使用（ユーザー要求時除く）
```

## コンポーネント参照（実装前に必ず確認）

| 用途 | 参照コンポーネント |
|------|-------------------|
| チップ/タグ | `src/components/ui/ToggleChip.tsx` |
| カード | `src/components/UnifiedSearchResultsScreen/RestaurantCard.tsx` |
| フィルターUI | `src/components/UnifiedSearchResultsScreen/SearchFilters.tsx` |
| エラー表示 | `src/components/ui/ErrorAlert.tsx` |
| ボタン | `src/index.css` の .btn クラス |

## 実装後チェック

```markdown
□ 角丸は rounded-lg か rounded-full（チップのみ）のみ使用
□ シャドウは shadow-lg 以下のみ使用
□ カラーは tailwind.config.js 定義のみ使用
□ 既存コンポーネントとスタイルが一貫している
□ 新しいパターンを発明していない
```
