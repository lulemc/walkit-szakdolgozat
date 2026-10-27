import { describe, it, expect, vi, afterEach } from "vitest";
import mongoose from "mongoose";
import app from "../app.js";
import { API_LIMIT } from "../middleware/rateLimit.js";
import { inject } from "./helpers/inject.js";

const givenDatabase = (readyState) =>
  vi.spyOn(mongoose.connection, "readyState", "get").mockReturnValue(readyState);

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GET /api/health", () => {
  it("is ok with the database connected, and says which version runs", async () => {
    givenDatabase(1);

    const response = await inject(app, { url: "/api/health" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { status: "ok", database: "connected", version: "1.0.0", uptimeSec: expect.any(Number) },
    });
  });

  it("answers 503 without the database, so the host can restart or hold traffic", async () => {
    givenDatabase(0);

    const response = await inject(app, { url: "/api/health" });

    expect(response.status).toBe(503);
    expect(response.body).toEqual(
      expect.objectContaining({ success: false, message: "The database is not connected" }),
    );
    expect(response.body.data).toEqual(expect.objectContaining({ status: "unavailable", database: "disconnected" }));
  });

  it("isn't rate limited, so frequent health checks don't block anyone", async () => {
    givenDatabase(1);
    const check = () => inject(app, { url: "/api/health", ip: "10.20.30.40" });

    for (let i = 0; i < API_LIMIT.limit; i++) await check();

    expect((await check()).status).toBe(200);
  });
});
