# UI/UX デザインガイドライン

このドキュメントは、AIがUI/UXデザインを実装する際に「AIっぽさ」を避け、プロフェッショナルで一貫性のあるデザインを実現するためのガイドラインです。

## 目次

1. [AI向けプロンプティング手法](#ai向けプロンプティング手法)
2. [基本原則](#基本原則)
3. [デザインシステムの定義](#デザインシステムの定義)
4. [AIっぽさを避けるルール](#aiっぽさを避けるルール)
5. [視覚デザインルール](#視覚デザインルール)
6. [コンポーネント設計](#コンポーネント設計)
7. [UXパターン](#uxパターン)
8. [アンチパターン（避けるべきこと）](#アンチパターン避けるべきこと)
9. [実装チェックリスト](#実装チェックリスト)

---

## AI向けプロンプティング手法

IMPORTANT: **このセクションはClaude CodeにUI/UX実装を依頼する際の効果的な指示方法を説明します。**

### 制約ベースプロンプティング（Constraint-Based Prompting）

AIに「何をするか」を説明するより、「何をしないか」を明確に制約すると良い結果が得られます。

```markdown
❌ 悪い指示:
「かっこいいボタンを作って」

✅ 良い指示:
「以下の制約でボタンを作成してください:

- rounded-lg 以外の角丸は使用禁止
- shadow-lg を超えるシャドウは使用禁止
- グラデーションは使用禁止
- アニメーションは hover 時の色変化のみ（duration-200）
- 既存の ToggleChip コンポーネント（src/components/ui/ToggleChip.tsx）のスタイルを参考に」
```

### TC-EBCフレームワーク

UI実装の依頼時は、以下の構造で指示すると精度が向上します：

```xml
<task>
何を実装するか（具体的な機能や画面）
</task>

<context>
なぜ必要か、誰のためか、どの画面に配置されるか
既存の類似コンポーネントがあればパスを記載
</context>

<constraints>
- 使用可能なカラー: primary-*, gray-*, green-*, red-* のみ
- 角丸: rounded-lg に統一
- シャドウ: shadow-lg 以下
- アニメーション: transition-colors duration-200 のみ
- 新しいCSSクラスの作成禁止
- Tailwindのデフォルトクラスのみ使用
</constraints>

<existing-patterns>
参照すべき既存コンポーネント:
- src/components/ui/ToggleChip.tsx（チップスタイル）
- src/components/UnifiedSearchResultsScreen/RestaurantCard.tsx（カードスタイル）
</existing-patterns>

<output-format>
- TypeScript + React
- Tailwind CSS のみ（カスタムCSSなし）
- propsの型定義を含める
</output-format>
```

### スクリーンショット活用

Claude Codeは画像を理解できます。UI実装時は：

```markdown
1. 既存画面のスクリーンショットをドラッグ&ドロップで共有
2. 「この画面と一貫したスタイルで〇〇を追加してください」と依頼
3. デザインモックがあれば「このモックを、既存のデザインシステムに合わせて実装してください」
```

### 既存コンポーネント参照の強制

新しいUIを作る前に、必ず既存パターンを参照させます：

```markdown
「新しいコンポーネントを作成する前に、以下を確認してください：

1. src/components/ui/ に類似コンポーネントがないか
2. src/components/UnifiedSearchResultsScreen/ の既存パターン
3. tailwind.config.js で定義されたカラーパレット

既存のパターンがあれば、それを再利用または拡張してください。
新しいデザインパターンの発明は禁止です。」
```

### 段階的実装の指示

複雑なUIは段階的に依頼すると品質が向上します：

```markdown
Step 1: 「まず、RestaurantCard.tsx を読んで、そのデザインパターンを説明してください」

Step 2: 「そのパターンに従って、新しい〇〇カードのコンポーネント構造を提案してください（コードは書かない）」

Step 3: 「提案した構造を実装してください。以下の制約を守ること：[制約リスト]」

Step 4: 「実装したコンポーネントが、既存の RestaurantCard と視覚的に一貫しているか確認してください」
```

### 否定的制約（Negative Constraints）

「やらないこと」を明確にすると、AIっぽさを防げます：

```markdown
<never>
以下は絶対に行わないでください：
- グラデーションテキスト
- 虹色の配色
- shadow-2xl 以上のシャドウ
- rounded-2xl 以上の角丸
- 複数のアニメーション同時使用
- ネオンカラー/グロー効果
- 装飾目的だけの要素追加
- 新しいカラーの導入（tailwind.config.js にないもの）
- カスタムCSSの追加
- 絵文字の使用
</never>
```

### 一貫性チェックの依頼

実装後に一貫性を確認させます：

```markdown
「実装が完了したら、以下をチェックしてください：

□ 使用した角丸は全て rounded-lg か rounded-full（チップのみ）
□ 使用したシャドウは shadow または shadow-lg のみ
□ カラーは tailwind.config.js で定義されたもののみ
□ 既存コンポーネントと比較して、スタイルに違和感がないか
□ 新しいデザインパターンを発明していないか

問題があれば自動的に修正してください。」
```

### 効果的な依頼例

```markdown
## 良い例：フィルターチップの追加

<task>
検索フィルターに「24時間営業」チップを追加
</task>

<context>
SearchFilters.tsx の価格帯フィルターの下に配置
ToggleChip コンポーネントを再利用
</context>

<constraints>
- ToggleChip コンポーネントをそのまま使用
- 新しいスタイルの追加禁止
- 状態管理は既存の isOpenNow と同様のパターン
</constraints>

<reference>
src/components/ui/ToggleChip.tsx
src/components/UnifiedSearchResultsScreen/SearchFilters.tsx:138-148
</reference>
```

```markdown
## 悪い例

「フィルターにチップを追加して。かっこよくして。」

→ 制約がないため、AIが独自のスタイルを発明してしまう
```

---

## 基本原則

### 4つの核心原則（CECS）

| 原則                         | 説明                                                   | 実践                     |
| ---------------------------- | ------------------------------------------------------ | ------------------------ |
| **Clarity（明確性）**        | 曖昧さを排除し、ユーザーが理解・行動できるようにする   | 1つの要素に1つの役割のみ |
| **Efficiency（効率性）**     | ワークフローを最適化し、ユーザーの目的達成を最短にする | 不要なステップを削除     |
| **Consistency（一貫性）**    | 同じ問題には同じ解決策を適用する                       | パターンの再利用         |
| **Simplicity（シンプルさ）** | 最小限の要素で最大限の価値を提供する                   | 足すより引く             |

### 設計時の問いかけ

デザインを実装する前に、必ず以下を自問してください：

```
「この要素は、ユーザーが目的を達成するのに必要か？」
```

「はい」と明確に答えられない場合、その要素は不要です。

---

## デザインシステムの定義

### このプロジェクトのデザイントークン

```typescript
// カラーパレット（tailwind.config.js で定義済み）
const colors = {
  // Primary: 青系 - メインアクション、ブランドカラー
  primary: {
    50: '#f0f9ff', // 背景（非常に薄い）
    100: '#e0f2fe', // 背景（薄い）
    500: '#0ea5e9', // メインカラー
    600: '#0284c7', // ホバー状態
    700: '#0369a1', // アクティブ状態
  },
  // Secondary: 緑系 - 成功、確認
  secondary: {
    500: '#10b981',
    600: '#059669',
  },
  // Accent: 赤系 - 警告、削除、重要
  accent: {
    500: '#f43f5e',
    600: '#e11d48',
  },
  // Neutral: グレー系 - テキスト、ボーダー、背景
  gray: {
    50: '#f9fafb', // 背景
    100: '#f3f4f6', // カード背景
    200: '#e5e7eb', // ボーダー（薄い）
    300: '#d1d5db', // ボーダー
    500: '#6b7280', // セカンダリテキスト
    700: '#374151', // プライマリテキスト
    900: '#111827', // 見出し
  },
};

// スペーシングスケール（Tailwindデフォルト）
const spacing = {
  xs: '0.25rem', // 4px - 要素内の最小間隔
  sm: '0.5rem', // 8px - 関連要素間
  md: '1rem', // 16px - セクション内
  lg: '1.5rem', // 24px - セクション間
  xl: '2rem', // 32px - 大きなセクション間
};

// タイポグラフィスケール
const typography = {
  xs: '0.75rem', // 12px - 補足情報
  sm: '0.875rem', // 14px - 本文（小）
  base: '1rem', // 16px - 本文
  lg: '1.125rem', // 18px - 本文（大）
  xl: '1.25rem', // 20px - 見出し（小）
  '2xl': '1.5rem', // 24px - 見出し
  '3xl': '1.875rem', // 30px - ページタイトル
};

// 角丸スケール
const borderRadius = {
  none: '0',
  sm: '0.125rem', // 2px - 最小
  md: '0.375rem', // 6px - 標準
  lg: '0.5rem', // 8px - カード
  full: '9999px', // チップ、アバター
};

// シャドウスケール
const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
};
```

### カラー使用ルール

| 用途                       | カラー                         | クラス例                                         |
| -------------------------- | ------------------------------ | ------------------------------------------------ |
| メインアクション（ボタン） | primary-500/600                | `bg-primary-500 hover:bg-primary-600`            |
| 成功・確認                 | secondary-500 または green-500 | `text-green-600`                                 |
| 警告・エラー               | accent-500 または red-500      | `text-red-600`                                   |
| 本文テキスト               | gray-700                       | `text-gray-700`                                  |
| 補足テキスト               | gray-500                       | `text-gray-500`                                  |
| ボーダー                   | gray-200/300                   | `border-gray-200`                                |
| 背景（ページ）             | primary-50 to primary-100      | `bg-linear-to-br from-primary-50 to-primary-100` |
| 背景（カード）             | white                          | `bg-white`                                       |

---

## AIっぽさを避けるルール

### 絶対に避けるべきこと（NEVER）

```markdown
❌ 過剰なグラデーション

- 虹色グラデーション
- 3色以上のグラデーション
- テキストへのグラデーション適用

❌ 過剰な角丸

- rounded-3xl 以上の角丸（特殊なケース除く）
- 要素ごとに異なる角丸

❌ 過剰なシャドウ

- 複数レイヤーのシャドウ
- 色付きシャドウ（shadow-primary-500/50 など）
- shadow-2xl 以上

❌ 過剰なアニメーション

- 3つ以上のアニメーションの同時使用
- 目的のない装飾的アニメーション
- 0.3秒以上のトランジション（特殊なケース除く）

❌ 過剰な装飾

- グローエフェクト
- ネオンカラー
- 複雑なパターン背景
- 無意味なアイコン・絵文字

❌ 一貫性のないスタイル

- ページごとに異なるボタンスタイル
- コンポーネントごとに異なる角丸
- 場所によって異なるスペーシング
```

### 推奨するアプローチ（PREFER）

```markdown
✅ シンプルで機能的

- 1-2色のグラデーション（同系色）
- 統一された角丸（このプロジェクトでは rounded-lg）
- 控えめなシャドウ（shadow, shadow-lg まで）

✅ 意図のあるデザイン

- 各要素に明確な目的がある
- ホワイトスペースを機能として活用
- フォーカス状態・ホバー状態の一貫性

✅ 親しみやすいパターン

- ユーザーが予測できる操作
- 一般的なUIパターンの使用
- 明確な視覚的階層
```

### 具体的な制約

```typescript
// ボタンスタイルの制約
const buttonConstraints = {
  maxRounded: 'rounded-lg', // rounded-xl 以上禁止
  maxShadow: 'shadow-lg', // shadow-xl 以上禁止
  transitionDuration: '200ms', // 300ms 以上禁止
  hoverScale: '1.02', // 1.05 以上禁止
};

// カードスタイルの制約
const cardConstraints = {
  rounded: 'rounded-lg', // 統一
  shadow: 'shadow-lg', // 基本
  hoverShadow: 'shadow-xl', // ホバー時
  padding: 'p-4', // 統一
};

// テキストスタイルの制約
const textConstraints = {
  maxTitleSize: 'text-3xl', // 見出しの最大
  lineClamp: 2, // テキストの最大行数
  noGradientText: true, // グラデーションテキスト禁止
};
```

---

## 視覚デザインルール

### タイポグラフィ階層

```tsx
// 見出し階層（必ずこの順序を守る）
<h1 className="text-2xl font-bold text-gray-900">    // ページタイトル
<h2 className="text-xl font-semibold text-gray-900"> // セクションタイトル
<h3 className="text-lg font-semibold text-gray-800"> // カードタイトル
<p className="text-base text-gray-700">              // 本文
<span className="text-sm text-gray-500">            // 補足情報
<span className="text-xs text-gray-400">            // メタ情報
```

### スペーシングルール

```markdown
## 垂直方向のリズム

セクション間: space-y-6 または space-y-8
要素グループ間: space-y-4
関連要素間: space-y-2
ラベルと入力: mb-2

## 水平方向のリズム

カード内パディング: p-4
ボタン内パディング: px-4 py-2
アイコンとテキスト: gap-2
要素間: gap-2 または gap-4
```

### 状態の視覚的表現

```tsx
// ボタン状態
const buttonStates = {
  default: 'bg-primary-500 text-white',
  hover: 'hover:bg-primary-600',
  focus: 'focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
  disabled: 'disabled:bg-gray-300 disabled:cursor-not-allowed',
  loading: 'opacity-75 cursor-wait',
};

// 入力フィールド状態
const inputStates = {
  default: 'border-gray-300',
  focus: 'focus:ring-primary-500 focus:border-primary-500',
  error: 'border-red-500 focus:ring-red-500',
  disabled: 'bg-gray-100 cursor-not-allowed',
};

// カード状態
const cardStates = {
  default: 'bg-white shadow-lg',
  hover: 'hover:shadow-xl hover:scale-[1.02]',
  selected: 'ring-2 ring-primary-500',
  disabled: 'opacity-50 pointer-events-none',
};
```

---

## コンポーネント設計

### コンポーネント設計の原則

1. **単一責任**: 1つのコンポーネントは1つのことだけを行う
2. **合成可能**: 小さなコンポーネントを組み合わせて複雑なUIを構築
3. **予測可能**: 同じpropsには常に同じ見た目・動作
4. **アクセシブル**: キーボード操作、スクリーンリーダー対応

### 標準コンポーネントパターン

```tsx
// ボタン（3つのバリアントのみ）
type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

// primary: メインアクション（1画面に1つ推奨）
<button className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg">
  保存
</button>

// secondary: サブアクション
<button className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg">
  キャンセル
</button>

// ghost: 控えめなアクション
<button className="text-primary-600 hover:bg-primary-50 px-4 py-2 rounded-lg">
  詳細を見る
</button>
```

```tsx
// カード（統一パターン）
<div className="bg-white rounded-lg shadow-lg overflow-hidden">
  {/* 画像エリア（任意） */}
  <div className="aspect-video bg-gray-100">
    <img src={src} alt={alt} className="w-full h-full object-cover" />
  </div>

  {/* コンテンツエリア */}
  <div className="p-4">
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-sm text-gray-500">{description}</p>
  </div>
</div>
```

```tsx
// 入力フィールド（統一パターン）
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    {label}
  </label>
  <input
    className="w-full px-4 py-2 border border-gray-300 rounded-lg
               focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
  />
  {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
</div>
```

### コンポーネント命名規則

```markdown
## ファイル名

- PascalCase: SearchFilters.tsx, RestaurantCard.tsx
- 機能を表す名前: LocationSearch.tsx（×LocationSearchComponent.tsx）

## Props命名

- booleanは is/has/can 接頭辞: isLoading, hasError, canSubmit
- イベントハンドラは on 接頭辞: onClick, onSubmit, onChange
- データは名詞: restaurant, searchResults, filters

## CSSクラス名（Tailwind使用時）

- 状態順: レイアウト → サイズ → 色 → 状態
- 例: "flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
```

---

## UXパターン

### フィードバックの原則

ユーザーのすべてのアクションに対して、適切なフィードバックを提供する：

```tsx
// 1. 即座の視覚的フィードバック（hover, active）
<button className="transition-colors duration-200 hover:bg-primary-600 active:bg-primary-700">

// 2. ローディング状態
<button disabled={isLoading}>
  {isLoading ? (
    <>
      <Spinner className="animate-spin mr-2" />
      処理中...
    </>
  ) : '検索'}
</button>

// 3. 成功・エラーメッセージ
{status === 'success' && (
  <div className="bg-green-50 text-green-700 p-4 rounded-lg">
    保存しました
  </div>
)}
{status === 'error' && (
  <div className="bg-red-50 text-red-700 p-4 rounded-lg">
    エラーが発生しました: {errorMessage}
  </div>
)}
```

### 操作の一貫性

```markdown
## クリック可能要素の視覚的ヒント

- cursor-pointer クラスを必ず付与
- ホバー時の変化（色、シャドウ）
- フォーカス時のリング

## 同じアクションには同じ見た目

- 削除系: 赤系カラー + ゴミ箱アイコン
- 追加系: 緑系またはprimary + プラスアイコン
- 編集系: gray系 + 鉛筆アイコン
- 外部リンク: ExternalLinkアイコン

## 位置の一貫性

- メインアクション: 右側または下部
- キャンセル: メインアクションの左側
- 削除: 右上または最後
```

### 情報階層

```markdown
## 視覚的重み順（重い→軽い）

1. 大きいテキスト + 太字 + 濃い色
2. 通常サイズ + 太字 + 濃い色
3. 通常サイズ + 通常ウェイト + 濃い色
4. 小さいサイズ + 通常ウェイト + 薄い色

## 空間的階層

1. 最も重要: 上部または中央
2. 次に重要: 直下または隣接
3. 補助的: 下部またはセカンダリエリア
```

### 空状態・エラー状態の設計

```tsx
// 空状態（Empty State）
<div className="text-center py-12">
  <SearchIcon className="mx-auto h-12 w-12 text-gray-400" />
  <h3 className="mt-4 text-lg font-medium text-gray-900">
    検索結果がありません
  </h3>
  <p className="mt-2 text-sm text-gray-500">
    別のキーワードで検索してみてください
  </p>
  <button className="mt-4 btn-primary">
    条件を変更
  </button>
</div>

// エラー状態
<div className="bg-red-50 border border-red-200 rounded-lg p-4">
  <div className="flex items-start">
    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
    <div className="ml-3">
      <h3 className="text-sm font-medium text-red-800">
        エラーが発生しました
      </h3>
      <p className="mt-1 text-sm text-red-700">
        {errorMessage}
      </p>
      <button className="mt-2 text-sm text-red-600 underline">
        再試行
      </button>
    </div>
  </div>
</div>
```

---

## アンチパターン（避けるべきこと）

### 視覚的アンチパターン

```markdown
❌ 虹色・ネオン配色
理由: プロフェッショナル感が失われる

❌ 過度なグラデーション・グロー効果
理由: 安っぽく見える、可読性低下

❌ 不揃いな角丸・シャドウ
理由: 統一感がなく雑然とした印象

❌ 密集した要素配置
理由: 情報過多で認知負荷が高い

❌ 目的のないアニメーション
理由: ユーザーの注意を散漫にする
```

### UXアンチパターン

```markdown
❌ Hide and Hover（ホバーしないと見えない）
理由: 操作可能な要素が分からない

❌ 小さすぎるクリックターゲット
理由: タップ・クリックしづらい（最小44x44px推奨）

❌ Whiplash レイアウト（ジグザグ配置）
理由: 視線の流れが悪く読みづらい

❌ 過度な選択肢
理由: 決定疲れを引き起こす（Hick's Law）

❌ 確認なしの破壊的アクション
理由: 誤操作による取り返しのつかない結果
```

### AIが陥りがちなパターン

```markdown
❌ 装飾のための装飾
→ 代わりに: 機能的な要素のみ追加

❌ 「かっこいい」という理由だけの選択
→ 代わりに: ユーザーの目的達成に寄与するか確認

❌ 複数のスタイルの混在
→ 代わりに: 既存のデザインシステムに従う

❌ 過剰な視覚的差別化
→ 代わりに: 類似要素は類似した見た目に

❌ 新しいパターンの発明
→ 代わりに: 確立されたUIパターンを使用
```

---

## 実装チェックリスト

### デザイン実装前

```markdown
□ 既存のコンポーネントで実現できないか確認した
□ デザインシステムのトークン（色、スペーシング、角丸）を使用している
□ 同様のUIが既にある場合、そのパターンに従っている
□ 1画面でのprimaryボタンは1つ以下
```

### 実装中

```markdown
□ rounded は rounded-lg に統一（特殊なケース除く）
□ shadow は shadow-lg 以下に制限
□ アニメーションは duration-200 以下
□ グラデーションは同系色2色まで
□ ホバー状態とフォーカス状態を定義した
□ 全てのインタラクティブ要素に cursor-pointer を付与
□ クリックターゲットは最小 44x44px
```

### 実装後

```markdown
□ 全てのテキストが読める（コントラスト比4.5:1以上）
□ 空状態・エラー状態・ローディング状態を実装した
□ キーボードで操作できる
□ モバイルで表示・操作を確認した
□ 既存の画面と見た目の一貫性がある
```

### レビュー時の確認

```markdown
□ 「この要素は必要か？」と問うた時に全て「はい」と答えられる
□ 装飾的な要素を追加していない
□ 新しいデザインパターンを発明していない
□ ユーザーの目的達成を最短経路で実現している
```

---

## 参考リソース

- [NN/g - Design Systems 101](https://www.nngroup.com/articles/design-systems-101/)
- [Figma - Consistency in Design](https://www.figma.com/resource-library/consistency-in-design/)
- [UXPin - Component-Based Design](https://www.uxpin.com/studio/blog/component-based-design-complete-implementation-guide/)
- [State of UX 2026](https://www.nngroup.com/articles/state-of-ux-2026/)

---

## 更新履歴

- 2026-01-29: 初版作成
