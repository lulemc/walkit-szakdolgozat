import { describe, it, expect } from "vitest";
import swaggerSpec from "../../config/swagger.js";

const FRIEND_ENDPOINTS = [
  ["get", "/api/friends"],
  ["get", "/api/friends/requests"],
  ["post", "/api/friends/requests"],
  ["post", "/api/friends/requests/{id}/accept"],
  ["post", "/api/friends/requests/{id}/decline"],
  ["delete", "/api/friends/requests/{id}"],
  ["delete", "/api/friends/{userId}"],
];

describe("Swagger spec: Friends", () => {
  it.each(FRIEND_ENDPOINTS)("documents %s %s behind login", (method, path) => {
    const operation = swaggerSpec.paths[path]?.[method];

    expect(operation).toBeDefined();
    expect(operation.tags).toEqual(["Friends"]);
    expect(operation.security).toEqual([{ bearerAuth: [] }]);
  });
});
