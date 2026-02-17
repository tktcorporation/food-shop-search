// Result type for error handling without throw
export type Result<T> =
  | { readonly ok: true; readonly data: T }
  | { readonly ok: false; readonly error: string };

// Location type
export interface Location {
  lat: number;
  lng: number;
}

// Restaurant (server-side, no google.maps types)
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
  isOpenNow?: boolean;
  distance?: number;
  business_status?: string;
}

// Station (server-side, no rawPrediction)
export interface Station {
  name: string;
  prefecture: string;
  address: string;
  distance?: number;
  placeId: string;
}

// API Request types
export interface RestaurantSearchRequest {
  keywords: string[];
  location: Location;
  radius: number;
  stationPlaceId: string; // for stable cache key
}

export interface StationSearchRequest {
  input: string;
}

export interface NearbyStationsRequest {
  lat: number;
  lng: number;
}

export interface ForwardGeocodeRequest {
  address: string;
}

export interface ReverseGeocodeRequest {
  lat: number;
  lng: number;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Google Maps API raw response types (for parsing)
export interface GooglePlaceResult {
  place_id: string;
  name: string;
  vicinity: string;
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  types?: string[];
  photos?: Array<{
    photo_reference: string;
    width: number;
    height: number;
  }>;
  opening_hours?: { open_now?: boolean };
  geometry?: { location: { lat: number; lng: number } };
  business_status?: string;
}

export interface GoogleNearbySearchResponse {
  results: GooglePlaceResult[];
  status: string;
  next_page_token?: string;
}

export interface GoogleAutocompletePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  types?: string[];
}

export interface GoogleAutocompleteResponse {
  predictions: GoogleAutocompletePrediction[];
  status: string;
}

export interface GoogleGeocodeResult {
  formatted_address: string;
  geometry: { location: { lat: number; lng: number } };
}

export interface GoogleGeocodeResponse {
  results: GoogleGeocodeResult[];
  status: string;
}
