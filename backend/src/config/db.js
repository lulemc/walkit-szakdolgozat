import mongoose from "mongoose";
import { logger } from "../utils/logger.js";

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: "walkit",
    });
    logger.info("MongoDB connected");
  } catch (err) {
    logger.error("MongoDB connection failed:", err);
    process.exit(1);
  }
};
