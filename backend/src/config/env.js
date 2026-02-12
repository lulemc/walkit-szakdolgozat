import dotenv from "dotenv";

dotenv.config();

const requiredEnvVars = ["MONGO_URI", "JWT_SECRET", "ORS_API_KEY"];

const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  if (process.env.NODE_ENV === "test") {
    console.warn(
      "⚠️  Warning: Missing environment variables in test environment:",
    );
    missingVars.forEach((varName) => {
      console.warn(`   - ${varName}`);
    });
    console.warn("   Some tests may fail or be skipped.");
  } else {
    console.error("❌ Error: Missing required environment variables:");
    missingVars.forEach((varName) => {
      console.error(`   - ${varName}`);
    });
    console.error(
      "   Make sure your .env file exists and contains these variables",
    );
    process.exit(1);
  }
}

export default {
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  ORS_API_KEY: process.env.ORS_API_KEY,
  NODE_ENV: process.env.NODE_ENV || "development",
};
