# Claude Code 開発ガイド

このドキュメントは、Claude Codeを使用してこのプロジェクトを開発する際のガイドラインと重要な情報をまとめています。

## プロジェクト概要

グルメスポット検索アプリケーション - Google Maps APIを使用して、現在地や駅周辺のレストランを検索できるWebアプリケーション。

- **技術スタック**: React 18 + TypeScript + Vite
- **スタイリング**: Tailwind CSS
- **地図API**: Google Maps API
- **状態管理**: React Hooks

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

- **APIキー**: `.env`ファイルの`VITE_GOOGLE_MAPS_API_KEY`で管理
- **ライブラリ**: `@react-google-maps/api`を使用
- **必要なライブラリ**: `places`, `geometry`

```typescript
// App.tsx:7
const libraries: ("places" | "geometry")[] = ['places', 'geometry'];
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
- TypeScriptエラーがないこと
- ESLintの警告がないこと
- 環境変数が正しく設定されていること

### リント

```bash
npm run lint
```

ESLint設定は`eslint.config.js`で管理。

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
- [ ] ESLintエラーがないことを確認
- [ ] ビルドが成功することを確認

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

## お問い合わせ

バグ報告や機能要望: https://forms.gle/MyyDc8ybQJcR5JYs9

---

このドキュメントは開発の進行に応じて更新してください。
