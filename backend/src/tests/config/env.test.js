import { describe, it, expect } from "vitest";
import { MIN_JWT_SECRET_LENGTH, checkEnv } from "../../config/env.js";

const complete = {
  MONGO_URI: "mongodb://localhost/walkit",
  JWT_SECRET: "x".repeat(32),
  ORS_API_KEY: "ors",
};

describe("checkEnv", () => {
  it("is happy with every variable set and a long enough secret", () => {
    expect(MIN_JWT_SECRET_LENGTH).toBe(32);
    expect(checkEnv(complete)).toEqual({ missing: [], weakJwtSecret: false, invalid: [] });
  });

  it("lists missing variables", () => {
    expect(checkEnv({ JWT_SECRET: complete.JWT_SECRET }).missing).toEqual(["MONGO_URI", "ORS_API_KEY"]);
  });

  it("flags a JWT secret shorter than 32 characters", () => {
    expect(checkEnv({ ...complete, JWT_SECRET: "x".repeat(31) }).weakJwtSecret).toBe(true);
  });

  it.each([
    ["MONGO_URI", "localhost:27017", "MONGO_URI must start with mongodb:// or mongodb+srv://"],
    ["PORT", "80a", "PORT must be a whole number from 1 to 65535"],
    ["PORT", "70000", "PORT must be a whole number from 1 to 65535"],
    ["NODE_ENV", "prod", "NODE_ENV must be development, test or production"],
    ["LOG_LEVEL", "verbose", "LOG_LEVEL must be debug, info, warn, error or silent"],
    ["TRUST_PROXY", "yes", "TRUST_PROXY must be a whole number (how many proxies are in front of the API)"],
    ["CORS_ORIGINS", "walkit.example", "CORS_ORIGINS must be a comma-separated list of origins like https://walkit.example"],
  ])("rejects %s=%s", (name, value, message) => {
    expect(checkEnv({ ...complete, [name]: value }).invalid).toEqual([message]);
  });

  it("accepts the documented formats", () => {
    expect(
      checkEnv({
        ...complete,
        MONGO_URI: "mongodb+srv://user:pw@cluster0.example.mongodb.net/walkit",
        PORT: "4000",
        NODE_ENV: "production",
        LOG_LEVEL: "warn",
        TRUST_PROXY: "1",
        CORS_ORIGINS: "https://walkit.example, http://localhost:8081",
      }).invalid,
    ).toEqual([]);
  });
});
