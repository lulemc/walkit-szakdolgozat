import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import GroupWalk from "../../models/GroupWalk.js";

const objectId = () => new mongoose.Types.ObjectId();

const route = () => ({
  name: "Riverside loop",
  type: "circular",
  startLocation: { latitude: 47.5, longitude: 19.04, address: "Start" },
  endLocation: { latitude: 47.5, longitude: 19.04, address: "Start" },
  coordinates: [
    { latitude: 47.5, longitude: 19.04 },
    { latitude: 47.51, longitude: 19.05 },
  ],
  totalDistance: 5200,
  estimatedDuration: 65,
});

const validWalk = (overrides = {}) => {
  const organiser = objectId();
  return {
    organiser,
    route: route(),
    scheduledAt: new Date("2030-05-01T08:00:00Z"),
    participants: [{ user: organiser, role: "organiser", status: "accepted" }],
    ...overrides,
  };
};

const validationErrors = async (doc) => (await doc.validate().catch((e) => e))?.errors ?? {};

describe("GroupWalk model", () => {
  it("accepts a valid walk and defaults to scheduled", async () => {
    const walk = new GroupWalk(validWalk());

    expect(walk.status).toBe("scheduled");
    await expect(walk.validate()).resolves.toBeUndefined();
  });

  it("requires an organiser, a route copy and a time", async () => {
    const errors = await validationErrors(new GroupWalk({}));

    expect(Object.keys(errors)).toEqual(
      expect.arrayContaining(["organiser", "route", "scheduledAt"]),
    );
  });

  it("validates the route copy like a saved route", async () => {
    const walk = new GroupWalk(validWalk({ route: { ...route(), type: "zigzag", coordinates: [{}] } }));

    const errors = await validationErrors(walk);

    expect(errors["route.type"]).toBeDefined();
    expect(errors["route.coordinates.0.latitude"]).toBeDefined();
  });

  it("limits the title to 80 and the note to 500 characters", async () => {
    const walk = new GroupWalk(validWalk({ title: "x".repeat(81), note: "x".repeat(501) }));

    const errors = await validationErrors(walk);

    expect(errors.title).toBeDefined();
    expect(errors.note).toBeDefined();
  });

  it("trims the title and note", () => {
    const walk = new GroupWalk(validWalk({ title: "  Sunday walk ", note: " Bring water " }));

    expect(walk.title).toBe("Sunday walk");
    expect(walk.note).toBe("Bring water");
  });

  it("only allows known participant roles and statuses, defaulting to an invitation", async () => {
    const invitee = new GroupWalk(validWalk({ participants: [{ user: objectId() }] }));
    expect(invitee.participants[0].role).toBe("invitee");
    expect(invitee.participants[0].status).toBe("invited");

    const bad = new GroupWalk(
      validWalk({ participants: [{ user: objectId(), role: "boss", status: "maybe" }] }),
    );
    const errors = await validationErrors(bad);
    expect(errors["participants.0.role"]).toBeDefined();
    expect(errors["participants.0.status"]).toBeDefined();
  });

  it("indexes walks by participant and by organiser", () => {
    const indexed = GroupWalk.schema.indexes().map(([fields]) => fields);

    expect(indexed).toEqual(
      expect.arrayContaining([
        { "participants.user": 1, scheduledAt: 1 },
        { organiser: 1, scheduledAt: -1 },
      ]),
    );
  });
});
