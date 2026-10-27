import { readFileSync } from "node:fs";
import mongoose from "mongoose";

const { version } = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8"));
const CONNECTED = 1;

/** For the host's health checks: 200 when the API can serve requests, 503 when the database is down */
export const getHealth = (req, res) => {
  const connected = mongoose.connection.readyState === CONNECTED;
  const data = {
    status: connected ? "ok" : "unavailable",
    database: connected ? "connected" : "disconnected",
    version,
    uptimeSec: Math.round(process.uptime()),
  };

  if (!connected) {
    return res.status(503).json({ success: false, message: "The database is not connected", data });
  }
  res.json({ success: true, data });
};
