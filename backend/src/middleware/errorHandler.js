import { HttpError } from "../utils/httpError.js";
import { logger } from "../utils/logger.js";

export const SERVER_ERROR_MESSAGE = "Something went wrong. Please try again.";

const fail = (res, status, message, details) =>
  res.status(status).json({ success: false, message, ...details });

/** Unknown endpoints get the usual `{ success: false, message }` instead of Express's HTML page */
export const notFound = (req, res) =>
  fail(res, 404, `No endpoint for ${req.method} ${req.originalUrl}`);

/**
 * The one place errors become responses. Controllers just throw (or let a
 * rejected promise through; Express 5 forwards it here):
 * - HttpError: its own status and message, plus its details
 * - Mongoose validation errors: 400 with the first problem
 * - ids that can't exist (CastError): 404; other values of the wrong type: 400
 * - duplicate keys: 409
 * - Express's own client errors (bad JSON, too large body): their status
 * - anything else: logged, and a 500 that reveals nothing
 */
// Express recognises error handlers by their four parameters, so `next` stays
export const errorHandler = (error, req, res, next) => {
  if (res.headersSent) return next(error);

  if (error instanceof HttpError) return fail(res, error.status, error.message, error.details);

  if (error?.name === "ValidationError") {
    const [first] = Object.values(error.errors ?? {});
    return fail(res, 400, first?.message ?? "Invalid data");
  }
  if (error?.name === "CastError") {
    if (error.kind === "ObjectId") return fail(res, 404, "Not found");
    return fail(res, 400, `${error.path} must be a ${error.kind.toLowerCase()}`);
  }
  if (error?.code === 11000) return fail(res, 409, "Already exists");

  if (error?.type === "entity.parse.failed") {
    return fail(res, 400, "The request body must be valid JSON");
  }
  if (error?.expose && error.status >= 400 && error.status < 500) {
    return fail(res, error.status, error.message);
  }

  logger.error(`Unhandled error on ${req.method} ${req.originalUrl}:`, error);
  return fail(res, 500, SERVER_ERROR_MESSAGE);
};
