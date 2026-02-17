const STATION_TYPES = ['train_station', 'subway_station', 'transit_station'];

/**
 * Check if a place type list includes a station type.
 */
export function isStation(types?: string[]): boolean {
  return types?.some((t) => STATION_TYPES.includes(t)) ?? false;
}
