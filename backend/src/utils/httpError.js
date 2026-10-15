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

/**
 * Sends an error response: an HttpError with its own status and message,
 * anything else as a 500 that doesn't reveal internals.
 */
export const sendError = (res, error, fallbackMessage) => {
  if (error instanceof HttpError) {
    return res.status(error.status).json({ success: false, message: error.message });
  }
  console.error(`${fallbackMessage}:`, error);
  return res.status(500).json({ success: false, message: fallbackMessage });
};
