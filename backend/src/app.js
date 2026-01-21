import express from "express";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/auth.js";

const app = express();

app.use(
  cors({
    origin: ["*"], // Whitelist the domains you want to allow
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.use(express.json());

// API routes
app.use("/api/users", userRoutes);
app.use("/auth", authRoutes);

export default app;
