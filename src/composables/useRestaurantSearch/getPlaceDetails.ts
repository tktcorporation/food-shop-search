import { Restaurant } from './types';

export const getPlaceDetails = async (
  service: google.maps.places.PlacesService,
  place: google.maps.places.PlaceResult & { searchKeywords: string[] },
  location: google.maps.LatLng,
  detailsCache: {
    getCached: (key: string) => Restaurant | null;
    setCached: (key: string, data: Restaurant) => void;
  }
): Promise<Restaurant> => {
  const cached = detailsCache.getCached(place.place_id!);
  if (cached) {
    return {
      ...cached,
      searchKeywords: place.searchKeywords
    };
  }

  return new Promise<Restaurant>((resolve, reject) => {
    service.getDetails({
      placeId: place.place_id,
      fields: [
        'place_id',
        'name',
        'vicinity',
        'rating',
        'user_ratings_total',
        'price_level',
        'types',
        'opening_hours',
        'photos',
        'geometry',
        'business_status'
      ]
    }, (result, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && result) {
        if (result.business_status && result.business_status !== 'OPERATIONAL') {
          resolve({} as Restaurant);
          return;
        }

        let distance: number | undefined;
        if (result.geometry?.location) {
          distance = google.maps.geometry.spherical.computeDistanceBetween(
            location,
            result.geometry.location
          );
        }

        const restaurantData: Restaurant = {
          place_id: result.place_id!,
          name: result.name!,
          vicinity: result.vicinity!,
          rating: result.rating || 0,
          user_ratings_total: result.user_ratings_total || 0,
          price_level: result.price_level || 1,
          types: result.types || [],
          photos: result.photos,
          searchKeywords: place.searchKeywords,
          opening_hours: result.opening_hours ? {
            weekday_text: result.opening_hours.weekday_text
          } : undefined,
          distance,
          geometry: result.geometry ? {
            location: result.geometry.location
          } : undefined,
          business_status: result.business_status
        };

        detailsCache.setCached(result.place_id!, restaurantData);
        resolve(restaurantData);
      } else if (status === google.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
        reject(new Error('Google Maps APIの認証に失敗しました。APIキーを確認してください。'));
      } else {
        resolve({
          place_id: place.place_id!,
          name: place.name!,
          vicinity: place.vicinity!,
          rating: place.rating || 0,
          user_ratings_total: place.user_ratings_total || 0,
          price_level: place.price_level || 1,
          types: place.types || [],
          searchKeywords: place.searchKeywords,
          opening_hours: undefined,
          business_status: place.business_status
        });
      }
    });
  });
};