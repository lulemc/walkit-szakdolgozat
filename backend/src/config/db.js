import mongoose from "mongoose";
import { logger } from "../utils/logger.js";

/** Connects to MongoDB; rejects when it can't (the server then stops, see server.js) */
export const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI, { dbName: "walkit" });
  logger.info("MongoDB connected");
};
