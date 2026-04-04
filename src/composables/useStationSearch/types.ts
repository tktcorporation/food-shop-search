export interface Station {
  name: string;
  prefecture: string;
  address: string;
  distance?: number;
  placeId: string;
  lat?: number;
  lng?: number;
}
