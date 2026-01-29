# プロンプトテンプレート集

このディレクトリには、Claude Codeと効果的にコミュニケーションするためのプロンプトテンプレートが含まれています。

## 📚 利用可能なテンプレート

### 1. [feature-implementation.md](./feature-implementation.md)

新機能の実装を依頼する際のテンプレート

**使用するタイミング：**

- 新しい機能やコンポーネントを追加する
- 既存機能を拡張する
- ビジネスロジックを実装する

**特徴：**

- XMLタグで構造化された明確な指示
- コンテキストと制約条件の明示
- 期待する動作の具体例
- 実装後のテスト計画

### 2. [bug-fix.md](./bug-fix.md)

バグ修正を依頼する際のテンプレート

**使用するタイミング：**

- 既存機能が正しく動作しない
- エラーが発生している
- 予期しない動作がある

**特徴：**

- 段階的思考（thinking tags）を活用
- 再現手順と期待動作の明確化
- 根本原因の分析を促す
- 修正後の検証項目

### 3. [code-review.md](./code-review.md)

コードレビューを依頼する際のテンプレート

**使用するタイミング：**

- プルリクエスト作成前
- コードの品質チェック
- リファクタリングの妥当性確認

**特徴：**

- 複数の観点からのレビュー
- プロジェクト規約との整合性チェック
- 重要度別の改善提案
- 代替実装案の提示

### 4. [ui-implementation.md](./ui-implementation.md)

UI/UX実装を依頼する際のテンプレート（制約ベースプロンプティング）

**使用するタイミング：**

- 新しいUIコンポーネントを作成する
- 既存UIを修正・拡張する
- デザインの一貫性を保ちたい

**特徴：**

- 制約ベースプロンプティング（AIっぽさを避ける）
- TC-EBCフレームワーク（Task, Context, Constraints）
- 既存パターンの参照を強制
- 禁止事項の明示
- 実装後の検証チェックリスト

**参照ドキュメント：**

- **.claude/rules/ui-ux-design.md** - 完全なデザインガイドライン（自動読み込み）

## 🎯 テンプレートの使い方

### 基本的な使用方法

1. **テンプレートをコピー**

   ```bash
   # 新機能実装の場合
   cat .claude/prompts/feature-implementation.md
   ```

2. **プレースホルダーを埋める**
   - `[機能の説明]` → 具体的な機能名
   - `[ファイルパス]` → 実際のファイルパス
   - `[要件1]` → 具体的な要件

3. **Claude Codeに送信**
   - テンプレートをそのままメッセージとして送信
   - または、テンプレートを参考に自分の言葉で依頼

### 効果的な使い方のコツ

#### ✅ DO（推奨）

- **具体的に記述する**

  ```markdown
  ❌ 検索機能を実装してください
  ✅ 駅名の曖昧検索機能を実装してください（「東京」→「東京駅」への自動変換）
  ```

- **ファイルパスを明示する**

  ```markdown
  ❌ 検索ロジックを修正してください
  ✅ src/composables/useStationSearch.ts:42-58 の検索ロジックを修正してください
  ```

- **期待する動作を例示する**

  ```markdown
  <example>
  入力: "東京"
  期待: 東京駅として検索 → 周辺500mのレストランを表示
  </example>
  ```

- **制約条件を明確にする**
  ```markdown
  <constraints>
  - 既存のキャッシュ機構を壊さない
  - API呼び出し回数を増やさない
  - TypeScript strict mode を維持
  </constraints>
  ```

#### ❌ DON'T（非推奨）

- **曖昧な指示**

  ```markdown
  ❌ バグを直してください
  ❌ もっと良くしてください
  ❌ 何か問題があるので見てください
  ```

- **コンテキスト不足**

  ```markdown
  ❌ この機能を追加して（どの機能？どこに？）
  ❌ エラーが出ます（何のエラー？どこで？）
  ```

- **過剰な情報**
  ```markdown
  ❌ ファイル全体のコードを貼り付けて長文で説明（必要な部分だけを示す）
  ```

