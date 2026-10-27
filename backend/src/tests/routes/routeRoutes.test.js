import { describe, it, expect, vi, beforeEach } from "vitest";
import Route from "../../models/Route.js";
import routeService from "../../services/routeService.js";
import app from "../../app.js";
import { inject } from "../helpers/inject.js";

vi.mock("../../middleware/authMiddleware.js", () => ({
  protect: vi.fn((req, res, next) => {
    req.user = { id: "u1" };
    next();
  }),
  requireSelf: vi.fn((req, res, next) => next()),
}));
vi.mock("../../services/routeService.js", () => ({
  default: {
    generateRoute: vi.fn(),
    listRoutes: vi.fn(),
    listFavoriteRoutes: vi.fn(),
    getRoute: vi.fn(),
    deleteRoute: vi.fn(),
  },
}));
// Keep the real exports (GroupWalk reuses the route schemas), replace the queries
vi.mock("../../models/Route.js", async (importOriginal) => ({
  ...(await importOriginal()),
  default: { findOne: vi.fn(), find: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("route ids", () => {
  it.each([
    ["GET", "/api/routes/not-an-id"],
    ["DELETE", "/api/routes/not-an-id"],
    ["POST", "/api/routes/not-an-id/favorite"],
    ["DELETE", "/api/routes/not-an-id/favorite"],
    ["PATCH", "/api/routes/not-an-id/name"],
    ["POST", "/api/routes/not-an-id/complete"],
  ])("%s %s answers 404 for an invalid id, without a database query", async (method, url) => {
    const response = await inject(app, { method, url, body: { name: "X" } });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ success: false, message: "Route not found" });
    expect(Route.findOne).not.toHaveBeenCalled();
    expect(routeService.getRoute).not.toHaveBeenCalled();
    expect(routeService.deleteRoute).not.toHaveBeenCalled();
  });

  it("still finds valid ids", async () => {
    routeService.getRoute.mockResolvedValue({ _id: "64b7f0c2a1b2c3d4e5f60718" });

    const response = await inject(app, { url: "/api/routes/64b7f0c2a1b2c3d4e5f60718" });

    expect(response.status).toBe(200);
  });

  it("doesn't treat the favourites list as a route id", async () => {
    routeService.listFavoriteRoutes.mockResolvedValue([]);

    const response = await inject(app, { url: "/api/routes/favorites/list" });

    expect(response.status).toBe(200);
  });
});
