# Google Maps API ガイドライン

<security>
## APIキー管理

IMPORTANT: **APIキーの取り扱いに注意！**

- **保存場所**: `.env`ファイルの`VITE_GOOGLE_MAPS_API_KEY`
- **セキュリティ**: `.env`ファイルは絶対にGitにコミットしない（`.gitignore`に含む）
- **本番環境**: 適切なAPI制限を設定
</security>

<implementation>
## 使用方法

**ライブラリ**: `@react-google-maps/api`

**必要なライブラリ**:
```typescript
// App.tsx:7
const libraries: ("places" | "geometry")[] = ['places', 'geometry'];
```

**有効化が必要なAPI**:
- Maps JavaScript API
- Places API
- Geocoding API
</implementation>

<optimization>
## APIコール最適化

1. **キャッシュマネージャーを活用**
   - `src/utils/cacheManager.ts`を使用
   - 同じクエリの重複リクエストを防ぐ

2. **デバウンス処理を実装**
   - ユーザー入力の連続APIコールを防ぐ

3. **不要なリクエストを避ける**
   - 検索前にバリデーション実施
</optimization>

<error_handling>
## エラーハンドリング

- API読み込み失敗時の適切なメッセージ表示
- ネットワークエラーの処理
- ユーザーフレンドリーなフィードバック
</error_handling>

<debugging>
## デバッグ手順

1. APIキー確認: `cat .env`
2. ブラウザコンソールでエラー確認
3. キャッシュクリア（ブラウザ・アプリ内）
4. カスタムコマンド: `/project:api-debug`
</debugging>
