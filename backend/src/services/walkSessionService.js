import mongoose from "mongoose";
import WalkSession from "../models/WalkSession.js";
import Route, { SAVE_ROUTE_UPDATE } from "../models/Route.js";
import GroupWalk from "../models/GroupWalk.js";
import { HttpError } from "../utils/httpError.js";

/** Stored points per walk at most; longer paths are thinned out */
export const MAX_PATH_POINTS = 500;
export const MAX_DISTANCE_M = 200_000;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;
// A year of walks most days is well below this
export const MAX_ACTIVITY_WALKS = 1000;
/** Phones' clocks can be a bit ahead of the server's */
const CLOCK_SKEW_MS = 5 * 60 * 1000;
/** Rounding slack between the app's timer and the start/end times */
const DURATION_SLACK_SEC = 60;

const routeNotFound = () => new HttpError(404, "Route not found");
const groupWalkNotFound = () => new HttpError(404, "Group walk not found");
const walkNotFound = () => new HttpError(404, "Walk not found");

const routeKindName = (type) => (type === "circular" ? "Circular route" : "Point-to-point route");

const isNumberBetween = (value, min, max) =>
  typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
const isCoordinate = (point) =>
  isNumberBetween(point?.latitude, -90, 90) && isNumberBetween(point?.longitude, -180, 180);

const parseDate = (value) => {
  const date = new Date(value);
  return value === undefined || value === null || Number.isNaN(date.getTime()) ? null : date;
};

/**
 * Thins a path to at most `maxPoints` by keeping every n-th point. Each
 * segment keeps its first and last point, so it still starts and ends where
 * the walker did.
 */
export const simplifyPath = (segments, maxPoints = MAX_PATH_POINTS) => {
  const total = segments.reduce((sum, segment) => sum + segment.length, 0);
  if (total <= maxPoints) return segments;

  // Room for the kept end points, then every `stride`-th point
  const stride = Math.ceil(total / Math.max(1, maxPoints - segments.length));
  return segments.map((segment) =>
    segment.filter((_, i) => i % stride === 0 || i === segment.length - 1),
  );
};

const parseWalk = (body = {}) => {
  const startedAt = parseDate(body.startedAt);
  const endedAt = parseDate(body.endedAt);
  if (!startedAt || !endedAt) throw new HttpError(400, "startedAt and endedAt must be dates");
  if (endedAt < startedAt) throw new HttpError(400, "endedAt can't be before startedAt");
  if (endedAt.getTime() > Date.now() + CLOCK_SKEW_MS) {
    throw new HttpError(400, "endedAt can't be in the future");
  }

  const walkedSec = (endedAt - startedAt) / 1000;
  if (!isNumberBetween(body.durationSec, 0, walkedSec + DURATION_SLACK_SEC)) {
    throw new HttpError(
      400,
      "durationSec must be between 0 and the time between startedAt and endedAt",
    );
  }
  if (!isNumberBetween(body.distanceM, 0, MAX_DISTANCE_M)) {
    throw new HttpError(400, `distanceM must be between 0 and ${MAX_DISTANCE_M}`);
  }

  const path = body.path ?? [];
  const validPath =
    Array.isArray(path) &&
    path.every((segment) => Array.isArray(segment) && segment.every(isCoordinate));
  if (!validPath) {
    throw new HttpError(400, "path must be a list of segments with valid coordinates");
  }

  return {
    startedAt,
    endedAt,
    durationSec: body.durationSec,
    distanceM: body.distanceM,
    // Only the coordinates, whatever else the app sent with them
    path: simplifyPath(path.map((segment) => segment.map(({ latitude, longitude }) => ({ latitude, longitude })))),
  };
};

const toWalk = (walk, { withPath = true } = {}) => ({
  _id: walk._id,
  routeId: walk.route ?? null,
  groupWalkId: walk.groupWalk ?? null,
  name: walk.name ?? null,
  startedAt: walk.startedAt,
  endedAt: walk.endedAt,
  durationSec: walk.durationSec,
  distanceM: walk.distanceM,
  ...(withPath && { path: (walk.path ?? []).map((segment) => segment.points) }),
});

/**
 * Saves a finished walk. With a routeId (one of my routes) the route's walk
 * count and last-walked time are updated; with a groupWalkId (a walk I take
 * part in) the walk is linked to it.
 */
