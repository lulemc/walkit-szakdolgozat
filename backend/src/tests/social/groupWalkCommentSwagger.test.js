import { describe, it, expect } from "vitest";
import swaggerSpec from "../../config/swagger.js";

const ENDPOINTS = [
  ["get", "/api/group-walks/summary"],
  ["get", "/api/group-walks/{id}/comments"],
  ["post", "/api/group-walks/{id}/comments"],
  ["delete", "/api/group-walks/{id}/comments/{commentId}"],
];

describe("Swagger spec: group walk comments and summary", () => {
  it.each(ENDPOINTS)("documents %s %s behind login", (method, path) => {
    const operation = swaggerSpec.paths[path]?.[method];

    expect(operation).toBeDefined();
    expect(operation.tags).toEqual(["Group Walks"]);
    expect(operation.security).toEqual([{ bearerAuth: [] }]);
  });

  it("documents the paging parameters", () => {
    const names = swaggerSpec.paths["/api/group-walks/{id}/comments"].get.parameters.map((p) => p.name);

    expect(names).toEqual(expect.arrayContaining(["id", "before", "limit"]));
  });

  it.each(["GroupWalkComment", "SocialSummary"])("defines the %s schema", (name) => {
    expect(swaggerSpec.components.schemas[name]).toBeDefined();
  });
});
