import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// 必須の環境変数をチェック
const requiredEnvVars = ['VITE_GOOGLE_MAPS_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(
  (varName) => !import.meta.env[varName],
);

if (missingEnvVars.length > 0) {
  const errorMessage = `
    必要な環境変数が設定されていません:
    ${missingEnvVars.join(', ')}
    
    .env ファイルに以下の変数を設定してください:
    VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
  `;

  throw new Error(errorMessage);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