export const recordWalk = async (userId, body = {}) => {
  const walk = parseWalk(body);
  let route = null;
  let groupWalk = null;
  let name = null;

  if (body.routeId !== undefined && body.routeId !== null) {
    if (!mongoose.isValidObjectId(body.routeId)) throw routeNotFound();
    const saved = await Route.findOne({ _id: body.routeId, userId }).select("name type").lean();
    if (!saved) throw routeNotFound();
    route = body.routeId;
    name = saved.name || routeKindName(saved.type);
  }

  if (body.groupWalkId !== undefined && body.groupWalkId !== null) {
    if (!mongoose.isValidObjectId(body.groupWalkId)) throw groupWalkNotFound();
    const shared = await GroupWalk.findOne({ _id: body.groupWalkId, "participants.user": userId })
      .select("title route.name route.type")
      .lean();
    if (!shared) throw groupWalkNotFound();
    groupWalk = body.groupWalkId;
    name = shared.title || shared.route?.name || routeKindName(shared.route?.type);
  }

  const created = await WalkSession.create({
    user: userId,
    route,
    groupWalk,
    name,
    ...walk,
    path: walk.path.map((points) => ({ points })),
  });

  if (route) {
    // Counts the walk, and keeps the route for good (generated routes start as drafts)
    await Route.updateOne(
      { _id: route },
      {
        $inc: { walkCount: 1 },
        $set: { lastWalkedAt: walk.endedAt, ...SAVE_ROUTE_UPDATE.$set },
        $unset: SAVE_ROUTE_UPDATE.$unset,
      },
    );
  }

  return toWalk(created);
};

/** My walks, newest first, without their paths. Pass the oldest startedAt as `before` for more. */
export const listWalks = async (userId, { before, limit } = {}) => {
  let beforeDate;
  if (before !== undefined) {
    beforeDate = parseDate(before);
    if (!beforeDate) throw new HttpError(400, "before must be a date");
  }
  const pageSize = limit === undefined ? DEFAULT_PAGE_SIZE : Number(limit);
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
    throw new HttpError(400, `limit must be a whole number from 1 to ${MAX_PAGE_SIZE}`);
  }

  const walks = await WalkSession.find({
    user: userId,
    ...(beforeDate && { startedAt: { $lt: beforeDate } }),
  })
    .select("-path")
    .sort({ startedAt: -1 })
    .limit(pageSize)
    .lean();

  return walks.map((walk) => toWalk(walk, { withPath: false }));
};

export const getWalk = async (userId, walkId) => {
  if (!mongoose.isValidObjectId(walkId)) throw walkNotFound();
  const walk = await WalkSession.findOne({ _id: walkId, user: userId }).lean();
  if (!walk) throw walkNotFound();
  return toWalk(walk);
};

/**
 * When and how far I walked since `from`, oldest first: just enough for the
 * app to work out weekly goals and streaks in the phone's own time zone
 */
export const getWalkActivity = async (userId, { from } = {}) => {
  const fromDate = parseDate(from);
  if (!fromDate) throw new HttpError(400, "from must be a date");

  return WalkSession.find({ user: userId, startedAt: { $gte: fromDate } })
    .select("startedAt distanceM -_id")
    .sort({ startedAt: 1 })
    .limit(MAX_ACTIVITY_WALKS)
    .lean();
};

/** Totals of my walks that started in [from, to); all of them without a range */
export const getWalkStats = async (userId, { from, to } = {}) => {
  const fromDate = from === undefined ? undefined : parseDate(from);
  const toDate = to === undefined ? undefined : parseDate(to);
  if (fromDate === null || toDate === null) throw new HttpError(400, "from and to must be dates");

  const startedAt = {
    ...(fromDate && { $gte: fromDate }),
    ...(toDate && { $lt: toDate }),
  };
  const [totals] = await WalkSession.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        ...(Object.keys(startedAt).length > 0 && { startedAt }),
      },
    },
    {
      $group: {
        _id: null,
        walkCount: { $sum: 1 },
        totalDistanceM: { $sum: "$distanceM" },
        totalDurationSec: { $sum: "$durationSec" },
      },
    },
  ]);

  return {
    walkCount: totals?.walkCount ?? 0,
    totalDistanceM: totals?.totalDistanceM ?? 0,
    totalDurationSec: totals?.totalDurationSec ?? 0,
  };
};
