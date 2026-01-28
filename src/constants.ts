/**
 * アプリケーション全体で使用される定数
 */

// ============================================
// API 関連
// ============================================

/** getDetails APIの最大呼び出し数（コスト制御） */
export const MAX_DETAILS_REQUESTS = 20;

/** API並列リクエストの最大数 */
export const MAX_CONCURRENCY = 5;

/** 周辺駅検索で返す最大駅数 */
export const MAX_NEARBY_STATIONS = 5;

/** 周辺駅検索の半径 (メートル) */
export const NEARBY_STATIONS_RADIUS = 5000;

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
export const DEFAULT_SEARCH_RADIUS = 100;

/** デフォルトの価格帯選択 */
export const DEFAULT_PRICE_LEVELS = [1, 2, 3, 4];

// ============================================
// 位置情報関連
// ============================================

/** 位置キャッシュキーの小数点桁数（≈ 約100m精度） */
export const POSITION_CACHE_PRECISION = 3;
