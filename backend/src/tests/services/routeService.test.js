import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import axios from "axios";
import Route from "../../models/Route.js";
import osmOverpassService from "../../services/osmOverpassService.js";
import circularRouteGenerator from "../../services/circularRouteGenerator.js";
import { HttpError } from "../../utils/httpError.js";
import routeService, {
  FAVORITES_PAGE_SIZE,
  ROUTES_PAGE_SIZE,
} from "../../services/routeService.js";

vi.mock("axios", () => ({ default: { post: vi.fn() } }));
vi.mock("../../services/osmOverpassService.js", () => ({
  default: { getAllPreferenceFeatures: vi.fn() },
}));
vi.mock("../../models/Route.js", async (importOriginal) => {
  const actual = await importOriginal();
  // A stand-in for the model: `new Route(fields)` keeps the fields, save() resolves
  const MockRoute = vi.fn(function (fields) {
    Object.assign(this, fields);
    this.save = vi.fn().mockResolvedValue(this);
  });
  MockRoute.find = vi.fn();
  return { ...actual, default: MockRoute };
});

const NOW = new Date("2030-01-01T10:00:00.000Z");

const query = (result) => {
  const q = {
    select: vi.fn(() => q),
    sort: vi.fn(() => q),
    limit: vi.fn(() => q),
    lean: vi.fn(() => Promise.resolve(result)),
  };
  return q;
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ["Date"], now: NOW });
  vi.spyOn(console, "log").mockImplementation(() => {});
  process.env.ORS_API_KEY = "ors-key";
});

afterEach(() => {
  vi.useRealTimers();
});

// What ORS answers: a road-snapped path with elevation
const orsAnswer = {
  data: {
    features: [
      {
        geometry: { coordinates: [[19.04, 47.5, 100], [19.05, 47.51, 130], [19.04, 47.5, 100]] },
        properties: { summary: { distance: 5100, duration: 3600 }, ascent: 30, descent: 30 },
      },
    ],
  },
};
const roadPath = [
  { latitude: 47.5, longitude: 19.04 },
  { latitude: 47.51, longitude: 19.05 },
  { latitude: 47.5, longitude: 19.04 },
];
const start = { latitude: 47.5, longitude: 19.04 };
const circular = (overrides = {}) => ({ routeType: "circular", startLocation: start, distance: 5, preferences: {}, ...overrides });

