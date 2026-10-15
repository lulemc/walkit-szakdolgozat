import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import Friendship from "../../models/Friendship.js";

const ids = () => ({
  requester: new mongoose.Types.ObjectId(),
  recipient: new mongoose.Types.ObjectId(),
});

describe("Friendship model", () => {
  it("starts as a pending request", async () => {
    const friendship = new Friendship({ ...ids(), pairKey: "a_b" });

    expect(friendship.status).toBe("pending");
    await expect(friendship.validate()).resolves.toBeUndefined();
  });

  it("only allows pending or accepted as status", async () => {
    const friendship = new Friendship({ ...ids(), pairKey: "a_b", status: "blocked" });

    const error = await friendship.validate().catch((e) => e);
    expect(error.errors.status).toBeDefined();
  });

  it("requires both users and the pair key", async () => {
    const error = await new Friendship({}).validate().catch((e) => e);

    expect(Object.keys(error.errors).sort()).toEqual(["pairKey", "recipient", "requester"]);
  });

  it("allows only one document per pair of users", () => {
    const pairIndex = Friendship.schema
      .indexes()
      .find(([fields]) => Object.keys(fields).join() === "pairKey");

    expect(pairIndex).toBeDefined();
    expect(pairIndex[1].unique).toBe(true);
  });

  it("indexes pending lists for both sides", () => {
    const indexedFields = Friendship.schema.indexes().map(([fields]) => Object.keys(fields).join());

    expect(indexedFields).toEqual(expect.arrayContaining(["recipient,status", "requester,status"]));
  });
});
