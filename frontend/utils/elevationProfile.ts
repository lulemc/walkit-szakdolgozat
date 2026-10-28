import type { Coordinates } from '@/services/routeService';
import { haversineMeters } from './walkMetrics';

export const PROFILE_BARS = 40;

export interface ElevationProfileData {
  /** One value per bar, 0 (lowest point) to 1 (highest), evenly spaced along the route */
  bars: number[];
  minM: number;
  maxM: number;
}

/**
 * The route's height along the distance walked, for a small profile chart.
 * Null if fewer than two points have a height (e.g. routes saved before
 * heights were kept) or the path has no length.
 */
export const elevationProfile = (
  coordinates: Coordinates[],
  barCount: number = PROFILE_BARS,
): ElevationProfileData | null => {
  const points = coordinates.filter(
    (point): point is Coordinates & { elevation: number } => typeof point.elevation === 'number',
  );
  if (points.length < 2) return null;

  // Distance walked to each point
  const along = [0];
  for (let i = 1; i < points.length; i++) along.push(along[i - 1] + haversineMeters(points[i - 1], points[i]));
  const total = along[along.length - 1];
  if (total === 0) return null;

  const heightAt = (distance: number) => {
    let i = 1;
    while (i < points.length - 1 && along[i] < distance) i++;
    const stretch = along[i] - along[i - 1];
    const share = stretch === 0 ? 1 : (distance - along[i - 1]) / stretch;
    return points[i - 1].elevation + share * (points[i].elevation - points[i - 1].elevation);
  };

  const heights = Array.from({ length: barCount }, (_, k) => heightAt((k / (barCount - 1)) * total));
  const minM = Math.min(...points.map((point) => point.elevation));
  const maxM = Math.max(...points.map((point) => point.elevation));
  const range = maxM - minM;

  return {
    bars: heights.map((height) => (range === 0 ? 0.5 : (height - minM) / range)),
    minM,
    maxM,
  };
};
