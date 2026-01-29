# デザイントークン定義

IMPORTANT: UI実装時はこれらのトークンのみ使用してください。

## カラーパレット

### Primary（青系）- メインアクション
```css
primary-50:  #f0f9ff  /* 背景（非常に薄い） */
primary-100: #e0f2fe  /* 背景（薄い） */
primary-500: #0ea5e9  /* メインカラー */
primary-600: #0284c7  /* ホバー */
primary-700: #0369a1  /* アクティブ */
```

### Secondary（緑系）- 成功・確認
```css
secondary-500: #10b981
secondary-600: #059669
```

### Accent（赤系）- 警告・エラー
```css
accent-500: #f43f5e
accent-600: #e11d48
```

### Gray - テキスト・背景
```css
gray-50:  #f9fafb  /* 背景 */
gray-100: #f3f4f6  /* カード背景 */
gray-200: #e5e7eb  /* ボーダー（薄い） */
gray-300: #d1d5db  /* ボーダー */
gray-500: #6b7280  /* セカンダリテキスト */
gray-700: #374151  /* プライマリテキスト */
gray-900: #111827  /* 見出し */
```

## タイポグラフィ

```markdown
見出し（ページ）:   text-2xl font-bold text-gray-900
見出し（セクション）: text-xl font-semibold text-gray-900
見出し（カード）:   text-lg font-semibold text-gray-800
本文:            text-base text-gray-700
補足:            text-sm text-gray-500
メタ:            text-xs text-gray-400
```

## スペーシング

```markdown
セクション間:      space-y-6 または space-y-8
要素グループ間:    space-y-4
関連要素間:        space-y-2
ラベルと入力:      mb-2
カード内パディング: p-4
ボタン内パディング: px-4 py-2
アイコンとテキスト: gap-2
```

## コンポーネントスタイル

### ボタン
```tsx
// Primary（1画面に1つ推奨）
"bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"

// Secondary
"bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition-colors duration-200"

// Ghost
"text-primary-600 hover:bg-primary-50 px-4 py-2 rounded-lg transition-colors duration-200"
```

### カード
```tsx
"bg-white rounded-lg shadow-lg overflow-hidden"
// ホバー時
"hover:shadow-xl hover:scale-[1.02] transition-transform duration-200"
```

### 入力フィールド
```tsx
"w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
```

### チップ（選択状態）
```tsx
// 選択時
"bg-primary-500 text-white"
// 非選択時
"bg-gray-200 text-gray-700 hover:bg-gray-300"
// 共通
"px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200"
```
