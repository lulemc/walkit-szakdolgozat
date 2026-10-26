import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/User.js";
import { normalizeEmail } from "../utils/email.js";
import { generateToken } from "../utils/generateToken.js";
import { HttpError } from "../utils/httpError.js";
import { toPublicUser } from "../utils/publicUser.js";
import { emailProblem, nameProblem, passwordProblem } from "../utils/validation.js";
import * as userSearchService from "../services/userSearchService.js";
import { deleteUserData } from "../services/accountCleanupService.js";

// Errors are thrown and turned into responses by middleware/errorHandler.js

const userNotFound = () => new HttpError(404, "User not found");

/** An id that can't exist is "not found" as well */
const userIdOf = (req) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw userNotFound();
  return req.params.id;
};

const PROFILE_FIELDS = ["dateOfBirth", "sex", "height", "weight", "activityLevel"];

export const getUserById = async (req, res) => {
  const user = await User.findById(userIdOf(req)).select("-passwordHash");
  if (!user) throw userNotFound();

  res.json({ success: true, data: toPublicUser(user) });
};

export const updateUser = async (req, res) => {
  const userId = userIdOf(req);
  const updateData = {};

  if (req.body.name !== undefined) {
    const problem = nameProblem(req.body.name);
    if (problem) throw new HttpError(400, problem);
    updateData.name = req.body.name.trim();
  }

  if (req.body.email !== undefined) {
    const email = normalizeEmail(req.body.email);
    const problem = emailProblem(email);
    if (problem) throw new HttpError(400, problem);

    const user = await User.findById(userId);
    if (!user) throw userNotFound();

    // A new email takes over the login, so a stolen token alone mustn't be enough
    if (email !== user.email) {
      if (!req.body.currentPassword) {
        throw new HttpError(400, "Enter your current password to change your email");
      }
      if (!(await bcrypt.compare(req.body.currentPassword, user.passwordHash))) {
        throw new HttpError(401, "Current password is incorrect");
      }
      if (await User.findOne({ email, _id: { $ne: userId } }).select("_id")) {
        throw new HttpError(409, "Email already in use");
      }
      updateData.email = email;
    }
  }

  for (const field of PROFILE_FIELDS) {
    if (req.body[field] !== undefined) updateData[field] = req.body[field];
  }

  let user;
  try {
    user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-passwordHash");
  } catch (error) {
    // Another account took the email between the check and the update
    if (error.code === 11000) throw new HttpError(409, "Email already in use");
    throw error;
  }
  if (!user) throw userNotFound();

  res.json({ success: true, message: "User updated successfully", data: toPublicUser(user) });
};

/**
 * Deletes the account. The user's friendships, comments, routes, walks and
 * walk participation are cleaned up first; if that fails, the account is kept
 * so the deletion can be retried instead of leaving data nobody can reach.
 */
export const deleteUser = async (req, res) => {
  const userId = userIdOf(req);
  if (!(await User.exists({ _id: userId }))) throw userNotFound();

  await deleteUserData(userId);
  await User.findByIdAndDelete(userId);

  res.json({ success: true, message: "User deleted" });
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw new HttpError(400, "Current password and new password are required");
  }

  const user = await User.findById(userIdOf(req));
  if (!user) throw userNotFound();

  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw new HttpError(401, "Current password is incorrect");
  }
  if (await bcrypt.compare(newPassword, user.passwordHash)) {
    throw new HttpError(400, "New password must be different from current password");
  }
  const problem = passwordProblem(newPassword);
  if (problem) throw new HttpError(400, problem);

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  // Logs out every other session: their tokens carry the old version
  user.tokenVersion = (user.tokenVersion ?? 0) + 1;
  await user.save();

  res.json({
    success: true,
    message: "Password changed successfully",
    data: { token: generateToken(user) },
  });
};

/**
 * Search other users by name or exact email, for adding friends
 */
export const searchUsers = async (req, res) => {
  const users = await userSearchService.searchUsers(req.user.id, req.query.q);
  res.json({ success: true, data: users });
};
