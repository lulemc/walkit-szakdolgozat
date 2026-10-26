import { describe, it, expect, vi, afterEach } from "vitest";
import mongoose from "mongoose";
import Route, { DRAFT_LIFETIME_DAYS, SAVE_ROUTE_UPDATE, draftExpiry, markSaved } from "../../models/Route.js";

const fields = () => ({
  userId: new mongoose.Types.ObjectId(),
  type: "circular",
  startLocation: { latitude: 47.5, longitude: 19.04, address: "Start" },
  endLocation: { latitude: 47.5, longitude: 19.04, address: "Start" },
  coordinates: [{ latitude: 47.5, longitude: 19.04 }],
  totalDistance: 5000,
  estimatedDuration: 60,
});

afterEach(() => {
  vi.useRealTimers();
});

describe("Route drafts", () => {
  it("treats routes as saved unless they are created as drafts (older routes have no status)", () => {
    expect(new Route(fields()).status).toBe("saved");
    expect(new Route({ ...fields(), status: "draft" }).status).toBe("draft");
    expect(new Route({ ...fields(), status: "maybe" }).validateSync().errors.status).toBeDefined();
  });

  it(`gives drafts ${DRAFT_LIFETIME_DAYS} days`, () => {
    vi.useFakeTimers({ toFake: ["Date"], now: new Date("2030-01-01T10:00:00.000Z") });

    expect(DRAFT_LIFETIME_DAYS).toBe(7);
    expect(draftExpiry()).toEqual(new Date("2030-01-08T10:00:00.000Z"));
  });

  it("lets MongoDB remove drafts once their time is up (TTL index)", () => {
    const ttl = Route.schema.indexes().find(([index]) => index.draftExpiresAt === 1);

    expect(ttl?.[1]).toEqual(expect.objectContaining({ expireAfterSeconds: 0 }));
  });

  it("keeps a saved route: no expiry, so the TTL index ignores it", () => {
    const route = new Route({ ...fields(), status: "draft", draftExpiresAt: draftExpiry() });

    markSaved(route);

    expect(route.status).toBe("saved");
    expect(route.draftExpiresAt).toBeUndefined();
    expect(SAVE_ROUTE_UPDATE).toEqual({ $set: { status: "saved" }, $unset: { draftExpiresAt: 1 } });
  });

  it("has no separate isFavorite index next to the compound favourites index", () => {
    const indexes = Route.schema.indexes().map(([index]) => index);

    expect(indexes).not.toContainEqual({ isFavorite: 1 });
    expect(indexes).toContainEqual({ userId: 1, isFavorite: 1, favoritedAt: -1 });
  });
});
