# Jujutsu (jj) VCS ルール

このプロジェクトでは Git の代わりに jj (Jujutsu) を使用する。

## 基本ルール

- `git add` は使わない（jj は変更を自動追跡する）
- `git commit` は使わない（代わりに `jj commit` を使う）
- `git status` の代わりに `jj status` を使う
- `git log` の代わりに `jj log` を使う
- `git diff` の代わりに `jj diff` を使う

## よく使うコマンド

```bash
jj status           # 現在の変更状態を確認
jj log              # コミット履歴を表示
jj diff             # 変更差分を表示
jj commit -m "msg"  # 変更をコミット
jj describe -m "msg" # 現在の変更にメッセージを設定
jj new              # 新しい空のチェンジを作成
jj bookmark create <name>  # ブックマーク（≒ブランチ）を作成
jj git push         # リモートにプッシュ
```

## 初期化

IMPORTANT: jj コマンド実行時に「There is no jj repo」エラーが出た場合、以下を実行して初期化すること：

```bash
jj git init --colocate
jj bookmark track main --remote=origin
```

初期化後、中断した作業を jj コマンドで続行する。

## Git との共存

- jj は Git リポジトリと colocated モードで動作している
- `.jj/` ディレクトリは `.gitignore` に含めないこと（jj が管理する）
- `jj git push` で GitHub にプッシュできる
