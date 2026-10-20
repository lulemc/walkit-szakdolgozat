import { rateLimit } from "express-rate-limit";

const MINUTE = 60 * 1000;

/** Login and register together, per client address: slows down password guessing */
export const AUTH_LIMIT = { limit: 10, windowMs: 15 * MINUTE };
/** Per user: route generation calls OpenRouteService and Overpass, which have quotas */
export const ROUTE_GENERATION_LIMIT = { limit: 30, windowMs: 60 * MINUTE };
/** Everything else, per client address */
export const API_LIMIT = { limit: 300, windowMs: 15 * MINUTE };

const createLimiter = ({ limit, windowMs }, message, options = {}) =>
  rateLimit({
    limit,
    windowMs,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    // The same `{ success, message }` shape as every other error
    handler: (req, res, next, { statusCode }) =>
      res.status(statusCode).json({ success: false, message }),
    ...options,
  });

// Factories, so each app (and each test) gets its own counters
export const authLimiter = () =>
  createLimiter(AUTH_LIMIT, "Too many attempts. Please try again later.");

/** Use after `protect`: counts per logged-in user */
export const routeGenerationLimiter = () =>
  createLimiter(
    ROUTE_GENERATION_LIMIT,
    "You've generated a lot of routes. Please try again in a while.",
    { keyGenerator: (req) => `user:${req.user.id}` },
  );

export const apiLimiter = () =>
  createLimiter(API_LIMIT, "Too many requests. Please slow down.");
