import { describe, it, expect, vi } from "vitest";
import { inject } from "./helpers/inject.js";

vi.hoisted(() => {
  process.env.NODE_ENV = "production";
});
const { default: app } = await import("../app.js");

describe("Swagger UI in production", () => {
  it("isn't served", async () => {
    const response = await inject(app, { url: "/api-docs/" });

    expect(response.status).toBe(404);
  });
});
