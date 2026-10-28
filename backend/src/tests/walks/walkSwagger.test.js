import { describe, it, expect } from "vitest";
import swaggerSpec from "../../config/swagger.js";

describe("Swagger spec: Walks", () => {
  it.each([
    ["post", "/api/walks"],
    ["get", "/api/walks"],
    ["get", "/api/walks/stats"],
    ["get", "/api/walks/activity"],
    ["get", "/api/walks/{id}"],
  ])("documents %s %s behind login", (method, path) => {
    const operation = swaggerSpec.paths[path]?.[method];

    expect(operation).toBeDefined();
    expect(operation.tags).toEqual(["Walks"]);
    expect(operation.security).toEqual([{ bearerAuth: [] }]);
  });

  it.each(["RecordWalkRequest", "WalkSummary", "Walk", "WalkStats", "WalkActivity"])("defines the %s schema", (name) => {
    expect(swaggerSpec.components.schemas[name]).toBeDefined();
  });
});

describe("Swagger spec: references", () => {
  it("only refers to schemas that exist", () => {
    const refs = [...JSON.stringify(swaggerSpec).matchAll(/"\$ref":"#\/components\/schemas\/([^"]+)"/g)].map(
      ([, name]) => name,
    );

    const missing = [...new Set(refs)].filter((name) => !swaggerSpec.components.schemas[name]);

    expect(missing).toEqual([]);
  });
});
