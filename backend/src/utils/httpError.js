/**
 * An error that carries the HTTP status the client should receive.
 * Services throw it; controllers turn it into `{ success: false, message }`.
 */
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}
