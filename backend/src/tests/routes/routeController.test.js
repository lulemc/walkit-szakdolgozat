import { describe, it, expect, vi, beforeEach } from "vitest";
import routeService from "../../services/routeService.js";
import Route from "../../models/Route.js";
import * as controller from "../../controllers/routeController.js";

vi.mock("../../services/routeService.js", () => ({
  default: { generateRoute: vi.fn(), getUserRoutes: vi.fn(), getRoute: vi.fn(), deleteRoute: vi.fn() },
}));
vi.mock("../../models/Route.js", () => ({ default: { findOne: vi.fn(), find: vi.fn() } }));

const mockRes = () => ({ status: vi.fn().mockReturnThis(), json: vi.fn() });
const request = (overrides = {}) => ({ user: { id: "u1" }, params: { routeId: "r1" }, body: {}, ...overrides });
const validBody = {
  routeType: "circular",
  startLocation: { latitude: 47.5, longitude: 19.04 },
  distance: 5,
  preferences: {},
};
/** A saved route document */
const routeDoc = (fields = {}) => ({
  _id: "r1",
  type: "circular",
  totalDistance: 5200,
  name: null,
  walkCount: 0,
  save: vi.fn().mockResolvedValue(undefined),
  ...fields,
});

const internalError = new Error("connect ECONNREFUSED 10.0.0.5:27017");

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
});

describe("generateRoute", () => {
  it("generates a route for the user", async () => {
    routeService.generateRoute.mockResolvedValue({ _id: "r1" });
    const res = mockRes();

    await controller.generateRoute(request({ body: validBody }), res);

    expect(routeService.generateRoute).toHaveBeenCalledWith(validBody, "u1");
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { _id: "r1" } });
  });

  it("answers 400 for an invalid request without calling the routing services", async () => {
    const res = mockRes();

    await controller.generateRoute(request({ body: { ...validBody, distance: 500 } }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "distance must be between 0.5 and 50 km",
    });
    expect(routeService.generateRoute).not.toHaveBeenCalled();
  });

  it("doesn't pass internal error text to the client", async () => {
    routeService.generateRoute.mockRejectedValue(internalError);
    const res = mockRes();

    await controller.generateRoute(request({ body: validBody }), res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Failed to generate route. Please try again.",
    });
  });
});

describe("reading and deleting routes", () => {
  it("lists my routes", async () => {
    routeService.getUserRoutes.mockResolvedValue([{ _id: "r1" }]);
    const res = mockRes();

    await controller.getUserRoutes(request(), res);

    expect(routeService.getUserRoutes).toHaveBeenCalledWith("u1");
    expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ _id: "r1" }] });
  });

  it("gets one of my routes, or 404", async () => {
    routeService.getRoute.mockResolvedValueOnce({ _id: "r1" }).mockResolvedValueOnce(null);
    const found = mockRes();
    const missing = mockRes();

    await controller.getRoute(request(), found);
    await controller.getRoute(request(), missing);

    expect(routeService.getRoute).toHaveBeenCalledWith("r1", "u1");
    expect(found.json).toHaveBeenCalledWith({ success: true, data: { _id: "r1" } });
    expect(missing.status).toHaveBeenCalledWith(404);
  });

  it("deletes one of my routes, or 404", async () => {
    routeService.deleteRoute.mockResolvedValueOnce({ _id: "r1" }).mockResolvedValueOnce(null);
    const deleted = mockRes();
    const missing = mockRes();

    await controller.deleteRoute(request(), deleted);
    await controller.deleteRoute(request(), missing);

    expect(routeService.deleteRoute).toHaveBeenCalledWith("r1", "u1");
    expect(deleted.json).toHaveBeenCalledWith({ success: true, message: "Route deleted successfully" });
    expect(missing.status).toHaveBeenCalledWith(404);
  });
});

describe("favourites, names and walks", () => {
  it("adds a route to favourites, naming unnamed routes", async () => {
    const route = routeDoc();
    Route.findOne.mockResolvedValue(route);
    const res = mockRes();

    await controller.addToFavorites(request(), res);

    expect(Route.findOne).toHaveBeenCalledWith({ _id: "r1", userId: "u1" });
    expect(route).toEqual(expect.objectContaining({ isFavorite: true, name: "Circular 5.2km" }));
    expect(route.favoritedAt).toBeInstanceOf(Date);
    expect(route.save).toHaveBeenCalled();
  });

  it("uses a given name for the favourite", async () => {
    const route = routeDoc();
    Route.findOne.mockResolvedValue(route);

    await controller.addToFavorites(request({ body: { name: "Riverside" } }), mockRes());

    expect(route.name).toBe("Riverside");
  });

  it("removes a route from favourites", async () => {
    const route = routeDoc({ isFavorite: true, favoritedAt: new Date() });
    Route.findOne.mockResolvedValue(route);

    await controller.removeFromFavorites(request(), mockRes());

    expect(route).toEqual(expect.objectContaining({ isFavorite: false, favoritedAt: null }));
    expect(route.save).toHaveBeenCalled();
  });

  it("lists favourites, most recent first", async () => {
    const sort = vi.fn().mockResolvedValue([{ _id: "r1" }]);
    Route.find.mockReturnValue({ sort });
    const res = mockRes();

    await controller.getFavoriteRoutes(request(), res);

    expect(Route.find).toHaveBeenCalledWith({ userId: "u1", isFavorite: true });
    expect(sort).toHaveBeenCalledWith({ favoritedAt: -1 });
    expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ _id: "r1" }], count: 1 });
  });

  it("renames a route, trimming the name; an empty name is 400", async () => {
    const route = routeDoc();
    Route.findOne.mockResolvedValue(route);
    const empty = mockRes();

    await controller.updateRouteName(request({ body: { name: "  Hill loop " } }), mockRes());
    await controller.updateRouteName(request({ body: { name: "   " } }), empty);

    expect(route.name).toBe("Hill loop");
    expect(empty.status).toHaveBeenCalledWith(400);
  });

  it("records a completed walk", async () => {
    const route = routeDoc({ walkCount: 2 });
    Route.findOne.mockResolvedValue(route);
    const res = mockRes();

    await controller.recordWalkCompletion(request(), res);

    expect(route.walkCount).toBe(3);
    expect(route.lastWalkedAt).toBeInstanceOf(Date);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: { walkCount: 3, lastWalkedAt: route.lastWalkedAt } }),
    );
  });

  it.each(["addToFavorites", "removeFromFavorites", "updateRouteName", "recordWalkCompletion"])(
    "%s answers 404 for a route that isn't mine",
    async (action) => {
      Route.findOne.mockResolvedValue(null);
      const res = mockRes();

      await controller[action](request({ body: { name: "X" } }), res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: "Route not found" });
    },
  );

  it.each(["addToFavorites", "removeFromFavorites", "updateRouteName", "recordWalkCompletion"])(
    "%s doesn't reveal internal errors",
    async (action) => {
      Route.findOne.mockRejectedValue(internalError);
      const res = mockRes();

      await controller[action](request({ body: { name: "X" } }), res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(JSON.stringify(res.json.mock.calls[0][0])).not.toContain("ECONNREFUSED");
    },
  );
});
