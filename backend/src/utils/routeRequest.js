/** Limits for a circular route's length, in kilometres */
export const MIN_DISTANCE_KM = 0.5;
export const MAX_DISTANCE_KM = 50;

const ROUTE_TYPES = ["circular", "point-to-point"];

const isNumberBetween = (value, min, max) =>
  typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;

const isCoordinate = (location) =>
  isNumberBetween(location?.latitude, -90, 90) && isNumberBetween(location?.longitude, -180, 180);

/**
 * Checks a route generation request before any routing service is called.
 * Returns a message for the client, or null when the request is fine.
 */
export const routeRequestProblem = (body) => {
  const { routeType, startLocation, destinationLocation, distance, preferences } = body ?? {};

  if (!ROUTE_TYPES.includes(routeType)) return "routeType must be circular or point-to-point";
  if (!isCoordinate(startLocation)) return "startLocation must have a valid latitude and longitude";

  if (routeType === "circular" && !isNumberBetween(distance, MIN_DISTANCE_KM, MAX_DISTANCE_KM)) {
    return `distance must be between ${MIN_DISTANCE_KM} and ${MAX_DISTANCE_KM} km`;
  }
  if (routeType === "point-to-point" && !isCoordinate(destinationLocation)) {
    return "destinationLocation must have a valid latitude and longitude";
  }

  if (preferences !== undefined && (typeof preferences !== "object" || preferences === null)) {
    return "preferences must be an object";
  }
  return null;
};
