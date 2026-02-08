/**
 * Formats minutes into a human-readable time string
 * @param minutes - Total minutes to format
 * @returns Formatted string like "45 min" or "1 h 30 min" or "2 h 15 min"
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);

  if (remainingMinutes === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${remainingMinutes} min`;
};

/**
 * Calculates estimated walk duration based on distance
 * @param distanceKm - Distance in kilometers
 * @param paceMinPerKm - Walking pace in minutes per kilometer (default: 12)
 * @returns Duration in minutes
 */
export const calculateWalkDuration = (
  distanceKm: number,
  paceMinPerKm: number = 11
): number => {
  return distanceKm * paceMinPerKm;
};

/**
 * Formats distance with appropriate unit and decimal places
 * @param distanceKm - Distance in kilometers
 * @returns Formatted string like "5 km" or "1.5 km"
 */
export const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    // Show in meters for distances less than 1 km
    return `${Math.round(distanceKm * 1000)} m`;
  }

  // Show 1 decimal place for distances between 1-10 km
  if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)} km`;
  }

  // Show whole numbers for distances 10 km and above
  return `${Math.round(distanceKm)} km`;
};