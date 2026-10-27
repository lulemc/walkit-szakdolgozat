import dotenv from "dotenv";
import { logger } from "../utils/logger.js";

dotenv.config();

const REQUIRED_ENV_VARS = ["MONGO_URI", "JWT_SECRET", "ORS_API_KEY"];
/** A short secret makes the login tokens guessable */
export const MIN_JWT_SECRET_LENGTH = 32;

const isWholeNumber = (value, min, max) => /^\d+$/.test(value) && Number(value) >= min && Number(value) <= max;

/** Format rules for variables that are set; each gives the message when it fails */
const FORMAT_RULES = [
  ["MONGO_URI", (v) => /^mongodb(\+srv)?:\/\//.test(v), "MONGO_URI must start with mongodb:// or mongodb+srv://"],
  ["PORT", (v) => isWholeNumber(v, 1, 65535), "PORT must be a whole number from 1 to 65535"],
  ["NODE_ENV", (v) => ["development", "test", "production"].includes(v), "NODE_ENV must be development, test or production"],
  ["LOG_LEVEL", (v) => ["debug", "info", "warn", "error", "silent"].includes(v), "LOG_LEVEL must be debug, info, warn, error or silent"],
  ["TRUST_PROXY", (v) => isWholeNumber(v, 0, 10), "TRUST_PROXY must be a whole number (how many proxies are in front of the API)"],
  [
    "CORS_ORIGINS",
    (v) => v.split(",").every((origin) => /^https?:\/\/[^\s/]+$/.test(origin.trim())),
    "CORS_ORIGINS must be a comma-separated list of origins like https://walkit.example",
  ],
];

/** What is wrong with the environment: missing variables, a too short JWT secret, wrong formats */
export const checkEnv = (env) => ({
  missing: REQUIRED_ENV_VARS.filter((name) => !env[name]),
  weakJwtSecret: Boolean(env.JWT_SECRET) && env.JWT_SECRET.length < MIN_JWT_SECRET_LENGTH,
  invalid: FORMAT_RULES.filter(([name, valid]) => env[name] !== undefined && env[name] !== "" && !valid(env[name])).map(
    ([, , message]) => message,
  ),
});

const { missing, weakJwtSecret, invalid } = checkEnv(process.env);
const isTest = process.env.NODE_ENV === "test";
const isProduction = process.env.NODE_ENV === "production";

if (missing.length > 0) {
  if (isTest) {
    logger.warn(`Missing environment variables in the test environment: ${missing.join(", ")}`);
  } else {
    logger.error(
      `Missing required environment variables: ${missing.join(", ")}. ` +
        "Make sure your .env file exists and contains them.",
    );
    process.exit(1);
  }
}

if (invalid.length > 0) {
  invalid.forEach((message) => logger.error(message));
  if (!isTest) process.exit(1);
}

if (weakJwtSecret && !isTest) {
  const advice =
    `JWT_SECRET should be at least ${MIN_JWT_SECRET_LENGTH} characters. Generate one with:\n` +
    `   node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"`;
  if (isProduction) {
    logger.error(advice);
    process.exit(1);
  }
  logger.warn(advice);
}

export default {
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  ORS_API_KEY: process.env.ORS_API_KEY,
  NODE_ENV: process.env.NODE_ENV || "development",
};