describe("generateRoute", () => {
  beforeEach(() => {
    axios.post.mockResolvedValue(orsAnswer);
  });

  it("saves the generated route as a draft that expires in 7 days", async () => {
    const route = await routeService.generateRoute(circular(), "u1");

    expect(route).toEqual(
      expect.objectContaining({
        userId: "u1",
        status: "draft",
        draftExpiresAt: new Date("2030-01-08T10:00:00.000Z"),
      }),
    );
    expect(route.save).toHaveBeenCalled();
  });

  it("stores the road-snapped path, distance, walking time and elevation from ORS", async () => {
    const route = await routeService.generateRoute(circular(), "u1");

    expect(route).toEqual(
      expect.objectContaining({
        coordinates: roadPath,
        totalDistance: 5100,
        estimatedDuration: 60,
        elevationGain: 30,
        elevationLoss: 30,
        maxElevation: 130,
        minElevation: 100,
      }),
    );
  });

  it("scores the preferences on the real path, not the planned waypoints", async () => {
    const features = { parks: [{ coordinates: start }] };
    osmOverpassService.getAllPreferenceFeatures.mockResolvedValue(features);
    const score = vi.spyOn(circularRouteGenerator, "calculatePreferenceScore").mockReturnValue(85);

    const route = await routeService.generateRoute(circular({ preferences: { parks: true } }), "u1");

    expect(score).toHaveBeenCalledWith(roadPath, { parks: true }, features);
    expect(route.preferenceScore).toBe(85);
  });

  it("scores point-to-point routes too", async () => {
    osmOverpassService.getAllPreferenceFeatures.mockResolvedValue({ parks: [] });
    const score = vi.spyOn(circularRouteGenerator, "calculatePreferenceScore").mockReturnValue(60);

    const route = await routeService.generateRoute(
      {
        routeType: "point-to-point",
        startLocation: start,
        destinationLocation: { latitude: 47.51, longitude: 19.05 },
        preferences: { parks: true },
      },
      "u1",
    );

    expect(axios.post.mock.calls[0][1].coordinates).toEqual([[19.04, 47.5], [19.05, 47.51]]);
    expect(score).toHaveBeenCalledWith(roadPath, { parks: true }, { parks: [] });
    expect(route.preferenceScore).toBe(60);
  });

  it("gives a neutral score without preferences, without looking up the map", async () => {
    const route = await routeService.generateRoute(circular(), "u1");

    expect(osmOverpassService.getAllPreferenceFeatures).not.toHaveBeenCalled();
    expect(route.preferenceScore).toBe(50);
  });

  it("passes on the routing service's own message instead of a generic one", async () => {
    axios.post.mockRejectedValue(Object.assign(new Error("429"), { response: { status: 429 } }));

    const error = await routeService.generateRoute(circular(), "u1", { wait: () => Promise.resolve() }).catch((e) => e);

    expect(error).toBeInstanceOf(HttpError);
    expect(error.message).toBe("The routing service is busy. Please try again in a minute.");
  });

  it("passes on a failed map lookup for the preferences", async () => {
    osmOverpassService.getAllPreferenceFeatures.mockRejectedValue(new HttpError(503, "Couldn't check the map"));

    await expect(routeService.generateRoute(circular({ preferences: { parks: true } }), "u1")).rejects.toThrow(
      "Couldn't check the map",
    );
    expect(Route).not.toHaveBeenCalled();
  });
});

describe("listing routes", () => {
  it(`lists my routes newest first, without coordinates, ${ROUTES_PAGE_SIZE} at a time`, async () => {
    const q = query([{ _id: "r1" }]);
    Route.find.mockReturnValue(q);

    await expect(routeService.listRoutes("u1", {})).resolves.toEqual([{ _id: "r1" }]);

    expect(Route.find).toHaveBeenCalledWith({ userId: "u1" });
    expect(q.select).toHaveBeenCalledWith("-coordinates");
    expect(q.sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(q.limit).toHaveBeenCalledWith(ROUTES_PAGE_SIZE);
  });

  it("pages my routes by creation time", async () => {
    const q = query([]);
    Route.find.mockReturnValue(q);

    await routeService.listRoutes("u1", { before: "2029-12-01T00:00:00.000Z", limit: "5" });

    expect(Route.find).toHaveBeenCalledWith({
      userId: "u1",
      createdAt: { $lt: new Date("2029-12-01T00:00:00.000Z") },
    });
    expect(q.limit).toHaveBeenCalledWith(5);
  });

  it(`lists my favourites, most recently favourited first, without coordinates, ${FAVORITES_PAGE_SIZE} at a time`, async () => {
    const q = query([]);
    Route.find.mockReturnValue(q);

    await routeService.listFavoriteRoutes("u1", { before: "2029-12-01T00:00:00.000Z" });

    expect(Route.find).toHaveBeenCalledWith({
      userId: "u1",
      isFavorite: true,
      favoritedAt: { $lt: new Date("2029-12-01T00:00:00.000Z") },
    });
    expect(q.select).toHaveBeenCalledWith("-coordinates");
    expect(q.sort).toHaveBeenCalledWith({ favoritedAt: -1 });
    expect(q.limit).toHaveBeenCalledWith(FAVORITES_PAGE_SIZE);
  });

  it("rejects paging values that don't fit with 400", async () => {
    await expect(routeService.listRoutes("u1", { limit: "500" })).rejects.toBeInstanceOf(HttpError);
    await expect(routeService.listFavoriteRoutes("u1", { before: "soon" })).rejects.toBeInstanceOf(HttpError);
  });
});
