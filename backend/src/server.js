import "./config/env.js";

import { pathToFileURL } from "node:url";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import app from "./app.js";
import { logger } from "./utils/logger.js";

/** How long open requests may take to finish when the server is told to stop */
export const SHUTDOWN_TIMEOUT_MS = 10_000;

/**
 * Stops taking new requests, lets open ones finish, closes the database and
 * exits. Hosts (Render, Docker) send SIGTERM before replacing the server.
 */
export const shutdown = (server, signal) => {
  logger.info(`${signal} received, shutting down`);
  // If open requests hang, stop anyway
  setTimeout(() => {
    logger.error("Open requests didn't finish in time, exiting");
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS).unref();

  return new Promise((resolve) => {
    server.close(async () => {
      await mongoose.disconnect();
      logger.info("Shut down cleanly");
      process.exit(0);
      resolve();
    });
  });
};

/** Connects to the database first, so no request arrives before it's ready */
export async function startServer() {
  try {
    await connectDB();
  } catch (error) {
    logger.error("Couldn't connect to MongoDB, stopping:", error);
    process.exit(1);
    return undefined;
  }

  const PORT = process.env.PORT || 4000;
  const server = app.listen(PORT, "0.0.0.0", () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Swagger UI at http://localhost:${PORT}/api-docs`);
  });

  for (const signal of ["SIGTERM", "SIGINT"]) {
    process.once(signal, () => shutdown(server, signal));
  }
  return server;
}

// Started only when run directly (node src/server.js), not when imported by tests
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startServer();
}
