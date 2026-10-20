import { describe, it, expect } from "vitest";
import app from "../app.js";
import { inject } from "./helpers/inject.js";

// Any path works: CORS is checked before routing
const fromOrigin = (origin) =>
  inject(app, { url: "/api-docs/", headers: origin ? { origin } : {} });

describe("CORS (default origins)", () => {
  it("allows the local Expo web origins", async () => {
    const response = await fromOrigin("http://localhost:8081");

    expect(response.status).not.toBe(403);
    expect(response.headers["access-control-allow-origin"]).toBe("http://localhost:8081");
  });

  it("answers 403 in the usual shape for other origins", async () => {
    const response = await fromOrigin("https://evil.example");

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ success: false, message: "Origin not allowed" });
    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("allows requests without an origin, like the mobile app's", async () => {
    expect((await fromOrigin(undefined)).status).not.toBe(403);
  });

  it("serves the Swagger docs outside production", async () => {
    expect((await fromOrigin(undefined)).status).toBe(200);
  });
});
