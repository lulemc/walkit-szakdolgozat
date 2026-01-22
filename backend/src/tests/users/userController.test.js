import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import User from "../../models/User.js";

import {
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
    find: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findByIdAndDelete: vi.fn(),
  },
}));

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

  /* -------- getAllUsers -------- */

  it("getAllUsers returns users without passwordHash", async () => {
    const req = {};
    const res = mockRes();

    const users = [{ _id: "1" }, { _id: "2" }];

    User.find.mockReturnValue({
      select: vi.fn().mockResolvedValue(users),
    });

    await getAllUsers(req, res);

    expect(User.find).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(users);
  });

  /* -------- getUserById -------- */

  it("getUserById returns user when found", async () => {
    const req = { params: { id: "123" } };
    const res = mockRes();

    const user = { _id: "123", name: "Jane" };

    User.findById.mockReturnValue({
      select: vi.fn().mockResolvedValue(user),
    });

    await getUserById(req, res);

    expect(User.findById).toHaveBeenCalledWith("123");
    expect(res.json).toHaveBeenCalledWith(user);
  });

  it("getUserById returns 404 if user not found", async () => {
    const req = { params: { id: "123" } };
    const res = mockRes();

    User.findById.mockReturnValue({
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

    User.findByIdAndUpdate.mockReturnValue({
      select: vi.fn().mockResolvedValue({
        _id: "123",
        name: "New Name",
      }),
    });

    await updateUser(req, res);

    expect(bcrypt.hash).toHaveBeenCalledWith("newpass", 10);

    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      "123",
      {
        name: "New Name",
        passwordHash: "new-hash",
      },
      { new: true },
    );

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "User updated",
        user: expect.any(Object),
      }),
    );
  });

  it("updateUser returns 404 if user not found", async () => {
    const req = {
      params: { id: "123" },
      body: { name: "Test" },
    };

    const res = mockRes();

    User.findByIdAndUpdate.mockReturnValue({
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

    User.findByIdAndDelete.mockResolvedValue({ _id: "123" });

    await deleteUser(req, res);

    expect(User.findByIdAndDelete).toHaveBeenCalledWith("123");
    expect(res.json).toHaveBeenCalledWith({ message: "User deleted" });
  });

  it("deleteUser returns 404 if user not found", async () => {
    const req = { params: { id: "123" } };
    const res = mockRes();

    User.findByIdAndDelete.mockResolvedValue(null);

    await deleteUser(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
  });
});
