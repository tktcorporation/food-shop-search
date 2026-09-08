import React, { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Star } from 'lucide-react';
import { getKeywordLabel } from '../utils/keywordOptions';
import type { Restaurant } from '@shared';

// Leaflet default marker icon fix (bundler compatibility)
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const currentLocationIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'current-location-marker',
});

L.Marker.prototype.options.icon = defaultIcon;

interface MapViewProps {
  restaurants: Restaurant[];
  currentLocation?: { lat: number; lng: number } | null;
}

/** Auto-fit map bounds to show all markers */
function FitBounds({
  restaurants,
  currentLocation,
}: {
  restaurants: Restaurant[];
  currentLocation?: { lat: number; lng: number } | null;
}) {
  const map = useMap();
  const prevBoundsKey = useRef<string>('');

  useEffect(() => {
    const points: [number, number][] = [];

    for (const r of restaurants) {
      if (r.lat != null && r.lng != null) {
        points.push([r.lat, r.lng]);
      }
    }

    if (currentLocation) {
      points.push([currentLocation.lat, currentLocation.lng]);
    }

    if (points.length === 0) return;

    const boundsKey = points
      .map(([lat, lng]) => `${lat.toFixed(5)},${lng.toFixed(5)}`)
      .join('|');

    if (boundsKey === prevBoundsKey.current) return;
    prevBoundsKey.current = boundsKey;

    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
  }, [restaurants, currentLocation, map]);

  return null;
}

const formatDistance = (meters: number) => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
};

const MapView: React.FC<MapViewProps> = ({ restaurants, currentLocation }) => {
  const restaurantsWithLocation = useMemo(
    () => restaurants.filter((r) => r.lat != null && r.lng != null),
    [restaurants],
  );

  const center = useMemo<[number, number]>(() => {
    if (currentLocation) {
      return [currentLocation.lat, currentLocation.lng];
    }
    if (restaurantsWithLocation.length > 0) {
      const first = restaurantsWithLocation[0];
      return [first.lat!, first.lng!];
    }
    // Default: Tokyo Station
    return [35.6812, 139.7671];
  }, [currentLocation, restaurantsWithLocation]);

  const openInGoogleMaps = (restaurant: Restaurant) => {
    const searchQuery = encodeURIComponent(
      `${restaurant.name} ${restaurant.vicinity}`,
    );
    const url = `https://www.google.com/maps/search/?api=1&query=${searchQuery}&query_place_id=${restaurant.place_id}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (restaurantsWithLocation.length === 0 && !currentLocation) {
    return (
      <div className="flex items-center justify-center py-12 text-text-muted text-sm">
        地図に表示できるお店がありません
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden border border-gray-200">
      <MapContainer
        center={center}
        zoom={15}
        style={{ height: '60vh', width: '100%', minHeight: '400px' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds
          restaurants={restaurantsWithLocation}
          currentLocation={currentLocation}
        />

        {/* Current location marker */}
        {currentLocation && (
          <Marker
            position={[currentLocation.lat, currentLocation.lng]}
            icon={currentLocationIcon}
          >
            <Popup>
              <span className="font-semibold text-sm">現在地</span>
            </Popup>
          </Marker>
        )}

        {/* Restaurant markers */}
        {restaurantsWithLocation.map((restaurant) => (
          <Marker
            key={restaurant.place_id}
            position={[restaurant.lat!, restaurant.lng!]}
          >
            <Popup>
              <div className="min-w-[200px] max-w-[260px]">
                <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2">
                  {restaurant.name}
                </h3>
                <div className="flex items-center gap-1.5 mb-1 text-xs">
                  <Star
                    className="text-primary-500"
                    size={12}
                    fill="currentColor"
                  />
                  <span className="font-medium">{restaurant.rating}</span>
                  <span className="text-gray-400">
                    ({restaurant.user_ratings_total})
                  </span>
                  {restaurant.price_level > 0 && (
                    <span className="text-gray-500">
                      {'¥'.repeat(restaurant.price_level)}
                    </span>
                  )}
                </div>
                {restaurant.distance !== undefined && (
                  <p className="text-xs text-gray-500 mb-1">
                    {formatDistance(restaurant.distance)}
                  </p>
                )}
                <p className="text-xs text-gray-500 line-clamp-1 mb-1.5">
                  {restaurant.vicinity}
                </p>
                {restaurant.searchKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {restaurant.searchKeywords.slice(0, 2).map((kw, i) => (
                      <span
                        key={i}
                        className="text-xs bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded"
                      >
                        {getKeywordLabel(kw)}
                      </span>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => openInGoogleMaps(restaurant)}
                  className="text-xs text-primary-600 font-medium hover:underline cursor-pointer"
                >
                  Google Maps で開く
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapView;
