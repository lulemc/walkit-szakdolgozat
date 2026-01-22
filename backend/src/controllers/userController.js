import bcrypt from "bcryptjs";
import User from "../models/User.js";

export const getAllUsers = async (req, res) => {
  const users = await User.find().select("-passwordHash");
  res.json(users);
};

export const getUserById = async (req, res) => {
  const user = await User.findById(req.params.id).select("-passwordHash");

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json(user);
};

export const updateUser = async (req, res) => {
  const updateData = {};

  if (req.body.name) updateData.name = req.body.name;
  if (req.body.email) updateData.email = req.body.email;

  if (req.body.password) {
    updateData.passwordHash = await bcrypt.hash(req.body.password, 10);
  }

  const user = await User.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
  }).select("-passwordHash");

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json({ message: "User updated", user });
};

export const deleteUser = async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json({ message: "User deleted" });
};
