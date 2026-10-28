import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import mongoose from "mongoose";
import WalkSession from "../../models/WalkSession.js";
import Route from "../../models/Route.js";
import GroupWalk from "../../models/GroupWalk.js";
import { HttpError } from "../../utils/httpError.js";
import {
  MAX_PATH_POINTS,
  MAX_ACTIVITY_WALKS,
  getWalk,
  getWalkActivity,
  getWalkStats,
  listWalks,
  recordWalk,
  simplifyPath,
} from "../../services/walkSessionService.js";

vi.mock("../../models/WalkSession.js", async (importOriginal) => ({
  ...(await importOriginal()),
  default: { create: vi.fn(), find: vi.fn(), findOne: vi.fn(), aggregate: vi.fn() },
}));
vi.mock("../../models/Route.js", async (importOriginal) => ({
  ...(await importOriginal()),
  default: { findOne: vi.fn(), updateOne: vi.fn() },
}));
vi.mock("../../models/GroupWalk.js", async (importOriginal) => ({
  ...(await importOriginal()),
  default: { findOne: vi.fn() },
}));

/* ---------------- helpers ---------------- */

const NOW = new Date("2030-01-02T12:00:00Z");
const id = () => new mongoose.Types.ObjectId().toString();
const me = id();
const routeId = id();
const groupWalkId = id();

const query = (result) => {
  const q = {
    select: vi.fn(() => q),
    sort: vi.fn(() => q),
    limit: vi.fn(() => q),
    lean: vi.fn(() => Promise.resolve(result)),
  };
  return q;
};

const expectHttpError = async (promise, status, message) => {
  const error = await promise.catch((e) => e);
  expect(error).toBeInstanceOf(HttpError);
  expect(error.status).toBe(status);
  if (message) expect(error.message).toBe(message);
};

const a = { latitude: 47.5, longitude: 19.04 };
const b = { latitude: 47.501, longitude: 19.04 };

/** What the app sends when a walk ends */
const input = (overrides = {}) => ({
  startedAt: "2030-01-02T09:00:00.000Z",
  endedAt: "2030-01-02T10:00:00.000Z",
  durationSec: 3000,
  distanceM: 4200,
  path: [[a, b]],
  ...overrides,
});

/** A stored walk as `create` / `lean` return it */
const stored = (fields = {}) => ({
  _id: "w1",
  user: me,
  route: null,
  groupWalk: null,
  name: null,
  startedAt: new Date("2030-01-02T09:00:00Z"),
  endedAt: new Date("2030-01-02T10:00:00Z"),
  durationSec: 3000,
  distanceM: 4200,
  path: [{ points: [a, b] }],
  ...fields,
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ["Date"], now: NOW });
  WalkSession.create.mockImplementation(async (doc) => stored(doc));
  Route.updateOne.mockResolvedValue({ modifiedCount: 1 });
});

afterEach(() => {
  vi.useRealTimers();
});

/* ---------------- simplifyPath ---------------- */

describe("simplifyPath", () => {
  const line = (n, offset = 0) =>
    Array.from({ length: n }, (_, i) => ({ latitude: 47 + (i + offset) / 10000, longitude: 19 }));

  it("keeps short paths as they are", () => {
    expect(simplifyPath([line(3), line(2, 10)], 10)).toEqual([line(3), line(2, 10)]);
  });

  it(`thins long paths to at most ${MAX_PATH_POINTS} points, keeping each segment's ends`, () => {
    const segments = [line(900), line(400, 2000)];

    const simplified = simplifyPath(segments, MAX_PATH_POINTS);

    expect(simplified.flat().length).toBeLessThanOrEqual(MAX_PATH_POINTS);
    expect(simplified).toHaveLength(2);
    simplified.forEach((segment, i) => {
      expect(segment[0]).toEqual(segments[i][0]);
      expect(segment.at(-1)).toEqual(segments[i].at(-1));
    });
  });
});

/* ---------------- recordWalk ---------------- */

