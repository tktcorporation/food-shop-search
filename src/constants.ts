/**
 * アプリケーション全体で使用される定数
 */

import { MAX_KEYWORDS_PER_SEARCH } from '@shared';

// ============================================
// UI 関連
// ============================================

/** 検索デバウンスの待機時間 (ミリ秒) */
export const SEARCH_DEBOUNCE_MS = 500;

/** 駅検索デバウンスの待機時間 (ミリ秒) */
export const STATION_SEARCH_DEBOUNCE_MS = 300;

/** 営業時間チェックの更新間隔 (ミリ秒) */
export const OPERATING_HOURS_CHECK_INTERVAL_MS = 60000;

// ============================================
// 検索フィルター デフォルト値
// ============================================

/** デフォルトの最小評価 */
export const DEFAULT_MIN_RATING = 3.5;

/** デフォルトの最小レビュー数 */
export const DEFAULT_MIN_REVIEWS = 100;

/** デフォルトの検索半径 (メートル) */
export const DEFAULT_SEARCH_RADIUS = 300;

/** デフォルトの価格帯選択 */
export const DEFAULT_PRICE_LEVELS = [1, 2, 3, 4];

/**
 * 初期選択キーワード（全選択は Nearby Search 課金が膨れるため少数に限定）
 */
export const DEFAULT_KEYWORDS = [
  'ランチ',
  'カフェ',
  'ラーメン',
  '定食',
  '居酒屋',
] as const;

/** 同時選択できるキーワード上限（Worker の maxItems と一致） */
export const MAX_SELECTED_KEYWORDS = MAX_KEYWORDS_PER_SEARCH;
