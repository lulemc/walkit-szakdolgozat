import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import axios from "axios";
import Route from "../../models/Route.js";
import { HttpError } from "../../utils/httpError.js";
import routeService, {
  FAVORITES_PAGE_SIZE,
  ROUTES_PAGE_SIZE,
} from "../../services/routeService.js";

vi.mock("axios", () => ({ default: { post: vi.fn() } }));
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
});

afterEach(() => {
  vi.useRealTimers();
});

describe("generateRoute", () => {
  it(`saves the generated route as a draft that expires in 7 days`, async () => {
    axios.post.mockResolvedValue({
      data: {
        features: [
          {
            geometry: { coordinates: [[19.04, 47.5], [19.05, 47.51]] },
            properties: { summary: { distance: 5100, duration: 3600 } },
          },
        ],
      },
    });

    const route = await routeService.generateRoute(
      { routeType: "circular", startLocation: { latitude: 47.5, longitude: 19.04 }, distance: 5, preferences: {} },
      "u1",
    );

    expect(route).toEqual(
      expect.objectContaining({
        userId: "u1",
        status: "draft",
        draftExpiresAt: new Date("2030-01-08T10:00:00.000Z"),
      }),
    );
    expect(route.save).toHaveBeenCalled();
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
