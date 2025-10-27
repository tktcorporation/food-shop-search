# グルメスポット検索

現在地や駅周辺のレストランを簡単に検索できるWebアプリケーション。

## 主な機能

- 現在地からの検索
- 駅周辺のレストラン検索
- 詳細な検索フィルター
  - 価格帯
  - 評価
  - レビュー数
  - 営業時間
- 検索範囲の指定（300m〜5km）
- レストラン情報の詳細表示
  - 写真
  - 評価
  - 営業時間
  - Google Mapsへのリンク

## 技術スタック

- **フロントエンド**: React 18 + TypeScript
- **ビルドツール**: Vite
- **スタイリング**: Tailwind CSS
- **アニメーション**: Framer Motion
- **地図**: Google Maps API (@react-google-maps/api)
- **アイコン**: Lucide React
- **リンター**: ESLint

## 前提条件

- Node.js (v18以上推奨、v20 LTS推奨)
- npm または yarn
- Google Maps API キー
- (オプション) [mise](https://mise.jdx.dev/) - ツールバージョン管理

## セットアップ手順

### 1. リポジトリのクローン

```bash
git clone https://github.com/tktcorporation/food-shop-search.git
cd food-shop-search
```

### 2. Node.js環境のセットアップ

#### オプションA: miseを使用する場合（推奨）

[mise](https://mise.jdx.dev/)を使用すると、プロジェクトで指定されたNode.jsバージョンを自動的に使用できます。

```bash
# miseのインストール（まだの場合）
curl https://mise.run | sh

# プロジェクトで指定されたNode.jsバージョンをインストール・有効化
mise install
```

miseは `.mise.toml` ファイルを読み込み、Node.js 20 LTSを自動的にインストールして使用します。

#### オプションB: 手動でNode.jsをインストールする場合

Node.js v18以上（v20 LTS推奨）を[公式サイト](https://nodejs.org/)からインストールするか、nvmなどのバージョンマネージャーを使用してください。

### 3. 依存関係のインストール

```bash
npm install
```

### 4. 環境変数の設定

`.env.example` をコピーして `.env` ファイルを作成します：

```bash
cp .env.example .env
```

`.env` ファイルを編集し、Google Maps API キーを設定します：

```env
VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

#### Google Maps API キーの取得方法

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成（または既存のプロジェクトを選択）
3. 「APIとサービス」→「認証情報」に移動
4. 「認証情報を作成」→「APIキー」を選択
5. 以下のAPIを有効化：
   - Maps JavaScript API
   - Places API
   - Geocoding API
6. 作成したAPIキーを `.env` ファイルに貼り付け

### 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:5173](http://localhost:5173) を開いてアプリケーションを確認できます。

## 利用可能なスクリプト

- `npm run dev` - 開発サーバーを起動
- `npm run build` - 本番用にビルド
- `npm run preview` - ビルドしたアプリケーションをプレビュー
- `npm run lint` - ESLintでコードをチェック

## プロジェクト構造

```
src/
├── components/     # Reactコンポーネント
├── composables/    # 再利用可能なロジック
├── hooks/          # カスタムReactフック
├── utils/          # ユーティリティ関数
├── App.tsx         # メインアプリケーションコンポーネント
├── main.tsx        # エントリーポイント
└── index.css       # グローバルスタイル
```

## デプロイ

### ビルド

```bash
npm run build
```

ビルドされたファイルは `dist/` ディレクトリに出力されます。

### 注意事項

- Google Maps API キーは公開リポジトリにコミットしないでください
- 本番環境では API キーに適切な制限を設定してください（HTTPリファラー、IPアドレスなど）

## ライセンス

このプロジェクトはプライベートプロジェクトです。

## Claude Code との開発

このプロジェクトは[Claude Code](https://claude.com/claude-code)に最適化されています。

### カスタムコマンド

`.claude/commands/` ディレクトリに以下のカスタムコマンドが用意されています：

- `/project:dev-check` - 開発環境のセットアップと動作確認
- `/project:build-check` - 本番ビルド前の総合チェック
- `/project:api-debug` - Google Maps API関連の問題デバッグ
- `/project:add-feature <機能名>` - 新機能追加時のチェックリスト実行

### プロンプトテンプレート

`.claude/prompts/` ディレクトリに効果的なコミュニケーションのためのテンプレートが用意されています：

- **feature-implementation.md** - 新機能実装の依頼テンプレート
- **bug-fix.md** - バグ修正の依頼テンプレート（思考プロセス付き）
- **code-review.md** - コードレビューの依頼テンプレート
- **refactoring.md** - リファクタリングの依頼テンプレート
- **README.md** - テンプレートの使い方とベストプラクティス

これらのテンプレートは、XMLタグでの構造化、段階的思考、Few-shot examplesなど、
Anthropicの最新プロンプトエンジニアリングベストプラクティスに基づいています。

### プロジェクト設定

- **CLAUDE.md** - プロジェクト固有の開発ガイドライン（コンテキスト最適化含む）
- **.mcp.json** - MCP (Model Context Protocol) サーバー設定
- **.claude/settings.json** - チーム共有の権限設定

個人用の設定は `CLAUDE.local.md` ファイルを作成してください（Gitには含まれません）。

## 開発

[Edit in StackBlitz next generation editor ⚡️](https://stackblitz.com/~/github.com/tktcorporation/food-shop-search)