describe("recordWalk - validation", () => {
  it.each([
    ["dates that aren't dates", { startedAt: "yesterday" }, "startedAt and endedAt must be dates"],
    ["an end before the start", { endedAt: "2030-01-02T08:00:00.000Z" }, "endedAt can't be before startedAt"],
    ["an end in the future", { endedAt: "2030-01-02T12:10:00.000Z" }, "endedAt can't be in the future"],
    ["a negative duration", { durationSec: -1 }, "durationSec must be between 0 and the time between startedAt and endedAt"],
    ["more time than the walk took", { durationSec: 3600 + 61 }, "durationSec must be between 0 and the time between startedAt and endedAt"],
    ["a negative distance", { distanceM: -5 }, "distanceM must be between 0 and 200000"],
    ["an absurd distance", { distanceM: 200001 }, "distanceM must be between 0 and 200000"],
    ["a path that isn't a list of segments", { path: [a, b] }, "path must be a list of segments with valid coordinates"],
    ["a point outside the world", { path: [[{ latitude: 95, longitude: 19 }]] }, "path must be a list of segments with valid coordinates"],
  ])("rejects %s with 400", async (_case, overrides, message) => {
    await expectHttpError(recordWalk(me, input(overrides)), 400, message);
    expect(WalkSession.create).not.toHaveBeenCalled();
  });

  it("allows a little clock difference between phone and server", async () => {
    await recordWalk(me, input({ endedAt: "2030-01-02T12:04:00.000Z" }));

    expect(WalkSession.create).toHaveBeenCalled();
  });

  it("accepts a walk without a path", async () => {
    await recordWalk(me, input({ path: undefined }));

    expect(WalkSession.create).toHaveBeenCalledWith(expect.objectContaining({ path: [] }));
  });
});

describe("recordWalk - saving", () => {
  it("stores a free walk and returns it with the path as segments", async () => {
    const walk = await recordWalk(me, input());

    expect(WalkSession.create).toHaveBeenCalledWith({
      user: me,
      route: null,
      groupWalk: null,
      name: null,
      startedAt: new Date("2030-01-02T09:00:00.000Z"),
      endedAt: new Date("2030-01-02T10:00:00.000Z"),
      durationSec: 3000,
      distanceM: 4200,
      path: [{ points: [a, b] }],
    });
    expect(walk).toEqual(
      expect.objectContaining({ _id: "w1", routeId: null, groupWalkId: null, path: [[a, b]] }),
    );
  });

  it("thins a long path before storing it", async () => {
    const long = Array.from({ length: 2000 }, (_, i) => ({ latitude: 47 + i / 100000, longitude: 19 }));

    await recordWalk(me, input({ path: [long] }));

    const { path } = WalkSession.create.mock.calls[0][0];
    expect(path[0].points.length).toBeLessThanOrEqual(MAX_PATH_POINTS);
  });

  it("counts the walk on my route and names it after the route", async () => {
    Route.findOne.mockReturnValue(query({ _id: routeId, name: "Riverside loop", type: "circular" }));

    await recordWalk(me, input({ routeId }));

    expect(Route.findOne).toHaveBeenCalledWith({ _id: routeId, userId: me });
    // Walking a route also keeps it for good (generated routes start as drafts)
    expect(Route.updateOne).toHaveBeenCalledWith(
      { _id: routeId },
      {
        $inc: { walkCount: 1 },
        $set: { lastWalkedAt: new Date("2030-01-02T10:00:00.000Z"), status: "saved" },
        $unset: { draftExpiresAt: 1 },
      },
    );
    expect(WalkSession.create).toHaveBeenCalledWith(
      expect.objectContaining({ route: routeId, name: "Riverside loop" }),
    );
  });

  it("names a walk on an unnamed route after its kind", async () => {
    Route.findOne.mockReturnValue(query({ _id: routeId, name: null, type: "point-to-point" }));

    await recordWalk(me, input({ routeId }));

    expect(WalkSession.create).toHaveBeenCalledWith(expect.objectContaining({ name: "Point-to-point route" }));
  });

  it("answers 404 for a route that isn't mine, or an invalid id", async () => {
    Route.findOne.mockReturnValue(query(null));

    await expectHttpError(recordWalk(me, input({ routeId })), 404, "Route not found");
    await expectHttpError(recordWalk(me, input({ routeId: "nope" })), 404, "Route not found");
    expect(WalkSession.create).not.toHaveBeenCalled();
  });

  it("links a group walk I take part in, named after it", async () => {
    GroupWalk.findOne.mockReturnValue(query({ _id: groupWalkId, title: "Sunday stroll", route: { name: null, type: "circular" } }));

    await recordWalk(me, input({ groupWalkId }));

    expect(GroupWalk.findOne).toHaveBeenCalledWith({ _id: groupWalkId, "participants.user": me });
    expect(WalkSession.create).toHaveBeenCalledWith(
      expect.objectContaining({ groupWalk: groupWalkId, name: "Sunday stroll" }),
    );
  });

  it("answers 404 for a group walk I'm not part of", async () => {
    GroupWalk.findOne.mockReturnValue(query(null));

    await expectHttpError(recordWalk(me, input({ groupWalkId })), 404, "Group walk not found");
  });
});

/* ---------------- reading ---------------- */

