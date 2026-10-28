import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import { HttpError } from "../../utils/httpError.js";
import { errorHandler, notFound, SERVER_ERROR_MESSAGE } from "../../middleware/errorHandler.js";

const mockRes = (headersSent = false) => ({
  headersSent,
  status: vi.fn().mockReturnThis(),
  json: vi.fn(),
});
const handle = (error, res = mockRes()) => {
  const next = vi.fn();
  errorHandler(error, { method: "GET", originalUrl: "/api/x" }, res, next);
  return { res, next };
};

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("errorHandler", () => {
  it("answers an HttpError with its status, message and details", () => {
    const { res } = handle(new HttpError(400, "You can only invite friends", { invalidIds: ["u9"] }));

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "You can only invite friends",
      invalidIds: ["u9"],
    });
  });

  it("answers a Mongoose validation error with 400 and the first problem", () => {
    const error = new mongoose.Error.ValidationError();
    error.addError("height", new mongoose.Error.ValidatorError({ message: "Height must be between 50 and 300 cm" }));

    const { res } = handle(error);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Height must be between 50 and 300 cm" });
  });

  it("answers an id that can't exist (CastError) with 404", () => {
    const error = new mongoose.Error.CastError("ObjectId", "nope", "_id");

    const { res } = handle(error);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Not found" });
  });

  it("answers a value of the wrong type (e.g. text for a number) with 400", () => {
    const error = new mongoose.Error.CastError("Number", "abc", "weeklyGoalKm");

    const { res } = handle(error);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "weeklyGoalKm must be a number" });
  });

  it("answers a duplicate key with 409", () => {
    const { res } = handle(Object.assign(new Error("E11000 duplicate key error"), { code: 11000 }));

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Already exists" });
  });

  it("answers a body that isn't JSON with 400", () => {
    const error = Object.assign(new SyntaxError("Unexpected token"), {
      type: "entity.parse.failed",
      status: 400,
      expose: true,
    });

    const { res } = handle(error);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "The request body must be valid JSON" });
  });

  it("passes on other client errors from Express itself, e.g. a too large body", () => {
    const error = Object.assign(new Error("request entity too large"), { status: 413, expose: true });

    const { res } = handle(error);

    expect(res.status).toHaveBeenCalledWith(413);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "request entity too large" });
  });

  it("logs anything else and answers 500 without details", () => {
    const { res } = handle(new Error("connect ECONNREFUSED 10.0.0.5:27017"));

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: SERVER_ERROR_MESSAGE });
    expect(console.error).toHaveBeenCalled();
  });

  it("leaves a response that already started to Express", () => {
    const error = new Error("late");
    const { res, next } = handle(error, mockRes(true));

    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(error);
  });
});

describe("notFound", () => {
  it("answers unknown endpoints with 404 in the usual shape", () => {
    const res = mockRes();

    notFound({ method: "GET", originalUrl: "/api/nope" }, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "No endpoint for GET /api/nope" });
  });
});
