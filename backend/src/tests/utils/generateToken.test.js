import { describe, it, expect, vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";
import { generateToken } from "../../utils/generateToken.js";

vi.mock("jsonwebtoken", () => ({ default: { sign: vi.fn(() => "signed") } }));

beforeEach(() => {
  vi.clearAllMocks();
  process.env.JWT_SECRET = "test-secret";
});

describe("generateToken", () => {
  it("signs the user's id and token version for 7 days", () => {
    expect(generateToken({ _id: "u1", tokenVersion: 3 })).toBe("signed");

    expect(jwt.sign).toHaveBeenCalledWith({ id: "u1", tokenVersion: 3 }, "test-secret", {
      expiresIn: "7d",
    });
  });

  it("uses version 0 for users that never changed their password", () => {
    generateToken({ _id: "u1" });

    expect(jwt.sign).toHaveBeenCalledWith({ id: "u1", tokenVersion: 0 }, "test-secret", {
      expiresIn: "7d",
    });
  });
});