## 🔧 プロンプトのカスタマイズ

### プロジェクト固有の情報を追加

テンプレートをプロジェクトに合わせてカスタマイズできます：

```markdown
<project_context>
このプロジェクトの特徴：

- グルメスポット検索アプリ
- Google Maps API を使用
- React 18 + TypeScript + Vite
- キャッシュマネージャーで API 呼び出しを最適化

重要なファイル：

- src/utils/cacheManager.ts: キャッシュ管理
- src/composables/: ビジネスロジック
- src/components/: UI コンポーネント
  </project_context>
```

### よく使う制約条件をテンプレート化

```markdown
<standard_constraints>
このプロジェクトの標準制約：

- TypeScript strict mode 必須
- any 型の使用禁止
- エラーハンドリング必須
- Google Maps API 呼び出しはキャッシュ必須
- ユーザーフレンドリーなエラーメッセージ
- モバイルファーストのレスポンシブデザイン
  </standard_constraints>
```

## 📖 高度なテクニック

### 1. 段階的思考（Thinking Tags）の活用

複雑なタスクでは、Claudeに段階的に考えさせることで精度が向上します：

```markdown
まず <thinking> タグ内で以下を分析してください：

1. 問題の根本原因
2. 考えられる解決策とそれぞれの長所・短所
3. 影響範囲の評価
4. 推奨アプローチとその理由

その後、<answer> タグ内で実装してください。
```

### 2. Few-Shot Examples（少数例示）

期待する動作を2-3個の代表的な例で示す：

```markdown
<example>
良いコミットメッセージ:
"feat: 駅名曖昧検索機能を追加

- stationShortcuts.ts にマッピングを追加
- useStationSearch.ts で自動変換ロジックを実装
- 「東京」→「東京駅」などの変換に対応"
  </example>

<example>
悪いコミットメッセージ:
"update"
"fix bug"
"WIP"
</example>
```

### 3. XMLタグでの構造化

Claudeが認識しやすい構造：

```markdown
<task>
  <goal>最終的に達成したいこと</goal>
  <approach>アプローチ方法</approach>
  <deliverables>成果物</deliverables>
</task>

<resources>
  <file path="src/App.tsx">メインコンポーネント</file>
  <documentation url="https://example.com">参考ドキュメント</documentation>
</resources>

<success_criteria>
<criterion>テストがすべて通る</criterion>
<criterion>TypeScriptエラーがない</criterion>
<criterion>ビルドが成功する</criterion>
</success_criteria>
```

## 🎓 学習リソース

より深く学びたい場合は、以下のドキュメントを参照してください：

- **CLAUDE.md**: プロジェクト固有のコンテキストエンジニアリングガイド
- [Anthropic: Effective Context Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)

## 💡 ヒント

### コンテキストの原則

> "望ましい結果の可能性を最大化する、最小限の高シグナルトークンのセットを見つける"

- **必要十分な情報**: 多すぎず、少なすぎず
- **構造化**: XMLタグやMarkdownで整理
- **具体性**: 曖昧さを排除
- **例示**: 良い例・悪い例で明示

### プロンプトの反復改善

1. **初回**: テンプレートをそのまま使用
2. **フィードバック**: 結果を確認して改善点を特定
3. **調整**: プロンプトを微調整
4. **再実行**: 改善されたプロンプトで再試行

プロンプトエンジニアリングは反復プロセスです。最初から完璧を目指すのではなく、徐々に改善していきましょう。

## 🤝 チームでの活用

これらのテンプレートはチーム全体で共有されています：

- **一貫性**: 全員が同じ形式で依頼できる
- **品質**: ベストプラクティスが組み込まれている
- **効率**: テンプレートをコピーして即使える
- **学習**: 良い依頼の仕方を学べる

新しいメンバーがジョインした際は、まずこのREADMEを読んでもらいましょう！

---

**質問や改善提案がある場合は、プロジェクトのIssueで共有してください。**
