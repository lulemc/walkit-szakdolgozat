import { describe, it, expect } from "vitest";
import swaggerSpec from "../../config/swagger.js";

describe("Swagger spec: user search", () => {
  it("documents GET /api/users/search behind login with a q parameter", () => {
    const operation = swaggerSpec.paths["/api/users/search"]?.get;

    expect(operation).toBeDefined();
    expect(operation.tags).toEqual(["Users"]);
    expect(operation.security).toEqual([{ bearerAuth: [] }]);
    expect(operation.parameters).toEqual(
      expect.arrayContaining([expect.objectContaining({ in: "query", name: "q", required: true })]),
    );
  });

  it("describes results without an email field", () => {
    const result = swaggerSpec.components.schemas.UserSearchResult;

    expect(Object.keys(result.properties)).toEqual(
      expect.arrayContaining(["_id", "name", "relationship", "friendshipId"]),
    );
    expect(result.properties).not.toHaveProperty("email");
  });
});
