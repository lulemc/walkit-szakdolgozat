import { describe, it, expect } from "vitest";
import { HttpError } from "../../utils/httpError.js";

describe("HttpError", () => {
  it("carries the status, message and details for the response", () => {
    const error = new HttpError(400, "You can only invite friends", { invalidIds: ["u9"] });

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("HttpError");
    expect(error.status).toBe(400);
    expect(error.message).toBe("You can only invite friends");
    expect(error.details).toEqual({ invalidIds: ["u9"] });
  });
});
