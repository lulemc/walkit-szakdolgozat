import { describe, it, expect, vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";
import User from "../../models/User.js";
import { protect, requireSelf } from "../../middleware/authMiddleware.js";

/* ---------------- mocks ---------------- */

vi.mock("jsonwebtoken", () => ({
  default: {
    verify: vi.fn(),
  },
}));

vi.mock("../../models/User.js", () => ({
  default: {
    findById: vi.fn(),
  },
}));

/* ---------------- tests ---------------- */

describe("authMiddleware - protect", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = { headers: {} };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    next = vi.fn();

    vi.clearAllMocks();
    process.env.JWT_SECRET = "test-secret";
  });

  it("calls next and attaches user when token is valid", async () => {
    const mockUser = { _id: "123", email: "test@test.com" };

    req.headers.authorization = "Bearer validtoken";

    jwt.verify.mockReturnValue({ id: "123" });

    User.findById.mockReturnValue({
      select: vi.fn().mockResolvedValue(mockUser),
    });

    await protect(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith("validtoken", "test-secret");

    expect(User.findById).toHaveBeenCalledWith("123");
    expect(req.user).toEqual(mockUser);
    expect(next).toHaveBeenCalled();
  });

  it("accepts a token whose version matches the user's", async () => {
    req.headers.authorization = "Bearer validtoken";
    jwt.verify.mockReturnValue({ id: "123", tokenVersion: 2 });
    User.findById.mockReturnValue({
      select: vi.fn().mockResolvedValue({ _id: "123", tokenVersion: 2 }),
    });

    await protect(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("accepts tokens from before token versions existed while the password is unchanged", async () => {
    req.headers.authorization = "Bearer oldtoken";
    jwt.verify.mockReturnValue({ id: "123" });
    User.findById.mockReturnValue({ select: vi.fn().mockResolvedValue({ _id: "123" }) });

    await protect(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("rejects a token issued before the last password change", async () => {
    req.headers.authorization = "Bearer oldtoken";
    jwt.verify.mockReturnValue({ id: "123", tokenVersion: 0 });
    User.findById.mockReturnValue({
      select: vi.fn().mockResolvedValue({ _id: "123", tokenVersion: 1 }),
    });

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Your session has expired. Please log in again.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 if token verification fails", async () => {
    req.headers.authorization = "Bearer invalidtoken";

    jwt.verify.mockImplementation(() => {
      throw new Error("Invalid token");
    });

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    // Without the library's own error text
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Not authorized, token failed" });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 if no authorization header is present", async () => {
    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Not authorized, no token" });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 if authorization header does not start with Bearer", async () => {
    req.headers.authorization = "Token sometoken";

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Not authorized, no token" });
    expect(next).not.toHaveBeenCalled();
  });
});

describe("authMiddleware - requireSelf", () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  };
  const next = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls next when the id matches the logged-in user", () => {
    const req = { params: { id: "123" }, user: { _id: "123" } };

    requireSelf(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns 403 when the id belongs to another user", () => {
    const req = { params: { id: "456" }, user: { _id: "123" } };

    requireSelf(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Forbidden" });
    expect(next).not.toHaveBeenCalled();
  });
});
