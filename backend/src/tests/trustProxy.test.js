import { describe, it, expect, vi } from "vitest";
import { inject } from "./helpers/inject.js";
import { AUTH_LIMIT } from "../middleware/rateLimit.js";

vi.mock("../models/User.js", () => ({ default: { findOne: vi.fn(() => Promise.resolve(null)) } }));

// Read when the app module loads, so it is set before the import below
vi.hoisted(() => {
  process.env.TRUST_PROXY = "1";
});
const { default: app } = await import("../app.js");

describe("TRUST_PROXY", () => {
  it("counts each client behind the proxy separately", async () => {
    const login = (client) =>
      inject(app, {
        method: "POST",
        url: "/api/auth/login",
        body: {},
        ip: "10.9.9.9", // the proxy
        headers: { "x-forwarded-for": client },
      });

    for (let i = 0; i < AUTH_LIMIT.limit; i++) await login("203.0.113.1");

    expect((await login("203.0.113.1")).status).toBe(429);
    expect((await login("203.0.113.2")).status).not.toBe(429);
  });
});
