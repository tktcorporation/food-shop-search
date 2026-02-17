# Claude Code 開発ガイド

グルメスポット検索アプリケーション（pekonavi） - 現在地や駅周辺のレストランを検索できるWebアプリケーション。

## 技術スタック

- **フロントエンド**: React 19 + TypeScript + Vite 7 + Tailwind CSS 4
- **バックエンド**: Hono (Cloudflare Workers) + D1 (SQLite) + Drizzle ORM
- **地図API**: Google Maps API (@react-google-maps/api)
- **ライブラリ**: Effect (関数型エラーハンドリング), Motion (アニメーション)
- **リント**: oxlint (OXC toolchain) + oxlint-tsgolint (type-aware)
- **フォーマット**: oxfmt (OXC toolchain)
- **型チェック**: tsgo (TypeScript Go / TypeScript 7 native preview)
- **テスト**: Vitest
- **VCS**: jj (Jujutsu) - 詳細は `.claude/rules/jujutsu.md` 参照

## 環境管理

IMPORTANT: このプロジェクトは **mise** を使用してNode.jsバージョンを管理しています。

```bash
mise install        # Node.js 22 LTSを自動インストール
npm install         # 依存関係のインストール
```

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

# VCS (jj) - git コマンドは使わない
jj status           # 変更状況を確認
jj diff             # 差分表示
jj commit -m "..."  # コミット
jj git push         # リモートにプッシュ
```

- oxlint設定: `.oxlintrc.json` / 抑制: `// oxlint-disable-next-line rule-name`
- oxfmt設定: `.oxfmtrc.json`（Prettier互換）

## ブランチ命名規則

- **feature/**: 新機能 / **fix/**: バグ修正 / **refactor/**: リファクタリング / **docs/**: ドキュメント
- **claude/**: Claude Codeによる自動生成ブランチ

## プロジェクト構造

```
src/                                 # フロントエンド (React)
├── components/                      # Reactコンポーネント
│   ├── Map.tsx                      # Google Maps表示
│   ├── RouletteScreen.tsx           # ルーレット機能
│   └── UnifiedSearchResultsScreen/  # 統合検索結果画面
├── composables/                     # ビジネスロジック用フック
│   ├── useLocationSearch.ts         # 現在地検索
│   ├── useStationSearch.ts          # 駅検索
│   ├── useRestaurantSearch.ts       # レストラン検索
│   └── useOperatingHours.ts         # 営業時間フィルター
├── hooks/                           # React固有のフック (useAnalytics等)
├── utils/                           # ユーティリティ (cacheManager, keywordOptions等)
├── App.tsx                          # メインアプリケーション
└── index.css                        # グローバルスタイル (Tailwind)

worker/src/                          # バックエンド (Hono / Cloudflare Workers)
├── index.ts                         # Honoアプリ エントリーポイント
├── types.ts                         # Worker型定義 (Bindings等)
├── routes/                          # APIルート
│   ├── stations.ts                  # 駅検索API
│   ├── restaurants.ts               # レストラン検索API
│   └── geocode.ts                   # ジオコーディングAPI
├── services/                        # 外部サービス連携
│   ├── google-maps.ts               # Google Maps API呼び出し
│   └── cache.ts                     # D1キャッシュサービス
├── lib/                             # ユーティリティ
│   ├── haversine.ts                 # 距離計算
│   └── station-filter.ts            # 駅フィルタリング
└── db/                              # データベース
    ├── schema.ts                    # Drizzle スキーマ定義
    └── index.ts                     # DB接続

drizzle/                             # D1マイグレーションファイル
wrangler.toml                        # Cloudflare Workers設定
```

## 重要な設計パターン

### Composables vs Hooks

- **composables/**: ビジネスロジック（`useRestaurantSearch`, `useStationSearch`等）
- **hooks/**: React固有・外部サービス統合（`useAnalytics`等）

### Google Maps API

IMPORTANT: **APIキーの取り扱いに注意！**

- フロントエンド: `.env` の `VITE_GOOGLE_MAPS_API_KEY` / ライブラリ: `@react-google-maps/api`
- バックエンド: Wrangler secrets で管理 / Worker から直接 API 呼び出し
- `.env`ファイルは絶対にコミットしないこと

### キャッシュ戦略

- **フロントエンド**: `src/utils/cacheManager.ts` でブラウザ側キャッシュ
- **バックエンド**: `worker/src/services/cache.ts` + D1 でサーバー側キャッシュ（place_id単位）

## コーディング規約

- TypeScript厳格モード、`any`型禁止、型ファイルは`types.ts`に分離
- コンポーネント: PascalCase / フック: camelCase with "use" / 定数: UPPER_SNAKE_CASE
- 単一責任の原則、propsは明示的に型定義

### UI/UX

IMPORTANT: UI実装時は `.claude/rules/` 配下のルールファイルが自動適用されます（`ui-constraints.md`, `ui-ux-design.md`, `design-tokens.md`, `app-design-direction.md`）。

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
