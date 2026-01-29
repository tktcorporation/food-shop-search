# デザイントークン定義

IMPORTANT: UI実装時はこれらのトークンのみ使用してください。

## カラーパレット

> Clean & Pop - 白ベース + 鮮やかオレンジ + 明確なコントラスト

### Primary（オレンジ系）- メインアクション、位置情報

```css
primary-50:  #FFF7ED  /* 背景（非常に薄い） */
primary-100: #FFEDD5  /* 背景（薄い） */
primary-200: #FED7AA  /* ソフトオレンジ */
primary-300: #FDBA74  /* ミディアムライト */
primary-400: #FB923C  /* ミディアム */
primary-500: #F97316  /* メインカラー */
primary-600: #EA580C  /* ホバー */
primary-700: #C2410C  /* アクティブ */
```

### Gray - テキスト・背景・ボーダー

```css
gray-50:  #F9FAFB  /* 背景（薄い） */
gray-100: #F3F4F6  /* 背景（ミュート） */
gray-200: #E5E7EB  /* ボーダー（薄い） */
gray-300: #D1D5DB  /* ボーダー */
gray-400: #9CA3AF  /* テキスト（薄い） */
gray-500: #6B7280  /* テキスト（セカンダリ） */
gray-600: #4B5563  /* テキスト（ミディアム） */
gray-700: #374151  /* テキスト（やや濃い） */
gray-800: #1F2937  /* テキスト（プライマリ） */
gray-900: #111827  /* 見出し */
```

### Success（緑系）- 成功・確認・営業中

```css
success-light: #D1FAE5
success:       #10B981
success-dark:  #059669
```

### Error（赤系）- エラー・警告

```css
error-light: #FEE2E2
error:       #EF4444
error-dark:  #DC2626
```

## タイポグラフィ

```markdown
見出し（ページ）: text-2xl font-bold text-gray-900
見出し（セクション）: text-xl font-semibold text-gray-900
見出し（カード）: text-lg font-semibold text-gray-800
本文: text-base text-gray-700
補足: text-sm text-gray-500
メタ: text-xs text-gray-400
```

## スペーシング

```markdown
セクション間: space-y-6 または space-y-8
要素グループ間: space-y-4
関連要素間: space-y-2
ラベルと入力: mb-2
カード内パディング: p-4
ボタン内パディング: px-4 py-2.5
アイコンとテキスト: gap-2
```

## コンポーネントスタイル

### ボタン

```tsx
// Primary（1画面に1つ推奨）- 最も目立つ
'bg-primary-500 hover:bg-primary-600 text-white px-4 py-2.5 rounded-lg font-semibold transition-colors duration-200';

// Secondary - 控えめ
'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-4 py-2.5 rounded-lg font-medium transition-colors duration-200';

// Ghost - 最小限
'text-primary-500 hover:bg-primary-50 px-3 py-2 rounded-lg font-medium transition-colors duration-200';
```

### カード

```tsx
// 基本カード
'bg-white rounded-xl p-4 border border-gray-200 shadow-card';

// インタラクティブカード
'bg-white rounded-xl p-4 border border-gray-200 shadow-card hover:shadow-lg hover:border-gray-300 cursor-pointer transition-shadow duration-200';
```

### 入力フィールド

```tsx
'w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder:text-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20';
```

### チップ（選択状態）

```tsx
// 選択時 - 明確に目立つ
'bg-primary-500 text-white';

// 非選択時 - 控えめ
'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800';

// 共通
'px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-200';
```

### 位置情報バー（最も目立つ要素）

```tsx
'bg-primary-500 text-white px-4 py-3 rounded-lg font-semibold shadow-md';
```

## 視覚的階層

```
【強】位置情報バー ─ primary-500背景 + 白文字
 ↓
【中】お店カード ─ 白背景 + shadow-card + gray-200ボーダー
 ↓
【弱】フィルター等 ─ gray-100背景、gray-500テキスト
```
