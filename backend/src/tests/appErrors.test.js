import { describe, it, expect, vi } from "vitest";
import routeService from "../services/routeService.js";
import app from "../app.js";
import { inject } from "./helpers/inject.js";

vi.mock("../middleware/authMiddleware.js", () => ({
  protect: vi.fn((req, res, next) => {
    req.user = { id: "u1" };
    next();
  }),
  requireSelf: vi.fn((req, res, next) => next()),
}));
vi.mock("../services/routeService.js", () => ({
  default: { listRoutes: vi.fn(), getRoute: vi.fn() },
}));

describe("errors through the whole app", () => {
  it("answers unknown endpoints with 404 in the usual shape", async () => {
    const response = await inject(app, { url: "/api/nothing-here" });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ success: false, message: "No endpoint for GET /api/nothing-here" });
  });

  it("answers a body that isn't JSON with 400", async () => {
    const response = await inject(app, {
      method: "POST",
      url: "/api/auth/login",
      headers: { "content-type": "application/json" },
      rawBody: "{not json",
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ success: false, message: "The request body must be valid JSON" });
  });

  it("turns a controller's HttpError into its response", async () => {
    routeService.getRoute.mockResolvedValue(null);

    const response = await inject(app, { url: "/api/routes/64b7f0c2a1b2c3d4e5f60718" });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ success: false, message: "Route not found" });
  });

  it("hides unexpected errors behind a 500", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    routeService.listRoutes.mockRejectedValue(new Error("connect ECONNREFUSED 10.0.0.5:27017"));

    const response = await inject(app, { url: "/api/routes" });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ success: false, message: "Something went wrong. Please try again." });
  });

  it("lists my routes at GET /api/routes, and still at the old path", async () => {
    routeService.listRoutes.mockResolvedValue([{ _id: "r1" }]);

    const current = await inject(app, { url: "/api/routes" });
    const old = await inject(app, { url: "/api/routes/user/whatever" });

    expect(current.body).toEqual({ success: true, data: [{ _id: "r1" }] });
    expect(old.body).toEqual({ success: true, data: [{ _id: "r1" }] });
    expect(routeService.listRoutes).toHaveBeenCalledWith("u1", {});
  });
});
