import { calculateDestinationPoint } from "../utils/calculations.js";
import osmOverpassService from "./osmOverpassService.js";

class CircularRouteGenerator {
  /**
   * Generate waypoints for a circular route
   * @param {Object} startLocation - {latitude, longitude}
   * @param {number} targetDistanceKm - Target distance in kilometers
   * @param {Object} preferences - User preferences
   * @param {Object} features - OSM features (optional)
   * @returns {Array} Array of waypoints
   */
  async generateWaypoints(
    startLocation,
    targetDistanceKm,
    preferences = null,
    features = null,
  ) {
    console.log("🎯 Generating circular waypoints:");
    console.log("   Start:", startLocation);
    console.log("   Target distance:", targetDistanceKm, "km");
    console.log("   Preferences:", preferences);

    const radiusKm = targetDistanceKm / (2 * Math.PI);
    const radiusMeters = radiusKm * 1000;

    console.log("   Calculated radius:", radiusMeters.toFixed(0), "meters");

    // Check if we should use preference-based waypoints
    const usePreferences =
      preferences &&
      features &&
      (preferences.parks ||
        preferences.waterfront ||
        preferences.scenic ||
        preferences.uphill ||
        preferences.mountain);

    if (usePreferences) {
      console.log("   Using preference-based waypoints");
      const preferenceWaypoints = await this.generatePreferenceWaypoints(
        startLocation,
        radiusMeters,
        targetDistanceKm,
        preferences,
        features,
      );

      if (preferenceWaypoints && preferenceWaypoints.length > 2) {
        return preferenceWaypoints;
      }

      console.log(
        "   Not enough preference features, falling back to geometric",
      );
    }

    // Fallback to geometric waypoints
    return this.generateGeometricWaypoints(
      startLocation,
      radiusMeters,
      targetDistanceKm,
    );
  }

  /**
   * Generate waypoints based on user preferences using OSM features
   */
  async generatePreferenceWaypoints(
    startLocation,
    radiusMeters,
    targetDistanceKm,
    preferences,
    features,
  ) {
    const selectedFeatures = [];

    // Parks
    if (preferences.parks && features.parks.length > 0) {
      const nearbyParks = osmOverpassService.filterByDistanceRange(
        features.parks,
        0,
        radiusMeters * 1.5,
      );
      selectedFeatures.push(...nearbyParks.slice(0, 2));
      console.log(`   Selected ${nearbyParks.slice(0, 2).length} parks`);
    }

    // Waterfront
    if (preferences.waterfront && features.waterfront.length > 0) {
      const nearbyWater = osmOverpassService.filterByDistanceRange(
        features.waterfront,
        0,
        radiusMeters * 1.5,
      );
      selectedFeatures.push(...nearbyWater.slice(0, 2));
      console.log(
        `   Selected ${nearbyWater.slice(0, 2).length} waterfront features`,
      );
    }

    // Scenic
    if (preferences.scenic && features.scenic.length > 0) {
      const nearbyScenic = osmOverpassService.filterByDistanceRange(
        features.scenic,
        0,
        radiusMeters * 1.5,
      );
      selectedFeatures.push(...nearbyScenic.slice(0, 2));
      console.log(
        `   Selected ${nearbyScenic.slice(0, 2).length} scenic points`,
      );
    }

    // Uphill/Mountain preferences
    if (preferences.uphill && features.elevation.length > 0) {
      const elevatedPoints = features.elevation
        .filter((f) => f.elevation && f.elevation > 0)
        .sort((a, b) => b.elevation - a.elevation); // Sort by highest first

      const nearbyElevation = osmOverpassService.filterByDistanceRange(
        elevatedPoints,
        0,
        radiusMeters * 1.5,
      );
      selectedFeatures.push(...nearbyElevation.slice(0, 2));
      console.log(
        `   Selected ${nearbyElevation.slice(0, 2).length} elevated points`,
      );
      console.log(
        `   Highest elevation: ${nearbyElevation[0]?.elevation || "N/A"}m`,
      );
    }

    // Mountain trails
    if (preferences.mountain && features.trails.length > 0) {
      const nearbyTrails = osmOverpassService.filterByDistanceRange(
        features.trails,
        0,
        radiusMeters * 1.5,
      );
      selectedFeatures.push(...nearbyTrails.slice(0, 2));
      console.log(
        `   Selected ${nearbyTrails.slice(0, 2).length} mountain trails`,
      );
    }

    if (selectedFeatures.length === 0) {
      console.log("   No suitable features found");
      return null;
    }

    // Sort by distance and distribute around the route
    const sortedFeatures = selectedFeatures.sort(
      (a, b) => a.distance - b.distance,
    );

    // Select features that create a good loop
    const numWaypoints = Math.min(Math.max(3, sortedFeatures.length), 5);
    const step = Math.floor(sortedFeatures.length / numWaypoints);

    const waypoints = [startLocation];

    for (let i = 0; i < numWaypoints && i * step < sortedFeatures.length; i++) {
      const feature = sortedFeatures[i * step];
      waypoints.push(feature.coordinates);
      const elevInfo = feature.elevation ? ` @ ${feature.elevation}m` : "";
      console.log(
        `   WP${i + 1}: ${feature.name} (${feature.distance.toFixed(0)}m away${elevInfo})`,
      );
    }

    // Close the loop
    waypoints.push(startLocation);

    console.log("   Total waypoints:", waypoints.length);

    return waypoints;
  }

