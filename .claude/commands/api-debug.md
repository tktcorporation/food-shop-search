---
description: Google Maps API関連の問題をデバッグ
---

Google Maps APIの問題をデバッグします：

1. **環境変数の確認**
   - `.env` ファイルの `VITE_GOOGLE_MAPS_API_KEY` を確認
   - APIキーが正しく設定されているか確認

2. **APIキーの有効性チェック**
   - Google Cloud Consoleで以下のAPIが有効になっているか確認：
     - Maps JavaScript API
     - Places API
     - Geocoding API

3. **ブラウザコンソールのエラー確認**
   - 開発者ツールのコンソールを開く
   - Google Maps API関連のエラーメッセージを確認
   - 特に以下のエラーに注意：
     - API Key制限エラー
     - Quota超過エラー
     - CORSエラー

4. **ネットワークタブの確認**
   - Network タブでGoogle Maps APIへのリクエストを確認
   - レスポンスステータスが200であることを確認
   - エラーレスポンスの内容を確認

5. **キャッシュのクリア**
   - ブラウザのキャッシュをクリア
   - アプリケーションのlocalStorageをクリア
   - 必要に応じてハードリロード（Ctrl+Shift+R）

6. **API制限の確認**
   - Google Cloud Consoleでクォータの使用状況を確認
   - 日次制限や分あたりの制限に達していないか確認

問題が解決しない場合は、APIキーを再生成するか、Google Cloud Consoleでサポートに問い合わせてください。
