import { describe, it, expect } from "vitest";
import User from "../../models/User.js";

const valid = { name: "John", email: "john@example.com", passwordHash: "hash" };
const errorsOf = (fields) => new User(fields).validateSync()?.errors ?? {};

describe("User model", () => {
  it("stores email lowercased and trimmed", () => {
    const user = new User({ name: "John", email: "  John.Doe@Example.COM " });

    expect(user.email).toBe("john.doe@example.com");
  });

  it("accepts a complete user", () => {
    expect(new User(valid).validateSync()).toBeUndefined();
  });

  it("trims the name", () => {
    expect(new User({ ...valid, name: "  John " }).name).toBe("John");
  });

  it.each(["name", "email", "passwordHash"])("requires %s", (field) => {
    const withoutField = Object.fromEntries(Object.entries(valid).filter(([key]) => key !== field));

    expect(errorsOf(withoutField)[field]).toBeDefined();
  });

  it("limits the name to 50 characters", () => {
    expect(errorsOf({ ...valid, name: "a".repeat(51) }).name.message).toBe(
      "Name can be at most 50 characters",
    );
  });

  it.each([
    ["height", 49, "Height must be between 50 and 300 cm"],
    ["height", 301, "Height must be between 50 and 300 cm"],
    ["weight", 19, "Weight must be between 20 and 500 kg"],
    ["weight", 501, "Weight must be between 20 and 500 kg"],
    ["weeklyGoalKm", 0, "The weekly goal must be between 1 and 200 km"],
    ["weeklyGoalKm", 201, "The weekly goal must be between 1 and 200 km"],
  ])("rejects %s %s", (field, value, message) => {
    expect(errorsOf({ ...valid, [field]: value })[field].message).toBe(message);
  });

  it("starts without push tokens and keeps each one's language", () => {
    expect(new User(valid).pushTokens).toEqual([]);
    const user = new User({ ...valid, pushTokens: [{ token: "ExponentPushToken[a]", language: "hu" }] });
    expect(user.toObject().pushTokens).toEqual([{ token: "ExponentPushToken[a]", language: "hu" }]);
  });

  it("has a weekly walking goal of 10 km until one is set", () => {
    expect(new User(valid).weeklyGoalKm).toBe(10);
  });

  it("accepts sensible heights and weights", () => {
    expect(errorsOf({ ...valid, height: 175, weight: 70 })).toEqual({});
  });
});

describe("User token version", () => {
  it("starts at 0", () => {
    expect(new User(valid).tokenVersion).toBe(0);
  });
});
