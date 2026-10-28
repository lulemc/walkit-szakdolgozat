import mongoose from "mongoose";
import {
  NAME_MAX_LENGTH,
  NAME_REQUIRED_MESSAGE,
  NAME_TOO_LONG_MESSAGE,
} from "../utils/validation.js";

const HEIGHT_MESSAGE = "Height must be between 50 and 300 cm";
const WEIGHT_MESSAGE = "Weight must be between 20 and 500 kg";
const GOAL_MESSAGE = "The weekly goal must be between 1 and 200 km";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, NAME_REQUIRED_MESSAGE],
      trim: true,
      maxlength: [NAME_MAX_LENGTH, NAME_TOO_LONG_MESSAGE],
    },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    // Increased on every password change; tokens with an older version are rejected
    tokenVersion: { type: Number, default: 0 },
    dateOfBirth: { type: Date },
    sex: { type: String, enum: ["male", "female", "other"] },
    height: { type: Number, min: [50, HEIGHT_MESSAGE], max: [300, HEIGHT_MESSAGE] }, // in cm
    weight: { type: Number, min: [20, WEIGHT_MESSAGE], max: [500, WEIGHT_MESSAGE] }, // in kg
    activityLevel: {
      type: String,
      enum: ["sedentary", "light", "moderate", "active", "very_active"],
    },
    // How far the user wants to walk with WalkIt each week, shown on Statistics
    weeklyGoalKm: { type: Number, default: 10, min: [1, GOAL_MESSAGE], max: [200, GOAL_MESSAGE] },
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);
export default User;
