const STATION_TYPES = [
  'train_station',
  'subway_station',
  'transit_station',
] as const;

/**
 * Google Place types が駅かどうかを判定する。
 */
export const isStation = (types?: readonly string[]): boolean =>
  types?.some((t) => (STATION_TYPES as readonly string[]).includes(t)) ?? false;
