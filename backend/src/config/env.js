import dotenv from "dotenv";

dotenv.config();

const REQUIRED_ENV_VARS = ["MONGO_URI", "JWT_SECRET", "ORS_API_KEY"];
/** A short secret makes the login tokens guessable */
export const MIN_JWT_SECRET_LENGTH = 32;

/** What is wrong with the environment: missing variables and a too short JWT secret */
export const checkEnv = (env) => ({
  missing: REQUIRED_ENV_VARS.filter((name) => !env[name]),
  weakJwtSecret: Boolean(env.JWT_SECRET) && env.JWT_SECRET.length < MIN_JWT_SECRET_LENGTH,
});

const { missing, weakJwtSecret } = checkEnv(process.env);
const isTest = process.env.NODE_ENV === "test";
const isProduction = process.env.NODE_ENV === "production";

if (missing.length > 0) {
  if (isTest) {
    console.warn("⚠️  Warning: Missing environment variables in test environment:");
    missing.forEach((name) => console.warn(`   - ${name}`));
    console.warn("   Some tests may fail or be skipped.");
  } else {
    console.error("❌ Error: Missing required environment variables:");
    missing.forEach((name) => console.error(`   - ${name}`));
    console.error("   Make sure your .env file exists and contains these variables");
    process.exit(1);
  }
}

if (weakJwtSecret && !isTest) {
  const advice =
    `JWT_SECRET should be at least ${MIN_JWT_SECRET_LENGTH} characters. Generate one with:\n` +
    `   node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"`;
  if (isProduction) {
    console.error(`❌ Error: ${advice}`);
    process.exit(1);
  }
  console.warn(`⚠️  Warning: ${advice}`);
}

export default {
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  ORS_API_KEY: process.env.ORS_API_KEY,
  NODE_ENV: process.env.NODE_ENV || "development",
};
