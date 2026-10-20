import { describe, it, expect } from "vitest";
import {
  MIN_PASSWORD_LENGTH,
  NAME_MAX_LENGTH,
  emailProblem,
  nameProblem,
  passwordProblem,
} from "../../utils/validation.js";

describe("passwordProblem", () => {
  it("accepts 8 or more characters", () => {
    expect(MIN_PASSWORD_LENGTH).toBe(8);
    expect(passwordProblem("12345678")).toBeNull();
  });

  it("rejects shorter or missing passwords", () => {
    expect(passwordProblem("1234567")).toBe("Password must be at least 8 characters long");
    expect(passwordProblem("")).toBe("Password must be at least 8 characters long");
    expect(passwordProblem(undefined)).toBe("Password must be at least 8 characters long");
  });
});

describe("emailProblem", () => {
  it.each(["ann@example.com", "a.b+c@sub.example.hu"])("accepts %s", (email) => {
    expect(emailProblem(email)).toBeNull();
  });

  it.each(["ann", "ann@", "@example.com", "ann@example", "ann @example.com", "", undefined, 42])(
    "rejects %s",
    (email) => {
      expect(emailProblem(email)).toBe("Please enter a valid email address");
    },
  );
});

describe("nameProblem", () => {
  it("accepts a name up to 50 characters", () => {
    expect(NAME_MAX_LENGTH).toBe(50);
    expect(nameProblem("Ann")).toBeNull();
    expect(nameProblem("a".repeat(50))).toBeNull();
  });

  it("rejects empty and too long names", () => {
    expect(nameProblem("   ")).toBe("Name can't be empty");
    expect(nameProblem(undefined)).toBe("Name can't be empty");
    expect(nameProblem("a".repeat(51))).toBe("Name can be at most 50 characters");
  });
});

describe("planNameFixes", () => {
  it("gives accounts without a name the placeholder name, and reports too long names", async () => {
    const { planNameFixes } = await import("../../utils/validation.js");

    const plan = planNameFixes([
      { _id: "1", name: "Ann" },
      { _id: "2" },
      { _id: "3", name: null },
      { _id: "4", name: "   " },
      { _id: "5", name: "a".repeat(51) },
    ]);

    expect(plan).toEqual({
      fill: [
        { _id: "2", to: "Unnamed user" },
        { _id: "3", to: "Unnamed user" },
        { _id: "4", to: "Unnamed user" },
      ],
      tooLong: [{ _id: "5", name: "a".repeat(51) }],
    });
  });
});
