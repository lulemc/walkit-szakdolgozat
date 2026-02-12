import Route from "../models/Route.js";
import openRouteService from "./openRouteService.js";
import circularRouteGenerator from "./circularRouteGenerator.js";
import osmOverpassService from "./osmOverpassService.js";

class RouteService {
  /**
   * Generate a new walking route
   * @param {Object} request - Route generation request
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Generated route
   */
  async generateRoute(request, userId) {
    // Validate request
    this.validateRequest(request);

    if (request.routeType === "circular") {
      return await this.generateCircularRoute(request, userId);
    } else {
      return await this.generatePointToPointRoute(request, userId);
    }
  }

  /**
   * Generate a circular route that loops back to start
   */
  async generateCircularRoute(request, userId) {
    const { startLocation, distance, preferences } = request;

    console.log("\n🔄 Generating circular route:");
    console.log("   Distance:", distance, "km");
    console.log("   Preferences:", preferences);

    // Step 1: Query OSM for features if preferences are enabled
    let features = null;
    const hasPreferences =
      preferences &&
      (preferences.parks || preferences.waterfront || preferences.scenic);

    if (hasPreferences) {
      const radiusMeters = (distance / (2 * Math.PI)) * 1000 * 1.5; // Search 1.5x radius
      features = await osmOverpassService.getAllPreferenceFeatures(
        startLocation,
        radiusMeters,
      );
    }

    // Step 2: Generate initial waypoints (preference-based or geometric)
    let waypoints = await circularRouteGenerator.generateWaypoints(
      startLocation,
      distance,
      preferences,
      features,
    );

    // Step 3: Get route from OpenRouteService
    let routeData = await openRouteService.getRoute(waypoints);
    let actualDistanceKm = routeData.distance / 1000;

    console.log(`   Initial route: ${actualDistanceKm.toFixed(2)}km`);

    // Step 4: Adjust if needed (max 2 iterations)
    let iterations = 0;
    const maxIterations = 2;

    while (
      !circularRouteGenerator.isDistanceAcceptable(
        actualDistanceKm,
        distance,
      ) &&
      iterations < maxIterations
    ) {
      console.log(
        `   Route distance ${actualDistanceKm.toFixed(2)}km not within tolerance, adjusting...`,
      );

      // Calculate current radius
      const currentRadius = distance / (2 * Math.PI);

      // Adjust radius
      const newRadius = circularRouteGenerator.adjustRadius(
        actualDistanceKm,
        distance,
        currentRadius,
      );

      // Regenerate waypoints with new radius
      // For adjustment iterations, use geometric waypoints (faster)
      waypoints = circularRouteGenerator.generateGeometricWaypoints(
        startLocation,
        newRadius * 1000,
        distance,
      );

      // Get new route
      routeData = await openRouteService.getRoute(waypoints);
      actualDistanceKm = routeData.distance / 1000;
      iterations++;
    }

    // Step 5: Calculate preference score
    const preferenceScore = features
      ? circularRouteGenerator.calculatePreferenceScore(
          waypoints,
          preferences,
          features,
        )
      : this.calculateBasicPreferenceScore(preferences);

    console.log(
      `\n✅ Final route: ${actualDistanceKm.toFixed(2)}km (score: ${preferenceScore})`,
    );

    // Step 6: Save to database
    const route = new Route({
      userId,
      type: "circular",
      startLocation: {
        latitude: startLocation.latitude,
        longitude: startLocation.longitude,
        address: "Start Location", // TODO: Reverse geocode in future
      },
      endLocation: {
        latitude: startLocation.latitude,
        longitude: startLocation.longitude,
        address: "Start Location",
      },
      coordinates: routeData.coordinates,
      totalDistance: routeData.distance,
      estimatedDuration: routeData.duration,
      preferenceScore,
      preferences,
    });

    await route.save();

    return route;
  }

  /**
   * Generate a point-to-point route
   */
  async generatePointToPointRoute(request, userId) {
    const { startLocation, destinationLocation, preferences } = request;

    console.log("\n📍 Generating point-to-point route:");
    console.log("   Start:", startLocation);
    console.log("   Destination:", destinationLocation);

    if (!destinationLocation) {
      throw new Error("Destination required for point-to-point route");
    }

    // Get direct route
    const routeData = await openRouteService.getRoute([
      startLocation,
      destinationLocation,
    ]);

    // Calculate preference score (basic for now)
    const preferenceScore = this.calculateBasicPreferenceScore(preferences);

    console.log(
      `✅ Route generated: ${(routeData.distance / 1000).toFixed(2)}km (score: ${preferenceScore})`,
    );

    // Save to database
    const route = new Route({
      userId,
      type: "point-to-point",
      startLocation: {
        latitude: startLocation.latitude,
        longitude: startLocation.longitude,
        address: "Start Location",
      },
      endLocation: {
        latitude: destinationLocation.latitude,
        longitude: destinationLocation.longitude,
        address: "Destination",
      },
      coordinates: routeData.coordinates,
      totalDistance: routeData.distance,
      estimatedDuration: routeData.duration,
      preferenceScore,
      preferences,
    });

    await route.save();

    return route;
  }

  /**
   * Get user's saved routes
   */
  async getUserRoutes(userId) {
    return await Route.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();
  }

  /**
   * Get single route by ID
   */
  async getRoute(routeId, userId) {
    return await Route.findOne({ _id: routeId, userId }).exec();
  }

  /**
   * Delete a route
   */
  async deleteRoute(routeId, userId) {
    const result = await Route.deleteOne({ _id: routeId, userId }).exec();
    return result.deletedCount > 0;
  }

  /**
   * Validate route generation request
   */
  validateRequest(request) {
    // Validate coordinates
    if (!this.isValidCoordinate(request.startLocation)) {
      throw new Error("Invalid start location coordinates");
    }

    if (
      request.routeType === "point-to-point" &&
      request.destinationLocation &&
      !this.isValidCoordinate(request.destinationLocation)
    ) {
      throw new Error("Invalid destination coordinates");
    }

    // Validate distance for circular routes
    if (request.routeType === "circular") {
      if (request.distance <= 0) {
        throw new Error("Distance must be greater than 0");
      }

      if (request.distance > 50) {
        throw new Error("Distance cannot exceed 50 km");
      }
    }

    // Validate route type
    if (!["circular", "point-to-point"].includes(request.routeType)) {
      throw new Error("Invalid route type");
    }
  }

  /**
   * Validate coordinate
   */
  isValidCoordinate(coord) {
    return (
      typeof coord.latitude === "number" &&
      typeof coord.longitude === "number" &&
      coord.latitude >= -90 &&
      coord.latitude <= 90 &&
      coord.longitude >= -180 &&
      coord.longitude <= 180
    );
  }

  /**
   * Calculate basic preference score (fallback)
   */
  calculateBasicPreferenceScore(preferences) {
    let score = 50; // Base score

    // Count enabled preferences
    const enabledCount = [
      preferences.parks,
      preferences.waterfront,
      preferences.scenic,
      preferences.avoidHighways,
    ].filter(Boolean).length;

    // Add 10 points for each preference
    score += enabledCount * 10;

    return Math.min(score, 100);
  }
}

export default new RouteService();
