import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const requiredEnvVars = ["ORS_API_KEY", "JWT_SECRET", "MONGO_URI"];
const missing = requiredEnvVars.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(
    "❌ Missing required environment variables:",
    missing.join(", "),
  );
  console.error(
    "   Make sure your .env file exists and contains these variables",
  );
  process.exit(1);
}

console.log("✅ Environment variables loaded successfully");
console.log(
  "   ORS_API_KEY:",
  process.env.ORS_API_KEY.substring(0, 15) + "...",
);

export default process.env;
