# Claude Code 開発ガイド

ペコサーチ（pekosearch） - 今いる場所から、すぐ見つかるお店探し。現在地や駅周辺のレストランをサクッと検索できるWebアプリ。

## 技術スタック

- **フロントエンド**: React 19 + TypeScript + Vite 7 + Tailwind CSS 4
- **バックエンド**: Hono (Cloudflare Workers) + D1 (SQLite) + Drizzle ORM
- **地図API**: Google Maps API (@react-google-maps/api)
- **ライブラリ**: Effect (関数型エラーハンドリング), Motion (アニメーション)
- **リント**: oxlint (OXC toolchain) + oxlint-tsgolint (type-aware)
- **フォーマット**: oxfmt (OXC toolchain)
- **型チェック**: tsgo (TypeScript Go / TypeScript 7 native preview)
- **テスト**: Vitest
- **VCS**: Git
- **テンプレ同期**: ziku（`npx ziku pull` / `npx ziku push`）— 詳細は `.claude/guides/tools/ziku.md`

## 環境管理

IMPORTANT: このプロジェクトは **mise** を使用してNode.jsバージョンを管理しています。

```bash
mise install        # Node.js 22 LTSを自動インストール
npm install         # 依存関係のインストール
```

共有ツールは `.config/mise/conf.d/shared.toml`、プロジェクト固有は `.mise.toml`。

## よく使うコマンド

```bash
# フロントエンド開発
npm run dev           # Vite開発サーバー (http://localhost:5173)
npm run build         # 本番ビルド (tsgo型チェック + vite build)
npm run preview       # ビルドプレビュー

# Worker/バックエンド開発
npm run dev:worker    # Wrangler開発サーバー
npm run dev:all       # クライアントビルド + Worker起動

# コード品質
npm run lint          # oxlint (type-aware linting)
npm run lint:quick    # oxlint (型情報なしの高速lint)
npm run format        # oxfmt でフォーマット適用
npm run format:check  # oxfmt でフォーマットチェック
npm run typecheck     # tsgo で型チェック
npm run check         # lint + format:check + typecheck 一括実行

# テスト
npm run test          # vitest run (全テスト実行)
npm run test:watch    # vitest (ウォッチモード)

# データベース (D1)
npm run db:generate       # Drizzle マイグレーション生成
npm run db:migrate:local  # ローカルD1にマイグレーション適用
npm run db:migrate:remote # リモートD1にマイグレーション適用

# デプロイ
npm run deploy            # 本番デプロイ
npm run deploy:preview    # プレビューデプロイ

# テンプレ同期 (ziku)
npx ziku status       # 同期状況を確認
npx ziku pull         # テンプレート最新を取り込み
npx ziku push -m "..."  # ローカル改善をテンプレへ還元
```

- oxlint設定: `.oxlintrc.json` / 抑制: `// oxlint-disable-next-line rule-name`
- oxfmt設定: `.oxfmtrc.json`（Prettier互換）

## ブランチ命名規則

- **feature/**: 新機能 / **fix/**: バグ修正 / **refactor/**: リファクタリング / **docs/**: ドキュメント
- **claude/**: Claude Codeによる自動生成ブランチ

## プロジェクト構造

```
shared/src/                          # FE/Worker 共通ドメイン (SSOT)
├── schema/                          # Effect Schema（Location/Restaurant/Station/API）
├── domain/                          # 純関数ドメインロジック
│   ├── geo/haversine.ts
│   ├── restaurant/{filter,sort}.ts
│   └── station/{normalize,from-google,is-station}.ts
└── http/decode.ts                   # upstream-form デコードヘルパー

src/                                 # フロントエンド (React)
├── components/                      # Reactコンポーネント
│   ├── MapView.tsx                  # Leaflet 地図表示
│   └── UnifiedSearchResultsScreen/  # 統合検索結果画面
├── composables/                     # React アダプタ（状態 + Effect 実行）
│   ├── useLocationSearch.ts
│   ├── useStationSearch.ts
│   ├── useNearbyStationSearch.ts
│   └── useRestaurantSearch.ts
├── programs/                        # Effect ユースケース
├── services/                        # Effect Layer（ApiService 等）
├── hooks/                           # React固有フック
├── App.tsx
└── index.css

worker/src/                          # バックエンド (Hono / Cloudflare Workers)
├── index.ts                         # Honoアプリ エントリーポイント
├── bindings.ts                      # Cloudflare Bindings SSOT
├── http/parse-body.ts               # Schema.decode による upstream-form
├── types.ts                         # Google Maps 生レスポンス型（インフラ）
├── routes/                          # APIルート（薄い境界）
├── services/                        # google-maps / D1 cache
└── db/                              # Drizzle スキーマ

drizzle/                             # D1マイグレーションファイル
wrangler.toml                        # Cloudflare Workers設定
```

## 重要な設計パターン

### Functional DDD / Upstream-form / SSOT

- **SSOT**: ドメイン型・API契約・純ロジックは `shared/` に集約。FE/Worker で型を再定義しない
- **Upstream-form**: HTTP/JSON 境界で `Schema.decodeUnknown` し、内部は常にドメイン型を扱う
- **Functional DDD**: ドメインは純関数、副作用は Effect + Layer（programs / services / routes）

### Composables vs Hooks

- **composables/**: React 状態と Effect 実行の橋渡し（`useRestaurantSearch` 等）
- **hooks/**: React固有・外部サービス統合（`useAnalytics` 等）

### Google Maps API

IMPORTANT: **APIキーの取り扱いに注意！**

- フロントエンド: Worker API 経由（ブラウザに API キーを露出させない）
- バックエンド: Wrangler secrets で管理 / Worker から直接 API 呼び出し
- `.env` / `.dev.vars` ファイルは絶対にコミットしないこと

### キャッシュ戦略

- **フロントエンド**: composable 内のインメモリキャッシュ（駅+キーワード単位）
- **バックエンド**: `worker/src/services/cache.ts` + D1 でサーバー側キャッシュ（place_id単位）

## コーディング規約

- TypeScript厳格モード、`any`型禁止、型ファイルは`types.ts`に分離
- コンポーネント: PascalCase / フック: camelCase with "use" / 定数: UPPER_SNAKE_CASE
- 単一責任の原則、propsは明示的に型定義

### UI/UX

IMPORTANT: UI実装時は `.claude/rules/project/` 配下のルールファイルが自動適用されます（`ui-constraints.md`, `ui-ux-design.md`, `design-tokens.md`, `app-design-direction.md`）。

- Tailwind CSS ユーティリティファースト、モバイルファースト
- カスタムカラーは `tailwind.config.js` で定義済み

## テストとビルド

ビルド前に `npm run check` で一括確認（lint + format:check + typecheck）。

## カスタムコマンド・テンプレート

- `/project:dev-check` - 開発環境の確認
- `/project:build-check` - 本番ビルド前チェック
- `/project:api-debug` - Google Maps APIデバッグ
- `/project:add-feature <機能名>` - 新機能追加チェックリスト
- プロンプトテンプレート: `.claude/prompts/` ディレクトリ参照

## トラブルシューティング

1. **Google Maps が表示されない** → APIキー確認、Maps JavaScript API / Places API / Geocoding API の有効化確認
2. **ビルドエラー** → `npm install` 再実行、`node_modules` 削除して再インストール
3. **スタイルが適用されない** → `tailwind.config.js` / `postcss.config.js` 確認

## お問い合わせ

バグ報告や機能要望: https://forms.gle/MyyDc8ybQJcR5JYs9
