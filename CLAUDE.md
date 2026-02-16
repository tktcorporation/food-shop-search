# Claude Code 開発ガイド

このドキュメントは、Claude Codeを使用してこのプロジェクトを開発する際のガイドラインと重要な情報をまとめています。

## プロジェクト概要

グルメスポット検索アプリケーション - Google Maps APIを使用して、現在地や駅周辺のレストランを検索できるWebアプリケーション。

- **技術スタック**: React 18 + TypeScript + Vite
- **スタイリング**: Tailwind CSS
- **地図API**: Google Maps API
- **状態管理**: React Hooks
- **リント**: oxlint (OXC toolchain) + oxlint-tsgolint (type-aware)
- **フォーマット**: oxfmt (OXC toolchain)
- **型チェック**: tsgo (TypeScript Go / TypeScript 7 native preview)

## 環境管理

IMPORTANT: このプロジェクトは **mise** を使用してNode.jsバージョンを管理しています。

```bash
# 推奨セットアップ
mise install        # Node.js 22 LTSを自動インストール
npm install         # 依存関係のインストール
npm run dev         # 開発サーバー起動
```

## よく使うコマンド

### NPM コマンド

```bash
# 開発
npm run dev           # 開発サーバー起動 (http://localhost:5173)
npm run build         # 本番ビルド (tsgo型チェック + vite build)
npm run preview       # ビルドしたアプリをプレビュー

# コード品質
npm run lint          # oxlint (type-aware linting via tsgolint)
npm run lint:quick    # oxlint (型情報なしの高速lint)
npm run format        # oxfmt でコードフォーマット
npm run format:check  # oxfmt でフォーマットチェック
npm run typecheck     # tsgo で型チェック
npm run check         # lint + format:check + typecheck を一括実行

# Git ワークフロー
git status          # 変更状況を確認
git add .           # すべての変更をステージング
git commit -m "..." # コミット
git push            # リモートにプッシュ

# 依存関係の管理
npm install <package>       # パッケージのインストール
npm install <package> --save-dev  # 開発依存関係のインストール
npm outdated                # 古いパッケージの確認
```

### Claude Code カスタムコマンド

`.claude/commands/` ディレクトリに以下のカスタムコマンドが用意されています：

- `/project:dev-check` - 開発環境のセットアップと動作確認を実施
- `/project:build-check` - 本番ビルド前の総合チェックを実施
- `/project:api-debug` - Google Maps API関連の問題をデバッグ
- `/project:add-feature <機能名>` - 新機能追加時のチェックリストを実行

これらのコマンドは繰り返し実行する作業を効率化します。

### プロンプトテンプレート

IMPORTANT: **効果的なコミュニケーションのため、`.claude/prompts/` ディレクトリのテンプレートを活用してください。**

利用可能なテンプレート：

- **feature-implementation.md** - 新機能実装時（XMLタグで構造化）
- **bug-fix.md** - バグ修正時（段階的思考を活用）
- **code-review.md** - コードレビュー依頼時（多角的な分析）
- **refactoring.md** - リファクタリング時（段階的アプローチ）
- **README.md** - テンプレートの使い方とベストプラクティス

これらのテンプレートは、Anthropicの最新プロンプトエンジニアリングベストプラクティス
（コンテキストエンジニアリング、XMLタグ構造化、思考タグ、Few-shot examples）に基づいています。

## Claude Code とのコミュニケーション最適化

このプロジェクトでは、Claude Codeと効果的にコミュニケーションするためのベストプラクティスを採用しています。

### コンテキストエンジニアリングの原則

IMPORTANT: **コンテキストは有限なリソースです**。以下の原則に従って最適化してください：

> "望ましい結果の可能性を最大化する、最小限の高シグナルトークンのセットを見つける"

#### 1. XMLタグで構造化

Claudeはプロンプト内のXMLタグを認識して処理するため、明確な構造化が可能です：

```markdown
<instructions>
この機能を実装してください：
- レストラン検索APIを呼び出す
- 結果をキャッシュする
- エラーハンドリングを実装する
</instructions>

<context>
現在のキャッシュ実装は src/utils/cacheManager.ts にあります。
APIキーは環境変数 VITE_GOOGLE_MAPS_API_KEY から取得します。
</context>

<constraints>
- キャッシュの有効期限は24時間
- エラー時はユーザーフレンドリーなメッセージを表示
</constraints>
```

