import { Layer } from 'effect';
import {
  GoogleMapsGeocoderService,
  GoogleMapsGeocoderServiceLive,
} from './GoogleMapsGeocoderService';
import {
  GoogleMapsPlacesService,
  GoogleMapsPlacesServiceLive,
} from './GoogleMapsPlacesService';
import {
  GeolocationService,
  GeolocationServiceLive,
} from './GeolocationService';
import { CacheService, CacheServiceLive } from './CacheService';

export {
  GoogleMapsGeocoderService,
  GoogleMapsPlacesService,
  GeolocationService,
  CacheService,
};

/** 全サービスを結合した Live レイヤー */
export const AppLive = Layer.mergeAll(
  GoogleMapsGeocoderServiceLive,
  GoogleMapsPlacesServiceLive,
  GeolocationServiceLive,
  CacheServiceLive,
);
