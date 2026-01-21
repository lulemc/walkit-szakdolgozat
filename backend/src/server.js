import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import app from "./app.js";
import "@dotenvx/dotenvx/config";

export function startServer() {
  dotenv.config();
  connectDB();

  const PORT = process.env.PORT || 4000;

  return app.listen(PORT, "0.0.0.0", () =>
    console.log(`🚀 Server running on port ${PORT}`),
  );
}

startServer();
//192.168.0.103
