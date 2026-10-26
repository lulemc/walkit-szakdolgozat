import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";
import { apiLimiter } from "./middleware/rateLimit.js";

import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/auth.js";
import routeRoutes from "./routes/routeRoutes.js";
import friendRoutes from "./routes/friendRoutes.js";
import groupWalkRoutes from "./routes/groupWalkRoutes.js";
import walkRoutes from "./routes/walkRoutes.js";

// Browser origins allowed to call the API (the mobile app sends no origin).
// CORS_ORIGINS is a comma-separated list; the default covers local Expo web.
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean)
  : ["http://localhost:8081", "http://localhost:19006", "http://localhost:4000"];

const app = express();

// Behind a hosting proxy, set TRUST_PROXY (e.g. 1) so rate limits see each
// client's own address instead of the proxy's
if (process.env.TRUST_PROXY) {
  app.set("trust proxy", Number(process.env.TRUST_PROXY));
}

app.use(helmet());

// Other browser origins get a clear 403 instead of a server error
app.use((req, res, next) => {
  const { origin } = req.headers;
  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({ success: false, message: "Origin not allowed" });
  }
  next();
});
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());

// API docs for development; not published in production
if (process.env.NODE_ENV !== "production") {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

// API routes
app.use("/api", apiLimiter());
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/routes", routeRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/group-walks", groupWalkRoutes);
app.use("/api/walks", walkRoutes);

export default app;
