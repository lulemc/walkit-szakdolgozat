import { describe, it, expect } from "vitest";
import {
  DELETED_USER_NAME,
  UNNAMED_USER_NAME,
  displayName,
  toUserSummary,
} from "../../utils/userSummary.js";

describe("toUserSummary", () => {
  it("keeps only the id and name of a user", () => {
    expect(toUserSummary({ _id: "u1", name: "Ann", email: "ann@x.com" })).toEqual({
      _id: "u1",
      name: "Ann",
    });
  });

  it("shows a user whose account was deleted as 'Deleted user'", () => {
    expect(toUserSummary(null)).toEqual({ _id: null, name: DELETED_USER_NAME });
    expect(toUserSummary(undefined)).toEqual({ _id: null, name: DELETED_USER_NAME });
    expect(DELETED_USER_NAME).toBe("Deleted user");
  });
});

describe("displayName", () => {
  it("is the user's name", () => {
    expect(displayName({ name: "Ann" })).toBe("Ann");
  });

  it("is 'Unnamed user' for accounts without a name, so clients always get text", () => {
    expect(displayName({})).toBe(UNNAMED_USER_NAME);
    expect(displayName({ name: null })).toBe(UNNAMED_USER_NAME);
    expect(displayName({ name: "   " })).toBe(UNNAMED_USER_NAME);
    expect(UNNAMED_USER_NAME).toBe("Unnamed user");
  });

  it("is used for summaries too", () => {
    expect(toUserSummary({ _id: "u1" })).toEqual({ _id: "u1", name: UNNAMED_USER_NAME });
  });
});
