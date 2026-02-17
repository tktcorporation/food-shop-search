# ペコサーチ

今いる場所から、すぐ見つかるお店探し。

現在地や駅周辺のレストランをサクッと検索できるWebアプリ。価格帯・評価・営業時間でフィルターして、あなたにぴったりの一軒が見つかります。

## 主な機能

- **現在地から検索** - GPS連動で周辺のお店を即座に表示
- **駅名で検索** - 駅名を入力して周辺のお店を探索
- **スマートフィルター** - 価格帯・評価・レビュー数・営業時間で絞り込み
- **検索範囲の調整** - 300m〜5kmの範囲を自由に設定
- **店舗詳細** - 写真・評価・営業時間・Google Mapsリンクを確認

## 技術スタック

- **フロントエンド**: React 19 + TypeScript + Vite 7 + Tailwind CSS 4
- **バックエンド**: Hono (Cloudflare Workers) + D1 (SQLite) + Drizzle ORM
- **地図**: Google Maps API (@react-google-maps/api)
- **ライブラリ**: Effect, Motion, Lucide React
- **ツールチェーン**: oxlint / oxfmt / tsgo / Vitest

## セットアップ

### 前提条件

- Node.js v22 LTS（[mise](https://mise.jdx.dev/) での管理を推奨）
- Google Maps API キー（Maps JavaScript API / Places API / Geocoding API を有効化）

### インストール

```bash
git clone https://github.com/tktcorporation/food-shop-search.git
cd food-shop-search

# Node.js バージョンの自動セットアップ（mise使用時）
mise install

# 依存関係のインストール
npm install
```

### 環境変数

```bash
cp .env.example .env
```

`.env` に Google Maps API キーを設定：

```env
VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

### 開発サーバー

```bash
npm run dev         # フロントエンド (http://localhost:5173)
npm run dev:worker  # バックエンド (Wrangler)
npm run dev:all     # フロント + バックエンド同時起動
```

## スクリプト一覧

| コマンド         | 内容                                     |
| ---------------- | ---------------------------------------- |
| `npm run dev`    | Vite 開発サーバー                        |
| `npm run build`  | 本番ビルド（型チェック込み）             |
| `npm run check`  | lint + format:check + typecheck 一括実行 |
| `npm run test`   | 全テスト実行                             |
| `npm run deploy` | 本番デプロイ                             |

## プロジェクト構造

```
src/                  # フロントエンド (React)
├── components/       # UI コンポーネント
├── composables/      # ビジネスロジック用フック
├── hooks/            # React 固有フック
├── utils/            # ユーティリティ
├── App.tsx           # メインアプリケーション
└── index.css         # グローバルスタイル

worker/src/           # バックエンド (Hono / Cloudflare Workers)
├── routes/           # API ルート
├── services/         # 外部サービス連携
├── lib/              # ユーティリティ
└── db/               # データベース
```

## Claude Code との開発

このプロジェクトは [Claude Code](https://claude.com/claude-code) に最適化されています。

### カスタムコマンド

- `/project:dev-check` - 開発環境のセットアップと動作確認
- `/project:build-check` - 本番ビルド前の総合チェック
- `/project:api-debug` - Google Maps API 関連の問題デバッグ
- `/project:add-feature <機能名>` - 新機能追加時のチェックリスト

### プロジェクト設定

- **CLAUDE.md** - プロジェクト固有の開発ガイドライン
- **.mcp.json** - MCP サーバー設定
- **.claude/settings.json** - チーム共有の権限設定
- **.claude/prompts/** - プロンプトテンプレート

## 注意事項

- Google Maps API キーは公開リポジトリにコミットしないでください
- 本番環境では API キーに適切なリファラー制限を設定してください

## フィードバック

バグ報告・機能要望: https://forms.gle/MyyDc8ybQJcR5JYs9

## ライセンス

Private
