import type { Station } from '../useStationSearch/types';

export interface Location {
  lat: number;
  lng: number;
}

/** サーバーAPIから返却されるレストラン型 */
export interface Restaurant {
  place_id: string;
  name: string;
  vicinity: string;
  rating: number;
  user_ratings_total: number;
  price_level: number;
  types: string[];
  photoUrls: string[];
  searchKeywords: string[];
  /** サーバー側の営業状態判定 */
  isOpenNow?: boolean;
  distance?: number;
  business_status?: string;
}

export interface SearchParams {
  keywords: string[];
  minRating: number;
  minReviews: number;
  searchLocation: Station;
  isOpenNow: boolean;
  searchRadius: number;
  selectedPriceLevels: number[];
}
