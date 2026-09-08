/**
 * 駅名入力を正規化する（末尾の「駅」を除去してトリム）。
 * 「新宿駅」→「新宿」
 */
export const normalizeStationInput = (input: string): string =>
  input.trim().replace(/駅$/, '');

/**
 * 住所・説明文から都道府県名を抽出する。
 */
export const extractPrefecture = (text: string): string => {
  const match = text.match(/(北海道|東京都|(?:京都|大阪)府|.{2,3}県)/);
  return match ? match[1] : '';
};

/**
 * 駅名に「駅」サフィックスを付与する（既にあればそのまま）。
 */
export const ensureStationSuffix = (name: string): string =>
  name.endsWith('駅') ? name : `${name}駅`;
