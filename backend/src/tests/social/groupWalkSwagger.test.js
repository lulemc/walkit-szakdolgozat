import { describe, it, expect } from "vitest";
import swaggerSpec from "../../config/swagger.js";

const GROUP_WALK_ENDPOINTS = [
  ["post", "/api/group-walks"],
  ["get", "/api/group-walks"],
  ["get", "/api/group-walks/{id}"],
  ["patch", "/api/group-walks/{id}"],
  ["post", "/api/group-walks/{id}/cancel"],
  ["post", "/api/group-walks/{id}/invites"],
  ["delete", "/api/group-walks/{id}/participants/{userId}"],
  ["post", "/api/group-walks/{id}/respond"],
];

describe("Swagger spec: Group Walks", () => {
  it.each(GROUP_WALK_ENDPOINTS)("documents %s %s behind login", (method, path) => {
    const operation = swaggerSpec.paths[path]?.[method];

    expect(operation).toBeDefined();
    expect(operation.tags).toEqual(["Group Walks"]);
    expect(operation.security).toEqual([{ bearerAuth: [] }]);
  });

  it("documents the list scopes", () => {
    const scope = swaggerSpec.paths["/api/group-walks"].get.parameters.find((p) => p.name === "scope");

    expect(scope.schema.enum).toEqual(["invitations", "upcoming", "past"]);
  });

  it.each(["CreateGroupWalkRequest", "GroupWalkSummary", "GroupWalkDetail", "GroupWalkParticipant"])(
    "defines the %s schema",
    (name) => {
      expect(swaggerSpec.components.schemas[name]).toBeDefined();
    },
  );
});
