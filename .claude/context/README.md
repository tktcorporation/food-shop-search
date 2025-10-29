# コンテキストドキュメント

<purpose>
このディレクトリには、プロジェクト固有のコンテキスト情報が分割されて格納されています。

Anthropicのコンテキストエンジニアリングベストプラクティスに従い、
「最小限の高シグナルトークン」の原則に基づいて、必要な情報を必要な時に
動的に参照できるよう構成されています。
</purpose>

---

## 📁 ファイル構成

<files>
### architecture.md
**内容**: プロジェクト構造・設計パターン・ディレクトリ規則

**参照タイミング**:
- 新機能の実装場所を決定する時
- ディレクトリ構造を理解したい時
- composables/hooks/utilsの使い分けを確認する時

### api-guidelines.md
**内容**: Google Maps API使用法・セキュリティ・最適化

**参照タイミング**:
- Google Maps API関連の実装時
- APIキーのセキュリティ確認時
- パフォーマンス最適化が必要な時
- API関連エラーのデバッグ時

### coding-standards.md
**内容**: TypeScript規約・命名規則・スタイリング・チェックリスト

**参照タイミング**:
- 新しいコンポーネント/関数の命名時
- コーディング規約を確認したい時
- 新機能追加前のチェックリスト確認時
</files>

---

## 💡 使い方

<usage>
### Claude Codeとの対話時

具体的なファイルパスを指定して参照してください：

```markdown
<context>
.claude/context/architecture.md のディレクトリ規則に従って、
新しいレストラン検索ロジックを適切な場所に配置してください。
</context>
```

### 全体像の把握

プロジェクト全体のガイドは **CLAUDE.md**（ルート）を参照してください。
CLAUDE.mdは目次として機能し、各コンテキストファイルへのリンクを提供しています。
</usage>

---

## 🎯 設計原則

<principles>
このディレクトリ構造は以下の原則に基づいています：

1. **ファイルシステムがシグナル**
   - ファイル名が目的を明確に示す
   - ディレクトリ構造が情報の種類を示す

2. **最小限の高シグナルトークン**
   - 各ファイルは40-60行程度
   - 必要な情報だけを含む
   - XMLタグで構造化

3. **動的参照**
   - すべてをコンテキストに含めず、必要に応じて参照
   - コンテキストウィンドウの効率的な使用

参考: [Anthropic: Effective Context Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
</principles>

---

## 📊 整理の成果

<metrics>
**整理前**:
- CLAUDE.md: 410行（すべての情報が1ファイル）
- .claude/prompts/README.md: 259行

**整理後**:
- CLAUDE.md: 167行（59%削減・目次として機能）
- .claude/prompts/README.md: 181行（30%削減）
- .claude/context/: 3ファイル、各60行程度（新規・動的参照用）

**効果**:
- 必要な情報を必要な時だけ参照可能
- コンテキストウィンドウの効率的な使用
- 情報の発見と更新が容易
</metrics>