#### 2. 段階的思考（Step-by-Step Thinking）

複雑なタスクでは、Claudeに段階的に考えるよう指示すると精度が40%向上します：

```markdown
以下のバグを修正してください。まず <thinking> タグ内で：

1. 問題の根本原因を分析
2. 修正方法を検討
3. 影響範囲を評価

その後、<answer> タグ内で修正コードを提供してください。
```

#### 3. Few-Shot Examples（少数例示）

期待する動作を示すには、網羅的なリストではなく、代表的な例を2-3個提示：

```markdown
以下のパターンでコミットメッセージを作成してください：

<example>
feat: Google Maps APIキャッシュ機能を追加

- cacheManager.tsに24時間キャッシュを実装
- API呼び出し回数を削減してコスト最適化
  </example>

<example>
fix: レストラン検索で営業時間フィルターが機能しない問題を修正

- useOperatingHours.tsのタイムゾーン処理を修正
- 深夜営業の判定ロジックを改善
  </example>
```

### 効果的なコンテキスト管理戦略

#### 動的コンテキスト検索

ファイルパス、関数名、変数名などの軽量な識別子を使用：

```markdown
❌ 悪い例：
「src/components/Map.tsx の全コードをここに貼り付けて...」

✅ 良い例：
「src/components/Map.tsx:45-67 の useEffect フックを確認して、
Google Maps APIの初期化ロジックを最適化してください」
```

#### ファイル構造をシグナルとして活用

```markdown
- composables/ → ビジネスロジックに関連
- hooks/ → React固有の機能
- utils/ → 汎用ユーティリティ

この命名規則に従って、新しいレストラン検索ロジックを
適切なディレクトリに配置してください。
```

### コンテキスト最適化のチェックリスト

Claude Codeと対話する際は以下を意識してください：

- [ ] **明確な指示**: 曖昧さを避け、具体的な要件を記述
- [ ] **コンテキストの動機**: なぜその変更が必要か説明
- [ ] **構造化**: XMLタグやMarkdownでセクション分け
- [ ] **関連ファイルのパス**: 具体的なファイルパスと行番号を提示
- [ ] **期待する動作**: 良い例・悪い例で明示
- [ ] **制約条件**: 守るべきルールや制限を明記

### コマンド実行時のベストプラクティス

カスタムコマンドを効果的に使用するために：

```bash
# ❌ 悪い例：情報不足
/project:add-feature 検索機能

# ✅ 良い例：具体的で明確
/project:add-feature 駅名の曖昧検索機能（東京→東京駅、新宿→新宿駅など）
```

これらのコマンドは繰り返し実行する作業を効率化します。

## Git ブランチ規則

IMPORTANT: このプロジェクトでは以下のブランチ命名規則を使用してください。

