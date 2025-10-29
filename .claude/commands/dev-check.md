---
description: 開発環境のセットアップと動作確認を実施
---

<instructions>
開発環境が正しくセットアップされているか確認してください。
</instructions>

<checklist>
## 確認項目

1. **Node.jsバージョン**
   - `node --version` → Node.js 18以上（推奨20）
   - miseの場合: `mise current`

2. **依存関係**
   - `npm list` → エラーがないか確認
   - 問題があれば `npm install`

3. **環境変数**
   - `.env` ファイル存在確認
   - `VITE_GOOGLE_MAPS_API_KEY` 設定確認

4. **開発サーバー**
   - `npm run dev` → http://localhost:5173
   - エラーがないか確認

5. **Lint**
   - `npm run lint` → エラー/警告なし
</checklist>

<success_criteria>
すべて問題なければ、開発を開始できます。
</success_criteria>
