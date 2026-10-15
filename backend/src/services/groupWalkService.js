import mongoose from "mongoose";
import GroupWalk, { PARTICIPANT_STATUSES } from "../models/GroupWalk.js";
import Route from "../models/Route.js";
import { getFriendIds } from "./friendshipService.js";
import { HttpError } from "../utils/httpError.js";

export const MAX_PARTICIPANTS = 20;

const SCOPES = ["invitations", "upcoming", "past"];
const RESPONSES = ["accepted", "declined"];

// Fields copied from a saved Route into the walk
const ROUTE_SNAPSHOT_FIELDS = [
  "name",
  "type",
  "startLocation",
  "endLocation",
  "coordinates",
  "totalDistance",
  "estimatedDuration",
  "preferences",
  "elevationGain",
  "elevationLoss",
  "maxElevation",
  "minElevation",
];

/* ---------------- helpers ---------------- */

const sameId = (a, b) => String(a?._id ?? a) === String(b?._id ?? b);

const toUserSummary = (user) => (user ? { _id: user._id, name: user.name } : null);

const findParticipant = (walk, userId) =>
  walk.participants.find((participant) => sameId(participant.user, userId));

const countStatuses = (participants) =>
  Object.fromEntries(
    PARTICIPANT_STATUSES.map((status) => [
      status,
      participants.filter((participant) => participant.status === status).length,
    ]),
  );

const snapshotOf = (route) =>
  Object.fromEntries(ROUTE_SNAPSHOT_FIELDS.map((field) => [field, route[field]]));

const walkNotFound = () => new HttpError(404, "Group walk not found");

/** Parses a time that must lie in the future, or throws 400 */
const parseFutureDate = (value) => {
  const date = value == null ? null : new Date(value);
  if (!date || Number.isNaN(date.getTime()) || date <= new Date()) {
    throw new HttpError(400, "scheduledAt must be a date and time in the future");
  }
  return date;
};

/** De-duplicated user ids as strings, without the given user */
const uniqueOtherIds = (ids, userId) =>
  [...new Set(ids.map(String))].filter((other) => other !== String(userId));

/** Throws 400 listing every id that isn't one of the user's friends */
const assertAllFriends = async (userId, ids) => {
  const friendIds = new Set((await getFriendIds(userId)).map(String));
  const invalidIds = ids.filter((other) => !friendIds.has(other));
  if (invalidIds.length > 0) {
    throw new HttpError(400, "You can only invite friends", { invalidIds });
  }
};

const assertWithinLimit = (participantCount) => {
  if (participantCount > MAX_PARTICIPANTS) {
    throw new HttpError(400, `A group walk can have at most ${MAX_PARTICIPANTS} participants`);
  }
};

/** Mongoose validation errors (e.g. a title over 80 characters) are the client's fault */
const asBadRequest = (error) =>
  error?.name === "ValidationError" ? new HttpError(400, error.message) : error;

/** Loads a walk the user takes part in, for changing it; outsiders get 404 */
const findForChange = async (userId, walkId) => {
  if (!mongoose.isValidObjectId(walkId)) throw walkNotFound();
  const walk = await GroupWalk.findOne({ _id: walkId, "participants.user": userId });
  if (!walk) throw walkNotFound();
  return walk;
};

const assertOrganiser = (walk, userId) => {
  if (!sameId(walk.organiser, userId)) {
    throw new HttpError(403, "Only the organiser can do this");
  }
};

/** Cancelled walks and walks that already happened can't be changed or answered */
const assertOpen = (walk) => {
  if (walk.status !== "scheduled" || walk.scheduledAt <= new Date()) {
    throw new HttpError(400, "This walk can no longer be changed");
  }
};

const saveAndReload = async (walk, userId) => {
  try {
    await walk.save();
  } catch (error) {
    throw asBadRequest(error);
  }
  return getGroupWalk(userId, walk._id);
};

/* ---------------- views ---------------- */

const toSummary = (walk, userId) => ({
  _id: walk._id,
  title: walk.title,
  scheduledAt: walk.scheduledAt,
  status: walk.status,
  organiser: toUserSummary(walk.organiser),
  route: walk.route,
  myStatus: findParticipant(walk, userId)?.status ?? null,
  counts: countStatuses(walk.participants),
});

const toDetail = (walk, userId) => ({
  _id: walk._id,
  title: walk.title,
  note: walk.note,
  scheduledAt: walk.scheduledAt,
  status: walk.status,
  cancelledAt: walk.cancelledAt,
  organiser: toUserSummary(walk.organiser),
  route: walk.route,
  participants: walk.participants.map((participant) => ({
    user: toUserSummary(participant.user),
    role: participant.role,
    status: participant.status,
    invitedAt: participant.invitedAt,
    respondedAt: participant.respondedAt,
  })),
  myStatus: findParticipant(walk, userId)?.status ?? null,
  isOrganiser: sameId(walk.organiser, userId),
  counts: countStatuses(walk.participants),
  createdAt: walk.createdAt,
  updatedAt: walk.updatedAt,
});

/* ---------------- create & read ---------------- */

