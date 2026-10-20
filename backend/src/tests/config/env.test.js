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
    expect(checkEnv(complete)).toEqual({ missing: [], weakJwtSecret: false });
  });

  it("lists missing variables", () => {
    expect(checkEnv({ JWT_SECRET: complete.JWT_SECRET }).missing).toEqual(["MONGO_URI", "ORS_API_KEY"]);
  });

  it("flags a JWT secret shorter than 32 characters", () => {
    expect(checkEnv({ ...complete, JWT_SECRET: "x".repeat(31) }).weakJwtSecret).toBe(true);
  });
});
