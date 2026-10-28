import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../../models/User.js";
import { deleteUserData } from "../../services/accountCleanupService.js";
import { HttpError } from "../../utils/httpError.js";
import { getUserById, updateUser, deleteUser, changePassword } from "../../controllers/userController.js";

vi.mock("bcryptjs", () => ({ default: { hash: vi.fn(), compare: vi.fn() } }));
vi.mock("jsonwebtoken", () => ({ default: { sign: vi.fn() } }));
vi.mock("../../services/accountCleanupService.js", () => ({ deleteUserData: vi.fn() }));
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

const ID = "64b7f0c2a1b2c3d4e5f60718";
const mockRes = () => ({ status: vi.fn().mockReturnThis(), json: vi.fn() });
const expectHttpError = async (promise, status, message) => {
  const error = await promise.catch((e) => e);
  expect(error).toBeInstanceOf(HttpError);
  expect(error.status).toBe(status);
  expect(error.message).toBe(message);
};
const selectResolving = (value) => ({ select: vi.fn().mockResolvedValue(value) });
const selectRejecting = (error) => ({ select: vi.fn().mockRejectedValue(error) });
const stored = { _id: ID, name: "Jane", email: "jane@example.com", passwordHash: "hash", tokenVersion: 1 };

beforeEach(() => {
  vi.clearAllMocks();
});

/* ---------------- getUserById ---------------- */

describe("getUserById", () => {
  it("returns the public user", async () => {
    User.findById.mockReturnValue(selectResolving(stored));
    const res = mockRes();

    await getUserById({ params: { id: ID } }, res);

    expect(User.findById).toHaveBeenCalledWith(ID);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { _id: ID, name: "Jane", email: "jane@example.com" },
    });
  });

  it("answers 404 for an unknown user or an id that can't exist", async () => {
    User.findById.mockReturnValue(selectResolving(null));

    await expectHttpError(getUserById({ params: { id: ID } }, mockRes()), 404, "User not found");
    User.findById.mockClear();
    await expectHttpError(getUserById({ params: { id: "not-an-id" } }, mockRes()), 404, "User not found");
    // Answered without a database query
    expect(User.findById).not.toHaveBeenCalled();
  });
});

/* ---------------- updateUser ---------------- */

