import "../config/env.js";
import axios from "axios";

const ORS_API_KEY = process.env.ORS_API_KEY || "";
const ORS_BASE_URL = "https://api.openrouteservice.org";

class OpenRouteService {
  /**
   * Get walking route through multiple waypoints
   * @param {Array} waypoints - Array of {latitude, longitude} objects
   * @returns {Promise<Object>} Route data with coordinates, distance, duration
   */
  async getRoute(waypoints) {
    if (!ORS_API_KEY || ORS_API_KEY.trim() === "") {
      throw new Error("ORS_API_KEY not configured");
    }

    if (waypoints.length < 2) {
      throw new Error("At least 2 waypoints required");
    }

    try {
      // Convert to ORS format: [[lng, lat], [lng, lat], ...]
      const coordinates = waypoints.map((wp) => [wp.longitude, wp.latitude]);

      console.log("📍 OpenRouteService Request:");
      console.log("   Waypoints:", coordinates.length);

      const response = await axios.post(
        `${ORS_BASE_URL}/v2/directions/foot-walking/geojson`,
        {
          coordinates,
          preference: "recommended",
          units: "m",
          language: "en",
          geometry: true,
          instructions: false,
          elevation: false,
        },
        {
          headers: {
            Authorization: ORS_API_KEY,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        },
      );

      console.log("📦 OpenRouteService Response received");

      // IMPORTANT: GeoJSON format uses 'features' not 'routes'
      if (!response.data.features || response.data.features.length === 0) {
        console.error("❌ No features found in response");
        throw new Error("No route found");
      }

      const feature = response.data.features[0];
      const properties = feature.properties;
      const geometry = feature.geometry;

      // Convert coordinates back to our format: [{lat, lng}, ...]
      const routeCoordinates = geometry.coordinates.map((coord) => ({
        latitude: coord[1],
        longitude: coord[0],
      }));

      console.log("✅ Route generated successfully");
      console.log("   Distance:", properties.summary.distance, "meters");
      console.log(
        "   Duration:",
        (properties.summary.duration / 60).toFixed(1),
        "minutes",
      );
      console.log("   Coordinate points:", routeCoordinates.length);

      return {
        distance: properties.summary.distance, // in meters
        duration: properties.summary.duration / 60, // convert seconds to minutes
        coordinates: routeCoordinates,
      };
    } catch (error) {
      console.error("❌ OpenRouteService Error:");

      if (error.response) {
        console.error("   Status:", error.response.status);
        console.error("   Data:", JSON.stringify(error.response.data, null, 2));

        if (error.response.status === 401) {
          throw new Error("Invalid OpenRouteService API key");
        }
        if (error.response.status === 429) {
          throw new Error("OpenRouteService rate limit exceeded");
        }
        if (error.response.status === 400) {
          throw new Error(
            `OpenRouteService bad request: ${JSON.stringify(error.response.data)}`,
          );
        }
        if (error.response.status === 403) {
          throw new Error("OpenRouteService API key not authorized");
        }
      } else if (error.request) {
        console.error("   No response received");
        throw new Error("No response from OpenRouteService");
      } else {
        console.error("   Error:", error.message);
      }

      throw error;
    }
  }

  /**
   * Health check for OpenRouteService
   * @returns {Promise<boolean>}
   */
  async healthCheck() {
    try {
      const response = await axios.get(`${ORS_BASE_URL}/health`, {
        timeout: 5000,
      });
      return response.status === 200;
    } catch (error) {
      console.error("ORS health check failed:", error.message);
      return false;
    }
  }
}

export default new OpenRouteService();
