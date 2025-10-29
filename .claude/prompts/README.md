# プロンプトテンプレート集

<overview>
このディレクトリには、Claude Codeと効果的にコミュニケーションするための
プロンプトテンプレートが含まれています。

これらはAnthropic最新ベストプラクティス（コンテキストエンジニアリング、
XMLタグ構造化、思考タグ、Few-shot examples）に基づいています。
</overview>

---

## 📚 利用可能なテンプレート

<templates>
### feature-implementation.md
新機能の実装依頼時に使用

**使用タイミング**: 新機能追加、既存機能拡張、ビジネスロジック実装

**特徴**: XMLタグ構造化、コンテキスト明示、期待動作の具体例

### bug-fix.md
バグ修正依頼時に使用

**使用タイミング**: 既存機能の不具合、エラー発生、予期しない動作

**特徴**: 段階的思考（thinking tags）、再現手順、根本原因分析

### code-review.md
コードレビュー依頼時に使用

**使用タイミング**: PR作成前、コード品質チェック、リファクタリング妥当性確認

**特徴**: 多角的分析、プロジェクト規約整合性、重要度別改善提案

### refactoring.md
リファクタリング依頼時に使用

**使用タイミング**: コード改善、構造最適化、パフォーマンス向上

**特徴**: 段階的アプローチ、影響範囲評価、テスト計画
</templates>

---

## 🎯 効果的な使い方

<usage_guide>
### 基本的な使用方法

1. テンプレートを参照（`cat .claude/prompts/feature-implementation.md`）
2. プレースホルダーを実際の値で置換
   - `[機能の説明]` → 具体的な機能名
   - `[ファイルパス]` → 実際のファイルパス
3. Claude Codeに送信

### ベストプラクティス

✅ **推奨**:
```markdown
<instructions>
駅名の曖昧検索機能を実装してください（「東京」→「東京駅」への自動変換）
</instructions>

<context>
src/composables/useStationSearch.ts:42-58 の検索ロジック
src/utils/stationShortcuts.ts に駅名マッピング定義済み
</context>

<constraints>
- 既存のキャッシュ機構を維持
- API呼び出し回数を増やさない
</constraints>

<expected_behavior>
<example>
入力: "東京" → 出力: "東京駅として検索"
</example>
</expected_behavior>
```

❌ **非推奨**:
```markdown
バグを直してください（曖昧）
もっと良くしてください（不明確）
全コードを貼り付け（過剰な情報）
```
</usage_guide>

---

## 🔧 コンテキスト最適化原則

<optimization_principles>
> "望ましい結果の可能性を最大化する、最小限の高シグナルトークンのセットを見つける"

### 重要な原則

1. **明確な指示** - 曖昧さを避け、具体的な要件を記述
2. **コンテキストの動機** - なぜその変更が必要か説明
3. **構造化** - XMLタグやMarkdownでセクション分け
4. **ファイルパス指定** - 具体的なパスと行番号（例: `src/App.tsx:45-67`）
5. **期待動作の例示** - 良い例・悪い例で明示（2-3個の代表例）
6. **制約条件** - 守るべきルールを明記

### ファイルパス参照の推奨方法

```markdown
❌ 悪い例: 「src/components/Map.tsx の全コードを貼り付けて...」
✅ 良い例: 「src/components/Map.tsx:45-67 の useEffect フックを確認」
```

### Few-Shot Examples（少数例示）

網羅的なリストではなく、代表的な例を2-3個提示：

```markdown
<example>
良いコミットメッセージ:
"feat: 駅名曖昧検索機能を追加

- stationShortcuts.ts にマッピング追加
- useStationSearch.ts で自動変換実装"
</example>

<example>
悪いコミットメッセージ: "update", "fix bug", "WIP"
</example>
```
</optimization_principles>

---

## 📖 高度なテクニック

<advanced_techniques>
### 段階的思考（Thinking Tags）

複雑なタスクでは精度が40%向上：

```markdown
まず <thinking> タグ内で：
1. 問題の根本原因を分析
2. 解決策の検討（長所・短所）
3. 影響範囲の評価

その後、<answer> タグ内で実装
```

### XMLタグでの構造化

```markdown
<task>
  <goal>最終目標</goal>
  <approach>アプローチ方法</approach>
</task>

<resources>
  <file path="src/App.tsx">メインコンポーネント</file>
</resources>

<success_criteria>
  <criterion>テストが通る</criterion>
  <criterion>TypeScriptエラーなし</criterion>
</success_criteria>
```
</advanced_techniques>

---

## 🎓 参考リソース

- **CLAUDE.md** - プロジェクト全体のガイド
- **.claude/context/** - プロジェクト固有のコンテキスト
- [Anthropic: Effective Context Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)

---

**質問や改善提案**: プロジェクトのIssueで共有してください
