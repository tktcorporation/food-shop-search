import { Station } from '../useStationSearch/types';

export interface Location {
  lat: number;
  lng: number;
}

export interface Restaurant {
  place_id: string;
  name: string;
  vicinity: string;
  rating: number;
  user_ratings_total: number;
  price_level: number;
  types: string[];
  photos?: google.maps.places.PlacePhoto[];
  searchKeywords: string[];
  opening_hours?: {
    weekday_text?: string[];
  };
  distance?: number;
  geometry?: {
    location: google.maps.LatLng;
  };
  business_status?: string;
}

export interface SearchParams {
  keywords: string[];
  minRating: number;
  minReviews: number;
  searchLocation: Station | Location;
  isOpenNow: boolean;
  searchRadius: number;
  selectedPriceLevels: number[];
}
