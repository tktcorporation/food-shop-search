# Claude Code 開発ガイド

<overview>
このプロジェクトは、Google Maps APIを使用したグルメスポット検索アプリケーションです。
Claude Codeを使用して開発する際のガイドラインをまとめています。

**技術スタック**: React 18 + TypeScript + Vite + Tailwind CSS + Google Maps API
</overview>

---

## 📚 コンテキストドキュメント（動的参照用）

プロジェクト固有の詳細情報は以下のファイルに分割されています。必要に応じて参照してください：

- **[.claude/context/architecture.md](./.claude/context/architecture.md)** - プロジェクト構造・設計パターン
- **[.claude/context/api-guidelines.md](./.claude/context/api-guidelines.md)** - Google Maps API使用法・最適化
- **[.claude/context/coding-standards.md](./.claude/context/coding-standards.md)** - TypeScript規約・命名規則

---

## 🚀 クイックスタート

<setup>
### 環境セットアップ

IMPORTANT: このプロジェクトは **mise** を使用してNode.jsバージョンを管理しています。

```bash
mise install        # Node.js 20 LTSを自動インストール
npm install         # 依存関係のインストール
npm run dev         # 開発サーバー起動 (http://localhost:5173)
```
</setup>

<common_commands>
### よく使うコマンド

```bash
# 開発
npm run dev         # 開発サーバー起動
npm run build       # 本番ビルド
npm run preview     # ビルドプレビュー
npm run lint        # ESLintチェック

# Git
git status          # 変更確認
git add .           # ステージング
git commit -m "..." # コミット
git push            # プッシュ
```
</common_commands>

---

## 🛠️ Claude Code機能

<custom_commands>
### カスタムスラッシュコマンド

`.claude/commands/` に以下のコマンドが用意されています：

- `/project:dev-check` - 開発環境のセットアップと動作確認
- `/project:build-check` - 本番ビルド前の総合チェック
- `/project:api-debug` - Google Maps API問題のデバッグ
- `/project:add-feature <機能名>` - 新機能追加チェックリスト
</custom_commands>

<prompt_templates>
### プロンプトテンプレート

`.claude/prompts/` に効果的なコミュニケーション用テンプレートがあります：

- **feature-implementation.md** - 新機能実装時
- **bug-fix.md** - バグ修正時
- **code-review.md** - コードレビュー時
- **refactoring.md** - リファクタリング時
- **README.md** - テンプレート使い方ガイド

これらはAnthropic最新ベストプラクティス（XMLタグ構造化、思考タグ、Few-shot examples）に基づいています。
</prompt_templates>

---

## 💡 コンテキストエンジニアリング原則

<context_principles>
IMPORTANT: **コンテキストは有限なリソース** - 以下の原則に従ってください：

> "望ましい結果の可能性を最大化する、最小限の高シグナルトークンのセットを見つける"

### 効果的な依頼の仕方

✅ **推奨**:
```markdown
src/composables/useStationSearch.ts:42-58 の検索ロジックを修正して、
「東京」→「東京駅」への曖昧検索を実装してください。

<constraints>
- 既存のキャッシュ機構を壊さない
- API呼び出し回数を増やさない
</constraints>
```

❌ **非推奨**:
```markdown
バグを直してください（曖昧・コンテキスト不足）
src/components/Map.tsx の全コードを貼り付け（過剰）
```

### XMLタグで構造化

```markdown
<instructions>具体的な指示</instructions>
<context>関連ファイルと現状</context>
<constraints>制約条件</constraints>
<expected_behavior>期待する動作</expected_behavior>
```

詳細は `.claude/prompts/README.md` を参照してください。
</context_principles>

---

## 📝 Git ブランチ規則

<git_branches>
- **feature/** - 新機能開発
- **fix/** - バグ修正
- **refactor/** - リファクタリング
- **docs/** - ドキュメント更新
- **claude/** - Claude Code自動生成ブランチ
</git_branches>

---

## 🔍 トラブルシューティング

<troubleshooting>
### よくある問題

**Google Mapsが表示されない**
→ APIキー確認（`cat .env`）、必要なAPI有効化、コンソールエラー確認

**ビルドエラー**
→ `npm install` 再実行、`node_modules` 削除して再インストール

**スタイルが適用されない**
→ `tailwind.config.js` 確認、ブラウザキャッシュクリア

詳細は各コンテキストファイルまたは `/project:api-debug` コマンドを参照。
</troubleshooting>

---

## 📖 参考リンク

- [Google Maps API Docs](https://developers.google.com/maps/documentation)
- [React Google Maps API](https://react-google-maps-api-docs.netlify.app/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Vite](https://vitejs.dev/)

**バグ報告・機能要望**: https://forms.gle/MyyDc8ybQJcR5JYs9

---

**Note**: このドキュメントは開発の進行に応じて更新してください。詳細な技術情報は `.claude/context/` ディレクトリのファイルを参照してください。
