import { describe, it, expect, vi, beforeEach } from "vitest";
import routeService from "../../services/routeService.js";
import Route from "../../models/Route.js";
import * as controller from "../../controllers/routeController.js";
import { HttpError } from "../../utils/httpError.js";

vi.mock("../../services/routeService.js", () => ({
  default: {
    generateRoute: vi.fn(),
    listRoutes: vi.fn(),
    listFavoriteRoutes: vi.fn(),
    getRoute: vi.fn(),
    deleteRoute: vi.fn(),
  },
}));
vi.mock("../../models/Route.js", async (importOriginal) => ({
  ...(await importOriginal()),
  default: { findOne: vi.fn(), find: vi.fn() },
}));

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
  status: "draft",
  draftExpiresAt: new Date("2030-01-08T10:00:00.000Z"),
  save: vi.fn().mockResolvedValue(undefined),
  ...fields,
});

const internalError = new Error("connect ECONNREFUSED 10.0.0.5:27017");

/** The controller rejects with an HttpError, which the error handler sends */
const expectHttpError = async (promise, status, message) => {
  const error = await promise.catch((e) => e);
  expect(error).toBeInstanceOf(HttpError);
  expect(error.status).toBe(status);
  expect(error.message).toBe(message);
};

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
    await expectHttpError(
      controller.generateRoute(request({ body: { ...validBody, distance: 500 } }), mockRes()),
      400,
      "distance must be between 0.5 and 50 km",
    );
    expect(routeService.generateRoute).not.toHaveBeenCalled();
  });

  it("leaves unexpected errors to the error handler, which hides their text", async () => {
    routeService.generateRoute.mockRejectedValue(internalError);

    await expect(controller.generateRoute(request({ body: validBody }), mockRes())).rejects.toBe(internalError);
  });
});

describe("reading and deleting routes", () => {
  it("lists my routes a page at a time", async () => {
    routeService.listRoutes.mockResolvedValue([{ _id: "r1" }]);
    const res = mockRes();

    await controller.getUserRoutes(request({ query: { limit: "5" } }), res);

    expect(routeService.listRoutes).toHaveBeenCalledWith("u1", { limit: "5" });
    expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ _id: "r1" }] });
  });

  it("gets one of my routes, or 404", async () => {
    routeService.getRoute.mockResolvedValueOnce({ _id: "r1" }).mockResolvedValueOnce(null);
    const found = mockRes();
    const missing = mockRes();

    await controller.getRoute(request(), found);
    await expectHttpError(controller.getRoute(request(), missing), 404, "Route not found");

    expect(routeService.getRoute).toHaveBeenCalledWith("r1", "u1");
    expect(found.json).toHaveBeenCalledWith({ success: true, data: { _id: "r1" } });
  });

  it("deletes one of my routes, or 404", async () => {
    routeService.deleteRoute.mockResolvedValueOnce({ _id: "r1" }).mockResolvedValueOnce(null);
    const deleted = mockRes();
    const missing = mockRes();

    await controller.deleteRoute(request(), deleted);
    await expectHttpError(controller.deleteRoute(request(), missing), 404, "Route not found");

    expect(routeService.deleteRoute).toHaveBeenCalledWith("r1", "u1");
    expect(deleted.json).toHaveBeenCalledWith({ success: true, message: "Route deleted successfully" });
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

  it("lists favourites a page at a time", async () => {
    routeService.listFavoriteRoutes.mockResolvedValue([{ _id: "r1" }]);
    const res = mockRes();

    await controller.getFavoriteRoutes(request({ query: { before: "2030-01-01" } }), res);

    expect(routeService.listFavoriteRoutes).toHaveBeenCalledWith("u1", { before: "2030-01-01" });
    expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ _id: "r1" }] });
  });

  it.each([
    ["addToFavorites", {}],
    ["updateRouteName", { name: "Hill loop" }],
    ["recordWalkCompletion", {}],
  ])("%s keeps a draft for good", async (action, body) => {
    const route = routeDoc();
    Route.findOne.mockResolvedValue(route);

    await controller[action](request({ body }), mockRes());

    expect(route.status).toBe("saved");
    expect(route.draftExpiresAt).toBeUndefined();
    expect(route.save).toHaveBeenCalled();
  });

  it("removing a favourite keeps the route saved", async () => {
    const route = routeDoc({ status: "saved", draftExpiresAt: undefined, isFavorite: true });
    Route.findOne.mockResolvedValue(route);

    await controller.removeFromFavorites(request(), mockRes());

    expect(route.status).toBe("saved");
  });

  it("renames a route, trimming the name; an empty name is 400", async () => {
    const route = routeDoc();
    Route.findOne.mockResolvedValue(route);

    await controller.updateRouteName(request({ body: { name: "  Hill loop " } }), mockRes());
    await expectHttpError(
      controller.updateRouteName(request({ body: { name: "   " } }), mockRes()),
      400,
      "Route name is required",
    );

    expect(route.name).toBe("Hill loop");
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

      await expectHttpError(controller[action](request({ body: { name: "X" } }), mockRes()), 404, "Route not found");
    },
  );

  it.each(["addToFavorites", "removeFromFavorites", "updateRouteName", "recordWalkCompletion"])(
    "%s leaves unexpected errors to the error handler",
    async (action) => {
      Route.findOne.mockRejectedValue(internalError);

      await expect(controller[action](request({ body: { name: "X" } }), mockRes())).rejects.toBe(internalError);
    },
  );
});
