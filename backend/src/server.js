import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import app from "./app.js";
import "@dotenvx/dotenvx/config";

dotenv.config();
connectDB();

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
