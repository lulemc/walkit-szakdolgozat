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

const allowedOrigins = [
  "http://localhost:8081",
  "http://localhost:19006",
  "http://localhost:4000",
];

const app = express();

// Behind a hosting proxy, set TRUST_PROXY (e.g. 1) so rate limits see each
// client's own address instead of the proxy's
if (process.env.TRUST_PROXY) {
  app.set("trust proxy", Number(process.env.TRUST_PROXY));
}

app.use(helmet());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());

// 🔹 Swagger endpoint
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API routes
app.use("/api", apiLimiter());
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/routes", routeRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/group-walks", groupWalkRoutes);

export default app;
