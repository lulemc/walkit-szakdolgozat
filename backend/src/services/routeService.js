// backend/src/services/routeService.js
// HYBRID: Generate geometric circle waypoints, then let ORS find walkable paths between them

import Route from "../models/Route.js";
import circularRouteGenerator from "./circularRouteGenerator.js";
import osmOverpassService from "./osmOverpassService.js";
import axios from "axios";

const ORS_API_KEY = process.env.ORS_API_KEY;
const ORS_BASE_URL = "https://api.openrouteservice.org/v2";

class RouteService {
  async generateRoute(routeData, userId) {
    const {
      startLocation,
      destinationLocation,
      distance,
      routeType,
      preferences,
    } = routeData;

    console.log("🎯 Generating route:", { routeType, distance, preferences });

    let osmFeatures = null;
    if (preferences && Object.values(preferences).some((v) => v)) {
      const radiusMeters =
        routeType === "circular"
          ? ((distance * 1000) / (2 * Math.PI)) * 1.5
          : distance * 1000;

      osmFeatures = await osmOverpassService.getAllPreferenceFeatures(
        startLocation,
        radiusMeters,
        preferences,
      );
    }

    let coordinates, totalDistance, estimatedDuration, preferenceScore;

    if (routeType === "circular") {
      // HYBRID APPROACH: Generate waypoints on circle, then snap to roads
      const radiusMeters = (distance * 1000) / (2 * Math.PI);

      // Generate just 3-4 evenly-spaced waypoints on a circle
      const waypoints = this.generateCircleWaypoints(
        startLocation,
        radiusMeters,
        3,
      );

      console.log(`📍 Generated ${waypoints.length} circle waypoints`);

      // Get walkable route through these waypoints
      const routeResponse = await this.getOptimizedRoute(waypoints);

      coordinates = routeResponse.coordinates;
      totalDistance = routeResponse.distance;
      estimatedDuration = routeResponse.duration;

      preferenceScore = osmFeatures
        ? circularRouteGenerator.calculatePreferenceScore(
            waypoints,
            preferences,
            osmFeatures,
          )
        : 50;

      console.log(
        `✅ Circular route: ${coordinates.length} points, ${(totalDistance / 1000).toFixed(1)}km`,
      );
    } else {
      // Point-to-point
      const waypoints = [startLocation, destinationLocation];
      const routeResponse = await this.getOptimizedRoute(waypoints);

      coordinates = routeResponse.coordinates;
      totalDistance = routeResponse.distance;
      estimatedDuration = routeResponse.duration;
      preferenceScore = 50;
    }

    const route = new Route({
      userId,
      type: routeType,
      startLocation: {
        latitude: startLocation.latitude,
        longitude: startLocation.longitude,
        address: routeData.startAddress || "Start Location",
      },
      endLocation: {
        latitude: destinationLocation?.latitude || startLocation.latitude,
        longitude: destinationLocation?.longitude || startLocation.longitude,
        address:
          routeData.endAddress || routeData.startAddress || "End Location",
      },
      coordinates,
      totalDistance,
      estimatedDuration,
      preferenceScore,
      preferences: preferences || {},
      elevationGain: 0,
      elevationLoss: 0,
      maxElevation: null,
      minElevation: null,
    });

    await route.save();
    console.log("✅ Route saved to database");

    return route;
  }

  /**
   * Generate evenly-spaced waypoints on a circle
   * SIMPLE: Just geometric points, ORS will find walkable paths
   */
  generateCircleWaypoints(center, radiusMeters, count) {
    const waypoints = [center]; // Start

    // Random starting angle for variation
    const startAngle = Math.random() * (2 * Math.PI);
    const angleStep = (2 * Math.PI) / count;

    for (let i = 0; i < count; i++) {
      const angle = startAngle + i * angleStep;

      // Small random variation (±10%)
      const radius = radiusMeters * (0.9 + Math.random() * 0.2);

      const lat = center.latitude + (radius / 111320) * Math.cos(angle);
      const lng =
        center.longitude +
        (radius / (111320 * Math.cos((center.latitude * Math.PI) / 180))) *
          Math.sin(angle);

      waypoints.push({ latitude: lat, longitude: lng });
    }

    waypoints.push(center); // End at start

    return waypoints;
  }

  /**
   * Get route from ORS - snaps to actual walkable paths
   */
  async getOptimizedRoute(waypoints) {
    try {
      const coordinates = waypoints.map((wp) => [wp.longitude, wp.latitude]);

      console.log(
        `🗺️  Requesting walkable route through ${coordinates.length} waypoints`,
      );

      const response = await axios.post(
        `${ORS_BASE_URL}/directions/foot-walking/geojson`,
        {
          coordinates,
          // Add preference for recommended (not fastest) paths
          preference: "recommended",
        },
        {
          headers: {
            Authorization: ORS_API_KEY,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        },
      );

      const route = response.data.features[0];
      const geometry = route.geometry;
      const properties = route.properties;

      const routeCoordinates = geometry.coordinates.map((coord) => ({
        latitude: coord[1],
        longitude: coord[0],
      }));

      console.log(
        `✅ ORS: ${routeCoordinates.length} points, ${(properties.summary.distance / 1000).toFixed(1)}km, ${(properties.summary.duration / 60).toFixed(0)}min`,
      );

      return {
        coordinates: routeCoordinates,
        distance: properties.summary.distance,
        duration: properties.summary.duration / 60,
      };
    } catch (error) {
      console.error("❌ Error from ORS:");
      console.error("   Status:", error.response?.status);
      console.error("   Data:", error.response?.data);

      throw new Error("Failed to generate walkable route. Please try again.");
    }
  }

  async getUserRoutes(userId) {
    return await Route.find({ userId }).sort({ createdAt: -1 });
  }

  async getRoute(routeId, userId) {
    return await Route.findOne({ _id: routeId, userId });
  }

  async deleteRoute(routeId, userId) {
    return await Route.findOneAndDelete({ _id: routeId, userId });
  }
}

export default new RouteService();
