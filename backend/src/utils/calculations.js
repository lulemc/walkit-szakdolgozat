/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {Object} point1 - {latitude, longitude}
 * @param {Object} point2 - {latitude, longitude}
 * @returns {number} Distance in meters
 */
export function calculateDistance(point1, point2) {
  const R = 6371e3; // Earth radius in meters
  const fi1 = (point1.latitude * Math.PI) / 180;
  const fi2 = (point2.latitude * Math.PI) / 180;
  const lam = ((point2.latitude - point1.latitude) * Math.PI) / 180;
  const alpha = ((point2.longitude - point1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(lam / 2) * Math.sin(lam / 2) +
    Math.cos(fi1) * Math.cos(fi2) * Math.sin(alpha / 2) * Math.sin(alpha / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculate total distance of a path
 * @param {Array} coordinates - Array of {latitude, longitude} objects
 * @returns {number} Total distance in meters
 */
export function calculatePathDistance(coordinates) {
  if (coordinates.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 1; i < coordinates.length; i++) {
    totalDistance += calculateDistance(coordinates[i - 1], coordinates[i]);
  }

  return totalDistance;
}

/**
 * Calculate destination point given start, distance, and bearing
 * @param {Object} start - {latitude, longitude}
 * @param {number} distanceMeters - Distance in meters
 * @param {number} bearingRadians - Bearing in radians (0 = North, π/2 = East, etc.)
 * @returns {Object} Destination coordinates {latitude, longitude}
 */
export function calculateDestinationPoint(
  start,
  distanceMeters,
  bearingRadians,
) {
  const R = 6371e3; // Earth radius in meters
  const fi1 = (start.latitude * Math.PI) / 180;
  const alpha1 = (start.longitude * Math.PI) / 180;
  const beta = distanceMeters / R;

  const fi2 = Math.asin(
    Math.sin(fi1) * Math.cos(beta) +
      Math.cos(fi1) * Math.sin(beta) * Math.cos(bearingRadians),
  );

  const alpha2 =
    alpha1 +
    Math.atan2(
      Math.sin(bearingRadians) * Math.sin(beta) * Math.cos(fi1),
      Math.cos(beta) - Math.sin(fi1) * Math.sin(fi2),
    );

  return {
    latitude: (fi2 * 180) / Math.PI,
    longitude: (alpha2 * 180) / Math.PI,
  };
}

/**
 * Calculate walking duration based on distance
 * @param {number} distanceKm - Distance in kilometers
 * @param {number} paceMinPerKm - Pace in minutes per kilometer (default 11 min/km)
 * @returns {number} Duration in minutes
 */
export function calculateWalkingDuration(distanceKm, paceMinPerKm = 11) {
  return distanceKm * paceMinPerKm;
}
