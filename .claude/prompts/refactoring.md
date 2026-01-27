# リファクタリングプロンプトテンプレート

このテンプレートを使用して、コードのリファクタリングをClaude Codeに依頼してください。

## テンプレート

```markdown
<refactoring_request>

## リファクタリングの目的

[なぜリファクタリングが必要か]

## 対象コード

ファイルパス: [ファイルパス]
対象範囲: [行番号または関数名]

## 現在の問題点

- [問題点1]
- [問題点2]
- [問題点3]
  </refactoring_request>

<instructions>
以下の観点でリファクタリングしてください：

1. **可読性の向上**
   - [具体的な改善ポイント]

2. **保守性の向上**
   - [具体的な改善ポイント]

3. **パフォーマンスの最適化**（該当する場合）
   - [具体的な改善ポイント]

4. **型安全性の強化**（TypeScriptの場合）
   - [具体的な改善ポイント]
     </instructions>

<constraints>
リファクタリングの制約：
- [ ] 外部から見た動作を変更しない（既存のインターフェースを維持）
- [ ] 既存のテストが通る状態を維持
- [ ] パフォーマンスを劣化させない
- [ ] [その他のプロジェクト固有の制約]
</constraints>

<context>
関連するコード：
- [関連ファイル1]: [役割]
- [関連ファイル2]: [役割]

このコードの役割：
[コードがプロジェクト内で果たしている役割]

最近の変更：
[関連する最近のコミットや変更]
</context>

<success_criteria>
リファクタリング後の成功基準：

- [ ] コードの意図が明確になっている
- [ ] 重複コードが削減されている
- [ ] 関数が単一責任の原則に従っている
- [ ] TypeScriptの型が適切に定義されている
- [ ] 既存のテストが通る
- [ ] [その他のプロジェクト固有の基準]
      </success_criteria>
```

## 使用例

### 例1: 複雑な関数の分割

```markdown
<refactoring_request>

## リファクタリングの目的

useRestaurantSearch.ts の searchRestaurants 関数が複雑になりすぎて、
可読性と保守性が低下している。複数の責務を持っているため分割したい。

## 対象コード

ファイルパス: src/composables/useRestaurantSearch.ts
対象範囲: searchRestaurants 関数（120-280行）

## 現在の問題点

- 1つの関数が200行以上ある
- キャッシュ処理、API呼び出し、フィルタリング、エラーハンドリングが混在
- テストが困難
- 部分的な再利用ができない
  </refactoring_request>

<instructions>
以下の観点でリファクタリングしてください：

1. **可読性の向上**
   - 各処理を意味のある小さな関数に分割
   - 変数名を明確にする
   - コメントで意図を明示

2. **保守性の向上**
   - 単一責任の原則に従って関数を分離
   - キャッシュ処理を独立した関数に
   - APIコール部分を独立した関数に
   - フィルタリングロジックを独立した関数に

3. **型安全性の強化**
   - 各関数の引数と戻り値の型を明示
   - 中間データの型を定義
     </instructions>

<constraints>
リファクタリングの制約：
- [x] 外部から見た動作を変更しない（useRestaurantSearch のインターフェースを維持）
- [x] 既存のテストが通る状態を維持
- [x] パフォーマンスを劣化させない
- [x] キャッシュマネージャー（cacheManager.ts）を引き続き使用
</constraints>

<context>
関連するコード：
- src/utils/cacheManager.ts: キャッシュ管理ユーティリティ
- src/composables/useOperatingHours.ts: 営業時間フィルター
- src/components/UnifiedSearchResultsScreen/: 検索結果画面（使用側）

このコードの役割：
レストラン検索の中核ロジック。現在地または指定座標の周辺レストランを
Google Maps Places APIで検索し、各種フィルターを適用して結果を返す。

最近の変更：
先月、営業時間フィルターとキャッシュ機能を追加したが、それにより
関数が肥大化した。
</context>

<success_criteria>
リファクタリング後の成功基準：

- [x] 各関数が50行以下
- [x] 各関数が単一の責務を持つ
- [x] 関数名が処理内容を明確に表している
- [x] TypeScriptの型が適切に定義されている
- [x] 既存のテストが通る
- [x] 新しく分割された関数が個別にテスト可能
      </success_criteria>
```

### 例2: 重複コードの削減

