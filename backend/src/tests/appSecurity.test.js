import { describe, it, expect, vi, beforeEach } from "vitest";
import User from "../models/User.js";
import app from "../app.js";
import { AUTH_LIMIT } from "../middleware/rateLimit.js";
import { inject } from "./helpers/inject.js";

vi.mock("../models/User.js", () => ({ default: { findOne: vi.fn() } }));

beforeEach(() => {
  vi.clearAllMocks();
  User.findOne.mockResolvedValue(null);
});

// The rate limit counts per client address, so each test uses its own
describe("app security middleware", () => {
  it("sends security headers (helmet)", async () => {
    const response = await inject(app, { url: "/api/routes/unknown-path-for-headers" });

    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["x-powered-by"]).toBeUndefined();
  });

  it("limits login attempts", async () => {
    const login = () =>
      inject(app, {
        method: "POST",
        url: "/api/auth/login",
        body: { email: "a@x.com", password: "wrong" },
        ip: "10.0.0.1",
      });

    for (let i = 0; i < AUTH_LIMIT.limit; i++) expect((await login()).status).not.toBe(429);

    expect((await login()).status).toBe(429);
  });

  it("limits registration attempts", async () => {
    const register = () =>
      inject(app, { method: "POST", url: "/api/auth/register", body: {}, ip: "10.0.0.2" });

    for (let i = 0; i < AUTH_LIMIT.limit; i++) expect((await register()).status).not.toBe(429);

    expect((await register()).status).toBe(429);
  });

  it("counts login and register together", async () => {
    const attempt = (url) => inject(app, { method: "POST", url, body: {}, ip: "10.0.0.3" });

    for (let i = 0; i < AUTH_LIMIT.limit; i++) await attempt("/api/auth/login");

    expect((await attempt("/api/auth/register")).status).toBe(429);
  });
});
