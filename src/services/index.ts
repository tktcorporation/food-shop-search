import { Layer } from 'effect';
import {
  GeolocationService,
  GeolocationServiceLive,
} from './GeolocationService';
import { ApiService, ApiServiceLive } from './ApiService';

export { GeolocationService, ApiService };

/** 全サービスを結合した Live レイヤー */
export const AppLive = Layer.mergeAll(GeolocationServiceLive, ApiServiceLive);