- **feature/**: 新機能の開発 (例: `feature/add-favorite-restaurants`)
- **fix/**: バグ修正 (例: `fix/map-rendering-issue`)
- **refactor/**: リファクタリング (例: `refactor/cache-manager`)
- **docs/**: ドキュメントの更新 (例: `docs/update-readme`)
- **claude/**: Claude Codeによる自動生成ブランチ (例: `claude/setup-mise-environment-*`)

## プロジェクト構造

```
src/
├── components/              # Reactコンポーネント
│   ├── Map.tsx             # Google Maps表示コンポーネント
│   ├── RouletteScreen.tsx  # ルーレット機能画面
│   └── UnifiedSearchResultsScreen/  # 統合検索結果画面
│       ├── index.tsx
│       ├── LocationSearch.tsx
│       └── StationSearch.tsx
├── composables/            # カスタムフック（Vueの命名を踏襲）
│   ├── useLocationSearch.ts       # 現在地検索ロジック
│   ├── useStationSearch.ts        # 駅検索ロジック
│   ├── useRestaurantSearch.ts     # レストラン検索ロジック
│   └── useOperatingHours.ts       # 営業時間フィルター
├── hooks/                  # React固有のフック
│   └── useAnalytics.ts     # Google Analytics統合
├── utils/                  # ユーティリティ関数
│   ├── cacheManager.ts     # キャッシュ管理
│   ├── keywordOptions.ts   # 検索キーワードオプション
│   ├── stationShortcuts.ts # 駅のショートカット
│   └── operatingHours.ts   # 営業時間関連ユーティリティ
├── App.tsx                 # メインアプリケーション
├── main.tsx               # エントリーポイント
└── index.css              # グローバルスタイル（Tailwind設定含む）
```

## 重要な設計パターン

### 1. Composables vs Hooks

- **composables/**: ビジネスロジックに関連するカスタムフック
  - 例: `useRestaurantSearch`, `useLocationSearch`, `useStationSearch`
- **hooks/**: React固有の機能や外部サービス統合
  - 例: `useAnalytics`

### 2. Google Maps API の使用

IMPORTANT: **APIキーの取り扱いに注意してください！**

- **APIキー**: `.env`ファイルの`VITE_GOOGLE_MAPS_API_KEY`で管理
- **セキュリティ**: `.env`ファイルは絶対にGitにコミットしないこと（`.gitignore`に含まれています）
- **ライブラリ**: `@react-google-maps/api`を使用
- **必要なライブラリ**: `places`, `geometry`

```typescript
// App.tsx:7
const libraries: ('places' | 'geometry')[] = ['places', 'geometry'];
```

### 3. キャッシュ管理

`src/utils/cacheManager.ts`でGoogle Maps APIのレスポンスをキャッシュしています。

- APIコールの削減
- パフォーマンス向上
- コスト最適化

### 4. 検索フィルター

以下のフィルターオプションが実装されています：

- **価格帯**: リーズナブル、中価格帯、高価格帯
- **評価**: 星の数でフィルタリング
- **レビュー数**: 最小レビュー数の設定
- **営業時間**: 現在営業中のみ表示
- **検索範囲**: 300m〜5km

## 開発ガイドライン

### コーディング規約

1. **TypeScript厳格モード**
   - 型定義を明示的に記述
   - `any`型の使用を避ける
   - 型ファイルは`types.ts`として分離

2. **コンポーネント設計**
   - 単一責任の原則を守る
   - プロップスは明示的に型定義
   - 状態管理は必要最小限に

3. **命名規則**
   - コンポーネント: PascalCase (`Map.tsx`, `RouletteScreen.tsx`)
   - フック: camelCase with "use" prefix (`useRestaurantSearch`)
   - ユーティリティ: camelCase (`cacheManager.ts`)
   - 定数: UPPER_SNAKE_CASE

### Google Maps API 開発時の注意点

1. **APIキーの管理**
   - `.env`ファイルは`.gitignore`に含まれている
   - 本番環境では適切なAPI制限を設定

2. **APIコールの最適化**
   - キャッシュマネージャーを活用
   - 不要なリクエストを避ける
   - デバウンス処理を実装

3. **エラーハンドリング**
   - API読み込み失敗時の適切なメッセージ表示
   - ネットワークエラーの処理
   - ユーザーへの分かりやすいフィードバック

### スタイリング

- **Tailwind CSS**: ユーティリティファーストアプローチ
- **カスタムカラー**: `tailwind.config.js`でprimaryカラーを定義
- **レスポンシブ**: モバイルファーストで設計

```tsx
// 例: グラデーション背景
<div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
```

IMPORTANT: **UI/UX実装時は必ず `.claude/rules/ui-ux-design.md` を参照してください。** このファイルはClaude Codeが自動的にコンテキストとして読み込みます。

このガイドラインには以下が含まれます：

- AI向けプロンプティング手法（制約ベースプロンプティング、TC-EBCフレームワーク）
- デザインシステムの定義（カラー、スペーシング、タイポグラフィ）
- AIっぽさを避けるルール（禁止事項と推奨アプローチ）
- コンポーネント設計パターン
- 実装チェックリスト

### UI/UX実装時の必須制約

```markdown
<ui-constraints>
以下はUI実装時の必須制約です：

角丸: rounded-lg に統一（チップのみ rounded-full 許可）
シャドウ: shadow-lg 以下のみ使用可
アニメーション: transition-colors duration-200 のみ
カラー: tailwind.config.js で定義されたもののみ
グラデーション: 同系色2色まで（primary-50 to primary-100 など）

禁止事項:

- グラデーションテキスト
- shadow-2xl 以上のシャドウ
- rounded-2xl 以上の角丸
- ネオンカラー/グロー効果
- 装飾目的だけの要素
- カスタムCSSの追加
- 新しいデザインパターンの発明
  </ui-constraints>
```

### 既存UIコンポーネントの参照

新しいUIを実装する前に、以下の既存コンポーネントを確認してください：

| コンポーネント | パス                                                           | 用途             |
| -------------- | -------------------------------------------------------------- | ---------------- |
| ToggleChip     | `src/components/ui/ToggleChip.tsx`                             | 選択可能なチップ |
| ErrorAlert     | `src/components/ui/ErrorAlert.tsx`                             | エラー表示       |
| RestaurantCard | `src/components/UnifiedSearchResultsScreen/RestaurantCard.tsx` | カードレイアウト |
| SearchFilters  | `src/components/UnifiedSearchResultsScreen/SearchFilters.tsx`  | フィルターUI     |

## テストとビルド

### 開発サーバー

```bash
npm run dev
```

### ビルド

```bash
npm run build
```

ビルド前に以下を確認：

- TypeScriptエラーがないこと（`npm run typecheck` / tsgo）
- oxlintの警告がないこと（`npm run lint`）
- コードフォーマットが統一されていること（`npm run format:check` / oxfmt）
- 環境変数が正しく設定されていること
- または `npm run check` で一括確認

### リント・フォーマット

```bash
npm run lint          # oxlint --type-aware (tsgoベースの型情報付きリント)
npm run format        # oxfmt --write . (フォーマット適用)
npm run check         # 全チェック一括実行
```

- oxlint設定は`.oxlintrc.json`で管理
- oxfmt設定は`.oxfmtrc.json`で管理（Prettier互換）
- 抑制コメント: `// oxlint-disable-next-line rule-name`

## デバッグのヒント

### Google Maps API関連

1. **APIキーが正しく設定されているか確認**

   ```bash
   cat .env
   ```

2. **ブラウザコンソールでエラーを確認**
   - Google Maps APIの制限エラー
   - CORS問題
   - ネットワークエラー

3. **キャッシュのクリア**
   - ブラウザのキャッシュをクリア
   - アプリケーション内キャッシュのリセット

### パフォーマンス

- React Developer Toolsでレンダリングを確認
- Network タブで API コールを監視
- キャッシュヒット率を確認

## 新機能追加時のチェックリスト

- [ ] TypeScript型定義を追加
- [ ] 適切なディレクトリに配置（components/composables/utils）
- [ ] エラーハンドリングを実装
- [ ] 必要に応じてキャッシュ戦略を検討
- [ ] レスポンシブデザインを確認
- [ ] oxlint + oxfmt エラーがないことを確認（`npm run check`）
- [ ] ビルドが成功することを確認（`npm run build`）

## トラブルシューティング

### よくある問題

1. **Google Maps が表示されない**
   - APIキーの確認
   - 必要なAPIが有効化されているか確認（Maps JavaScript API, Places API, Geocoding API）
   - ブラウザコンソールでエラーメッセージを確認

2. **ビルドエラー**
   - `npm install`で依存関係を再インストール
   - `node_modules`と`package-lock.json`を削除して再インストール
   - TypeScriptのバージョンを確認

3. **スタイルが適用されない**
   - Tailwind CSSの設定を確認（`tailwind.config.js`）
   - PostCSSの設定を確認（`postcss.config.js`）
   - ブラウザのキャッシュをクリア

## 外部リンク

- [Google Maps API ドキュメント](https://developers.google.com/maps/documentation)
- [React Google Maps API](https://react-google-maps-api-docs.netlify.app/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Vite](https://vitejs.dev/)
- [OXC (oxlint)](https://oxc.rs/)
- [oxfmt](https://oxc.rs/docs/guide/usage/formatter)
- [tsgo (TypeScript Native Preview)](https://devblogs.microsoft.com/typescript/announcing-typescript-native-previews/)

## お問い合わせ

バグ報告や機能要望: https://forms.gle/MyyDc8ybQJcR5JYs9

---

このドキュメントは開発の進行に応じて更新してください。
