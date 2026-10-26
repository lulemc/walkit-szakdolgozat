import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import { HttpError } from "../../utils/httpError.js";
import { MAX_ATTEMPTS, ORS_TIMEOUT_MS, getWalkingRoute } from "../../services/orsClient.js";

vi.mock("axios", () => ({ default: { post: vi.fn() } }));

const a = { latitude: 47.5, longitude: 19.04 };
const b = { latitude: 47.51, longitude: 19.05 };
const noWait = { wait: () => Promise.resolve() };

/** What ORS sends: GeoJSON with [lng, lat, elevation] points and a summary */
const orsResponse = {
  data: {
    features: [
      {
        geometry: { coordinates: [[19.04, 47.5, 110], [19.045, 47.505, 125.5], [19.05, 47.51, 118]] },
        properties: { summary: { distance: 1520.4, duration: 1200 }, ascent: 15.5, descent: 7.5 },
      },
    ],
  },
};
const httpFailure = (status, data = {}) => Object.assign(new Error(`status ${status}`), { response: { status, data } });
const noResponse = () => Object.assign(new Error("timeout of 20000ms exceeded"), { code: "ECONNABORTED", request: {} });

const expectHttpError = async (promise, status, message) => {
  const error = await promise.catch((e) => e);
  expect(error).toBeInstanceOf(HttpError);
  expect(error.status).toBe(status);
  expect(error.message).toBe(message);
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  process.env.ORS_API_KEY = "ors-key";
});

describe("getWalkingRoute", () => {
  it("asks ORS for a walking route with elevation, with a timeout", async () => {
    axios.post.mockResolvedValue(orsResponse);

    await getWalkingRoute([a, b], noWait);

    expect(axios.post).toHaveBeenCalledWith(
      "https://api.openrouteservice.org/v2/directions/foot-walking/geojson",
      expect.objectContaining({ coordinates: [[19.04, 47.5], [19.05, 47.51]], elevation: true }),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: "ors-key" }), timeout: ORS_TIMEOUT_MS }),
    );
  });

  it("returns the road-snapped path, distance, walking time and elevation", async () => {
    axios.post.mockResolvedValue(orsResponse);

    const route = await getWalkingRoute([a, b], noWait);

    expect(route).toEqual({
      coordinates: [
        { latitude: 47.5, longitude: 19.04 },
        { latitude: 47.505, longitude: 19.045 },
        { latitude: 47.51, longitude: 19.05 },
      ],
      distance: 1520.4,
      duration: 20,
      elevation: { gain: 15.5, loss: 7.5, max: 125.5, min: 110 },
    });
  });

  it("copes with a response without elevation", async () => {
    axios.post.mockResolvedValue({
      data: {
        features: [{ geometry: { coordinates: [[19.04, 47.5], [19.05, 47.51]] }, properties: { summary: { distance: 10, duration: 60 } } }],
      },
    });

    const route = await getWalkingRoute([a, b], noWait);

    expect(route.elevation).toEqual({ gain: 0, loss: 0, max: null, min: null });
  });

  it.each([
    ["the service is busy (429)", httpFailure(429)],
    ["the service has a problem (502)", httpFailure(502)],
    ["there is no answer (timeout)", noResponse()],
  ])(`tries again (${MAX_ATTEMPTS} attempts in all) when %s`, async (_case, failure) => {
    axios.post.mockRejectedValueOnce(failure).mockRejectedValueOnce(failure).mockResolvedValueOnce(orsResponse);

    await expect(getWalkingRoute([a, b], noWait)).resolves.toEqual(expect.objectContaining({ distance: 1520.4 }));
    expect(axios.post).toHaveBeenCalledTimes(3);
  });

  it("waits longer before each new attempt", async () => {
    const wait = vi.fn(() => Promise.resolve());
    axios.post.mockRejectedValueOnce(httpFailure(503)).mockRejectedValueOnce(httpFailure(503)).mockResolvedValueOnce(orsResponse);

    await getWalkingRoute([a, b], { wait });

    expect(wait.mock.calls.map(([ms]) => ms)).toEqual([500, 1000]);
  });

  it.each([
    ["busy", httpFailure(429), 503, "The routing service is busy. Please try again in a minute."],
    ["down", httpFailure(503), 503, "The routing service isn't responding. Please try again."],
    ["unreachable", noResponse(), 503, "The routing service isn't responding. Please try again."],
  ])("gives up with a clear message when it stays %s", async (_case, failure, status, message) => {
    axios.post.mockRejectedValue(failure);

    await expectHttpError(getWalkingRoute([a, b], noWait), status, message);
    expect(axios.post).toHaveBeenCalledTimes(MAX_ATTEMPTS);
  });

  it.each([
    ["a point with no path nearby (ORS 2010)", httpFailure(404, { error: { code: 2010 } })],
    ["a route ORS can't build (400)", httpFailure(400, { error: { code: 2004 } })],
  ])("doesn't retry %s, and says no walkable route was found", async (_case, failure) => {
    axios.post.mockRejectedValue(failure);

    await expectHttpError(
      getWalkingRoute([a, b], noWait),
      422,
      "No walkable route was found here. Try another start point or a shorter distance.",
    );
    expect(axios.post).toHaveBeenCalledTimes(1);
  });

  it.each([401, 403])("doesn't retry a rejected API key (%s), and logs it for us", async (status) => {
    axios.post.mockRejectedValue(httpFailure(status));

    await expectHttpError(getWalkingRoute([a, b], noWait), 503, "Route generation is unavailable right now.");
    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalled();
  });

  it("says so, without calling ORS, when no API key is configured", async () => {
    delete process.env.ORS_API_KEY;

    await expectHttpError(getWalkingRoute([a, b], noWait), 503, "Route generation is unavailable right now.");
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("treats an answer without a route as no walkable route", async () => {
    axios.post.mockResolvedValue({ data: { features: [] } });

    await expectHttpError(
      getWalkingRoute([a, b], noWait),
      422,
      "No walkable route was found here. Try another start point or a shorter distance.",
    );
  });
});
