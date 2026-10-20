import { describe, it, expect, vi } from "vitest";
import { inject } from "./helpers/inject.js";

// Read when the app module loads
vi.hoisted(() => {
  process.env.CORS_ORIGINS = "https://walkit.example, https://admin.walkit.example";
});
const { default: app } = await import("../app.js");

describe("CORS_ORIGINS", () => {
  it("allows exactly the configured origins", async () => {
    const allowed = await inject(app, { url: "/api-docs/", headers: { origin: "https://admin.walkit.example" } });
    const local = await inject(app, { url: "/api-docs/", headers: { origin: "http://localhost:8081" } });

    expect(allowed.status).not.toBe(403);
    expect(local.status).toBe(403);
  });
});
