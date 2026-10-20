import { describe, it, expect } from "vitest";
import { MAX_DISTANCE_KM, MIN_DISTANCE_KM, routeRequestProblem } from "../../utils/routeRequest.js";

const budapest = { latitude: 47.4979, longitude: 19.0402 };
const circular = { routeType: "circular", startLocation: budapest, distance: 5, preferences: {} };
const pointToPoint = {
  routeType: "point-to-point",
  startLocation: budapest,
  destinationLocation: { latitude: 47.51, longitude: 19.06 },
};

describe("routeRequestProblem", () => {
  it("accepts valid circular and point-to-point requests", () => {
    expect(routeRequestProblem(circular)).toBeNull();
    expect(routeRequestProblem(pointToPoint)).toBeNull();
  });

  it("accepts distances from 0.5 to 50 km for circular routes", () => {
    expect([MIN_DISTANCE_KM, MAX_DISTANCE_KM]).toEqual([0.5, 50]);
    expect(routeRequestProblem({ ...circular, distance: 0.5 })).toBeNull();
    expect(routeRequestProblem({ ...circular, distance: 50 })).toBeNull();
  });

  it.each([0.4, 51, -5, "5", undefined, Number.NaN])("rejects a circular distance of %s", (distance) => {
    expect(routeRequestProblem({ ...circular, distance })).toBe("distance must be between 0.5 and 50 km");
  });

  it.each([undefined, "loop", "CIRCULAR"])("rejects routeType %s", (routeType) => {
    expect(routeRequestProblem({ ...circular, routeType })).toBe(
      "routeType must be circular or point-to-point",
    );
  });

  it.each([
    ["missing", undefined],
    ["latitude over 90", { latitude: 91, longitude: 19 }],
    ["longitude under -180", { latitude: 47, longitude: -181 }],
    ["text", { latitude: "47", longitude: "19" }],
  ])("rejects a start location that is %s", (_case, startLocation) => {
    expect(routeRequestProblem({ ...circular, startLocation })).toBe(
      "startLocation must have a valid latitude and longitude",
    );
  });

  it("requires a valid destination for point-to-point routes", () => {
    const message = "destinationLocation must have a valid latitude and longitude";
    expect(routeRequestProblem({ ...pointToPoint, destinationLocation: undefined })).toBe(message);
    expect(routeRequestProblem({ ...pointToPoint, destinationLocation: { latitude: 0 } })).toBe(message);
  });

  it("rejects preferences that aren't an object", () => {
    expect(routeRequestProblem({ ...circular, preferences: "parks" })).toBe("preferences must be an object");
  });

  it("rejects a missing body", () => {
    expect(routeRequestProblem(undefined)).toBe("routeType must be circular or point-to-point");
  });
});
