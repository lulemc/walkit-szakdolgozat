import { describe, it, expect } from "vitest";
import { DELETED_USER_NAME, toUserSummary } from "../../utils/userSummary.js";

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
