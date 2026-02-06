import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    passwordHash: String,
    dateOfBirth: { type: Date },
    sex: { type: String, enum: ["male", "female", "other"] },
    height: { type: Number }, // in cm
    weight: { type: Number }, // in kg
    activityLevel: {
      type: String,
      enum: ["sedentary", "light", "moderate", "active", "very_active"],
    },
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);
export default User;
