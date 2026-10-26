import axios from "axios";
import { HttpError } from "../utils/httpError.js";
import { logger } from "../utils/logger.js";

const OVERPASS_API_URL = "https://overpass-api.de/api/interpreter";

/** Which feature types are looked up for which preferences (null: the basic ones) */
const FEATURE_LOOKUPS = [
  { key: "parks", query: "queryParks", wanted: (p) => !p || p.parks },
  { key: "waterfront", query: "queryWaterfront", wanted: (p) => !p || p.waterfront },
  { key: "highways", query: "queryHighways", wanted: (p) => !p || p.avoidHighways },
  { key: "scenic", query: "queryScenicPoints", wanted: (p) => !p || p.scenic },
  { key: "elevation", query: "queryElevation", wanted: (p) => Boolean(p && (p.uphill || p.mountain)) },
  { key: "trails", query: "queryTrails", wanted: (p) => Boolean(p && (p.uphill || p.mountain)) },
  { key: "quietStreets", query: "queryQuietStreets", wanted: (p) => Boolean(p?.quietStreets) },
  { key: "beaches", query: "queryBeaches", wanted: (p) => Boolean(p?.beach) },
];

/* ---------------- cache ----------------
 * Map features hardly change, and the public Overpass server is slow and
 * rate limited, so lookups are kept in memory for a while. */
export const FEATURE_CACHE_TTL_MS = 60 * 60 * 1000;
const MAX_CACHED_AREAS = 200;
const featureCache = new Map();

/** Same area: rounded to about 100 m; same radius to 100 m; same feature types */
const cacheKey = (center, radiusMeters, lookups) =>
  [
    center.latitude.toFixed(3),
    center.longitude.toFixed(3),
    Math.round(radiusMeters / 100),
    lookups.map(({ key }) => key).join(","),
  ].join("|");

const remember = (key, features) => {
  featureCache.delete(key);
  featureCache.set(key, { features, expiresAt: Date.now() + FEATURE_CACHE_TTL_MS });
  // A Map keeps insertion order, so the first entry is the oldest
  if (featureCache.size > MAX_CACHED_AREAS) featureCache.delete(featureCache.keys().next().value);
};

export const clearFeatureCache = () => featureCache.clear();

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
   * The map features near a location for the user's preferences. Lookups that
   * fail count as "none found"; if every requested lookup fails, it says so
   * (503) instead of scoring a route against nothing. Complete results are
   * cached per area and preference set for FEATURE_CACHE_TTL_MS.
   * @param {Object} center - {latitude, longitude}
   * @param {number} radiusMeters - Search radius in meters
   * @param {Object|null} preferences - User preferences (null: the basic feature types)
   * @returns {Promise<Object>} Object with feature arrays
   */
  async getAllPreferenceFeatures(center, radiusMeters = 2000, preferences = null) {
    const requested = FEATURE_LOOKUPS.filter(({ wanted }) => wanted(preferences));
    const key = cacheKey(center, radiusMeters, requested);
    const cached = featureCache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.features;

    const results = await Promise.allSettled(
      requested.map(({ query }) => this[query](center, radiusMeters)),
    );

    const features = Object.fromEntries(FEATURE_LOOKUPS.map(({ key: name }) => [name, []]));
    let failed = 0;
    results.forEach((result, i) => {
      if (result.status === "fulfilled") {
        features[requested[i].key] = result.value;
      } else {
        failed += 1;
        logger.warn(`OSM lookup for ${requested[i].key} failed:`, result.reason?.message);
      }
    });

    if (requested.length > 0 && failed === requested.length) {
      throw new HttpError(
        503,
        "Couldn't check the map for your preferences right now. Try again, or turn the preferences off.",
      );
    }
    if (failed === 0) remember(key, features);
    return features;
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
      // Passed on, so a failed lookup isn't mistaken for "nothing nearby"
      error.message = `OSM ${type} lookup failed: ${error.message}`;
      throw error;
    }
  }

}

export default new OSMOverpassService();
