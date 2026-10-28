import { describe, it, expect, vi, beforeEach } from "vitest";
import { protect } from "../../middleware/authMiddleware.js";
import * as walkSessionService from "../../services/walkSessionService.js";
import { HttpError } from "../../utils/httpError.js";
import app from "../../app.js";
import { inject } from "../helpers/inject.js";

vi.mock("../../middleware/authMiddleware.js", () => ({
  protect: vi.fn((req, res, next) => {
    req.user = { id: "me" };
    next();
  }),
  requireSelf: vi.fn((req, res, next) => next()),
}));
vi.mock("../../services/walkSessionService.js", () => ({
  recordWalk: vi.fn(),
  listWalks: vi.fn(),
  getWalk: vi.fn(),
  getWalkStats: vi.fn(),
  getWalkActivity: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  for (const fn of Object.values(walkSessionService)) fn.mockResolvedValue({ ok: true });
});

describe("walk routes", () => {
  it.each([
    ["POST", "/api/walks", "recordWalk", { distanceM: 10 }, ["me", { distanceM: 10 }], 201],
    ["GET", "/api/walks?before=2030-01-01&limit=5", "listWalks", undefined, ["me", { before: "2030-01-01", limit: "5" }], 200],
    ["GET", "/api/walks/stats?from=2030-01-01", "getWalkStats", undefined, ["me", { from: "2030-01-01" }], 200],
    ["GET", "/api/walks/activity?from=2030-01-01", "getWalkActivity", undefined, ["me", { from: "2030-01-01" }], 200],
    ["GET", "/api/walks/w1", "getWalk", undefined, ["me", "w1"], 200],
  ])("%s %s reaches %s", async (method, url, serviceFn, body, args, status) => {
    const response = await inject(app, { method, url, body });

    expect(response.status).toBe(status);
    expect(response.body).toEqual({ success: true, data: { ok: true } });
    expect(walkSessionService[serviceFn]).toHaveBeenCalledWith(...args);
    expect(protect).toHaveBeenCalled();
  });

  it("passes the service's 4xx on in the usual shape", async () => {
    walkSessionService.recordWalk.mockRejectedValue(new HttpError(400, "distanceM must be between 0 and 200000"));

    const response = await inject(app, { method: "POST", url: "/api/walks", body: {} });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ success: false, message: "distanceM must be between 0 and 200000" });
  });

  it("hides unexpected errors", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    walkSessionService.getWalk.mockRejectedValue(new Error("connection lost to 10.0.0.5"));

    const response = await inject(app, { url: "/api/walks/w1" });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ success: false, message: "Something went wrong. Please try again." });
  });
});
