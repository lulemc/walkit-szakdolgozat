import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../../models/User.js";
import { register } from "../../controllers/authController.js";

/* ---------------- mocks ---------------- */

vi.mock("bcryptjs");
vi.mock("jsonwebtoken");
vi.mock("../../models/User.js");

/* ---------------- helpers ---------------- */

const mockRes = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn(),
});

/* ---------------- tests ---------------- */

describe("authController - register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = "test-secret";
    jwt.sign.mockReturnValue("test-token");
  });

  it("registers user and returns token", async () => {
    const req = {
      body: {
        name: "John",
        email: "john@test.com",
        password: "secret",
      },
    };

    const res = mockRes();

    User.findOne.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue("hashed-password");

    User.create.mockResolvedValue({
      _id: "123",
      name: "John",
      email: "john@test.com",
    });

    await register(req, res);

    expect(bcrypt.hash).toHaveBeenCalledWith("secret", 10);

    expect(User.create).toHaveBeenCalledWith({
      name: "John",
      email: "john@test.com",
      passwordHash: "hashed-password",
    });

    expect(jwt.sign).toHaveBeenCalledWith({ id: "123" }, "test-secret", {
      expiresIn: "7d",
    });

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      token: "test-token",
      user: {
        _id: "123",
        name: "John",
        email: "john@test.com",
      },
    });
  });

  it("returns 400 if user already exists", async () => {
    const req = {
      body: {
        email: "john@test.com",
      },
    };

    const res = mockRes();

    User.findOne.mockResolvedValue({});

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "User already exists",
    });
  });
});