  /**
   * Generate simple geometric waypoints in a circle
   */
  generateGeometricWaypoints(startLocation, radiusMeters, targetDistanceKm) {
    const numWaypoints = this.calculateOptimalWaypointCount(targetDistanceKm);
    const angleStep = (2 * Math.PI) / numWaypoints;

    const waypoints = [startLocation];

    for (let i = 0; i < numWaypoints; i++) {
      const angle = i * angleStep;
      const waypoint = calculateDestinationPoint(
        startLocation,
        radiusMeters,
        angle,
      );
      waypoints.push(waypoint);
      console.log(
        `   WP${i + 1}: (${waypoint.latitude.toFixed(4)}, ${waypoint.longitude.toFixed(4)})`,
      );
    }

    waypoints.push(startLocation);

    console.log("   Total waypoints:", waypoints.length);

    return waypoints;
  }

  /**
   * Calculate optimal number of waypoints based on distance
   */
  calculateOptimalWaypointCount(distanceKm) {
    if (distanceKm <= 2) return 3;
    if (distanceKm <= 5) return 4;
    if (distanceKm <= 10) return 5;
    return 6;
  }

  /**
   * Adjust radius to match target distance
   */
  adjustRadius(currentDistanceKm, targetDistanceKm, currentRadiusKm) {
    const ratio = targetDistanceKm / currentDistanceKm;

    console.log("🔄 Adjusting radius:");
    console.log("   Current distance:", currentDistanceKm.toFixed(2), "km");
    console.log("   Target distance:", targetDistanceKm, "km");
    console.log("   Adjustment ratio:", ratio.toFixed(2));
    console.log(
      "   New radius:",
      (currentRadiusKm * ratio * 1000).toFixed(0),
      "meters",
    );

    return currentRadiusKm * ratio;
  }

  /**
   * Check if distance is acceptable (within tolerance)
   */
  isDistanceAcceptable(
    actualDistanceKm,
    targetDistanceKm,
    tolerancePercent = 15,
  ) {
    const lowerBound = targetDistanceKm * (1 - tolerancePercent / 100);
    const upperBound = targetDistanceKm * (1 + tolerancePercent / 100);

    const acceptable =
      actualDistanceKm >= lowerBound && actualDistanceKm <= upperBound;

    console.log("✓ Distance check:");
    console.log("   Actual:", actualDistanceKm.toFixed(2), "km");
    console.log(
      "   Target range:",
      lowerBound.toFixed(2),
      "-",
      upperBound.toFixed(2),
      "km",
    );
    console.log("   Acceptable:", acceptable ? "YES ✅" : "NO ❌");

    return acceptable;
  }

