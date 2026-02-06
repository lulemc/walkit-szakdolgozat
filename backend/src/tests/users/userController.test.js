import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../../models/User.js";

import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  changePassword,
} from "../../controllers/userController.js";

/* ---------------- mocks ---------------- */

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

vi.mock("jsonwebtoken", () => ({
  default: {
    sign: vi.fn(),
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
      { new: true, runValidators: true },
    );

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "User updated successfully",
        user: expect.any(Object),
      }),
    );
  });

  it("updateUser updates only provided fields", async () => {
    const req = {
      params: { id: "123" },
      body: {
        name: "New Name",
        height: 180,
        weight: 75,
        activityLevel: "moderately_active",
      },
    };

    const res = mockRes();

    User.findByIdAndUpdate.mockReturnValue({
      select: vi.fn().mockResolvedValue({
        _id: "123",
        name: "New Name",
        height: 180,
        weight: 75,
        activityLevel: "moderately_active",
      }),
    });

    await updateUser(req, res);

    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      "123",
      {
        name: "New Name",
        height: 180,
        weight: 75,
        activityLevel: "moderately_active",
      },
      { new: true, runValidators: true },
    );

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "User updated successfully",
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

  it("updateUser returns 400 on validation error", async () => {
    const req = {
      params: { id: "123" },
      body: { activityLevel: "invalid_level" },
    };

    const res = mockRes();

    const validationError = new Error("Validation failed");

    User.findByIdAndUpdate.mockReturnValue({
      select: vi.fn().mockRejectedValue(validationError),
    });

    await updateUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Validation failed" });
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

  /* -------- changePassword -------- */

  it("changePassword successfully changes password and returns new token", async () => {
    const req = {
      params: { id: "123" },
      body: {
        currentPassword: "oldPassword123",
        newPassword: "newPassword456",
      },
    };

    const res = mockRes();

    const mockUser = {
      _id: "123",
      passwordHash: "old-hash",
      save: vi.fn().mockResolvedValue(true),
    };

    User.findById.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValueOnce(true); // current password is correct
    bcrypt.compare.mockResolvedValueOnce(false); // new password is different
    bcrypt.hash.mockResolvedValue("new-hash");
    jwt.sign.mockReturnValue("new-jwt-token");

    await changePassword(req, res);

    expect(User.findById).toHaveBeenCalledWith("123");
    expect(bcrypt.compare).toHaveBeenCalledWith("oldPassword123", "old-hash");
    expect(bcrypt.compare).toHaveBeenCalledWith("newPassword456", "old-hash");
    expect(bcrypt.hash).toHaveBeenCalledWith("newPassword456", 10);
    expect(mockUser.save).toHaveBeenCalled();
    expect(jwt.sign).toHaveBeenCalledWith(
      { id: "123" },
      process.env.JWT_SECRET,
      { expiresIn: "30d" },
    );
    expect(res.json).toHaveBeenCalledWith({
      message: "Password changed successfully",
      token: "new-jwt-token",
    });
  });

  it("changePassword returns 400 if passwords are missing", async () => {
    const req = {
      params: { id: "123" },
      body: {
        currentPassword: "oldPassword123",
        // newPassword is missing
      },
    };

    const res = mockRes();

    await changePassword(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Current password and new password are required",
    });
  });

  it("changePassword returns 404 if user not found", async () => {
    const req = {
      params: { id: "123" },
      body: {
        currentPassword: "oldPassword123",
        newPassword: "newPassword456",
      },
    };

    const res = mockRes();

    User.findById.mockResolvedValue(null);

    await changePassword(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
  });

  it("changePassword returns 401 if current password is incorrect", async () => {
    const req = {
      params: { id: "123" },
      body: {
        currentPassword: "wrongPassword",
        newPassword: "newPassword456",
      },
    };

    const res = mockRes();

    const mockUser = {
      _id: "123",
      passwordHash: "old-hash",
    };

    User.findById.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValueOnce(false); // current password is incorrect

    await changePassword(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Current password is incorrect",
    });
  });

  it("changePassword returns 400 if new password is same as current", async () => {
    const req = {
      params: { id: "123" },
      body: {
        currentPassword: "password123",
        newPassword: "password123",
      },
    };

    const res = mockRes();

    const mockUser = {
      _id: "123",
      passwordHash: "hash",
    };

    User.findById.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValueOnce(true); // current password is correct
    bcrypt.compare.mockResolvedValueOnce(true); // new password is same

    await changePassword(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "New password must be different from current password",
    });
  });

  it("changePassword returns 400 if new password is too short", async () => {
    const req = {
      params: { id: "123" },
      body: {
        currentPassword: "oldPassword123",
        newPassword: "short",
      },
    };

    const res = mockRes();

    const mockUser = {
      _id: "123",
      passwordHash: "old-hash",
    };

    User.findById.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValueOnce(true); // current password is correct
    bcrypt.compare.mockResolvedValueOnce(false); // new password is different

    await changePassword(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Password must be at least 8 characters long",
    });
  });

  it("changePassword returns 500 on unexpected error", async () => {
    const req = {
      params: { id: "123" },
      body: {
        currentPassword: "oldPassword123",
        newPassword: "newPassword456",
      },
    };

    const res = mockRes();
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    User.findById.mockRejectedValue(new Error("Database error"));

    await changePassword(req, res);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Change password error:",
      expect.any(Error),
    );
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Failed to change password. Please try again.",
    });

    consoleErrorSpy.mockRestore();
  });
});