```markdown
<refactoring_request>

## リファクタリングの目的

useLocationSearch.ts と useStationSearch.ts に重複した
レストラン検索ロジックが存在する。DRY原則に違反しているため、
共通化したい。

## 対象コード

ファイルパス:

- src/composables/useLocationSearch.ts（85-120行）
- src/composables/useStationSearch.ts（92-127行）

## 現在の問題点

- 同じレストラン検索ロジックが2箇所に存在
- 片方を修正しても、もう片方に反映されない
- バグ修正やメンテナンスが二重の手間
- コードの総量が不必要に多い
  </refactoring_request>

<instructions>
以下の観点でリファクタリングしてください：

1. **DRY原則の適用**
   - 重複している検索ロジックを抽出
   - 共通の関数またはフックとして切り出す
   - 両方のフックから共通ロジックを利用

2. **適切な抽象化**
   - 共通部分と差異部分を明確に分離
   - パラメータで差異を吸収
   - 拡張性を考慮した設計

3. **保守性の向上**
   - 1箇所の修正で両方に反映される構造
   - テストが容易な構造
     </instructions>

<constraints>
リファクタリングの制約：
- [x] useLocationSearch と useStationSearch の外部インターフェースを維持
- [x] 既存の使用箇所（コンポーネント側）の修正が不要
- [x] パフォーマンスを劣化させない
- [x] TypeScript strict mode を維持
</constraints>

<context>
関連するコード：
- src/composables/useRestaurantSearch.ts: 既存のレストラン検索フック
- src/components/UnifiedSearchResultsScreen/LocationSearch.tsx: 現在地検索画面
- src/components/UnifiedSearchResultsScreen/StationSearch.tsx: 駅検索画面

このコードの役割：

- useLocationSearch: 現在地から周辺レストランを検索
- useStationSearch: 駅名から座標を取得し、周辺レストランを検索

共通している処理：

- Google Maps Places API の呼び出し
- 結果のフィルタリング（価格帯、評価など）
- キャッシュ処理
- エラーハンドリング

異なる処理：

- useLocationSearch: Geolocation APIで現在地取得
- useStationSearch: Geocoding APIで駅名→座標変換
  </context>

<success_criteria>
リファクタリング後の成功基準：

- [x] 重複コードが削減されている
- [x] 共通ロジックが1箇所に集約されている
- [x] 両方のフックが共通ロジックを利用している
- [x] 外部インターフェースが変わっていない
- [x] 既存のテストが通る
- [x] 新しい共通関数が単独でテスト可能
      </success_criteria>
```

### 例3: 型安全性の強化

```markdown
<refactoring_request>

## リファクタリングの目的

Google Maps API のレスポンスを any 型で扱っているため、
型安全性が低く、実行時エラーが発生しやすい。
適切な型定義を追加して型安全性を向上させたい。

## 対象コード

ファイルパス: src/composables/useRestaurantSearch.ts
対象範囲: 全体（特に API レスポンスの型定義）

## 現在の問題点

- APIレスポンスが any 型
- プロパティへのアクセスが型チェックされない
- 存在しないプロパティへのアクセスがコンパイル時に検出されない
- IDEの補完が効かない
- リファクタリングが困難
  </refactoring_request>

<instructions>
以下の観点でリファクタリングしてください：

1. **型定義の追加**
   - Google Maps Places API のレスポンス型を定義
   - 中間データの型を定義
   - 戻り値の型を明示

2. **型安全性の向上**
   - any 型を排除
   - オプショナルプロパティを適切に扱う（?演算子、??演算子）
   - 型ガードを必要に応じて追加

3. **開発体験の向上**
   - IDE の補完が効くようにする
   - 型エラーをコンパイル時に検出
   - リファクタリングしやすい構造
     </instructions>

<constraints>
リファクタリングの制約：
- [x] 既存の動作を変更しない
- [x] TypeScript strict mode を維持
- [x] 既存のテストが通る
- [x] Google Maps API の実際の型に準拠
</constraints>

<context>
関連するコード：
- @types/google.maps: Google Maps の型定義パッケージ
- src/types/: プロジェクトの型定義ディレクトリ（必要に応じて追加）

このコードの役割：
Google Maps Places API を呼び出し、レストラン情報を取得・加工して返す。

現在の実装：

- API レスポンスを any として受け取り
- プロパティアクセス時に型チェックなし
- runtime で undefined チェックをしている箇所もある
  </context>

<success_criteria>
リファクタリング後の成功基準：

- [x] any 型が排除されている
- [x] 適切な型定義が追加されている
- [x] TypeScript strict mode でエラーがない
- [x] IDE の補完が正常に動作する
- [x] 存在しないプロパティへのアクセスがコンパイルエラーになる
- [x] 既存のテストが通る
      </success_criteria>
```

## リファクタリングのベストプラクティス

### 1. 段階的にリファクタリングする

大規模なリファクタリングは、小さなステップに分割：

```markdown
<instructions>
以下の順序で段階的にリファクタリングしてください：

ステップ1: 型定義の追加（動作は変更しない）
ステップ2: 関数の分割（型を活用）
ステップ3: 重複コードの削減
ステップ4: 最終的な最適化

各ステップ後、既存のテストが通ることを確認してください。
</instructions>
```

### 2. テストファーストアプローチ

リファクタリング前にテストがあることを確認：

```markdown
<pre_refactoring_checks>
リファクタリング前の確認事項：

1. 既存のテストが通ることを確認
2. テストがない場合は、まずテストを追加
3. カバレッジが十分か確認
4. エッジケースがテストされているか確認
   </pre_refactoring_checks>
```

### 3. 動作を変更しない

リファクタリングの基本原則：

```markdown
<refactoring_principles>
IMPORTANT: リファクタリングは「内部構造の改善」であり、
「外部から見た動作の変更」ではありません。

- インターフェースを維持
- 既存のテストが通る
- パフォーマンス特性を維持
- バグ修正はリファクタリングと分離

もし動作変更が必要な場合は、リファクタリングとは別に行ってください。
</refactoring_principles>
```

## リファクタリング後のチェックリスト

```markdown
<post_refactoring_checklist>
リファクタリング完了後、以下を確認してください：

- [ ] すべての既存テストが通る
- [ ] TypeScript コンパイルエラーがない
- [ ] ESLint 警告がない
- [ ] ビルドが成功する
- [ ] パフォーマンステストが通る（該当する場合）
- [ ] コードレビューの準備ができている
- [ ] コミットメッセージが適切
- [ ] 変更内容が文書化されている
      </post_refactoring_checklist>
```
