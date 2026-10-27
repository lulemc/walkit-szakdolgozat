import Route, { draftExpiry } from "../models/Route.js";
import { parsePage } from "../utils/paging.js";
import circularRouteGenerator from "./circularRouteGenerator.js";
import osmOverpassService from "./osmOverpassService.js";
import { getWalkingRoute } from "./orsClient.js";

export const ROUTES_PAGE_SIZE = 20;
export const FAVORITES_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 50;

class RouteService {
  /**
   * Generates a walking route and saves it as a draft. Circular routes go
   * through waypoints on a circle of the right length; ORS snaps them to real
   * paths. The preference score is measured on that real path.
   * @param {object} [options] passed to the ORS client (e.g. `wait` in tests)
   */
  async generateRoute(routeData, userId, options = {}) {
    const { startLocation, destinationLocation, distance, routeType, preferences } = routeData;
    const wantsFeatures = preferences && Object.values(preferences).some(Boolean);

    let osmFeatures = null;
    if (wantsFeatures) {
      const radiusMeters =
        routeType === "circular" ? ((distance * 1000) / (2 * Math.PI)) * 1.5 : distance * 1000;
      osmFeatures = await osmOverpassService.getAllPreferenceFeatures(
        startLocation,
        radiusMeters || 2000,
        preferences,
      );
    }

    const waypoints =
      routeType === "circular"
        ? this.generateCircleWaypoints(startLocation, (distance * 1000) / (2 * Math.PI), 3)
        : [startLocation, destinationLocation];
    const walkingRoute = await getWalkingRoute(waypoints, options);

    const preferenceScore = osmFeatures
      ? circularRouteGenerator.calculatePreferenceScore(walkingRoute.coordinates, preferences, osmFeatures)
      : 50;

    // A draft until the user keeps it (favourite, name, walk, group walk)
    const route = new Route({
      userId,
      status: "draft",
      draftExpiresAt: draftExpiry(),
      type: routeType,
      startLocation: {
        latitude: startLocation.latitude,
        longitude: startLocation.longitude,
        address: routeData.startAddress || "Start Location",
      },
      endLocation: {
        latitude: destinationLocation?.latitude || startLocation.latitude,
        longitude: destinationLocation?.longitude || startLocation.longitude,
        address: routeData.endAddress || routeData.startAddress || "End Location",
      },
      coordinates: walkingRoute.coordinates,
      totalDistance: walkingRoute.distance,
      estimatedDuration: walkingRoute.duration,
      preferenceScore,
      preferences: preferences || {},
      elevationGain: walkingRoute.elevation.gain,
      elevationLoss: walkingRoute.elevation.loss,
      maxElevation: walkingRoute.elevation.max,
      minElevation: walkingRoute.elevation.min,
    });

    await route.save();
    return route;
  }

  /**
   * Generate evenly-spaced waypoints on a circle
   * SIMPLE: Just geometric points, ORS will find walkable paths
   */
  generateCircleWaypoints(center, radiusMeters, count) {
    const waypoints = [center]; // Start

    const startAngle = Math.random() * (2 * Math.PI);
    const angleStep = (2 * Math.PI) / count;

    for (let i = 0; i < count; i++) {
      const angle = startAngle + i * angleStep;

      const radius = radiusMeters * (0.9 + Math.random() * 0.2);

      const lat = center.latitude + (radius / 111320) * Math.cos(angle);
      const lng =
        center.longitude +
        (radius / (111320 * Math.cos((center.latitude * Math.PI) / 180))) *
          Math.sin(angle);

      waypoints.push({ latitude: lat, longitude: lng });
    }

    waypoints.push(center);

    return waypoints;
  }

  /** My routes, newest first, without coordinates (load one route for its map) */
  async listRoutes(userId, query = {}) {
    const { before, limit } = parsePage(query, { defaultLimit: ROUTES_PAGE_SIZE, maxLimit: MAX_PAGE_SIZE });
    return Route.find({ userId, ...(before && { createdAt: { $lt: before } }) })
      .select("-coordinates")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  /** My favourites, most recently favourited first, without coordinates */
  async listFavoriteRoutes(userId, query = {}) {
    const { before, limit } = parsePage(query, { defaultLimit: FAVORITES_PAGE_SIZE, maxLimit: MAX_PAGE_SIZE });
    return Route.find({ userId, isFavorite: true, ...(before && { favoritedAt: { $lt: before } }) })
      .select("-coordinates")
      .sort({ favoritedAt: -1 })
      .limit(limit)
      .lean();
  }

  async getRoute(routeId, userId) {
    return await Route.findOne({ _id: routeId, userId });
  }

  async deleteRoute(routeId, userId) {
    return await Route.findOneAndDelete({ _id: routeId, userId });
  }
}

export default new RouteService();
