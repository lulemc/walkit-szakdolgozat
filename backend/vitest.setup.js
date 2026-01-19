/* eslint-disable no-undef */
import mongoose from "mongoose";
import "dotenv/config";

afterAll(async () => {
  await mongoose.connection.close();
});
