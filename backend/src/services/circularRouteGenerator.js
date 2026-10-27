import osmOverpassService from "./osmOverpassService.js";

/** Scores how well a route matches the walker's preferences, from the map features near it */
class CircularRouteGenerator {
  calculatePreferenceScore(routePoints, preferences, features) {
    if (!preferences || !features) {
      return 50;
    }

    let score = 50;
    let matchCount = 0;
    let totalPreferences = 0;

    const samplePoints = this.samplePoints(routePoints, 20);

    if (preferences.parks) {
      totalPreferences++;
      const parksNear = this.countFeaturesNearPoints(
        samplePoints,
        features.parks || [],
        300,
      );
      if (parksNear > 0) {
        matchCount++;
        score += Math.min(parksNear * 5, 15);
      }
    }

    if (preferences.waterfront) {
      totalPreferences++;
      const waterfrontNear = this.countFeaturesNearPoints(
        samplePoints,
        features.waterfront || [],
        300,
      );
      if (waterfrontNear > 0) {
        matchCount++;
        score += Math.min(waterfrontNear * 5, 15);
      }
    }

    if (preferences.avoidHighways) {
      totalPreferences++;
      const highwaysNear = this.countFeaturesNearPoints(
        samplePoints,
        features.highways || [],
        300,
      );
      if (highwaysNear === 0) {
        matchCount++;
        score += 10;
      }
    }

    if (preferences.scenic) {
      totalPreferences++;
      const scenicNear = this.countFeaturesNearPoints(
        samplePoints,
        features.scenic || [],
        300,
      );
      if (scenicNear > 0) {
        matchCount++;
        score += Math.min(scenicNear * 5, 15);
      }
    }

    if (preferences.uphill) {
      totalPreferences++;
      const elevationNear = this.countFeaturesNearPoints(
        samplePoints,
        features.elevation || [],
        300,
      );
      if (elevationNear > 0) {
        matchCount++;
        score += Math.min(elevationNear * 5, 15);
      }
    }

    if (preferences.mountain) {
      totalPreferences++;
      const trailsNear = this.countFeaturesNearPoints(
        samplePoints,
        features.trails || [],
        300,
      );
      if (trailsNear > 0) {
        matchCount++;
        score += Math.min(trailsNear * 5, 15);
      }
    }

    if (preferences.quietStreets) {
      totalPreferences++;
      const quietNear = this.countFeaturesNearPoints(
        samplePoints,
        features.quietStreets || [],
        300,
      );
      if (quietNear > 0) {
        matchCount++;
        score += Math.min(quietNear * 5, 15);
      }
    }

    if (preferences.beach) {
      totalPreferences++;
      const beachesNear = this.countFeaturesNearPoints(
        samplePoints,
        features.beaches || [],
        300,
      );
      if (beachesNear > 0) {
        matchCount++;
        score += Math.min(beachesNear * 5, 15);
      }
    }

    if (totalPreferences > 0 && matchCount === totalPreferences) {
      score += 10;
    }

    return Math.min(score, 100);
  }

  samplePoints(points, count) {
    if (points.length <= count) return points;

    const step = Math.floor(points.length / count);
    const sampled = [];

    for (let i = 0; i < points.length; i += step) {
      sampled.push(points[i]);
    }

    return sampled;
  }

  countFeaturesNearPoints(points, features, thresholdMeters = 300) {
    let count = 0;

    for (const point of points) {
      for (const feature of features) {
        const distance = osmOverpassService.calculateDistance(
          point,
          feature.coordinates,
        );
        if (distance <= thresholdMeters) {
          count++;
          break;
        }
      }
    }

    return count;
  }

}

export default new CircularRouteGenerator();