export const createGroupWalk = async (
  userId,
  { routeId, scheduledAt, title, note, inviteeIds = [] } = {},
) => {
  const routeNotFound = new HttpError(404, "Route not found");
  if (!mongoose.isValidObjectId(routeId)) throw routeNotFound;
  if (!Array.isArray(inviteeIds)) throw new HttpError(400, "inviteeIds must be a list");

  const route = await Route.findOne({ _id: routeId, userId }).lean();
  if (!route) throw routeNotFound;

  const when = parseFutureDate(scheduledAt);
  const invitees = uniqueOtherIds(inviteeIds, userId);
  assertWithinLimit(1 + invitees.length);
  if (invitees.length > 0) await assertAllFriends(userId, invitees);

  let created;
  try {
    created = await GroupWalk.create({
      organiser: userId,
      sourceRouteId: route._id,
      route: snapshotOf(route),
      title,
      note,
      scheduledAt: when,
      participants: [
        { user: userId, role: "organiser", status: "accepted", respondedAt: new Date() },
        ...invitees.map((invitee) => ({ user: invitee, role: "invitee", status: "invited" })),
      ],
    });
  } catch (error) {
    throw asBadRequest(error);
  }

  return getGroupWalk(userId, created._id);
};

/**
 * - invitations: walks I'm invited to that are still ahead and not cancelled
 * - upcoming: walks I accepted that are still ahead (cancelled ones too, so I see they're off)
 * - past: every walk I'm part of whose time has passed, newest first
 */
export const listGroupWalks = async (userId, scope) => {
  if (!SCOPES.includes(scope)) {
    throw new HttpError(400, `scope must be one of: ${SCOPES.join(", ")}`);
  }

  const now = new Date();
  const filters = {
    invitations: {
      participants: { $elemMatch: { user: userId, status: "invited" } },
      status: "scheduled",
      scheduledAt: { $gte: now },
    },
    upcoming: {
      participants: { $elemMatch: { user: userId, status: "accepted" } },
      scheduledAt: { $gte: now },
    },
    past: { "participants.user": userId, scheduledAt: { $lt: now } },
  };

  const walks = await GroupWalk.find(filters[scope])
    .select("-route.coordinates")
    .populate("organiser", "name")
    .sort({ scheduledAt: scope === "past" ? -1 : 1 })
    .lean();

  return walks.map((walk) => toSummary(walk, userId));
};

export const getGroupWalk = async (userId, walkId) => {
  if (!mongoose.isValidObjectId(walkId)) throw walkNotFound();

  const walk = await GroupWalk.findOne({ _id: walkId, "participants.user": userId })
    .populate("organiser", "name")
    .populate("participants.user", "name")
    .lean();
  if (!walk) throw walkNotFound();

  return toDetail(walk, userId);
};

/* ---------------- organiser changes ---------------- */

export const updateGroupWalk = async (userId, walkId, { title, note, scheduledAt } = {}) => {
  const walk = await findForChange(userId, walkId);
  assertOrganiser(walk, userId);
  assertOpen(walk);

  if (title !== undefined) walk.title = title;
  if (note !== undefined) walk.note = note;
  if (scheduledAt !== undefined) walk.scheduledAt = parseFutureDate(scheduledAt);

  return saveAndReload(walk, userId);
};

export const cancelGroupWalk = async (userId, walkId) => {
  const walk = await findForChange(userId, walkId);
  assertOrganiser(walk, userId);
  assertOpen(walk);

  walk.status = "cancelled";
  walk.cancelledAt = new Date();

  return saveAndReload(walk, userId);
};

/** Invites more friends; people who declined are invited again, others are left as they are */
export const inviteToGroupWalk = async (userId, walkId, userIds) => {
  const walk = await findForChange(userId, walkId);
  assertOrganiser(walk, userId);
  assertOpen(walk);

  const ids = Array.isArray(userIds) ? uniqueOtherIds(userIds, userId) : [];
  if (ids.length === 0) throw new HttpError(400, "userIds must be a non-empty list");
  await assertAllFriends(userId, ids);

  const newIds = ids.filter((other) => !findParticipant(walk, other));
  assertWithinLimit(walk.participants.length + newIds.length);

  for (const other of ids) {
    const existing = findParticipant(walk, other);
    if (existing?.status === "declined") {
      existing.status = "invited";
      existing.invitedAt = new Date();
      existing.respondedAt = undefined;
    }
  }
  for (const other of newIds) {
    walk.participants.push({ user: other, role: "invitee", status: "invited" });
  }

  return saveAndReload(walk, userId);
};

export const removeParticipant = async (userId, walkId, participantId) => {
  const walk = await findForChange(userId, walkId);
  assertOrganiser(walk, userId);

  if (sameId(participantId, userId)) {
    throw new HttpError(400, "The organiser can't be removed; cancel the walk instead");
  }
  const index = walk.participants.findIndex((participant) =>
    sameId(participant.user, participantId),
  );
  if (index === -1) throw new HttpError(404, "Participant not found");

  walk.participants.splice(index, 1);

  return saveAndReload(walk, userId);
};

/* ---------------- invitee response ---------------- */

/** Accept or decline an invitation; answering "declined" after accepting is how you leave */
export const respondToGroupWalk = async (userId, walkId, status) => {
  if (!RESPONSES.includes(status)) {
    throw new HttpError(400, `status must be one of: ${RESPONSES.join(", ")}`);
  }

  const walk = await findForChange(userId, walkId);
  if (findParticipant(walk, userId)?.role === "organiser") {
    throw new HttpError(400, "The organiser can't respond to their own walk");
  }
  assertOpen(walk);

  // Atomic, so a concurrent cancel or reschedule can't be overwritten
  const now = new Date();
  const result = await GroupWalk.updateOne(
    {
      _id: walkId,
      status: "scheduled",
      scheduledAt: { $gt: now },
      participants: { $elemMatch: { user: userId, role: "invitee" } },
    },
    { $set: { "participants.$.status": status, "participants.$.respondedAt": now } },
  );
  if (result.matchedCount === 0) {
    throw new HttpError(400, "This walk can no longer be answered");
  }

  return { myStatus: status };
};
