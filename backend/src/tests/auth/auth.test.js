import { describe, it, expect, vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";
import User from "../../models/User.js";
import { protect } from "../../middleware/authMiddleware.js";

// ---- mocks ----
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

describe("authMiddleware - protect", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      headers: {},
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    next = vi.fn();

    vi.clearAllMocks();
  });

  it("calls next and attaches user when token is valid", async () => {
    const mockUser = { id: "123", email: "test@test.com" };

    req.headers.authorization = "Bearer validtoken";

    jwt.verify.mockReturnValue({ id: "123" });

    User.findById.mockReturnValue({
      select: vi.fn().mockResolvedValue(mockUser),
    });

    await protect(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith(
      "validtoken",
      process.env.JWT_SECRET,
    );

    expect(User.findById).toHaveBeenCalledWith("123");
    expect(req.user).toEqual(mockUser);
    expect(next).toHaveBeenCalled();
  });

  it("returns 401 if token verification fails", async () => {
    req.headers.authorization = "Bearer invalidtoken";

    jwt.verify.mockImplementation(() => {
      throw new Error("Invalid token");
    });

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Not authorized, token failed",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 if no authorization header is present", async () => {
    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Not authorized, no token",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 if authorization header does not start with Bearer", async () => {
    req.headers.authorization = "Token sometoken";

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Not authorized, no token",
    });
    expect(next).not.toHaveBeenCalled();
  });
});
