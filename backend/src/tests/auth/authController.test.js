import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../../models/User.js";
import { register, login } from "../../controllers/authController.js";

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
        name: "John",
        email: "john@test.com",
        password: "secret",
      },
    };

    const res = mockRes();

    User.findOne.mockResolvedValue({
      _id: "existing-id",
      email: "john@test.com",
    });

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "User already exists",
    });
    expect(User.create).not.toHaveBeenCalled();
  });

  it("looks up and stores the email in normalised form", async () => {
    const req = {
      body: { name: "John", email: "  John@Test.COM ", password: "secret" },
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

    expect(User.findOne).toHaveBeenCalledWith({ email: "john@test.com" });
    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: "john@test.com" }),
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("rejects an email that differs from an existing one only by case", async () => {
    const req = {
      body: { name: "John", email: "JOHN@test.com", password: "secret" },
    };
    const res = mockRes();

    User.findOne.mockImplementation(({ email }) =>
      Promise.resolve(
        email === "john@test.com" ? { _id: "existing-id", email } : null,
      ),
    );

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "User already exists" });
    expect(User.create).not.toHaveBeenCalled();
  });

  it("returns 500 on server error", async () => {
    const req = {
      body: {
        name: "John",
        email: "john@test.com",
        password: "secret",
      },
    };

    const res = mockRes();

    User.findOne.mockRejectedValue(new Error("Database connection failed"));

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Server error",
    });
  });

  it("returns 500 if User.create fails", async () => {
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
    User.create.mockRejectedValue(new Error("Validation failed"));

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Server error",
    });
  });
});

describe("authController - login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = "test-secret";
    jwt.sign.mockReturnValue("test-login-token");
  });

  it("logs in user with valid credentials and returns token", async () => {
    const req = {
      body: {
        email: "john@test.com",
        password: "correctPassword",
      },
    };

    const res = mockRes();

    const userData = {
      _id: "456",
      name: "John",
      email: "john@test.com",
      passwordHash: "hashed-password",
    };
    const mockUser = { ...userData, toObject: () => ({ ...userData }) };

    User.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);

    await login(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ email: "john@test.com" });
    expect(bcrypt.compare).toHaveBeenCalledWith(
      "correctPassword",
      "hashed-password",
    );
    expect(jwt.sign).toHaveBeenCalledWith({ id: "456" }, "test-secret", {
      expiresIn: "7d",
    });
    expect(res.json).toHaveBeenCalledWith({
      token: "test-login-token",
      user: { _id: "456", name: "John", email: "john@test.com" },
    });
  });

  it("finds the user by the normalised email", async () => {
    const req = { body: { email: " John@Test.COM", password: "correctPassword" } };
    const res = mockRes();

    const userData = {
      _id: "456",
      name: "John",
      email: "john@test.com",
      passwordHash: "hashed-password",
    };
    User.findOne.mockResolvedValue({ ...userData, toObject: () => ({ ...userData }) });
    bcrypt.compare.mockResolvedValue(true);

    await login(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ email: "john@test.com" });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ token: "test-login-token" }),
    );
  });

  it("returns 400 if user does not exist", async () => {
    const req = {
      body: {
        email: "nonexistent@test.com",
        password: "password",
      },
    };

    const res = mockRes();

    User.findOne.mockResolvedValue(null);

    await login(req, res);

    expect(User.findOne).toHaveBeenCalledWith({
      email: "nonexistent@test.com",
    });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid credentials",
    });
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  it("returns 400 if password is incorrect", async () => {
    const req = {
      body: {
        email: "john@test.com",
        password: "wrongPassword",
      },
    };

    const res = mockRes();

    const mockUser = {
      _id: "456",
      email: "john@test.com",
      passwordHash: "hashed-password",
    };

    User.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(false);

    await login(req, res);

    expect(bcrypt.compare).toHaveBeenCalledWith(
      "wrongPassword",
      "hashed-password",
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid credentials",
    });
    expect(jwt.sign).not.toHaveBeenCalled();
  });

  it("returns 500 on server error", async () => {
    const req = {
      body: {
        email: "john@test.com",
        password: "password",
      },
    };

    const res = mockRes();

    User.findOne.mockRejectedValue(new Error("Database error"));

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Server error",
    });
  });

  it("returns 500 if bcrypt.compare fails", async () => {
    const req = {
      body: {
        email: "john@test.com",
        password: "password",
      },
    };

    const res = mockRes();

    const mockUser = {
      _id: "456",
      email: "john@test.com",
      passwordHash: "hashed-password",
    };

    User.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockRejectedValue(new Error("bcrypt error"));

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Server error",
    });
  });
});
