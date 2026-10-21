import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../../models/User.js";
import { deleteUserData } from "../../services/accountCleanupService.js";

import {
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

vi.mock("../../services/accountCleanupService.js", () => ({
  deleteUserData: vi.fn(),
}));

vi.mock("../../models/User.js", () => ({
  default: {
    find: vi.fn(),
    findOne: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findByIdAndDelete: vi.fn(),
    exists: vi.fn(),
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

  it("getUserById returns 404 for an invalid id", async () => {
    const req = { params: { id: "not-an-id" } };
    const res = mockRes();

    const castError = new Error("Cast to ObjectId failed");
    castError.name = "CastError";
    User.findById.mockReturnValue({
      select: vi.fn().mockRejectedValue(castError),
    });

    await getUserById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
  });

  /* -------- updateUser -------- */

  it("updateUser ignores password in the request body", async () => {
    const req = {
      params: { id: "123" },
      body: { name: "New Name", password: "newpass" },
    };

    const res = mockRes();

    User.findByIdAndUpdate.mockReturnValue({
      select: vi.fn().mockResolvedValue({
        _id: "123",
        name: "New Name",
      }),
    });

    await updateUser(req, res);

    expect(bcrypt.hash).not.toHaveBeenCalled();

    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      "123",
      { name: "New Name" },
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

  /* -------- updateUser: email -------- */

  const currentUser = { _id: "123", email: "old@example.com", passwordHash: "hash" };
  const emailChange = (body) => ({ params: { id: "123" }, body });

  const givenEmailChangeContext = ({ passwordOk = true, takenBy = null } = {}) => {
    User.findById.mockResolvedValue(currentUser);
    bcrypt.compare.mockResolvedValue(passwordOk);
    User.findOne.mockReturnValue({ select: vi.fn().mockResolvedValue(takenBy) });
    User.findByIdAndUpdate.mockReturnValue({
      select: vi.fn().mockResolvedValue({ _id: "123", email: "new.mail@example.com" }),
    });
  };

  it("updateUser changes the email in normalised form after checking the current password", async () => {
    givenEmailChangeContext();
    const res = mockRes();

    await updateUser(
      emailChange({ email: "  New.Mail@Example.COM ", currentPassword: "secret123" }),
      res,
    );

    expect(bcrypt.compare).toHaveBeenCalledWith("secret123", "hash");
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      "123",
      { email: "new.mail@example.com" },
      { new: true, runValidators: true },
    );
  });

  it("updateUser asks for the current password before changing the email", async () => {
    givenEmailChangeContext();
    const res = mockRes();

    await updateUser(emailChange({ email: "new@example.com" }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Enter your current password to change your email",
    });
    expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it("updateUser refuses an email change with the wrong password", async () => {
    givenEmailChangeContext({ passwordOk: false });
    const res = mockRes();

    await updateUser(emailChange({ email: "new@example.com", currentPassword: "nope" }), res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Current password is incorrect" });
    expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it("updateUser answers 409 when another account uses the email", async () => {
    givenEmailChangeContext({ takenBy: { _id: "456" } });
    const res = mockRes();

    await updateUser(emailChange({ email: "taken@example.com", currentPassword: "secret123" }), res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ message: "Email already in use" });
    expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it("updateUser answers 409 when the email is taken at the same moment (unique index)", async () => {
    givenEmailChangeContext();
    User.findByIdAndUpdate.mockReturnValue({
      select: vi.fn().mockRejectedValue(Object.assign(new Error("E11000 duplicate key"), { code: 11000 })),
    });
    const res = mockRes();

    await updateUser(emailChange({ email: "taken@example.com", currentPassword: "secret123" }), res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ message: "Email already in use" });
  });

  it("updateUser rejects an invalid email", async () => {
    givenEmailChangeContext();
    const res = mockRes();

    await updateUser(emailChange({ email: "not-an-email", currentPassword: "secret123" }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Please enter a valid email address" });
  });

  it("updateUser doesn't ask for the password when the email stays the same", async () => {
    givenEmailChangeContext();
    const res = mockRes();

    await updateUser(emailChange({ email: "OLD@example.com", name: "Ann" }), res);

    expect(bcrypt.compare).not.toHaveBeenCalled();
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      "123",
      { name: "Ann" },
      { new: true, runValidators: true },
    );
  });

  it("updateUser rejects an empty name", async () => {
    const res = mockRes();

    await updateUser({ params: { id: "123" }, body: { name: "   " } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Name can't be empty" });
    expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
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

  it("updateUser returns 400 with the validation message, not Mongoose's text", async () => {
    const req = { params: { id: "123" }, body: { height: 20 } };
    const res = mockRes();
    const validationError = Object.assign(
      new Error("Validation failed: height: Path `height` (20) is less than minimum allowed value (50)."),
      { name: "ValidationError", errors: { height: { message: "Height must be between 50 and 300 cm" } } },
    );
    User.findByIdAndUpdate.mockReturnValue({ select: vi.fn().mockRejectedValue(validationError) });

    await updateUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Height must be between 50 and 300 cm" });
  });

  it("updateUser returns 404 for an invalid id", async () => {
    const res = mockRes();
    User.findByIdAndUpdate.mockReturnValue({
      select: vi.fn().mockRejectedValue(Object.assign(new Error("Cast to ObjectId failed"), { name: "CastError" })),
    });

    await updateUser({ params: { id: "nope" }, body: { name: "Ann" } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("updateUser hides unexpected errors behind a generic message", async () => {
    const res = mockRes();
    User.findByIdAndUpdate.mockReturnValue({
      select: vi.fn().mockRejectedValue(new Error("connection reset by mongod at 10.0.0.5")),
    });

    await updateUser({ params: { id: "123" }, body: { name: "Ann" } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Failed to update profile" });
  });

  /* -------- deleteUser -------- */

  it("deleteUser cleans up the user's social data, then deletes the account", async () => {
    const req = { params: { id: "123" } };
    const res = mockRes();
    const order = [];
    User.exists.mockResolvedValue({ _id: "123" });
    deleteUserData.mockImplementation(async () => order.push("cleanup"));
    User.findByIdAndDelete.mockImplementation(async () => order.push("delete"));

    await deleteUser(req, res);

    expect(User.exists).toHaveBeenCalledWith({ _id: "123" });
    expect(deleteUserData).toHaveBeenCalledWith("123");
    expect(User.findByIdAndDelete).toHaveBeenCalledWith("123");
    expect(order).toEqual(["cleanup", "delete"]);
    expect(res.json).toHaveBeenCalledWith({ message: "User deleted" });
  });

  it("deleteUser returns 404 if user not found, without cleaning anything up", async () => {
    const req = { params: { id: "123" } };
    const res = mockRes();
    User.exists.mockResolvedValue(null);

    await deleteUser(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
    expect(deleteUserData).not.toHaveBeenCalled();
    expect(User.findByIdAndDelete).not.toHaveBeenCalled();
  });

  it("deleteUser keeps the account if the cleanup fails, so it can be retried", async () => {
    const req = { params: { id: "123" } };
    const res = mockRes();
    vi.spyOn(console, "error").mockImplementation(() => {});
    User.exists.mockResolvedValue({ _id: "123" });
    deleteUserData.mockRejectedValue(new Error("connection lost"));

    await deleteUser(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Failed to delete user" });
    expect(User.findByIdAndDelete).not.toHaveBeenCalled();
  });

  it("deleteUser returns 404 for an invalid id", async () => {
    const req = { params: { id: "not-an-id" } };
    const res = mockRes();

    const castError = new Error("Cast to ObjectId failed");
    castError.name = "CastError";
    User.exists.mockRejectedValue(castError);

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
      tokenVersion: 4,
      save: vi.fn().mockResolvedValue(true),
    };

    User.findById.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValueOnce(true);
    bcrypt.compare.mockResolvedValueOnce(false);
    bcrypt.hash.mockResolvedValue("new-hash");
    jwt.sign.mockReturnValue("new-jwt-token");

    await changePassword(req, res);

    expect(User.findById).toHaveBeenCalledWith("123");
    expect(bcrypt.compare).toHaveBeenCalledWith("oldPassword123", "old-hash");
    expect(bcrypt.compare).toHaveBeenCalledWith("newPassword456", "old-hash");
    expect(bcrypt.hash).toHaveBeenCalledWith("newPassword456", 10);
    expect(mockUser.save).toHaveBeenCalled();
    // A new version makes every token issued before the change invalid
    expect(mockUser.tokenVersion).toBe(5);
    expect(jwt.sign).toHaveBeenCalledWith(
      { id: "123", tokenVersion: 5 },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
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
    bcrypt.compare.mockResolvedValueOnce(true);
    bcrypt.compare.mockResolvedValueOnce(true);

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
    bcrypt.compare.mockResolvedValueOnce(true);
    bcrypt.compare.mockResolvedValueOnce(false);

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
