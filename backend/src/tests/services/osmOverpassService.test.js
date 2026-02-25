import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import axios from "axios";
import osmOverpassService from "../../services/osmOverpassService.js";

/* ---------------- mocks ---------------- */

vi.mock("axios");

/* ---------------- helpers ---------------- */

const mockOSMResponse = {
  data: {
    elements: [
      {
        id: 12345,
        center: { lat: 47.5148, lon: 19.0782 },
        tags: { name: "City Park", leisure: "park" },
      },
      {
        id: 67890,
        center: { lat: 47.51, lon: 19.075 },
        tags: { name: "Forest Area", landuse: "forest" },
      },
    ],
  },
};

const mockBeachResponse = {
  data: {
    elements: [
      {
        id: 11111,
        center: { lat: 41.3851, lon: 2.1734 },
        tags: { name: "Barceloneta Beach", natural: "beach" },
      },
    ],
  },
};

const mockElevationResponse = {
  data: {
    elements: [
      {
        id: 22222,
        lat: 47.52,
        lon: 18.975,
        tags: { name: "Gellért Hill", natural: "peak", ele: "235" },
      },
    ],
  },
};

/* ---------------- tests ---------------- */

describe("OSMOverpassService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("calculateDistance", () => {
    it("calculates distance between two coordinates", () => {
      const coord1 = { latitude: 47.4979, longitude: 19.0402 };
      const coord2 = { latitude: 47.5148, longitude: 19.0782 };

      const distance = osmOverpassService.calculateDistance(coord1, coord2);

      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeCloseTo(3400, -2); // Roughly 4.5km
    });

    it("returns 0 for same coordinates", () => {
      const coord = { latitude: 47.4979, longitude: 19.0402 };

      const distance = osmOverpassService.calculateDistance(coord, coord);

      expect(distance).toBeCloseTo(0, 0);
    });
  });

  describe("queryParks", () => {
    it("queries and returns parks near location", async () => {
      axios.post.mockResolvedValue(mockOSMResponse);

      const center = { latitude: 47.4979, longitude: 19.0402 };
      const parks = await osmOverpassService.queryParks(center, 2000);

      expect(axios.post).toHaveBeenCalledTimes(1);
      expect(parks).toHaveLength(2);
      expect(parks[0]).toMatchObject({
        id: "12345",
        type: "park",
        name: "City Park",
        coordinates: { latitude: 47.5148, longitude: 19.0782 },
      });
      expect(parks[0].distance).toBeGreaterThan(0);
    });

    it("returns empty array on error", async () => {
      axios.post.mockRejectedValue(new Error("Network error"));

      const center = { latitude: 47.4979, longitude: 19.0402 };
      const parks = await osmOverpassService.queryParks(center, 2000);

      expect(parks).toEqual([]);
    });
  });

  describe("queryWaterfront", () => {
    it("queries and returns waterfront features", async () => {
      const waterResponse = {
        data: {
          elements: [
            {
              id: 33333,
              center: { lat: 47.507, lon: 19.0444 },
              tags: { name: "Danube", waterway: "river" },
            },
          ],
        },
      };

      axios.post.mockResolvedValue(waterResponse);

      const center = { latitude: 47.4979, longitude: 19.0402 };
      const waterfront = await osmOverpassService.queryWaterfront(center, 2000);

      expect(waterfront).toHaveLength(1);
      expect(waterfront[0].type).toBe("waterfront");
      expect(waterfront[0].name).toBe("Danube");
    });
  });

  describe("queryHighways", () => {
    it("queries and returns highways to avoid", async () => {
      const highwayResponse = {
        data: {
          elements: [
            {
              id: 44444,
              center: { lat: 47.5, lon: 19.05 },
              tags: { highway: "motorway", name: "M1" },
            },
          ],
        },
      };

      axios.post.mockResolvedValue(highwayResponse);

      const center = { latitude: 47.4979, longitude: 19.0402 };
      const highways = await osmOverpassService.queryHighways(center, 2000);

      expect(highways).toHaveLength(1);
      expect(highways[0].type).toBe("highway");
    });
  });

  describe("queryScenicPoints", () => {
    it("queries and returns scenic viewpoints", async () => {
      const scenicResponse = {
        data: {
          elements: [
            {
              id: 55555,
              lat: 47.51,
              lon: 19.07,
              tags: { tourism: "viewpoint", name: "Castle View" },
            },
          ],
        },
      };

      axios.post.mockResolvedValue(scenicResponse);

      const center = { latitude: 47.4979, longitude: 19.0402 };
      const scenic = await osmOverpassService.queryScenicPoints(center, 2000);

      expect(scenic).toHaveLength(1);
      expect(scenic[0].type).toBe("scenic");
      expect(scenic[0].name).toBe("Castle View");
    });
  });

  describe("queryElevation", () => {
    it("queries and returns elevation features with elevation data", async () => {
      axios.post.mockResolvedValue(mockElevationResponse);

      const center = { latitude: 47.52, longitude: 18.975 };
      const elevation = await osmOverpassService.queryElevation(center, 2000);

      expect(elevation).toHaveLength(1);
      expect(elevation[0].type).toBe("elevation");
      expect(elevation[0].name).toBe("Gellért Hill");
      expect(elevation[0].elevation).toBe(235);
    });

    it("handles missing elevation data", async () => {
      const noElevationResponse = {
        data: {
          elements: [
            {
              id: 66666,
              lat: 47.52,
              lon: 18.975,
              tags: { name: "Small Hill", natural: "hill" },
            },
          ],
        },
      };

      axios.post.mockResolvedValue(noElevationResponse);

      const center = { latitude: 47.52, longitude: 18.975 };
      const elevation = await osmOverpassService.queryElevation(center, 2000);

      expect(elevation).toHaveLength(1);
      expect(elevation[0].elevation).toBeNull();
    });
  });

  describe("queryTrails", () => {
    it("queries and returns hiking trails with difficulty", async () => {
      const trailResponse = {
        data: {
          elements: [
            {
              id: 77777,
              center: { lat: 47.7, lon: 18.9 },
              tags: {
                name: "Mountain Trail",
                highway: "path",
                sac_scale: "mountain_hiking",
              },
            },
          ],
        },
      };

      axios.post.mockResolvedValue(trailResponse);

      const center = { latitude: 47.7, longitude: 18.9 };
      const trails = await osmOverpassService.queryTrails(center, 2000);

      expect(trails).toHaveLength(1);
      expect(trails[0].type).toBe("trail");
      expect(trails[0].difficulty).toBe("mountain_hiking");
    });
  });

  describe("queryQuietStreets", () => {
    it("queries and returns quiet pedestrian paths", async () => {
      const quietResponse = {
        data: {
          elements: [
            {
              id: 88888,
              center: { lat: 47.499, lon: 19.042 },
              tags: { highway: "footway", name: "Garden Path" },
            },
          ],
        },
      };

      axios.post.mockResolvedValue(quietResponse);

      const center = { latitude: 47.4979, longitude: 19.0402 };
      const quietStreets = await osmOverpassService.queryQuietStreets(
        center,
        2000,
      );

      expect(quietStreets).toHaveLength(1);
      expect(quietStreets[0].type).toBe("quiet_street");
    });
  });

  describe("queryBeaches", () => {
    it("queries and returns beach features", async () => {
      axios.post.mockResolvedValue(mockBeachResponse);

      const center = { latitude: 41.3851, longitude: 2.1734 };
      const beaches = await osmOverpassService.queryBeaches(center, 2000);

      expect(beaches).toHaveLength(1);
      expect(beaches[0].type).toBe("beach");
      expect(beaches[0].name).toBe("Barceloneta Beach");
    });
  });

  describe("getAllPreferenceFeatures", () => {
    it("queries all features when no preferences specified", async () => {
      axios.post.mockResolvedValue({ data: { elements: [] } });

      const center = { latitude: 47.4979, longitude: 19.0402 };
      const features = await osmOverpassService.getAllPreferenceFeatures(
        center,
        2000,
        null,
      );

      expect(features).toHaveProperty("parks");
      expect(features).toHaveProperty("waterfront");
      expect(features).toHaveProperty("highways");
      expect(features).toHaveProperty("scenic");
      expect(features).toHaveProperty("elevation");
      expect(features).toHaveProperty("trails");
      expect(features).toHaveProperty("quietStreets");
      expect(features).toHaveProperty("beaches");
    });

    it("only queries requested preference features", async () => {
      axios.post.mockResolvedValue(mockOSMResponse);

      const center = { latitude: 47.4979, longitude: 19.0402 };
      const preferences = {
        parks: true,
        waterfront: false,
        avoidHighways: false,
        scenic: false,
        uphill: false,
        mountain: false,
        quietStreets: true,
        beach: false,
      };

      const features = await osmOverpassService.getAllPreferenceFeatures(
        center,
        2000,
        preferences,
      );

      expect(features.parks.length).toBeGreaterThan(0);
      expect(features.waterfront).toEqual([]);
      expect(features.quietStreets.length).toBeGreaterThan(0);
      expect(features.beaches).toEqual([]);
    });

    it("queries elevation and trails when uphill or mountain preference enabled", async () => {
      axios.post.mockResolvedValue({ data: { elements: [] } });

      const center = { latitude: 47.52, longitude: 18.975 };
      const preferences = {
        parks: false,
        waterfront: false,
        avoidHighways: false,
        scenic: false,
        uphill: true,
        mountain: true,
        quietStreets: false,
        beach: false,
      };

      await osmOverpassService.getAllPreferenceFeatures(
        center,
        2000,
        preferences,
      );

      // Should have called axios for elevation and trails
      expect(axios.post).toHaveBeenCalled();
    });

    it("returns empty arrays on error", async () => {
      axios.post.mockRejectedValue(new Error("API error"));

      const center = { latitude: 47.4979, longitude: 19.0402 };
      const features = await osmOverpassService.getAllPreferenceFeatures(
        center,
        2000,
      );

      expect(features.parks).toEqual([]);
      expect(features.waterfront).toEqual([]);
      expect(features.beaches).toEqual([]);
    });
  });

  describe("findNearestFeatures", () => {
    it("sorts features by distance and returns limited results", () => {
      const features = [
        { name: "Far", distance: 1000 },
        { name: "Close", distance: 100 },
        { name: "Medium", distance: 500 },
      ];

      const nearest = osmOverpassService.findNearestFeatures(features, 2);

      expect(nearest).toHaveLength(2);
      expect(nearest[0].name).toBe("Close");
      expect(nearest[1].name).toBe("Medium");
    });
  });

  describe("filterByDistanceRange", () => {
    it("filters features within distance range", () => {
      const features = [
        { name: "A", distance: 100 },
        { name: "B", distance: 500 },
        { name: "C", distance: 1000 },
        { name: "D", distance: 2000 },
      ];

      const filtered = osmOverpassService.filterByDistanceRange(
        features,
        200,
        1500,
      );

      expect(filtered).toHaveLength(2);
      expect(filtered[0].name).toBe("B");
      expect(filtered[1].name).toBe("C");
    });
  });

  describe("filterByElevation", () => {
    it("filters features by minimum elevation", () => {
      const features = [
        { name: "Low Hill", elevation: 50 },
        { name: "Medium Hill", elevation: 150 },
        { name: "High Peak", elevation: 500 },
        { name: "No Data", elevation: null },
      ];

      const filtered = osmOverpassService.filterByElevation(features, 100);

      expect(filtered).toHaveLength(2);
      expect(filtered[0].name).toBe("Medium Hill");
      expect(filtered[1].name).toBe("High Peak");
    });
  });
});
