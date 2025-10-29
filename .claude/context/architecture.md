# プロジェクトアーキテクチャ

<overview>
グルメスポット検索アプリケーション - Google Maps APIを使用した現在地・駅周辺のレストラン検索Webアプリ

**技術スタック**
- React 18 + TypeScript + Vite
- Tailwind CSS
- Google Maps API
- React Hooks（状態管理）
</overview>

<directory_structure>
```
src/
├── components/              # Reactコンポーネント
│   ├── Map.tsx             # Google Maps表示
│   ├── RouletteScreen.tsx  # ルーレット機能
│   └── UnifiedSearchResultsScreen/  # 統合検索結果
│       ├── index.tsx
│       ├── LocationSearch.tsx
│       └── StationSearch.tsx
├── composables/            # ビジネスロジックのカスタムフック
│   ├── useLocationSearch.ts
│   ├── useStationSearch.ts
│   ├── useRestaurantSearch.ts
│   └── useOperatingHours.ts
├── hooks/                  # React固有のフック・外部サービス統合
│   └── useAnalytics.ts
├── utils/                  # ユーティリティ関数
│   ├── cacheManager.ts
│   ├── keywordOptions.ts
│   ├── stationShortcuts.ts
│   └── operatingHours.ts
├── App.tsx                 # メインアプリケーション
├── main.tsx               # エントリーポイント
└── index.css              # Tailwind設定
```
</directory_structure>

<design_patterns>
## ディレクトリ規則（ファイルシステムがシグナル）

- **composables/** → ビジネスロジックに関連
- **hooks/** → React固有の機能や外部サービス統合
- **utils/** → 汎用ユーティリティ関数

この命名規則に従って、新しい機能を適切なディレクトリに配置してください。

## キャッシュ管理

`src/utils/cacheManager.ts`でGoogle Maps APIレスポンスをキャッシュ
- APIコール削減・パフォーマンス向上・コスト最適化

## 検索フィルター機能

- 価格帯（リーズナブル、中価格帯、高価格帯）
- 評価（星の数）
- レビュー数（最小レビュー数）
- 営業時間（現在営業中のみ）
- 検索範囲（300m〜5km）
</design_patterns>
