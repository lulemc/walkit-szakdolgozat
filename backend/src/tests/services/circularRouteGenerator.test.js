import { describe, it, expect, vi, beforeEach } from "vitest";
import circularRouteGenerator from "../../services/circularRouteGenerator.js";
import osmOverpassService from "../../services/osmOverpassService.js";

/* ---------------- mocks ---------------- */

vi.mock("../../services/osmOverpassService.js", () => ({
  default: {
    filterByDistanceRange: vi.fn(),
    calculateDistance: vi.fn(),
  },
}));

/* ---------------- helpers ---------------- */

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "log").mockImplementation(() => {});
});

/* ---------------- tests ---------------- */

describe("CircularRouteGenerator", () => {
  describe("generateWaypoints", () => {
    it("generates geometric waypoints when no preferences", async () => {
      const startLocation = { latitude: 47.4979, longitude: 19.0402 };
      const targetDistance = 5;

      const waypoints = await circularRouteGenerator.generateWaypoints(
        startLocation,
        targetDistance,
        null,
        null,
      );

      expect(waypoints).toHaveLength(6); // 1 start + 4 waypoints + 1 end
      expect(waypoints[0]).toEqual(startLocation);
      expect(waypoints[waypoints.length - 1]).toEqual(startLocation);
    });

    it("generates geometric waypoints when features are empty", async () => {
      const startLocation = { latitude: 47.4979, longitude: 19.0402 };
      const targetDistance = 5;
      const preferences = { parks: true };
      const features = { parks: [], waterfront: [] };

      const waypoints = await circularRouteGenerator.generateWaypoints(
        startLocation,
        targetDistance,
        preferences,
        features,
      );

      expect(waypoints).toHaveLength(6);
      expect(waypoints[0]).toEqual(startLocation);
    });

    it("uses preference-based waypoints when features available", async () => {
      const startLocation = { latitude: 47.4979, longitude: 19.0402 };
      const targetDistance = 5;
      const preferences = { parks: true };
      const features = {
        parks: [
          {
            id: "1",
            coordinates: { latitude: 47.5148, longitude: 19.0782 },
            distance: 500,
          },
          {
            id: "2",
            coordinates: { latitude: 47.51, longitude: 19.075 },
            distance: 800,
          },
        ],
      };

      osmOverpassService.filterByDistanceRange.mockReturnValue(features.parks);

      const waypoints = await circularRouteGenerator.generateWaypoints(
        startLocation,
        targetDistance,
        preferences,
        features,
      );

      expect(waypoints.length).toBeGreaterThan(2);
      expect(waypoints[0]).toEqual(startLocation);
      expect(waypoints[waypoints.length - 1]).toEqual(startLocation);
    });
  });

  describe("generateGeometricWaypoints", () => {
    it("generates correct number of waypoints for 2km route", () => {
      const startLocation = { latitude: 47.4979, longitude: 19.0402 };
      const radiusMeters = 318; // 2km / (2*PI)
      const targetDistance = 2;

      const waypoints = circularRouteGenerator.generateGeometricWaypoints(
        startLocation,
        radiusMeters * 1000,
        targetDistance,
      );

      expect(waypoints).toHaveLength(5); // 1 + 3 + 1
    });

    it("generates correct number of waypoints for 5km route", () => {
      const startLocation = { latitude: 47.4979, longitude: 19.0402 };
      const radiusMeters = 796;
      const targetDistance = 5;

      const waypoints = circularRouteGenerator.generateGeometricWaypoints(
        startLocation,
        radiusMeters * 1000,
        targetDistance,
      );

      expect(waypoints).toHaveLength(6); // 1 + 4 + 1
    });

    it("starts and ends at the same location", () => {
      const startLocation = { latitude: 47.4979, longitude: 19.0402 };
      const radiusMeters = 796000;
      const targetDistance = 5;

      const waypoints = circularRouteGenerator.generateGeometricWaypoints(
        startLocation,
        radiusMeters,
        targetDistance,
      );

      expect(waypoints[0]).toEqual(startLocation);
      expect(waypoints[waypoints.length - 1]).toEqual(startLocation);
    });
  });

  describe("calculateOptimalWaypointCount", () => {
    it("returns 3 for distances <= 2km", () => {
      expect(circularRouteGenerator.calculateOptimalWaypointCount(1)).toBe(3);
      expect(circularRouteGenerator.calculateOptimalWaypointCount(2)).toBe(3);
    });

    it("returns 4 for distances 2-5km", () => {
      expect(circularRouteGenerator.calculateOptimalWaypointCount(3)).toBe(4);
      expect(circularRouteGenerator.calculateOptimalWaypointCount(5)).toBe(4);
    });

    it("returns 5 for distances 5-10km", () => {
      expect(circularRouteGenerator.calculateOptimalWaypointCount(7)).toBe(5);
      expect(circularRouteGenerator.calculateOptimalWaypointCount(10)).toBe(5);
    });

    it("returns 6 for distances > 10km", () => {
      expect(circularRouteGenerator.calculateOptimalWaypointCount(15)).toBe(6);
      expect(circularRouteGenerator.calculateOptimalWaypointCount(50)).toBe(6);
    });
  });

  describe("adjustRadius", () => {
    it("increases radius when route is too short", () => {
      const newRadius = circularRouteGenerator.adjustRadius(4, 5, 0.8);
      expect(newRadius).toBeGreaterThan(0.8);
      expect(newRadius).toBeCloseTo(1.0, 1);
    });

    it("decreases radius when route is too long", () => {
      const newRadius = circularRouteGenerator.adjustRadius(6, 5, 1.0);
      expect(newRadius).toBeLessThan(1.0);
      expect(newRadius).toBeCloseTo(0.833, 2);
    });

    it("keeps radius same when distance is exact", () => {
      const newRadius = circularRouteGenerator.adjustRadius(5, 5, 0.8);
      expect(newRadius).toBeCloseTo(0.8, 2);
    });
  });

  describe("isDistanceAcceptable", () => {
    it("returns true when distance is within tolerance", () => {
      expect(circularRouteGenerator.isDistanceAcceptable(4.8, 5)).toBe(true);
      expect(circularRouteGenerator.isDistanceAcceptable(5.0, 5)).toBe(true);
      expect(circularRouteGenerator.isDistanceAcceptable(5.5, 5)).toBe(true);
    });

    it("returns false when distance is below tolerance", () => {
      expect(circularRouteGenerator.isDistanceAcceptable(4.0, 5)).toBe(false);
    });

    it("returns false when distance is above tolerance", () => {
      expect(circularRouteGenerator.isDistanceAcceptable(6.0, 5)).toBe(false);
    });

    it("accepts custom tolerance percentage", () => {
      expect(circularRouteGenerator.isDistanceAcceptable(4.0, 5, 20)).toBe(
        true,
      );
      expect(circularRouteGenerator.isDistanceAcceptable(3.9, 5, 20)).toBe(
        false,
      );
    });
  });

  describe("calculatePreferenceScore", () => {
    beforeEach(() => {
      osmOverpassService.calculateDistance.mockReturnValue(150); // Within 200m
    });

    it("returns base score when no preferences", () => {
      const waypoints = [{ latitude: 47.4979, longitude: 19.0402 }];
      const score = circularRouteGenerator.calculatePreferenceScore(
        waypoints,
        null,
        null,
      );

      expect(score).toBe(50);
    });

    it("increases score when parks preference matched", () => {
      const waypoints = [
        { latitude: 47.4979, longitude: 19.0402 },
        { latitude: 47.5148, longitude: 19.0782 },
      ];
      const preferences = { parks: true };
      const features = {
        parks: [{ coordinates: { latitude: 47.5148, longitude: 19.0782 } }],
      };

      const score = circularRouteGenerator.calculatePreferenceScore(
        waypoints,
        preferences,
        features,
      );

      expect(score).toBeGreaterThan(50);
    });

    it("increases score when waterfront preference matched", () => {
      const waypoints = [
        { latitude: 47.4979, longitude: 19.0402 },
        { latitude: 47.507, longitude: 19.0444 },
      ];
      const preferences = { waterfront: true };
      const features = {
        waterfront: [{ coordinates: { latitude: 47.507, longitude: 19.0444 } }],
      };

      const score = circularRouteGenerator.calculatePreferenceScore(
        waypoints,
        preferences,
        features,
      );

      expect(score).toBeGreaterThan(50);
    });

    it("increases score when avoiding highways", () => {
      const waypoints = [{ latitude: 47.4979, longitude: 19.0402 }];
      const preferences = { avoidHighways: true };
      const features = { highways: [] };

      osmOverpassService.calculateDistance.mockReturnValue(500); // Far from highways

      const score = circularRouteGenerator.calculatePreferenceScore(
        waypoints,
        preferences,
        features,
      );

      expect(score).toBeGreaterThanOrEqual(60); // 50 + 10 for avoiding highways
    });

    it("increases score when uphill preference matched", () => {
      const waypoints = [
        { latitude: 47.4979, longitude: 19.0402 },
        { latitude: 47.52, longitude: 18.975 },
      ];
      const preferences = { uphill: true };
      const features = {
        elevation: [
          {
            coordinates: { latitude: 47.52, longitude: 18.975 },
            elevation: 235,
          },
        ],
      };

      const score = circularRouteGenerator.calculatePreferenceScore(
        waypoints,
        preferences,
        features,
      );

      expect(score).toBeGreaterThan(50);
    });

    it("increases score when mountain preference matched", () => {
      const waypoints = [
        { latitude: 47.7, longitude: 18.9 },
        { latitude: 47.71, longitude: 18.91 },
      ];
      const preferences = { mountain: true };
      const features = {
        trails: [{ coordinates: { latitude: 47.71, longitude: 18.91 } }],
      };

      const score = circularRouteGenerator.calculatePreferenceScore(
        waypoints,
        preferences,
        features,
      );

      expect(score).toBeGreaterThan(50);
    });

    it("increases score when quiet streets preference matched", () => {
      const waypoints = [
        { latitude: 47.4979, longitude: 19.0402 },
        { latitude: 47.499, longitude: 19.042 },
      ];
      const preferences = { quietStreets: true };
      const features = {
        quietStreets: [
          { coordinates: { latitude: 47.499, longitude: 19.042 } },
        ],
      };

      const score = circularRouteGenerator.calculatePreferenceScore(
        waypoints,
        preferences,
        features,
      );

      expect(score).toBeGreaterThan(50);
    });

    it("increases score when beach preference matched", () => {
      const waypoints = [
        { latitude: 41.3851, longitude: 2.1734 },
        { latitude: 41.386, longitude: 2.175 },
      ];
      const preferences = { beach: true };
      const features = {
        beaches: [{ coordinates: { latitude: 41.386, longitude: 2.175 } }],
      };

      const score = circularRouteGenerator.calculatePreferenceScore(
        waypoints,
        preferences,
        features,
      );

      expect(score).toBeGreaterThan(50);
    });

    it("adds bonus when all preferences matched", () => {
      const waypoints = [
        { latitude: 47.4979, longitude: 19.0402 },
        { latitude: 47.5148, longitude: 19.0782 },
      ];
      const preferences = { parks: true, waterfront: true };
      const features = {
        parks: [{ coordinates: { latitude: 47.5148, longitude: 19.0782 } }],
        waterfront: [
          { coordinates: { latitude: 47.5148, longitude: 19.0782 } },
        ],
      };

      const score = circularRouteGenerator.calculatePreferenceScore(
        waypoints,
        preferences,
        features,
      );

      // Should have parks bonus + waterfront bonus + all matched bonus
      expect(score).toBeGreaterThan(60);
    });

    it("caps score at 100", () => {
      const waypoints = Array(20)
        .fill()
        .map((_, i) => ({ latitude: 47.4979 + i * 0.01, longitude: 19.0402 }));

      const preferences = {
        parks: true,
        waterfront: true,
        scenic: true,
        uphill: true,
        mountain: true,
        quietStreets: true,
        beach: true,
      };

      const features = {
        parks: waypoints.map((wp) => ({ coordinates: wp })),
        waterfront: waypoints.map((wp) => ({ coordinates: wp })),
        scenic: waypoints.map((wp) => ({ coordinates: wp })),
        elevation: waypoints.map((wp) => ({ coordinates: wp })),
        trails: waypoints.map((wp) => ({ coordinates: wp })),
        quietStreets: waypoints.map((wp) => ({ coordinates: wp })),
        beaches: waypoints.map((wp) => ({ coordinates: wp })),
        highways: [],
      };

      const score = circularRouteGenerator.calculatePreferenceScore(
        waypoints,
        preferences,
        features,
      );

      expect(score).toBe(100);
    });
  });

  describe("countFeaturesNearWaypoints", () => {
    it("counts features within distance threshold", () => {
      const waypoints = [
        { latitude: 47.4979, longitude: 19.0402 },
        { latitude: 47.5148, longitude: 19.0782 },
      ];
      const features = [
        { coordinates: { latitude: 47.498, longitude: 19.0403 } },
        { coordinates: { latitude: 47.5149, longitude: 19.0783 } },
      ];

      osmOverpassService.calculateDistance.mockReturnValue(50); // Within threshold

      const count = circularRouteGenerator.countFeaturesNearWaypoints(
        waypoints,
        features,
        200,
      );

      expect(count).toBe(2);
    });

    it("does not count features beyond distance threshold", () => {
      const waypoints = [{ latitude: 47.4979, longitude: 19.0402 }];
      const features = [{ coordinates: { latitude: 48.0, longitude: 20.0 } }];

      osmOverpassService.calculateDistance.mockReturnValue(50000); // Far away

      const count = circularRouteGenerator.countFeaturesNearWaypoints(
        waypoints,
        features,
        200,
      );

      expect(count).toBe(0);
    });
  });
});
