import { describe, it, expect, vi, beforeEach } from "vitest";
import { HttpError, sendError } from "../../utils/httpError.js";

const mockRes = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn(),
});

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("sendError", () => {
  it("sends an HttpError with its status and message", () => {
    const res = mockRes();

    sendError(res, new HttpError(404, "Not found"), "Failed");

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Not found" });
  });

  it("adds an HttpError's details to the response", () => {
    const res = mockRes();

    sendError(
      res,
      new HttpError(400, "You can only invite friends", { invalidIds: ["u9"] }),
      "Failed",
    );

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "You can only invite friends",
      invalidIds: ["u9"],
    });
  });

  it("hides unexpected errors behind a 500 with the fallback message", () => {
    const res = mockRes();

    sendError(res, new Error("connection lost"), "Failed to load");

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Failed to load" });
  });
});
