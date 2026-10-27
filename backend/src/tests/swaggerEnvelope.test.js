import { describe, it, expect } from "vitest";
import swaggerSpec from "../config/swagger.js";

const schemas = swaggerSpec.components.schemas;
const resolve = (schema) => (schema?.$ref ? schemas[schema.$ref.split("/").pop()] : schema);
/** The properties of a schema, including those from allOf parts */
const propertiesOf = (schema) => {
  const resolved = resolve(schema);
  if (resolved?.allOf) return Object.assign({}, ...resolved.allOf.map(propertiesOf));
  return resolved?.properties ?? {};
};

const responses = Object.entries(swaggerSpec.paths).flatMap(([path, operations]) =>
  Object.entries(operations).flatMap(([method, operation]) =>
    Object.entries(operation.responses ?? {}).map(([status, response]) => [
      `${method.toUpperCase()} ${path} ${status}`,
      response,
    ]),
  ),
);

describe("Swagger spec: response envelope", () => {
  it.each(responses)("%s documents a { success, ... } JSON body", (_name, response) => {
    const schema = response.content?.["application/json"]?.schema;

    expect(schema).toBeDefined();
    expect(propertiesOf(schema)).toHaveProperty("success");
  });

  it("documents the user the API returns: the public fields, never the password hash", () => {
    const user = propertiesOf(schemas.User);

    expect(Object.keys(user)).toEqual(
      expect.arrayContaining(["_id", "name", "email", "height", "weight", "activityLevel"]),
    );
    expect(user).not.toHaveProperty("passwordHash");
    expect(user).not.toHaveProperty("id");
  });

  it.each([
    ["get", "/api/routes"],
    ["get", "/api/routes/favorites/list"],
    ["post", "/api/routes/{routeId}/favorite"],
    ["delete", "/api/routes/{routeId}/favorite"],
    ["patch", "/api/routes/{routeId}/name"],
    ["post", "/api/routes/{routeId}/complete"],
    ["get", "/api/users/{id}"],
    ["put", "/api/users/{id}"],
    ["delete", "/api/users/{id}"],
    ["post", "/api/users/{id}/change-password"],
  ])("documents %s %s", (method, path) => {
    expect(swaggerSpec.paths[path]?.[method]).toBeDefined();
  });
});

describe("Swagger spec: route lists", () => {
  it.each(["/api/routes", "/api/routes/favorites/list"])("documents paging for %s", (path) => {
    const names = swaggerSpec.paths[path].get.parameters.map((parameter) => parameter.name);

    expect(names).toEqual(expect.arrayContaining(["before", "limit"]));
  });

  it("documents drafts on routes", () => {
    const route = propertiesOf(schemas.Route);

    expect(route.status.enum).toEqual(["draft", "saved"]);
    expect(route).toHaveProperty("draftExpiresAt");
  });
});

describe("Swagger spec: health", () => {
  it("documents the health check without login", () => {
    const operation = swaggerSpec.paths["/api/health"]?.get;

    expect(operation).toBeDefined();
    expect(operation.security).toBeUndefined();
  });
});
