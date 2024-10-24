export interface Station {
  name: string;
  prefecture: string;
  address?: string;
  distance?: number;
  rawPrediction: google.maps.places.AutocompletePrediction;
}