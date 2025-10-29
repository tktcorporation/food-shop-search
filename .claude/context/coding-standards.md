# コーディング規約

<typescript_rules>
## TypeScript厳格モード

- 型定義を明示的に記述
- `any`型の使用を避ける
- 型ファイルは`types.ts`として分離
</typescript_rules>

<component_design>
## コンポーネント設計

- 単一責任の原則を守る
- プロップスは明示的に型定義
- 状態管理は必要最小限に
</component_design>

<naming_conventions>
## 命名規則

- **コンポーネント**: PascalCase
  - 例: `Map.tsx`, `RouletteScreen.tsx`

- **フック**: camelCase + "use" prefix
  - 例: `useRestaurantSearch`, `useLocationSearch`

- **ユーティリティ**: camelCase
  - 例: `cacheManager.ts`, `keywordOptions.ts`

- **定数**: UPPER_SNAKE_CASE
  - 例: `API_TIMEOUT`, `MAX_RESULTS`
</naming_conventions>

<styling>
## スタイリング（Tailwind CSS）

- ユーティリティファーストアプローチ
- カスタムカラー: `tailwind.config.js`でprimary定義
- モバイルファーストで設計

例:
```tsx
<div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
```
</styling>

<checklist>
## 新機能追加時のチェックリスト

- [ ] TypeScript型定義を追加
- [ ] 適切なディレクトリに配置（components/composables/utils）
- [ ] エラーハンドリングを実装
- [ ] 必要に応じてキャッシュ戦略を検討
- [ ] レスポンシブデザインを確認
- [ ] ESLintエラーがないことを確認（`npm run lint`）
- [ ] ビルドが成功することを確認（`npm run build`）
</checklist>
