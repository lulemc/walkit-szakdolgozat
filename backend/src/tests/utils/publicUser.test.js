import { describe, it, expect } from "vitest";
import { toPublicUser } from "../../utils/publicUser.js";

const stored = {
  _id: "u1",
  name: "Ann",
  email: "ann@example.com",
  passwordHash: "hash",
  tokenVersion: 2,
  __v: 0,
  dateOfBirth: "1990-01-01",
  sex: "female",
  height: 170,
  weight: 60,
  activityLevel: "active",
  createdAt: "2030-01-01",
  updatedAt: "2030-01-02",
};

describe("toPublicUser", () => {
  it("keeps the profile fields the app shows", () => {
    expect(toPublicUser(stored)).toEqual({
      _id: "u1",
      name: "Ann",
      email: "ann@example.com",
      dateOfBirth: "1990-01-01",
      sex: "female",
      height: 170,
      weight: 60,
      activityLevel: "active",
      createdAt: "2030-01-01",
      updatedAt: "2030-01-02",
    });
  });

  it("never includes the password hash or token version", () => {
    const user = toPublicUser(stored);

    expect(user).not.toHaveProperty("passwordHash");
    expect(user).not.toHaveProperty("tokenVersion");
    expect(user).not.toHaveProperty("__v");
  });

  it("works with Mongoose documents", () => {
    const doc = { toObject: () => stored };

    expect(toPublicUser(doc).email).toBe("ann@example.com");
  });

  it("leaves out fields the user never filled in", () => {
    expect(toPublicUser({ _id: "u2", name: "Bob", email: "bob@example.com" })).toEqual({
      _id: "u2",
      name: "Bob",
      email: "bob@example.com",
    });
  });
});