describe("updateUser", () => {
  it("updates only the given profile fields and ignores a password", async () => {
    User.findByIdAndUpdate.mockReturnValue(selectResolving({ ...stored, name: "New Name", height: 180 }));
    const res = mockRes();

    await updateUser(
      { params: { id: ID }, body: { name: "New Name", password: "newpass", height: 180, weight: 75, activityLevel: "active", weeklyGoalKm: 20 } },
      res,
    );

    expect(bcrypt.hash).not.toHaveBeenCalled();
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      ID,
      { name: "New Name", height: 180, weight: 75, activityLevel: "active", weeklyGoalKm: 20 },
      { new: true, runValidators: true },
    );
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "User updated successfully",
      data: { _id: ID, name: "New Name", email: "jane@example.com", height: 180 },
    });
  });

  it("answers 404 for an unknown user or an id that can't exist", async () => {
    User.findByIdAndUpdate.mockReturnValue(selectResolving(null));

    await expectHttpError(updateUser({ params: { id: ID }, body: { name: "Ann" } }, mockRes()), 404, "User not found");
    await expectHttpError(updateUser({ params: { id: "nope" }, body: { name: "Ann" } }, mockRes()), 404, "User not found");
  });

  it("rejects an empty name", async () => {
    await expectHttpError(updateUser({ params: { id: ID }, body: { name: "   " } }, mockRes()), 400, "Name can't be empty");
    expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it("leaves the model's validation errors to the error handler (which sends their message)", async () => {
    const validationError = Object.assign(new Error("Validation failed"), {
      name: "ValidationError",
      errors: { height: { message: "Height must be between 50 and 300 cm" } },
    });
    User.findByIdAndUpdate.mockReturnValue(selectRejecting(validationError));

    await expect(updateUser({ params: { id: ID }, body: { height: 20 } }, mockRes())).rejects.toBe(validationError);
  });

  describe("changing the email", () => {
    const givenEmailChangeContext = ({ passwordOk = true, takenBy = null } = {}) => {
      User.findById.mockResolvedValue({ _id: ID, email: "old@example.com", passwordHash: "hash" });
      bcrypt.compare.mockResolvedValue(passwordOk);
      User.findOne.mockReturnValue(selectResolving(takenBy));
      User.findByIdAndUpdate.mockReturnValue(selectResolving({ ...stored, email: "new.mail@example.com" }));
    };
    const change = (body) => updateUser({ params: { id: ID }, body }, mockRes());

    it("stores it in normalised form after checking the current password", async () => {
      givenEmailChangeContext();

      await change({ email: "  New.Mail@Example.COM ", currentPassword: "secret123" });

      expect(bcrypt.compare).toHaveBeenCalledWith("secret123", "hash");
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        ID,
        { email: "new.mail@example.com" },
        { new: true, runValidators: true },
      );
    });

    it("asks for the current password", async () => {
      givenEmailChangeContext();

      await expectHttpError(change({ email: "new@example.com" }), 400, "Enter your current password to change your email");
      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("refuses a wrong password", async () => {
      givenEmailChangeContext({ passwordOk: false });

      await expectHttpError(change({ email: "new@example.com", currentPassword: "nope" }), 401, "Current password is incorrect");
      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("answers 409 when another account uses it", async () => {
      givenEmailChangeContext({ takenBy: { _id: "456" } });

      await expectHttpError(change({ email: "taken@example.com", currentPassword: "secret123" }), 409, "Email already in use");
    });

    it("answers 409 when it's taken at the same moment (unique index)", async () => {
      givenEmailChangeContext();
      User.findByIdAndUpdate.mockReturnValue(
        selectRejecting(Object.assign(new Error("E11000 duplicate key"), { code: 11000 })),
      );

      await expectHttpError(change({ email: "taken@example.com", currentPassword: "secret123" }), 409, "Email already in use");
    });

    it("rejects an invalid email", async () => {
      givenEmailChangeContext();

      await expectHttpError(change({ email: "not-an-email", currentPassword: "secret123" }), 400, "Please enter a valid email address");
    });

    it("doesn't ask for the password when the email stays the same", async () => {
      givenEmailChangeContext();

      await change({ email: "OLD@example.com", name: "Ann" });

      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(ID, { name: "Ann" }, { new: true, runValidators: true });
    });
  });
});

/* ---------------- deleteUser ---------------- */

describe("deleteUser", () => {
  it("cleans up the user's data, then deletes the account", async () => {
    const order = [];
    User.exists.mockResolvedValue({ _id: ID });
    deleteUserData.mockImplementation(async () => order.push("cleanup"));
    User.findByIdAndDelete.mockImplementation(async () => order.push("delete"));
    const res = mockRes();

    await deleteUser({ params: { id: ID } }, res);

    expect(deleteUserData).toHaveBeenCalledWith(ID);
    expect(User.findByIdAndDelete).toHaveBeenCalledWith(ID);
    expect(order).toEqual(["cleanup", "delete"]);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: "User deleted" });
  });

  it("answers 404 for an unknown user or an invalid id, without cleaning anything up", async () => {
    User.exists.mockResolvedValue(null);

    await expectHttpError(deleteUser({ params: { id: ID } }, mockRes()), 404, "User not found");
    await expectHttpError(deleteUser({ params: { id: "nope" } }, mockRes()), 404, "User not found");
    expect(deleteUserData).not.toHaveBeenCalled();
  });

  it("keeps the account if the cleanup fails, so it can be retried", async () => {
    User.exists.mockResolvedValue({ _id: ID });
    deleteUserData.mockRejectedValue(new Error("connection lost"));

    await expect(deleteUser({ params: { id: ID } }, mockRes())).rejects.toThrow("connection lost");
    expect(User.findByIdAndDelete).not.toHaveBeenCalled();
  });
});

/* ---------------- changePassword ---------------- */

describe("changePassword", () => {
  const request = (body) => ({ params: { id: ID }, body });
  const givenUser = () => {
    const user = { _id: ID, passwordHash: "old-hash", tokenVersion: 4, save: vi.fn().mockResolvedValue(true) };
    User.findById.mockResolvedValue(user);
    return user;
  };

  it("changes the password, logs out other sessions and returns a new token", async () => {
    const user = givenUser();
    bcrypt.compare.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    bcrypt.hash.mockResolvedValue("new-hash");
    jwt.sign.mockReturnValue("new-jwt-token");
    const res = mockRes();

    await changePassword(request({ currentPassword: "oldPassword123", newPassword: "newPassword456" }), res);

    expect(bcrypt.compare).toHaveBeenCalledWith("oldPassword123", "old-hash");
    expect(bcrypt.hash).toHaveBeenCalledWith("newPassword456", 10);
    expect(user.passwordHash).toBe("new-hash");
    // A new version makes every token issued before the change invalid
    expect(user.tokenVersion).toBe(5);
    expect(user.save).toHaveBeenCalled();
    expect(jwt.sign).toHaveBeenCalledWith({ id: ID, tokenVersion: 5 }, process.env.JWT_SECRET, { expiresIn: "7d" });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Password changed successfully",
      data: { token: "new-jwt-token" },
    });
  });

  it("answers 400 if a password is missing", async () => {
    await expectHttpError(changePassword(request({ currentPassword: "x" }), mockRes()), 400, "Current password and new password are required");
  });

  it("answers 404 for an unknown user", async () => {
    User.findById.mockResolvedValue(null);

    await expectHttpError(changePassword(request({ currentPassword: "a", newPassword: "newPassword456" }), mockRes()), 404, "User not found");
  });

  it("answers 401 for a wrong current password", async () => {
    givenUser();
    bcrypt.compare.mockResolvedValueOnce(false);

    await expectHttpError(changePassword(request({ currentPassword: "wrong", newPassword: "newPassword456" }), mockRes()), 401, "Current password is incorrect");
  });

  it("answers 400 if the new password is the current one", async () => {
    givenUser();
    bcrypt.compare.mockResolvedValueOnce(true).mockResolvedValueOnce(true);

    await expectHttpError(changePassword(request({ currentPassword: "same1234", newPassword: "same1234" }), mockRes()), 400, "New password must be different from current password");
  });

  it("answers 400 if the new password is too short", async () => {
    givenUser();
    bcrypt.compare.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    await expectHttpError(changePassword(request({ currentPassword: "oldPassword123", newPassword: "short" }), mockRes()), 400, "Password must be at least 8 characters long");
  });
});
