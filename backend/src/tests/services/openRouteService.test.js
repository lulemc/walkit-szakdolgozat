import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import axios from "axios";

/* ---------------- mocks ---------------- */

vi.mock("axios");

// Mock env to avoid side effects
const mockEnv = { ORS_API_KEY: "test-api-key-12345" };

vi.mock("../../config/env.js", () => ({
  default: mockEnv,
}));

/* ---------------- helpers ---------------- */

const mockORSResponse = {
  data: {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {
          summary: {
            distance: 5123.5,
            duration: 3685.2,
          },
        },
        geometry: {
          type: "LineString",
          coordinates: [
            [19.0402, 47.4979],
            [19.0403, 47.498],
            [19.0404, 47.4981],
            [19.0402, 47.4979],
          ],
        },
      },
    ],
    metadata: {},
  },
};

/* ---------------- tests ---------------- */

describe("OpenRouteService", () => {
  let openRouteService;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.ORS_API_KEY = "test-api-key-12345";

    // Reset module to get fresh instance with new env
    vi.resetModules();
    openRouteService = (await import("../../services/openRouteService.js"))
      .default;
  });

  afterEach(() => {
    delete process.env.ORS_API_KEY;
  });

  describe("getRoute", () => {
    it("successfully generates a route with valid waypoints", async () => {
      axios.post.mockResolvedValue(mockORSResponse);

      const waypoints = [
        { latitude: 47.4979, longitude: 19.0402 },
        { latitude: 47.51, longitude: 19.055 },
      ];

      const result = await openRouteService.getRoute(waypoints);

      expect(axios.post).toHaveBeenCalledTimes(1);

      // Check the URL
      expect(axios.post).toHaveBeenCalledWith(
        "https://api.openrouteservice.org/v2/directions/foot-walking/geojson",
        expect.objectContaining({
          coordinates: [
            [19.0402, 47.4979],
            [19.055, 47.51],
          ],
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        }),
      );

      expect(result).toEqual({
        distance: 5123.5,
        duration: expect.closeTo(61.42, 1),
        coordinates: [
          { latitude: 47.4979, longitude: 19.0402 },
          { latitude: 47.498, longitude: 19.0403 },
          { latitude: 47.4981, longitude: 19.0404 },
          { latitude: 47.4979, longitude: 19.0402 },
        ],
      });
    });

    it("throws error if ORS_API_KEY is not configured", async () => {
      // Delete env var and reimport
      delete process.env.ORS_API_KEY;
      vi.resetModules();

      const freshService = (await import("../../services/openRouteService.js"))
        .default;

      const waypoints = [
        { latitude: 47.4979, longitude: 19.0402 },
        { latitude: 47.51, longitude: 19.055 },
      ];

      await expect(freshService.getRoute(waypoints)).rejects.toThrow(
        "ORS_API_KEY not configured",
      );
    });

    it("throws error if fewer than 2 waypoints provided", async () => {
      const waypoints = [{ latitude: 47.4979, longitude: 19.0402 }];

      await expect(openRouteService.getRoute(waypoints)).rejects.toThrow(
        "At least 2 waypoints required",
      );
    });

    it("throws error if no features in response", async () => {
      axios.post.mockResolvedValue({
        data: {
          features: [],
        },
      });

      const waypoints = [
        { latitude: 47.4979, longitude: 19.0402 },
        { latitude: 47.51, longitude: 19.055 },
      ];

      await expect(openRouteService.getRoute(waypoints)).rejects.toThrow(
        "No route found",
      );
    });

    it("handles 401 unauthorized error", async () => {
      axios.post.mockRejectedValue({
        response: {
          status: 401,
          data: { error: "Unauthorized" },
        },
      });

      const waypoints = [
        { latitude: 47.4979, longitude: 19.0402 },
        { latitude: 47.51, longitude: 19.055 },
      ];

      await expect(openRouteService.getRoute(waypoints)).rejects.toThrow(
        "Invalid OpenRouteService API key",
      );
    });

    it("handles 429 rate limit error", async () => {
      axios.post.mockRejectedValue({
        response: {
          status: 429,
          data: { error: "Rate limit exceeded" },
        },
      });

      const waypoints = [
        { latitude: 47.4979, longitude: 19.0402 },
        { latitude: 47.51, longitude: 19.055 },
      ];

      await expect(openRouteService.getRoute(waypoints)).rejects.toThrow(
        "OpenRouteService rate limit exceeded",
      );
    });

    it("handles 400 bad request error", async () => {
      axios.post.mockRejectedValue({
        response: {
          status: 400,
          data: { error: { message: "Invalid coordinates" } },
        },
      });

      const waypoints = [
        { latitude: 47.4979, longitude: 19.0402 },
        { latitude: 200, longitude: 300 },
      ];

      await expect(openRouteService.getRoute(waypoints)).rejects.toThrow(
        "OpenRouteService bad request",
      );
    });

    it("handles network error (no response)", async () => {
      axios.post.mockRejectedValue({
        request: {},
        message: "Network error",
      });

      const waypoints = [
        { latitude: 47.4979, longitude: 19.0402 },
        { latitude: 47.51, longitude: 19.055 },
      ];

      await expect(openRouteService.getRoute(waypoints)).rejects.toThrow(
        "No response from OpenRouteService",
      );
    });
  });

  describe("healthCheck", () => {
    it("returns true when service is healthy", async () => {
      axios.get.mockResolvedValue({ status: 200 });

      const result = await openRouteService.healthCheck();

      expect(result).toBe(true);
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining("/health"),
        expect.any(Object),
      );
    });

    it("returns false when service is down", async () => {
      axios.get.mockRejectedValue(new Error("Service unavailable"));

      const result = await openRouteService.healthCheck();

      expect(result).toBe(false);
    });
  });
});
