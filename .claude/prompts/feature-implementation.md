# 新機能実装プロンプトテンプレート

このテンプレートを使用して、新機能の実装をClaude Codeに依頼してください。

## テンプレート

```markdown
<instructions>
以下の新機能を実装してください：
[機能の簡潔な説明]

具体的な要件：

- [要件1]
- [要件2]
- [要件3]
  </instructions>

<context>
関連するファイル：
- [ファイルパス1]: [役割の説明]
- [ファイルパス2]: [役割の説明]

プロジェクトのアーキテクチャ：

- composables/: ビジネスロジック
- components/: UIコンポーネント
- utils/: ユーティリティ関数

現在の実装状態：
[既存の関連機能や依存関係について]
</context>

<constraints>
- TypeScriptの厳格モードを維持
- 既存のコーディング規約に従う
- エラーハンドリングを適切に実装
- [その他のプロジェクト固有の制約]
</constraints>

<expected_behavior>
期待する動作：

1. [ステップ1]
2. [ステップ2]
3. [ステップ3]

例：
<example>
ユーザーが「東京」と入力した場合
→ 「東京駅」として認識
→ 駅周辺500mのレストランを検索
→ 結果を評価順に表示
</example>
</expected_behavior>

<test_plan>
実装後、以下を確認してください：

- [ ] TypeScriptエラーがない
- [ ] ESLintの警告がない
- [ ] 既存機能に影響がない
- [ ] ビルドが成功する
      </test_plan>
```

## 使用例

```markdown
<instructions>
駅名の曖昧検索機能を実装してください。

具体的な要件：

- ユーザーが「東京」と入力した場合、「東京駅」として認識
- 「新宿」→「新宿駅」のように自動変換
- 既に「駅」が含まれている場合は変換しない
- 変換できない場合はそのまま検索
  </instructions>

<context>
関連するファイル：
- src/composables/useStationSearch.ts: 駅検索ロジック
- src/utils/stationShortcuts.ts: 駅名のマッピング

現在の実装状態：
useStationSearch フックは駅名を受け取り、Google Maps Geocoding APIで
座標を取得しています。stationShortcuts.ts には主要駅のマッピングが
定義されています。
</context>

<constraints>
- 既存の stationShortcuts.ts の構造を維持
- Geocoding APIのリクエスト回数を増やさない
- キャッシュマネージャーを活用してパフォーマンス最適化
</constraints>

<expected_behavior>
期待する動作：

1. ユーザーが駅名を入力（「東京」）
2. stationShortcuts で変換チェック（「東京」→「東京駅」）
3. 変換後の駅名でGeocoding API呼び出し
4. 結果をキャッシュに保存

例：
<example>
入力: "東京"
出力: "東京駅の座標を取得 → 周辺レストラン検索"
</example>

<example>
入力: "東京駅"（既に「駅」付き）
出力: "そのまま検索"
</example>
</expected_behavior>

<test_plan>
実装後、以下を確認してください：

- [ ] 主要駅名（東京、新宿、渋谷など）が正しく変換される
- [ ] 既に「駅」が付いている場合は重複しない
- [ ] 変換できない駅名はそのまま検索される
- [ ] キャッシュが正しく機能する
- [ ] TypeScriptエラーがない
      </test_plan>
```
