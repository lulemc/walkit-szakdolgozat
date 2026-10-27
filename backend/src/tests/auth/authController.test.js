import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../../models/User.js";
import { register, login } from "../../controllers/authController.js";
import { HttpError } from "../../utils/httpError.js";

vi.mock("bcryptjs");
vi.mock("jsonwebtoken");
vi.mock("../../models/User.js");

const mockRes = () => ({ status: vi.fn().mockReturnThis(), json: vi.fn() });

/** The controller rejects with an HttpError, which the error handler sends */
const expectHttpError = async (promise, status, message) => {
  const error = await promise.catch((e) => e);
  expect(error).toBeInstanceOf(HttpError);
  expect(error.status).toBe(status);
  expect(error.message).toBe(message);
};

const valid = { name: "John", email: "john@test.com", password: "secret123" };

beforeEach(() => {
  vi.clearAllMocks();
  process.env.JWT_SECRET = "test-secret";
  jwt.sign.mockReturnValue("test-token");
});

describe("authController - register", () => {
  it("registers the user and returns the token and public user", async () => {
    const res = mockRes();
    User.findOne.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue("hashed-password");
    User.create.mockResolvedValue({
      _id: "123",
      name: "John",
      email: "john@test.com",
      passwordHash: "hashed-password",
      tokenVersion: 0,
    });

    await register({ body: valid }, res);

    expect(bcrypt.hash).toHaveBeenCalledWith("secret123", 10);
    expect(User.create).toHaveBeenCalledWith({
      name: "John",
      email: "john@test.com",
      passwordHash: "hashed-password",
    });
    expect(jwt.sign).toHaveBeenCalledWith({ id: "123", tokenVersion: 0 }, "test-secret", { expiresIn: "7d" });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { token: "test-token", user: { _id: "123", name: "John", email: "john@test.com" } },
    });
  });

  it.each([
    ["name", { email: "john@test.com", password: "secret123" }],
    ["blank name", { name: "   ", email: "john@test.com", password: "secret123" }],
    ["email", { name: "John", password: "secret123" }],
    ["password", { name: "John", email: "john@test.com" }],
  ])("answers 400 without a %s", async (_missing, body) => {
    await expectHttpError(register({ body }, mockRes()), 400, "Name, email and password are required");
    expect(User.create).not.toHaveBeenCalled();
  });

  it.each([
    ["a short password", { ...valid, password: "1234567" }, "Password must be at least 8 characters long"],
    ["an invalid email", { ...valid, email: "john@test" }, "Please enter a valid email address"],
    ["a too long name", { ...valid, name: "a".repeat(51) }, "Name can be at most 50 characters"],
  ])("answers 400 for %s", async (_case, body, message) => {
    await expectHttpError(register({ body }, mockRes()), 400, message);
    expect(User.create).not.toHaveBeenCalled();
  });

  it("stores the name without surrounding spaces and the email in normalised form", async () => {
    User.findOne.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue("hashed-password");
    User.create.mockResolvedValue({ _id: "123", name: "John", email: "john@test.com" });

    await register({ body: { ...valid, name: "  John ", email: "  John@Test.COM " } }, mockRes());

    expect(User.findOne).toHaveBeenCalledWith({ email: "john@test.com" });
    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({ name: "John", email: "john@test.com" }));
  });

  it("answers 400 if the user already exists, also with a differently written email", async () => {
    User.findOne.mockResolvedValue({ _id: "existing-id", email: "john@test.com" });

    await expectHttpError(register({ body: { ...valid, email: "JOHN@test.com" } }, mockRes()), 400, "User already exists");
    expect(User.create).not.toHaveBeenCalled();
  });

  it("leaves unexpected errors to the error handler", async () => {
    User.findOne.mockRejectedValue(new Error("Database connection failed"));

    await expect(register({ body: valid }, mockRes())).rejects.toThrow("Database connection failed");
  });
});

describe("authController - login", () => {
  const stored = {
    _id: "456",
    name: "John",
    email: "john@test.com",
    passwordHash: "hashed-password",
    tokenVersion: 3,
  };

  it("logs in and returns the token and public user, without the password hash", async () => {
    const res = mockRes();
    User.findOne.mockResolvedValue({ ...stored, toObject: () => ({ ...stored }) });
    bcrypt.compare.mockResolvedValue(true);

    await login({ body: { email: " John@Test.COM", password: "correctPassword" } }, res);

    expect(User.findOne).toHaveBeenCalledWith({ email: "john@test.com" });
    expect(bcrypt.compare).toHaveBeenCalledWith("correctPassword", "hashed-password");
    expect(jwt.sign).toHaveBeenCalledWith({ id: "456", tokenVersion: 3 }, "test-secret", { expiresIn: "7d" });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { token: "test-token", user: { _id: "456", name: "John", email: "john@test.com" } },
    });
  });

  it("answers 400 for an unknown email, without checking a password", async () => {
    User.findOne.mockResolvedValue(null);

    await expectHttpError(login({ body: { email: "x@test.com", password: "pw" } }, mockRes()), 400, "Invalid credentials");
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  it("answers 400 for a wrong password, without a token", async () => {
    User.findOne.mockResolvedValue(stored);
    bcrypt.compare.mockResolvedValue(false);

    await expectHttpError(login({ body: { email: "john@test.com", password: "wrong" } }, mockRes()), 400, "Invalid credentials");
    expect(jwt.sign).not.toHaveBeenCalled();
  });

  it("answers 400 when email or password is missing", async () => {
    await expectHttpError(login({ body: { email: "john@test.com" } }, mockRes()), 400, "Email and password are required");
    expect(User.findOne).not.toHaveBeenCalled();
  });

  it("leaves unexpected errors to the error handler", async () => {
    User.findOne.mockRejectedValue(new Error("Database error"));

    await expect(login({ body: { email: "john@test.com", password: "pw" } }, mockRes())).rejects.toThrow("Database error");
  });
});
