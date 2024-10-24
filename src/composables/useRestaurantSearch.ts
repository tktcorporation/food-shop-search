import { useState, useCallback } from 'react';

interface Restaurant {
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
    open_now: boolean;
    weekday_text?: string[];
  };
}

interface Station {
  name: string;
  prefecture: string;
}

interface Location {
  lat: number;
  lng: number;
}

const useRestaurantSearch = () => {
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchNearbyRestaurants = useCallback(async (
    keywords: string[],
    minRating: number,
    minReviews: number,
    searchLocation: Station | Location,
    isOpenNow: boolean,
    searchRadius: number,
    selectedPriceLevels: number[]
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      let location: google.maps.LatLng;

      if ('lat' in searchLocation) {
        location = new google.maps.LatLng(searchLocation.lat, searchLocation.lng);
      } else {
        const geocoder = new google.maps.Geocoder();
        const result = await new Promise<google.maps.GeocoderResult>((resolve, reject) => {
          geocoder.geocode(
            { address: `${searchLocation.name}駅,${searchLocation.prefecture}` },
            (results, status) => {
              if (status === google.maps.GeocoderStatus.OK && results?.[0]) {
                resolve(results[0]);
              } else {
                reject(new Error('位置を取得できませんでした。'));
              }
            }
          );
        });
        location = result.geometry.location;
      }

      const service = new google.maps.places.PlacesService(document.createElement('div'));

      const searchPromises = keywords.map(keyword => 
        new Promise<google.maps.places.PlaceResult[]>((resolve, reject) => {
          const request: google.maps.places.PlaceSearchRequest = {
            keyword: keyword,
            location: location,
            radius: searchRadius,
            // type: 'restaurant',
            openNow: isOpenNow
          };

          service.nearbySearch(request, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
              resolve(results);
            } else {
              reject(new Error(`${keyword}の検索に失敗しました。`));
            }
          });
        })
      );

      const searchResults = await Promise.all(searchPromises);

      const combinedResults = searchResults.flatMap((results, index) => 
        results.map(place => ({
          ...place,
          searchKeywords: [keywords[index]]
        }))
      );

      const uniqueResults = combinedResults.reduce((acc, current) => {
        const x = acc.find(item => item.place_id === current.place_id);
        if (!x) {
          return acc.concat([current]);
        } else {
          x.searchKeywords = [...new Set([...x.searchKeywords, ...current.searchKeywords])];
          return acc;
        }
      }, [] as (google.maps.places.PlaceResult & { searchKeywords: string[] })[]);

      const detailedResults = await Promise.all(
        uniqueResults.map(place =>
          new Promise<Restaurant>((resolve) => {
            service.getDetails({
              placeId: place.place_id,
              fields: ['place_id', 'name', 'vicinity', 'rating', 'user_ratings_total', 'price_level', 'types', 'opening_hours', 'photos']
            }, (result, status) => {
              if (status === google.maps.places.PlacesServiceStatus.OK && result) {
                resolve({
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
                    open_now: result.opening_hours.isOpen(),
                    weekday_text: result.opening_hours.weekday_text
                  } : undefined
                });
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
                  opening_hours: undefined
                });
              }
            });
          })
        )
      );

      const filteredResults = detailedResults.filter(place => 
        place.rating >= minRating &&
        place.user_ratings_total >= minReviews &&
        selectedPriceLevels.includes(place.price_level)
      );

      setAllRestaurants(filteredResults);
      setFilteredRestaurants(filteredResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : '検索中にエラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    allRestaurants,
    filteredRestaurants,
    isLoading,
    error,
    searchNearbyRestaurants
  };
};

export default useRestaurantSearch;