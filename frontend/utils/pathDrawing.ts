import type { Coordinates } from '@/services/routeService';

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/**
 * The walked path as SVG polyline points ("x,y x,y ..."), one per stretch
 * between pauses, fitted into width x height with north up. Longitude is
 * scaled by the latitude, so the shape isn't stretched sideways.
 */
export const pathToPolylines = (
  segments: Coordinates[][],
  width: number,
  height: number,
  padding = 16,
): string[] => {
  const all = segments.flat();
  if (all.length < 2) return [];

  const middleLatitude = all.reduce((sum, point) => sum + point.latitude, 0) / all.length;
  const xScale = Math.cos(toRadians(middleLatitude));
  const project = (point: Coordinates) => ({ x: point.longitude * xScale, y: -point.latitude });

  const projected = all.map(project);
  const minX = Math.min(...projected.map((point) => point.x));
  const maxX = Math.max(...projected.map((point) => point.x));
  const minY = Math.min(...projected.map((point) => point.y));
  const maxY = Math.max(...projected.map((point) => point.y));
  const spanX = maxX - minX;
  const spanY = maxY - minY;
  if (spanX === 0 && spanY === 0) return [];

  const scale = Math.min(
    spanX === 0 ? Infinity : (width - 2 * padding) / spanX,
    spanY === 0 ? Infinity : (height - 2 * padding) / spanY,
  );
  // Centre the drawing in the box
  const offsetX = (width - spanX * scale) / 2;
  const offsetY = (height - spanY * scale) / 2;

  return segments
    .filter((segment) => segment.length >= 2)
    .map((segment) =>
      segment
        .map(project)
        .map(({ x, y }) => `${(offsetX + (x - minX) * scale).toFixed(1)},${(offsetY + (y - minY) * scale).toFixed(1)}`)
        .join(' '),
    );
};
