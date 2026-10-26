import axios from "axios";
import { HttpError } from "../utils/httpError.js";

/**
 * The OpenRouteService client: walking routes through waypoints, snapped to
 * real paths, with elevation. Retries when ORS is busy or down, and turns its
 * failures into messages the app can show.
 */
const DIRECTIONS_URL = "https://api.openrouteservice.org/v2/directions/foot-walking/geojson";
export const ORS_TIMEOUT_MS = 20_000;
export const MAX_ATTEMPTS = 3;
/** Waits before the 2nd and 3rd attempt */
const RETRY_DELAYS_MS = [500, 1000];

const BUSY = "The routing service is busy. Please try again in a minute.";
const DOWN = "The routing service isn't responding. Please try again.";
const UNAVAILABLE = "Route generation is unavailable right now.";
const NO_ROUTE = "No walkable route was found here. Try another start point or a shorter distance.";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Busy, broken or silent: worth another try */
const isTemporary = (error) => {
  const status = error.response?.status;
  return status === undefined ? Boolean(error.request) : status === 429 || status >= 500;
};

const toHttpError = (error) => {
  const status = error.response?.status;
  if (status === 429) return new HttpError(503, BUSY);
  if (status === 401 || status === 403) {
    // Our key is wrong or blocked: the user can't fix that, we can
    console.error("OpenRouteService rejected the API key:", status, error.response?.data);
    return new HttpError(503, UNAVAILABLE);
  }
  if (status === 400 || status === 404) return new HttpError(422, NO_ROUTE);
  if (status === undefined && !error.request) return error;
  console.warn("OpenRouteService failed:", status ?? error.code ?? error.message);
  return new HttpError(503, DOWN);
};

const summarizeElevation = (points, properties) => {
  const heights = points.map((point) => point[2]).filter((height) => typeof height === "number");
  return {
    gain: properties.ascent ?? 0,
    loss: properties.descent ?? 0,
    max: heights.length > 0 ? Math.max(...heights) : null,
    min: heights.length > 0 ? Math.min(...heights) : null,
  };
};

/**
 * @param {{ latitude: number, longitude: number }[]} waypoints
 * @param {{ wait?: (ms: number) => Promise<void> }} [options] wait is replaceable for tests
 * @returns {Promise<{ coordinates: object[], distance: number, duration: number, elevation: object }>}
 *   distance in metres, duration in minutes
 */
export const getWalkingRoute = async (waypoints, { wait = sleep } = {}) => {
  const apiKey = process.env.ORS_API_KEY;
  if (!apiKey) {
    console.error("ORS_API_KEY is not set");
    throw new HttpError(503, UNAVAILABLE);
  }

  const body = {
    coordinates: waypoints.map(({ latitude, longitude }) => [longitude, latitude]),
    preference: "recommended",
    elevation: true,
    instructions: false,
  };
  const config = {
    headers: { Authorization: apiKey, "Content-Type": "application/json" },
    timeout: ORS_TIMEOUT_MS,
  };

  for (let attempt = 1; ; attempt += 1) {
    let response;
    try {
      response = await axios.post(DIRECTIONS_URL, body, config);
    } catch (error) {
      if (attempt < MAX_ATTEMPTS && isTemporary(error)) {
        await wait(RETRY_DELAYS_MS[attempt - 1]);
        continue;
      }
      throw toHttpError(error);
    }

    const feature = response.data?.features?.[0];
    if (!feature) throw new HttpError(422, NO_ROUTE);

    const points = feature.geometry.coordinates;
    return {
      coordinates: points.map(([longitude, latitude]) => ({ latitude, longitude })),
      distance: feature.properties.summary.distance,
      duration: feature.properties.summary.duration / 60,
      elevation: summarizeElevation(points, feature.properties),
    };
  }
};
