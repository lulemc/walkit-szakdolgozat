/* eslint-disable no-undef */
import mongoose from "mongoose";
import "dotenv/config";

beforeAll(async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI not defined");
  }

  await mongoose.connect(process.env.MONGO_URI);
});

afterAll(async () => {
  await mongoose.connection.close();
});
