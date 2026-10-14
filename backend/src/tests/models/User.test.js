import { describe, it, expect } from "vitest";
import User from "../../models/User.js";

describe("User model", () => {
  it("stores email lowercased and trimmed", () => {
    const user = new User({ name: "John", email: "  John.Doe@Example.COM " });

    expect(user.email).toBe("john.doe@example.com");
  });
});
