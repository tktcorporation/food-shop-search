# UI実装プロンプトテンプレート

このテンプレートは、Claude CodeにUI/UX実装を依頼する際に使用します。
制約ベースのアプローチにより、AIっぽさを避けた一貫性のあるデザインを実現します。

## 基本テンプレート

```xml
<task>
[何を実装するか - 具体的な機能や画面を記述]
例: 「お気に入り」ボタンをRestaurantCardに追加
</task>

<context>
[なぜ必要か、誰のためか、どの画面に配置されるか]
例: ユーザーがレストランを保存できるようにするため。
RestaurantCard の右上に配置。
</context>

<existing-patterns>
[参照すべき既存コンポーネントのパス]
- src/components/ui/ToggleChip.tsx
- src/components/UnifiedSearchResultsScreen/RestaurantCard.tsx
</existing-patterns>

<constraints>
必須制約:
- rounded-lg に統一（チップのみ rounded-full）
- shadow-lg 以下のみ
- transition-colors duration-200 のみ
- tailwind.config.js のカラーのみ使用

禁止事項:
- グラデーションテキスト
- shadow-2xl 以上
- rounded-2xl 以上
- ネオンカラー/グロー効果
- 装飾目的だけの要素
- カスタムCSS
- 新しいデザインパターンの発明
</constraints>

<output-format>
- TypeScript + React
- Tailwind CSS のみ
- props の型定義を含める
- 既存パターンとの一貫性を保つ
</output-format>

<verification>
実装後、以下を確認:
□ 使用した角丸は全て rounded-lg か rounded-full（チップのみ）
□ 使用したシャドウは shadow または shadow-lg のみ
□ カラーは tailwind.config.js で定義されたもののみ
□ 既存コンポーネントと視覚的に一貫している
□ 新しいデザインパターンを発明していない
</verification>
```

---

## 具体例

### 例1: 新しいボタンの追加

```xml
<task>
検索結果をリセットする「クリア」ボタンを SearchFilters に追加
</task>

<context>
SearchFilters.tsx の最下部に配置。
ユーザーが選択したフィルターを一括リセットできるようにする。
セカンダリアクションのため、控えめなスタイル。
</context>

<existing-patterns>
- src/components/ui/ToggleChip.tsx（ボタンスタイルの参考）
- src/components/UnifiedSearchResultsScreen/SearchFilters.tsx（配置場所）
</existing-patterns>

<constraints>
ボタンスタイル:
- variant: secondary（bg-gray-200 hover:bg-gray-300 text-gray-700）
- rounded-lg
- px-4 py-2
- transition-colors duration-200

禁止:
- primary カラーの使用（メインアクションではないため）
- シャドウの追加
- アイコンの追加（テキストのみ）
</constraints>

<output-format>
既存の SearchFilters.tsx に追加するコードのみ提供
</output-format>
```

### 例2: カードコンポーネントの新規作成

```xml
<task>
検索履歴を表示する SearchHistoryCard コンポーネントを作成
</task>

<context>
ユーザーの過去の検索キーワードと日時を表示。
タップで再検索できる。
一覧で表示されるため、RestaurantCard よりシンプルに。
</context>

<existing-patterns>
- src/components/UnifiedSearchResultsScreen/RestaurantCard.tsx（カード構造の参考）
- src/index.css（.btn クラスの参考）
</existing-patterns>

<constraints>
カードスタイル:
- bg-white rounded-lg shadow（shadow-lg ではなく shadow）
- p-3（RestaurantCard より小さいパディング）
- hover:shadow-lg hover:scale-[1.01]（控えめなホバー効果）

内容:
- 検索キーワード: text-base font-medium text-gray-800
- 日時: text-xs text-gray-500
- 削除ボタン: text-gray-400 hover:text-red-500（右端に配置）

禁止:
- 画像の使用
- 複数のアクションボタン
- アニメーション（ホバー以外）
</constraints>

<output-format>
- 新規ファイル: src/components/SearchHistoryCard.tsx
- interface SearchHistoryCardProps を定義
- React.FC で型付け
</output-format>
```

### 例3: 既存コンポーネントの修正

```xml
<task>
RestaurantCard に「営業中」バッジを追加
</task>

<context>
現在、営業時間は詳細セクションに表示されている。
カード上部に目立つバッジとして表示し、営業中の店舗が一目で分かるようにする。
</context>

<existing-patterns>
- src/components/UnifiedSearchResultsScreen/RestaurantCard.tsx:109-116（businessStatusInfo バッジの参考）
</existing-patterns>

<constraints>
バッジスタイル（営業中）:
- bg-green-100 text-green-800
- px-2 py-0.5
- rounded-full
- text-xs font-medium
- 配置: 画像の左上（既存の businessStatusInfo バッジと同じ位置ロジック）

営業時間外の場合:
- バッジを表示しない（または bg-gray-100 text-gray-600）

禁止:
- アニメーション（点滅など）
- アイコンの追加
- 既存の営業時間表示との重複
</constraints>

<output-format>
RestaurantCard.tsx への差分のみ提供
</output-format>
```

---

## チェックリスト（実装前に確認）

UI実装を依頼する前に、以下を確認してください：

- [ ] 既存の類似コンポーネントを特定した
- [ ] 参照すべきファイルパスを記載した
- [ ] 具体的な制約を明記した
- [ ] 禁止事項を明記した
- [ ] 出力形式を指定した

---

## 参考リソース

- **.claude/rules/ui-ux-design.md** - 完全なデザインガイドライン（自動読み込み）
- **tailwind.config.js** - カラーパレット定義
- **src/index.css** - グローバルスタイル（.btn など）