  /**
   * Calculate preference score based on actual features used
   */
  calculatePreferenceScore(waypoints, preferences, features) {
    let score = 50; // Base score

    if (!preferences || !features) {
      return score;
    }

    let matchCount = 0;
    let totalPreferences = 0;

    // Parks
    if (preferences.parks) {
      totalPreferences++;
      const parksNearRoute = this.countFeaturesNearWaypoints(
        waypoints,
        features.parks,
        200,
      );
      if (parksNearRoute > 0) {
        matchCount++;
        score += Math.min(parksNearRoute * 5, 15);
        console.log(
          `   Parks near route: ${parksNearRoute} (+${Math.min(parksNearRoute * 5, 15)} points)`,
        );
      }
    }

    // Waterfront
    if (preferences.waterfront) {
      totalPreferences++;
      const waterNearRoute = this.countFeaturesNearWaypoints(
        waypoints,
        features.waterfront,
        200,
      );
      if (waterNearRoute > 0) {
        matchCount++;
        score += Math.min(waterNearRoute * 5, 15);
        console.log(
          `   Water near route: ${waterNearRoute} (+${Math.min(waterNearRoute * 5, 15)} points)`,
        );
      }
    }

    // Scenic
    if (preferences.scenic) {
      totalPreferences++;
      const scenicNearRoute = this.countFeaturesNearWaypoints(
        waypoints,
        features.scenic,
        200,
      );
      if (scenicNearRoute > 0) {
        matchCount++;
        score += Math.min(scenicNearRoute * 5, 15);
        console.log(
          `   Scenic near route: ${scenicNearRoute} (+${Math.min(scenicNearRoute * 5, 15)} points)`,
        );
      }
    }

    // Avoid Highways
    if (preferences.avoidHighways) {
      totalPreferences++;
      const highwaysNear = this.countFeaturesNearWaypoints(
        waypoints,
        features.highways,
        100,
      );
      if (highwaysNear === 0) {
        score += 10;
        matchCount++;
        console.log(`   Avoiding highways (+10 points)`);
      }
    }

    // Uphill
    if (preferences.uphill) {
      totalPreferences++;
      const elevationNear = this.countFeaturesNearWaypoints(
        waypoints,
        features.elevation,
        300,
      );
      if (elevationNear > 0) {
        matchCount++;
        score += Math.min(elevationNear * 5, 15);
        console.log(
          `   Elevation points: ${elevationNear} (+${Math.min(elevationNear * 5, 15)} points)`,
        );
      }
    }

    // Mountain trails
    if (preferences.mountain) {
      totalPreferences++;
      const trailsNear = this.countFeaturesNearWaypoints(
        waypoints,
        features.trails,
        300,
      );
      if (trailsNear > 0) {
        matchCount++;
        score += Math.min(trailsNear * 5, 15);
        console.log(
          `   Mountain trails: ${trailsNear} (+${Math.min(trailsNear * 5, 15)} points)`,
        );
      }
    }
    // Quiet Streets
    if (preferences.quietStreets) {
      totalPreferences++;
      const quietNear = this.countFeaturesNearWaypoints(
        waypoints,
        features.quietStreets,
        200,
      );
      if (quietNear > 0) {
        matchCount++;
        score += Math.min(quietNear * 5, 15);
        console.log(
          `   Quiet streets: ${quietNear} (+${Math.min(quietNear * 5, 15)} points)`,
        );
      }
    }

    // Beach/Coast
    if (preferences.beach) {
      totalPreferences++;
      const beachesNear = this.countFeaturesNearWaypoints(
        waypoints,
        features.beaches,
        200,
      );
      if (beachesNear > 0) {
        matchCount++;
        score += Math.min(beachesNear * 5, 15);
        console.log(
          `   Beaches near route: ${beachesNear} (+${Math.min(beachesNear * 5, 15)} points)`,
        );
      }
    }
    // Bonus for matching all preferences
    if (totalPreferences > 0 && matchCount === totalPreferences) {
      score += 10;
      console.log(`   All preferences matched (+10 points)`);
    }

    console.log(`   Final preference score: ${Math.min(score, 100)}/100`);

    return Math.min(score, 100);
  }

  /**
   * Count how many features are near the waypoints
   */
  countFeaturesNearWaypoints(waypoints, features, maxDistanceMeters) {
    let count = 0;

    for (const waypoint of waypoints) {
      for (const feature of features) {
        const distance = osmOverpassService.calculateDistance(
          waypoint,
          feature.coordinates,
        );
        if (distance <= maxDistanceMeters) {
          count++;
          break; // Count each waypoint once
        }
      }
    }

    return count;
  }
}

export default new CircularRouteGenerator();
