import type { Coordinates } from '@/services/routeService';

const EARTH_RADIUS_M = 6371e3;
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/** Distance in metres between two points on the Earth's surface */
export const haversineMeters = (from: Coordinates, to: Coordinates): number => {
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const dLat = toRadians(to.latitude - from.latitude);
  const dLng = toRadians(to.longitude - from.longitude);

  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * Length of a walked path in metres. The path is split into segments (one per
 * stretch between pauses), and the gap between two segments isn't counted.
 */
export const segmentsDistance = (segments: Coordinates[][]): number =>
  segments.reduce(
    (total, segment) =>
      total + segment.slice(1).reduce((sum, point, i) => sum + haversineMeters(segment[i], point), 0),
    0,
  );

/** e.g. "2m 5s" or "1h 2m 5s" */
export const formatElapsed = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return hrs > 0 ? `${hrs}h ${mins}m ${secs}s` : `${mins}m ${secs}s`;
};

/** e.g. "850m" or "1.23km" */
export const formatWalkDistance = (meters: number): string =>
  meters < 1000 ? `${meters.toFixed(0)}m` : `${(meters / 1000).toFixed(2)}km`;

/** Minutes per kilometre, e.g. "9:30" */
export const formatPace = (seconds: number, meters: number): string => {
  if (meters === 0) return '0:00';
  const minPerKm = seconds / 60 / (meters / 1000);
  const mins = Math.floor(minPerKm);
  const secs = Math.floor((minPerKm - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/** Monday 00:00 of the date's week, in the user's time zone */
export const startOfLocalWeek = (date: Date): Date => {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  // getDay(): Sunday is 0, so Sunday goes back 6 days and Monday 0
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start;
};
