import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import User from "../../models/User.js";

import {
  registerUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../../controllers/userController.js";

/* ---------------- mocks ---------------- */

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(),
  },
}));

vi.mock("../../models/User.js", () => ({
  default: {
    create: vi.fn(),
    find: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findByIdAndDelete: vi.fn(),
  },
}));

const mockedUser = vi.mocked(User);

/* ---------------- helpers ---------------- */

const mockRes = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn(),
});

/* ---------------- tests ---------------- */

describe("User controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /* -------- registerUser -------- */

  it("registerUser creates user and returns 201", async () => {
    const req = {
      body: {
        name: "John",
        email: "john@test.com",
        password: "secret",
      },
    };

    const res = mockRes();

    bcrypt.hash.mockResolvedValue("hashed-password");

    mockedUser.create.mockResolvedValue({
      id: "123",
      name: "John",
      email: "john@test.com",
    });

    await registerUser(req, res);

    expect(bcrypt.hash).toHaveBeenCalledWith("secret", 10);
    expect(mockedUser.create).toHaveBeenCalledWith({
      name: "John",
      email: "john@test.com",
      passwordHash: "hashed-password",
    });

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: "User created",
      token: expect.any(String),
      user: expect.objectContaining({
        name: "John",
        email: "john@test.com",
      }),
    });
  });

  /* -------- getAllUsers -------- */

  it("getAllUsers returns users without passwordHash", async () => {
    const req = {};
    const res = mockRes();

    const users = [{ id: "1" }, { id: "2" }];

    mockedUser.find.mockReturnValue({
      select: vi.fn().mockResolvedValue(users),
    });

    await getAllUsers(req, res);

    expect(mockedUser.find).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(users);
  });

  /* -------- getUserById -------- */

  it("getUserById returns user when found", async () => {
    const req = { params: { id: "123" } };
    const res = mockRes();

    const user = { id: "123", name: "Jane" };

    mockedUser.findById.mockReturnValue({
      select: vi.fn().mockResolvedValue(user),
    });

    await getUserById(req, res);

    expect(mockedUser.findById).toHaveBeenCalledWith("123");
    expect(res.json).toHaveBeenCalledWith(user);
  });

  it("getUserById returns 404 if user not found", async () => {
    const req = { params: { id: "123" } };
    const res = mockRes();

    mockedUser.findById.mockReturnValue({
      select: vi.fn().mockResolvedValue(null),
    });

    await getUserById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
  });

  /* -------- updateUser -------- */

  it("updateUser updates user with hashed password", async () => {
    const req = {
      params: { id: "123" },
      body: { name: "New Name", password: "newpass" },
    };

    const res = mockRes();

    bcrypt.hash.mockResolvedValue("new-hash");

    mockedUser.findByIdAndUpdate.mockReturnValue({
      select: vi.fn().mockResolvedValue({
        id: "123",
        name: "New Name",
      }),
    });

    await updateUser(req, res);

    expect(bcrypt.hash).toHaveBeenCalledWith("newpass", 10);
    expect(mockedUser.findByIdAndUpdate).toHaveBeenCalledWith(
      "123",
      {
        name: "New Name",
        passwordHash: "new-hash",
      },
      { new: true },
    );

    expect(res.json).toHaveBeenCalledWith({
      message: "User updated successfully",
      user: expect.any(Object),
    });
  });

  it("updateUser returns 404 if user not found", async () => {
    const req = {
      params: { id: "123" },
      body: { name: "Test" },
    };

    const res = mockRes();

    mockedUser.findByIdAndUpdate.mockReturnValue({
      select: vi.fn().mockResolvedValue(null),
    });

    await updateUser(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
  });

  /* -------- deleteUser -------- */

  it("deleteUser deletes user successfully", async () => {
    const req = { params: { id: "123" } };
    const res = mockRes();

    mockedUser.findByIdAndDelete.mockResolvedValue({ id: "123" });

    await deleteUser(req, res);

    expect(mockedUser.findByIdAndDelete).toHaveBeenCalledWith("123");
    expect(res.json).toHaveBeenCalledWith({
      message: "User deleted successfully",
    });
  });

  it("deleteUser returns 404 if user not found", async () => {
    const req = { params: { id: "123" } };
    const res = mockRes();

    mockedUser.findByIdAndDelete.mockResolvedValue(null);

    await deleteUser(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
  });
});
