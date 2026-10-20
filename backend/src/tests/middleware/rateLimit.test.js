import { describe, it, expect } from "vitest";
import express from "express";
import {
  API_LIMIT,
  AUTH_LIMIT,
  ROUTE_GENERATION_LIMIT,
  apiLimiter,
  authLimiter,
  routeGenerationLimiter,
} from "../../middleware/rateLimit.js";
import { inject } from "../helpers/inject.js";

/** A tiny app with one limited endpoint; a fresh app also means fresh counters */
const appWith = (limiter, { asUser = false } = {}) => {
  const app = express();
  if (asUser) {
    app.use((req, res, next) => {
      req.user = { id: req.headers["x-test-user"] };
      next();
    });
  }
  app.post("/limited", limiter, (req, res) => res.json({ success: true }));
  return app;
};

const send = (app, times, options = {}) =>
  Promise.all(Array.from({ length: times }, () => inject(app, { method: "POST", url: "/limited", ...options })));

describe("rate limits", () => {
  it("allows 10 login or register attempts per 15 minutes per address", () => {
    expect(AUTH_LIMIT).toEqual({ limit: 10, windowMs: 15 * 60 * 1000 });
  });

  it("answers 429 in the usual error shape once the limit is used up", async () => {
    const app = appWith(authLimiter());

    const allowed = await send(app, AUTH_LIMIT.limit);
    const blocked = await inject(app, { method: "POST", url: "/limited" });

    expect(allowed.every((response) => response.status === 200)).toBe(true);
    expect(blocked.status).toBe(429);
    expect(blocked.body).toEqual({
      success: false,
      message: "Too many attempts. Please try again later.",
    });
    expect(blocked.headers["retry-after"]).toBeDefined();
  });

  it("counts each address separately", async () => {
    const app = appWith(authLimiter());
    await send(app, AUTH_LIMIT.limit, { ip: "10.0.0.1" });

    const other = await inject(app, { method: "POST", url: "/limited", ip: "10.0.0.2" });

    expect(other.status).toBe(200);
  });

  it("limits route generation per user, not per address", async () => {
    expect(ROUTE_GENERATION_LIMIT).toEqual({ limit: 30, windowMs: 60 * 60 * 1000 });
    const app = appWith(routeGenerationLimiter(), { asUser: true });
    await send(app, ROUTE_GENERATION_LIMIT.limit, { headers: { "x-test-user": "ann" } });

    const annAgain = await inject(app, { method: "POST", url: "/limited", headers: { "x-test-user": "ann" } });
    const bob = await inject(app, { method: "POST", url: "/limited", headers: { "x-test-user": "bob" } });

    expect(annAgain.status).toBe(429);
    expect(annAgain.body.message).toBe("You've generated a lot of routes. Please try again in a while.");
    expect(bob.status).toBe(200);
  });

  it("has a generous limit for everything else", async () => {
    expect(API_LIMIT).toEqual({ limit: 300, windowMs: 15 * 60 * 1000 });
    const app = appWith(apiLimiter());
    await send(app, API_LIMIT.limit);

    const blocked = await inject(app, { method: "POST", url: "/limited" });

    expect(blocked.status).toBe(429);
    expect(blocked.body.success).toBe(false);
  });
});
