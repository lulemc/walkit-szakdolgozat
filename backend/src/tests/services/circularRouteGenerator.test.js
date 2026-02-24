import { describe, it, expect, beforeEach, vi } from "vitest";
import circularRouteGenerator from "../../services/circularRouteGenerator.js";
import osmOverpassService from "../../services/osmOverpassService.js";

vi.mock("../../services/osmOverpassService.js");

describe("CircularRouteGenerator", () => {
  const startLocation = {
    latitude: 47.4979,
    longitude: 19.0402,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateCircularPath", () => {
    it("generates many coordinate points for a circle", async () => {
      const targetDistance = 5;

      const path = await circularRouteGenerator.generateCircularPath(
        startLocation,
        targetDistance,
        null,
        null,
      );

      expect(path.length).toBeGreaterThan(50);
      expect(path[0]).toEqual(path[path.length - 1]);
    });

    it("generates more points for longer distances", async () => {
      const shortPath = await circularRouteGenerator.generateCircularPath(
        startLocation,
        2,
        null,
        null,
      );

      const longPath = await circularRouteGenerator.generateCircularPath(
        startLocation,
        10,
        null,
        null,
      );

      expect(longPath.length).toBeGreaterThan(shortPath.length);
    });

    it("starts and ends at approximately the same location", async () => {
      const path = await circularRouteGenerator.generateCircularPath(
        startLocation,
        5,
        null,
        null,
      );

      const first = path[0];
      const last = path[path.length - 1];

      expect(first.latitude).toBeCloseTo(last.latitude, 6);
      expect(first.longitude).toBeCloseTo(last.longitude, 6);
    });
  });

  describe("calculatePathDistance", () => {
    it("calculates total distance of a path", () => {
      const path = [
        { latitude: 47.4979, longitude: 19.0402 },
        { latitude: 47.498, longitude: 19.0403 },
        { latitude: 47.4981, longitude: 19.0404 },
      ];

      osmOverpassService.calculateDistance
        .mockReturnValueOnce(100)
        .mockReturnValueOnce(100);

      const distance = circularRouteGenerator.calculatePathDistance(path);

      expect(distance).toBe(200);
      expect(osmOverpassService.calculateDistance).toHaveBeenCalledTimes(2);
    });

    it("returns 0 for single point", () => {
      const path = [{ latitude: 47.4979, longitude: 19.0402 }];

      const distance = circularRouteGenerator.calculatePathDistance(path);

      expect(distance).toBe(0);
    });
  });

  describe("calculatePreferenceScore", () => {
    beforeEach(() => {
      osmOverpassService.calculateDistance.mockReturnValue(100);
    });

    it("returns base score when no preferences", () => {
      const path = [startLocation];
      const score = circularRouteGenerator.calculatePreferenceScore(
        path,
        null,
        null,
      );
      expect(score).toBe(50);
    });

    it("increases score when parks preference matched", () => {
      const path = [startLocation, { latitude: 47.498, longitude: 19.0403 }];
      const preferences = { parks: true };
      const features = {
        parks: [{ coordinates: { latitude: 47.498, longitude: 19.0403 } }],
      };

      const score = circularRouteGenerator.calculatePreferenceScore(
        path,
        preferences,
        features,
      );

      expect(score).toBeGreaterThan(50);
    });

    it("increases score when waterfront preference matched", () => {
      const path = [startLocation];
      const preferences = { waterfront: true };
      const features = {
        waterfront: [{ coordinates: startLocation }],
      };

      const score = circularRouteGenerator.calculatePreferenceScore(
        path,
        preferences,
        features,
      );

      expect(score).toBeGreaterThan(50);
    });

    it("increases score when avoiding highways", () => {
      const path = [startLocation];
      const preferences = { avoidHighways: true };
      const features = { highways: [] };

      const score = circularRouteGenerator.calculatePreferenceScore(
        path,
        preferences,
        features,
      );

      expect(score).toBeGreaterThan(50);
    });

    it("increases score when uphill preference matched", () => {
      const path = [startLocation];
      const preferences = { uphill: true };
      const features = {
        elevation: [{ coordinates: startLocation }],
      };

      const score = circularRouteGenerator.calculatePreferenceScore(
        path,
        preferences,
        features,
      );

      expect(score).toBeGreaterThan(50);
    });

    it("increases score when mountain preference matched", () => {
      const path = [startLocation];
      const preferences = { mountain: true };
      const features = {
        trails: [{ coordinates: startLocation }],
      };

      const score = circularRouteGenerator.calculatePreferenceScore(
        path,
        preferences,
        features,
      );

      expect(score).toBeGreaterThan(50);
    });

    it("increases score when quiet streets preference matched", () => {
      const path = [startLocation];
      const preferences = { quietStreets: true };
      const features = {
        quietStreets: [{ coordinates: startLocation }],
      };

      const score = circularRouteGenerator.calculatePreferenceScore(
        path,
        preferences,
        features,
      );

      expect(score).toBeGreaterThan(50);
    });

    it("increases score when beach preference matched", () => {
      const path = [startLocation];
      const preferences = { beach: true };
      const features = {
        beaches: [{ coordinates: startLocation }],
      };

      const score = circularRouteGenerator.calculatePreferenceScore(
        path,
        preferences,
        features,
      );

      expect(score).toBeGreaterThan(50);
    });

    it("adds bonus when all preferences matched", () => {
      const path = [startLocation];
      const preferences = {
        parks: true,
        waterfront: true,
      };
      const features = {
        parks: [{ coordinates: startLocation }],
        waterfront: [{ coordinates: startLocation }],
      };

      const score = circularRouteGenerator.calculatePreferenceScore(
        path,
        preferences,
        features,
      );

      expect(score).toBeGreaterThan(60);
    });

    it("caps score at 100", () => {
      const path = [startLocation];
      const preferences = {
        parks: true,
        waterfront: true,
        scenic: true,
        uphill: true,
        mountain: true,
        quietStreets: true,
        beach: true,
        avoidHighways: true,
      };
      const features = {
        parks: Array(10).fill({ coordinates: startLocation }),
        waterfront: Array(10).fill({ coordinates: startLocation }),
        scenic: Array(10).fill({ coordinates: startLocation }),
        elevation: Array(10).fill({ coordinates: startLocation }),
        trails: Array(10).fill({ coordinates: startLocation }),
        quietStreets: Array(10).fill({ coordinates: startLocation }),
        beaches: Array(10).fill({ coordinates: startLocation }),
        highways: [],
      };

      const score = circularRouteGenerator.calculatePreferenceScore(
        path,
        preferences,
        features,
      );

      expect(score).toBe(100);
    });
  });

  describe("samplePoints", () => {
    it("returns all points if count is greater than length", () => {
      const points = [
        { latitude: 1, longitude: 1 },
        { latitude: 2, longitude: 2 },
      ];

      const sampled = circularRouteGenerator.samplePoints(points, 10);

      expect(sampled).toHaveLength(2);
    });

    it("samples evenly spaced points", () => {
      const points = Array.from({ length: 100 }, (_, i) => ({
        latitude: i,
        longitude: i,
      }));

      const sampled = circularRouteGenerator.samplePoints(points, 10);

      expect(sampled.length).toBeLessThanOrEqual(10);
    });
  });

  describe("countFeaturesNearPoints", () => {
    it("counts features within distance threshold", () => {
      const points = [startLocation];
      const features = [
        { coordinates: { latitude: 47.498, longitude: 19.0403 } },
      ];

      osmOverpassService.calculateDistance.mockReturnValue(50);

      const count = circularRouteGenerator.countFeaturesNearPoints(
        points,
        features,
        100,
      );

      expect(count).toBe(1);
    });

    it("does not count features beyond distance threshold", () => {
      const points = [startLocation];
      const features = [{ coordinates: { latitude: 47.5, longitude: 19.05 } }];

      osmOverpassService.calculateDistance.mockReturnValue(50000);

      const count = circularRouteGenerator.countFeaturesNearPoints(
        points,
        features,
        100,
      );

      expect(count).toBe(0);
    });
  });
});
