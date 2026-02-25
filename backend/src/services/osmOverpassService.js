import axios from "axios";

const OVERPASS_API_URL = "https://overpass-api.de/api/interpreter";

class OSMOverpassService {
  /**
   * Calculate distance between two coordinates using Haversine formula
   * @param {Object} coord1 - {latitude, longitude}
   * @param {Object} coord2 - {latitude, longitude}
   * @returns {number} Distance in meters
   */
  calculateDistance(coord1, coord2) {
    const R = 6371e3; // Earth radius in meters
    const fi1 = (coord1.latitude * Math.PI) / 180;
    const fi2 = (coord2.latitude * Math.PI) / 180;
    const fi = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
    const lam = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(fi / 2) * Math.sin(fi / 2) +
      Math.cos(fi1) * Math.cos(fi2) * Math.sin(lam / 2) * Math.sin(lam / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Query OSM for parks and green spaces
   * @param {Object} center - {latitude, longitude}
   * @param {number} radiusMeters - Search radius in meters
   * @returns {Promise<Array>} Array of park features
   */
  async queryParks(center, radiusMeters = 2000) {
    const query = `
      [out:json][timeout:25];
      (
        way["leisure"="park"](around:${radiusMeters},${center.latitude},${center.longitude});
        way["leisure"="garden"](around:${radiusMeters},${center.latitude},${center.longitude});
        way["landuse"="forest"](around:${radiusMeters},${center.latitude},${center.longitude});
        way["landuse"="meadow"](around:${radiusMeters},${center.latitude},${center.longitude});
        way["landuse"="recreation_ground"](around:${radiusMeters},${center.latitude},${center.longitude});
      );
      out center;
    `;

    return this.executeQuery(query, center, "park");
  }

  /**
   * Query OSM for waterfront areas
   * @param {Object} center - {latitude, longitude}
   * @param {number} radiusMeters - Search radius in meters
   * @returns {Promise<Array>} Array of waterfront features
   */
  async queryWaterfront(center, radiusMeters = 2000) {
    const query = `
      [out:json][timeout:25];
      (
        way["natural"="water"](around:${radiusMeters},${center.latitude},${center.longitude});
        way["waterway"="river"](around:${radiusMeters},${center.latitude},${center.longitude});
        way["waterway"="stream"](around:${radiusMeters},${center.latitude},${center.longitude});
        way["waterway"="canal"](around:${radiusMeters},${center.latitude},${center.longitude});
      );
      out center;
    `;

    return this.executeQuery(query, center, "waterfront");
  }

  /**
   * Query OSM for highways to avoid
   * @param {Object} center - {latitude, longitude}
   * @param {number} radiusMeters - Search radius in meters
   * @returns {Promise<Array>} Array of highway features
   */
  async queryHighways(center, radiusMeters = 2000) {
    const query = `
      [out:json][timeout:25];
      (
        way["highway"="motorway"](around:${radiusMeters},${center.latitude},${center.longitude});
        way["highway"="trunk"](around:${radiusMeters},${center.latitude},${center.longitude});
        way["highway"="primary"](around:${radiusMeters},${center.latitude},${center.longitude});
      );
      out center;
    `;

    return this.executeQuery(query, center, "highway");
  }

  /**
   * Query OSM for scenic points (viewpoints, monuments, historic sites)
   * @param {Object} center - {latitude, longitude}
   * @param {number} radiusMeters - Search radius in meters
   * @returns {Promise<Array>} Array of scenic features
   */
  async queryScenicPoints(center, radiusMeters = 2000) {
    const query = `
      [out:json][timeout:25];
      (
        node["tourism"="viewpoint"](around:${radiusMeters},${center.latitude},${center.longitude});
        way["historic"](around:${radiusMeters},${center.latitude},${center.longitude});
        node["natural"="peak"](around:${radiusMeters},${center.latitude},${center.longitude});
        way["tourism"="attraction"](around:${radiusMeters},${center.latitude},${center.longitude});
      );
      out center;
    `;

    return this.executeQuery(query, center, "scenic");
  }

  /**
   * Query OSM for hills, mountains, and elevated terrain
   * @param {Object} center - {latitude, longitude}
   * @param {number} radiusMeters - Search radius in meters
   * @returns {Promise<Array>} Array of elevation features
   */
  async queryElevation(center, radiusMeters = 2000) {
    const query = `
      [out:json][timeout:25];
      (
        node["natural"="peak"](around:${radiusMeters},${center.latitude},${center.longitude});
        node["natural"="hill"](around:${radiusMeters},${center.latitude},${center.longitude});
        node["natural"="saddle"](around:${radiusMeters},${center.latitude},${center.longitude});
        way["natural"="ridge"](around:${radiusMeters},${center.latitude},${center.longitude});
        way["natural"="cliff"](around:${radiusMeters},${center.latitude},${center.longitude});
      );
      out body;
      >;
      out skel qt;
    `;

    return this.executeQuery(query, center, "elevation");
  }

  /**
   * Query OSM for hiking trails and mountain paths
   * @param {Object} center - {latitude, longitude}
   * @param {number} radiusMeters - Search radius in meters
   * @returns {Promise<Array>} Array of trail features
   */
  async queryTrails(center, radiusMeters = 2000) {
    const query = `
      [out:json][timeout:25];
      (
        way["highway"="path"]["sac_scale"](around:${radiusMeters},${center.latitude},${center.longitude});
        way["highway"="track"]["tracktype"~"grade[1-3]"](around:${radiusMeters},${center.latitude},${center.longitude});
        way["highway"="footway"]["incline"](around:${radiusMeters},${center.latitude},${center.longitude});
        way["route"="hiking"](around:${radiusMeters},${center.latitude},${center.longitude});
      );
      out center;
    `;

    return this.executeQuery(query, center, "trail");
  }

  /**
   * Query OSM for quiet streets and pedestrian paths
   * @param {Object} center - {latitude, longitude}
   * @param {number} radiusMeters - Search radius in meters
   * @returns {Promise<Array>} Array of quiet street features
   */
  async queryQuietStreets(center, radiusMeters = 2000) {
    const query = `
      [out:json][timeout:25];
      (
        way["highway"="footway"](around:${radiusMeters},${center.latitude},${center.longitude});
        way["highway"="pedestrian"](around:${radiusMeters},${center.latitude},${center.longitude});
        way["highway"="living_street"](around:${radiusMeters},${center.latitude},${center.longitude});
        way["highway"="path"](around:${radiusMeters},${center.latitude},${center.longitude});
      );
      out center;
    `;

    return this.executeQuery(query, center, "quiet_street");
  }

  /**
   * Query OSM for beaches and coastal areas
   * @param {Object} center - {latitude, longitude}
   * @param {number} radiusMeters - Search radius in meters
   * @returns {Promise<Array>} Array of beach/coast features
   */
  async queryBeaches(center, radiusMeters = 2000) {
    const query = `
      [out:json][timeout:25];
      (
        way["natural"="beach"](around:${radiusMeters},${center.latitude},${center.longitude});
        way["natural"="coastline"](around:${radiusMeters},${center.latitude},${center.longitude});
        node["natural"="beach"](around:${radiusMeters},${center.latitude},${center.longitude});
        way["leisure"="beach_resort"](around:${radiusMeters},${center.latitude},${center.longitude});
        way["tourism"="beach_resort"](around:${radiusMeters},${center.latitude},${center.longitude});
      );
      out center;
    `;

    return this.executeQuery(query, center, "beach");
  }

  /**
   * Get all preference features for a location
   * @param {Object} center - {latitude, longitude}
   * @param {number} radiusMeters - Search radius in meters
   * @param {Object} preferences - User preferences
   * @returns {Promise<Object>} Object with feature arrays
   */
  async getAllPreferenceFeatures(
    center,
    radiusMeters = 2000,
    preferences = null,
  ) {
    console.log("🔍 Querying OSM for features...");
    console.log(`   Center: (${center.latitude}, ${center.longitude})`);
    console.log(`   Radius: ${radiusMeters}m`);

    try {
      const queries = [];

      // Only query for features the user wants
      if (!preferences || preferences.parks) {
        queries.push(this.queryParks(center, radiusMeters));
      } else {
        queries.push(Promise.resolve([]));
      }

      if (!preferences || preferences.waterfront) {
        queries.push(this.queryWaterfront(center, radiusMeters));
      } else {
        queries.push(Promise.resolve([]));
      }

      if (!preferences || preferences.avoidHighways) {
        queries.push(this.queryHighways(center, radiusMeters));
      } else {
        queries.push(Promise.resolve([]));
      }

      if (!preferences || preferences.scenic) {
        queries.push(this.queryScenicPoints(center, radiusMeters));
      } else {
        queries.push(Promise.resolve([]));
      }

      // Elevation and trails
      if (preferences && (preferences.uphill || preferences.mountain)) {
        queries.push(this.queryElevation(center, radiusMeters));
        queries.push(this.queryTrails(center, radiusMeters));
      } else {
        queries.push(Promise.resolve([]));
        queries.push(Promise.resolve([]));
      }

      // Quiet Streets
      if (preferences && preferences.quietStreets) {
        queries.push(this.queryQuietStreets(center, radiusMeters));
      } else {
        queries.push(Promise.resolve([]));
      }

      // Beach/Coast
      if (preferences && preferences.beach) {
        queries.push(this.queryBeaches(center, radiusMeters));
      } else {
        queries.push(Promise.resolve([]));
      }

      const [
        parks,
        waterfront,
        highways,
        scenic,
        elevation,
        trails,
        quietStreets,
        beaches,
      ] = await Promise.all(queries);

      console.log("✅ OSM features found:");
      console.log(`   Parks: ${parks.length}`);
      console.log(`   Waterfront: ${waterfront.length}`);
      console.log(`   Highways: ${highways.length}`);
      console.log(`   Scenic: ${scenic.length}`);
      console.log(`   Elevation points: ${elevation.length}`);
      console.log(`   Trails: ${trails.length}`);
      console.log(`   Quiet streets: ${quietStreets.length}`);
      console.log(`   Beaches: ${beaches.length}`);

      return {
        parks,
        waterfront,
        highways,
        scenic,
        elevation,
        trails,
        quietStreets,
        beaches,
      };
    } catch (error) {
      console.error("❌ Error fetching OSM features:", error.message);
      return {
        parks: [],
        waterfront: [],
        highways: [],
        scenic: [],
        elevation: [],
        trails: [],
        quietStreets: [],
        beaches: [],
      };
    }
  }

  /**
   * Execute Overpass query
   * @param {string} query - Overpass QL query
   * @param {Object} center - {latitude, longitude}
   * @param {string} type - Feature type
   * @returns {Promise<Array>} Array of features
   */
  async executeQuery(query, center, type) {
    try {
      const response = await axios.post(
        OVERPASS_API_URL,
        `data=${encodeURIComponent(query)}`,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          timeout: 30000, // 30 second timeout
        },
      );

      if (!response.data || !response.data.elements) {
        return [];
      }

      return response.data.elements.map((element) => {
        const coordinates = element.center
          ? { latitude: element.center.lat, longitude: element.center.lon }
          : { latitude: element.lat, longitude: element.lon };

        const distance = this.calculateDistance(center, coordinates);

        // Extract elevation if available
        const elevation = element.tags?.ele
          ? parseFloat(element.tags.ele)
          : null;

        return {
          id: element.id.toString(),
          type,
          coordinates,
          tags: element.tags || {},
          name: element.tags?.name || `Unnamed ${type}`,
          distance,
          elevation, // Elevation in meters
          difficulty: element.tags?.sac_scale || null, // Hiking difficulty
          incline: element.tags?.incline || null, // Steepness
        };
      });
    } catch (error) {
      console.error(`❌ Error querying OSM for ${type}:`, error.message);
      return [];
    }
  }

  /**
   * Find nearest features of a specific type
   * @param {Array} features - Array of features
   * @param {number} limit - Maximum number to return
   * @returns {Array} Sorted array of nearest features
   */
  findNearestFeatures(features, limit = 5) {
    return features
      .sort((a, b) => (a.distance || 0) - (b.distance || 0))
      .slice(0, limit);
  }

  /**
   * Filter features within a distance range
   * @param {Array} features - Array of features
   * @param {number} minDistance - Minimum distance in meters
   * @param {number} maxDistance - Maximum distance in meters
   * @returns {Array} Filtered features
   */
  filterByDistanceRange(features, minDistance = 0, maxDistance = 5000) {
    return features.filter(
      (f) =>
        f.distance !== undefined &&
        f.distance >= minDistance &&
        f.distance <= maxDistance,
    );
  }

  /**
   * Filter features by elevation (for uphill routes)
   * @param {Array} features - Array of features with elevation
   * @param {number} minElevation - Minimum elevation in meters
   * @returns {Array} Features above minimum elevation
   */
  filterByElevation(features, minElevation = 100) {
    return features.filter(
      (f) => f.elevation !== null && f.elevation >= minElevation,
    );
  }
}

export default new OSMOverpassService();
