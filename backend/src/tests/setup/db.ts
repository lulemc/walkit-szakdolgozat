import mongoose from "mongoose";

export const connectTestDB = async () => {
  if (mongoose.connection.readyState === 1) return;

  await mongoose.connect("mongodb://127.0.0.1:27017/app_test");
};

export const disconnectTestDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
};
