import { describe, it, expect } from "vitest";
import { normalizeEmail, planEmailNormalisation } from "../../utils/email.js";

describe("normalizeEmail", () => {
  it("lowercases the address", () => {
    expect(normalizeEmail("John.Doe@Example.COM")).toBe("john.doe@example.com");
  });

  it("removes surrounding whitespace", () => {
    expect(normalizeEmail("  john@example.com \n")).toBe("john@example.com");
  });

  it("leaves non-string values unchanged so validation can reject them", () => {
    expect(normalizeEmail(undefined)).toBeUndefined();
    expect(normalizeEmail(null)).toBeNull();
  });
});

describe("planEmailNormalisation", () => {
  it("plans an update for an email that isn't normalised yet", () => {
    const plan = planEmailNormalisation([{ _id: "1", email: " Ann@X.com" }]);

    expect(plan.updates).toEqual([{ _id: "1", from: " Ann@X.com", to: "ann@x.com" }]);
    expect(plan.collisions).toEqual([]);
  });

  it("leaves already normalised emails alone", () => {
    const plan = planEmailNormalisation([{ _id: "1", email: "ann@x.com" }]);

    expect(plan).toEqual({ updates: [], collisions: [] });
  });

  it("reports accounts that differ only by case and changes none of them", () => {
    const plan = planEmailNormalisation([
      { _id: "1", email: "ann@x.com" },
      { _id: "2", email: "Ann@X.com" },
      { _id: "3", email: "Bob@X.com" },
    ]);

    expect(plan.collisions).toEqual([
      {
        email: "ann@x.com",
        users: [
          { _id: "1", email: "ann@x.com" },
          { _id: "2", email: "Ann@X.com" },
        ],
      },
    ]);
    expect(plan.updates).toEqual([{ _id: "3", from: "Bob@X.com", to: "bob@x.com" }]);
  });

  it("skips users without an email", () => {
    const plan = planEmailNormalisation([{ _id: "1" }, { _id: "2", email: null }]);

    expect(plan).toEqual({ updates: [], collisions: [] });
  });
});
