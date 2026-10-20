import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { normalizeEmail } from "../utils/email.js";
import { sendError } from "../utils/httpError.js";
import { generateToken } from "../utils/generateToken.js";
import { emailProblem, nameProblem, passwordProblem } from "../utils/validation.js";
import * as userSearchService from "../services/userSearchService.js";
import { deleteUserData } from "../services/accountCleanupService.js";

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(500).json({ message: "Failed to fetch user" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const updateData = {};

    if (req.body.name !== undefined) {
      const problem = nameProblem(req.body.name);
      if (problem) return res.status(400).json({ message: problem });
      updateData.name = req.body.name.trim();
    }

    if (req.body.email !== undefined) {
      const email = normalizeEmail(req.body.email);
      const problem = emailProblem(email);
      if (problem) return res.status(400).json({ message: problem });

      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      // A new email takes over the login, so a stolen token alone mustn't be enough
      if (email !== user.email) {
        if (!req.body.currentPassword) {
          return res
            .status(400)
            .json({ message: "Enter your current password to change your email" });
        }
        if (!(await bcrypt.compare(req.body.currentPassword, user.passwordHash))) {
          return res.status(401).json({ message: "Current password is incorrect" });
        }
        if (await User.findOne({ email, _id: { $ne: userId } }).select("_id")) {
          return res.status(409).json({ message: "Email already in use" });
        }
        updateData.email = email;
      }
    }

    if (req.body.dateOfBirth !== undefined)
      updateData.dateOfBirth = req.body.dateOfBirth;
    if (req.body.sex !== undefined) updateData.sex = req.body.sex;
    if (req.body.height !== undefined) updateData.height = req.body.height;
    if (req.body.weight !== undefined) updateData.weight = req.body.weight;
    if (req.body.activityLevel !== undefined)
      updateData.activityLevel = req.body.activityLevel;

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User updated successfully", user });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ message: "User not found" });
    }
    if (error.name === "ValidationError") {
      // The model's own message (e.g. "Height must be between 50 and 300 cm")
      const [first] = Object.values(error.errors);
      return res.status(400).json({ message: first?.message ?? "Invalid profile data" });
    }
    if (error.code === 11000) {
      // Another account took the email between the check and the update
      return res.status(409).json({ message: "Email already in use" });
    }
    console.error("Failed to update user:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

/**
 * Deletes the account. The user's friendships, comments, routes and walk
 * participation are cleaned up first; if that fails, the account is kept so
 * the deletion can be retried instead of leaving data nobody can reach.
 */
export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    if (!(await User.exists({ _id: userId }))) {
      return res.status(404).json({ message: "User not found" });
    }

    await deleteUserData(userId);
    await User.findByIdAndDelete(userId);

    res.json({ message: "User deleted" });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ message: "User not found" });
    }
    console.error("Failed to delete user:", error);
    res.status(500).json({ message: "Failed to delete user" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.params.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current password and new password are required",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Current password is incorrect",
      });
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSamePassword) {
      return res.status(400).json({
        message: "New password must be different from current password",
      });
    }

    const problem = passwordProblem(newPassword);
    if (problem) {
      return res.status(400).json({ message: problem });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    user.passwordHash = newPasswordHash;
    // Logs out every other session: their tokens carry the old version
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    await user.save();

    const newToken = generateToken(user);

    res.json({
      message: "Password changed successfully",
      token: newToken,
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      message: "Failed to change password. Please try again.",
    });
  }
};

/**
 * Search other users by name or exact email, for adding friends
 */
export const searchUsers = async (req, res) => {
  try {
    const users = await userSearchService.searchUsers(req.user.id, req.query.q);
    res.json({ success: true, data: users });
  } catch (error) {
    sendError(res, error, "Failed to search users");
  }
};
