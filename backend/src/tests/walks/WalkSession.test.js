import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import WalkSession from "../../models/WalkSession.js";

const valid = () => ({
  user: new mongoose.Types.ObjectId(),
  startedAt: new Date("2030-01-02T09:00:00Z"),
  endedAt: new Date("2030-01-02T10:00:00Z"),
  durationSec: 3000,
  distanceM: 4200,
  path: [{ points: [{ latitude: 47.5, longitude: 19.04 }] }],
});
const errorsOf = (fields) => new WalkSession(fields).validateSync()?.errors ?? {};

describe("WalkSession model", () => {
  it("accepts a complete walk; route and group walk are optional", () => {
    const walk = new WalkSession(valid());

    expect(walk.validateSync()).toBeUndefined();
    expect(walk.route).toBeNull();
    expect(walk.groupWalk).toBeNull();
  });

  it.each(["user", "startedAt", "endedAt", "durationSec", "distanceM"])("requires %s", (field) => {
    const fields = valid();
    delete fields[field];

    expect(errorsOf(fields)[field]).toBeDefined();
  });

  it.each(["durationSec", "distanceM"])("doesn't allow a negative %s", (field) => {
    expect(errorsOf({ ...valid(), [field]: -1 })[field]).toBeDefined();
  });

  it("is indexed for listing a user's walks newest first", () => {
    const indexes = WalkSession.schema.indexes().map(([fields]) => fields);

    expect(indexes).toContainEqual({ user: 1, startedAt: -1 });
  });
});