describe("listWalks", () => {
  it("lists my walks newest first, without the paths, 20 at a time", async () => {
    const q = query([stored()]);
    WalkSession.find.mockReturnValue(q);

    const walks = await listWalks(me, {});

    expect(WalkSession.find).toHaveBeenCalledWith({ user: me });
    expect(q.select).toHaveBeenCalledWith("-path");
    expect(q.sort).toHaveBeenCalledWith({ startedAt: -1 });
    expect(q.limit).toHaveBeenCalledWith(20);
    expect(walks[0]).not.toHaveProperty("path");
    expect(walks[0]).toEqual(expect.objectContaining({ _id: "w1", distanceM: 4200 }));
  });

  it("pages with before and limit", async () => {
    const q = query([]);
    WalkSession.find.mockReturnValue(q);

    await listWalks(me, { before: "2030-01-01T00:00:00.000Z", limit: "5" });

    expect(WalkSession.find).toHaveBeenCalledWith({
      user: me,
      startedAt: { $lt: new Date("2030-01-01T00:00:00.000Z") },
    });
    expect(q.limit).toHaveBeenCalledWith(5);
  });

  it.each([
    [{ before: "soon" }, "before must be a date"],
    [{ limit: "0" }, "limit must be a whole number from 1 to 50"],
    [{ limit: "51" }, "limit must be a whole number from 1 to 50"],
  ])("rejects %o with 400", async (page, message) => {
    await expectHttpError(listWalks(me, page), 400, message);
  });
});

describe("getWalk", () => {
  it("returns one of my walks with its path", async () => {
    WalkSession.findOne.mockReturnValue(query(stored()));

    const walk = await getWalk(me, "64b7f0c2a1b2c3d4e5f60718");

    expect(WalkSession.findOne).toHaveBeenCalledWith({ _id: "64b7f0c2a1b2c3d4e5f60718", user: me });
    expect(walk.path).toEqual([[a, b]]);
  });

  it("answers 404 for someone else's walk or an invalid id", async () => {
    WalkSession.findOne.mockReturnValue(query(null));

    await expectHttpError(getWalk(me, "64b7f0c2a1b2c3d4e5f60718"), 404, "Walk not found");
    await expectHttpError(getWalk(me, "nope"), 404, "Walk not found");
  });
});

describe("getWalkStats", () => {
  it("adds up my walks in the time range", async () => {
    WalkSession.aggregate.mockResolvedValue([{ walkCount: 3, totalDistanceM: 9000, totalDurationSec: 7200 }]);

    const stats = await getWalkStats(me, { from: "2030-01-01T00:00:00.000Z", to: "2030-01-08T00:00:00.000Z" });

    expect(stats).toEqual({ walkCount: 3, totalDistanceM: 9000, totalDurationSec: 7200 });
    const [{ $match }] = WalkSession.aggregate.mock.calls[0][0];
    expect($match.user).toEqual(new mongoose.Types.ObjectId(me));
    expect($match.startedAt).toEqual({
      $gte: new Date("2030-01-01T00:00:00.000Z"),
      $lt: new Date("2030-01-08T00:00:00.000Z"),
    });
  });

  it("counts all my walks without a range, and zeros when there are none", async () => {
    WalkSession.aggregate.mockResolvedValue([]);

    const stats = await getWalkStats(me, {});

    expect(stats).toEqual({ walkCount: 0, totalDistanceM: 0, totalDurationSec: 0 });
    expect(WalkSession.aggregate.mock.calls[0][0][0].$match).not.toHaveProperty("startedAt");
  });

  it("rejects dates that aren't dates", async () => {
    await expectHttpError(getWalkStats(me, { from: "monday" }), 400, "from and to must be dates");
  });
});

describe("getWalkActivity", () => {
  it("lists when and how far I walked since a date, oldest first", async () => {
    const days = [{ startedAt: new Date("2030-01-01T09:00:00Z"), distanceM: 2000 }];
    const q = query(days);
    WalkSession.find.mockReturnValue(q);

    const activity = await getWalkActivity(me, { from: "2029-12-01T00:00:00.000Z" });

    expect(activity).toEqual(days);
    expect(WalkSession.find).toHaveBeenCalledWith({
      user: me,
      startedAt: { $gte: new Date("2029-12-01T00:00:00.000Z") },
    });
    expect(q.select).toHaveBeenCalledWith("startedAt distanceM -_id");
    expect(q.sort).toHaveBeenCalledWith({ startedAt: 1 });
    expect(q.limit).toHaveBeenCalledWith(MAX_ACTIVITY_WALKS);
  });

  it.each([undefined, "monday"])("needs a from date (%s)", async (from) => {
    await expectHttpError(getWalkActivity(me, { from }), 400, "from must be a date");
  });
});
