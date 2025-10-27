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

- Node.js (v16以上推奨)
- npm または yarn
- Google Maps API キー

## セットアップ手順

### 1. リポジトリのクローン

```bash
git clone https://github.com/tktcorporation/food-shop-search.git
cd food-shop-search
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

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

### 4. 開発サーバーの起動

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

## 開発

[Edit in StackBlitz next generation editor ⚡️](https://stackblitz.com/~/github.com/tktcorporation/food-shop-search)