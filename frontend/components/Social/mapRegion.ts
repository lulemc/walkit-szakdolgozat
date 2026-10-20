import type { Coordinates } from "@/services/routeService";

// Room around the route (as a share of its size), and the zoom for a very short route
const PADDING = 1.4;
const MIN_DELTA = 0.005;

/** The map region that shows the whole route */
export const regionForCoordinates = (coordinates: Coordinates[]) => {
  const latitudes = coordinates.map((point) => point.latitude);
  const longitudes = coordinates.map((point) => point.longitude);
  const [minLat, maxLat] = [Math.min(...latitudes), Math.max(...latitudes)];
  const [minLng, maxLng] = [Math.min(...longitudes), Math.max(...longitudes)];

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * PADDING, MIN_DELTA),
    longitudeDelta: Math.max((maxLng - minLng) * PADDING, MIN_DELTA),
  };
};
