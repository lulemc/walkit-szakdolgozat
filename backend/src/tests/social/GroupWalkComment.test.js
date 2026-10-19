import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import GroupWalkComment from "../../models/GroupWalkComment.js";

const objectId = () => new mongoose.Types.ObjectId();

const validationErrors = async (doc) => (await doc.validate().catch((e) => e))?.errors ?? {};

describe("GroupWalkComment model", () => {
  it("accepts a comment and trims its text", async () => {
    const comment = new GroupWalkComment({
      groupWalk: objectId(),
      author: objectId(),
      text: "  See you at the bridge ",
    });

    expect(comment.text).toBe("See you at the bridge");
    await expect(comment.validate()).resolves.toBeUndefined();
  });

  it("requires the walk, the author and some text", async () => {
    const errors = await validationErrors(new GroupWalkComment({ text: "   " }));

    expect(Object.keys(errors).sort()).toEqual(["author", "groupWalk", "text"]);
  });

  it("limits the text to 500 characters", async () => {
    const comment = new GroupWalkComment({
      groupWalk: objectId(),
      author: objectId(),
      text: "x".repeat(501),
    });

    expect((await validationErrors(comment)).text).toBeDefined();
  });

  it("indexes comments per walk, newest first", () => {
    const indexed = GroupWalkComment.schema.indexes().map(([fields]) => fields);

    expect(indexed).toContainEqual({ groupWalk: 1, createdAt: -1 });
  });
});
