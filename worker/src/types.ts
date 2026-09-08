// Google Maps API raw response types (Worker infrastructure only)
// Domain / API contract types live in @shared (SSOT).

export interface GooglePlaceResult {
  place_id: string;
  name: string;
  vicinity: string;
  formatted_address?: string;
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

export interface GoogleTextSearchResponse {
  results: GooglePlaceResult[];
  status: string;
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
