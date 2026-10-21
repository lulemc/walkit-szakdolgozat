import { describe, it, expect, vi } from "vitest";
import app from "../app.js";
import { ROUTE_GENERATION_LIMIT } from "../middleware/rateLimit.js";
import { inject } from "./helpers/inject.js";

vi.mock("../middleware/authMiddleware.js", () => ({
  protect: vi.fn((req, res, next) => {
    req.user = { id: req.headers["x-test-user"] };
    next();
  }),
  requireSelf: vi.fn((req, res, next) => next()),
}));
vi.mock("../controllers/routeController.js", async (importOriginal) => ({
  ...(await importOriginal()),
  generateRoute: vi.fn((req, res) => res.status(201).json({ success: true })),
}));

const generate = (user) =>
  inject(app, { method: "POST", url: "/api/routes/generate", body: {}, headers: { "x-test-user": user } });

describe("POST /api/routes/generate", () => {
  it(`allows each user ${ROUTE_GENERATION_LIMIT.limit} routes per hour`, async () => {
    for (let i = 0; i < ROUTE_GENERATION_LIMIT.limit; i++) {
      expect((await generate("ann")).status).toBe(201);
    }

    expect((await generate("ann")).status).toBe(429);
    expect((await generate("bob")).status).toBe(201);
  });
});
