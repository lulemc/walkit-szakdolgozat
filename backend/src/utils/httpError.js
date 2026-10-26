/**
 * An error that carries the HTTP status the client should receive.
 * Services and controllers throw it; middleware/errorHandler.js turns it into
 * `{ success: false, message, ...details }`.
 */
export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.details = details;
  }
}
