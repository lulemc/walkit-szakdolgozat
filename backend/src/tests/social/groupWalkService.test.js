import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import mongoose from "mongoose";
import GroupWalk from "../../models/GroupWalk.js";
import Route from "../../models/Route.js";
import { getFriendIds } from "../../services/friendshipService.js";
import { HttpError } from "../../utils/httpError.js";
import {
  MAX_PARTICIPANTS,
  createGroupWalk,
  listGroupWalks,
  getGroupWalk,
  updateGroupWalk,
  cancelGroupWalk,
  inviteToGroupWalk,
  removeParticipant,
  respondToGroupWalk,
} from "../../services/groupWalkService.js";

vi.mock("../../models/GroupWalk.js", async (importOriginal) => ({
  // Keep the model's real constants (e.g. PARTICIPANT_STATUSES), fake only the queries
  ...(await importOriginal()),
  default: { create: vi.fn(), find: vi.fn(), findOne: vi.fn(), updateOne: vi.fn() },
}));
vi.mock("../../models/Route.js", async (importOriginal) => ({
  ...(await importOriginal()),
  default: { findOne: vi.fn(), updateOne: vi.fn() },
}));
vi.mock("../../services/friendshipService.js", () => ({ getFriendIds: vi.fn() }));

/* ---------------- helpers ---------------- */

const NOW = new Date("2030-05-01T10:00:00Z");
const LATER = new Date("2030-05-03T08:00:00Z");
const EARLIER = new Date("2030-04-28T08:00:00Z");

const id = () => new mongoose.Types.ObjectId().toString();

const query = (result) => {
  const q = {
    select: vi.fn(() => q),
    populate: vi.fn(() => q),
    sort: vi.fn(() => q),
    lean: vi.fn(() => Promise.resolve(result)),
  };
  return q;
};

const expectHttpError = async (promise, status) => {
  const error = await promise.catch((e) => e);
  expect(error).toBeInstanceOf(HttpError);
  expect(error.status).toBe(status);
  return error;
};

const me = id();
const ann = id();
const bob = id();
const walkId = id();

const savedRoute = {
  _id: id(),
  userId: me,
  name: "Riverside loop",
  type: "circular",
  startLocation: { latitude: 47.5, longitude: 19.04, address: "Start" },
  endLocation: { latitude: 47.5, longitude: 19.04, address: "Start" },
  coordinates: [{ latitude: 47.5, longitude: 19.04 }],
  totalDistance: 5200,
  estimatedDuration: 65,
  preferences: { parks: true },
  elevationGain: 10,
  elevationLoss: 10,
  maxElevation: 120,
  minElevation: 100,
  isFavorite: true,
  walkCount: 3,
};

// A walk document as findOne returns it for changes (not lean)
const walkDoc = (overrides = {}) => ({
  _id: walkId,
  organiser: me,
  status: "scheduled",
  scheduledAt: LATER,
  participants: [
    { user: me, role: "organiser", status: "accepted" },
    { user: ann, role: "invitee", status: "invited" },
  ],
  save: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

// After a change the service reloads the walk detail with a second findOne
const detail = { _id: walkId, organiser: { _id: me, name: "Me" }, participants: [] };
const withDetailReload = (doc) => {
  GroupWalk.findOne.mockResolvedValueOnce(doc).mockReturnValueOnce(query(detail));
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ["Date"], now: NOW });
  getFriendIds.mockResolvedValue([ann, bob]);
});

afterEach(() => {
  vi.useRealTimers();
});

/* ---------------- create ---------------- */

describe("createGroupWalk", () => {
  const input = (overrides = {}) => ({
    routeId: savedRoute._id,
    scheduledAt: LATER.toISOString(),
    title: "Sunday walk",
    note: "Bring water",
    inviteeIds: [ann],
    ...overrides,
  });

  beforeEach(() => {
    Route.findOne.mockReturnValue(query(savedRoute));
    GroupWalk.create.mockResolvedValue({ _id: walkId });
    GroupWalk.findOne.mockReturnValue(query(detail));
  });

  it("stores a copy of my route with me as organiser and friends as invitees", async () => {
    const result = await createGroupWalk(me, input());

    expect(Route.findOne).toHaveBeenCalledWith({ _id: savedRoute._id, userId: me });
    expect(GroupWalk.create).toHaveBeenCalledWith({
      organiser: me,
      sourceRouteId: savedRoute._id,
      route: {
        name: "Riverside loop",
        type: "circular",
        startLocation: savedRoute.startLocation,
        endLocation: savedRoute.endLocation,
        coordinates: savedRoute.coordinates,
        totalDistance: 5200,
        estimatedDuration: 65,
        preferences: { parks: true },
        elevationGain: 10,
        elevationLoss: 10,
        maxElevation: 120,
        minElevation: 100,
      },
      title: "Sunday walk",
      note: "Bring water",
      scheduledAt: LATER,
      participants: [
        { user: me, role: "organiser", status: "accepted", respondedAt: NOW },
        { user: ann, role: "invitee", status: "invited" },
      ],
    });
    expect(result).toEqual(expect.objectContaining({ _id: walkId }));
  });

  it("keeps the route for good, since a walk is planned on it", async () => {
    await createGroupWalk(me, input());

    expect(Route.updateOne).toHaveBeenCalledWith(
      { _id: savedRoute._id },
      { $set: { status: "saved" }, $unset: { draftExpiresAt: 1 } },
    );
  });

  it("returns 404 when the route isn't mine", async () => {
    Route.findOne.mockReturnValue(query(null));

    await expectHttpError(createGroupWalk(me, input()), 404);
    expect(GroupWalk.create).not.toHaveBeenCalled();
  });

  it("returns 404 for an invalid route id", async () => {
    await expectHttpError(createGroupWalk(me, input({ routeId: "bad" })), 404);
    expect(Route.findOne).not.toHaveBeenCalled();
  });

  it.each([
    ["in the past", EARLIER.toISOString()],
    ["not a date", "next sunday"],
    ["missing", undefined],
  ])("returns 400 when the time is %s", async (_label, scheduledAt) => {
    await expectHttpError(createGroupWalk(me, input({ scheduledAt })), 400);
  });

  it("returns 400 listing invitees who aren't my friends", async () => {
    const stranger = id();

    const error = await expectHttpError(
      createGroupWalk(me, input({ inviteeIds: [ann, stranger, "bad"] })),
      400,
    );

    expect(error.details).toEqual({ invalidIds: [stranger, "bad"] });
    expect(GroupWalk.create).not.toHaveBeenCalled();
  });

  it("ignores duplicate invitees and myself", async () => {
    await createGroupWalk(me, input({ inviteeIds: [ann, ann, me] }));

    const { participants } = GroupWalk.create.mock.calls[0][0];
    expect(participants.map((p) => p.user)).toEqual([me, ann]);
  });

  it("returns 400 when inviteeIds isn't a list", async () => {
    await expectHttpError(createGroupWalk(me, input({ inviteeIds: ann })), 400);
  });

  it(`allows at most ${MAX_PARTICIPANTS} participants including me`, async () => {
    const friends = Array.from({ length: MAX_PARTICIPANTS }, id);
    getFriendIds.mockResolvedValue(friends);

    await expectHttpError(createGroupWalk(me, input({ inviteeIds: friends })), 400);
    await expect(
      createGroupWalk(me, input({ inviteeIds: friends.slice(0, MAX_PARTICIPANTS - 1) })),
    ).resolves.toBeDefined();
  });

  it("turns a model validation error (e.g. a long title) into 400", async () => {
    GroupWalk.create.mockRejectedValue(
      Object.assign(new Error("Path `title` is longer than the maximum"), {
        name: "ValidationError",
      }),
    );

    await expectHttpError(createGroupWalk(me, input({ title: "x".repeat(81) })), 400);
  });
});

/* ---------------- read ---------------- */

describe("listGroupWalks", () => {
  const listed = {
    _id: walkId,
    title: "Sunday walk",
    scheduledAt: LATER,
    status: "scheduled",
    organiser: { _id: ann, name: "Ann" },
    route: { name: "Loop", type: "circular", totalDistance: 5200, estimatedDuration: 65, startLocation: {} },
    participants: [
      { user: ann, role: "organiser", status: "accepted" },
      { user: me, role: "invitee", status: "invited" },
      { user: bob, role: "invitee", status: "declined" },
    ],
  };

  it("lists upcoming invitations without route coordinates", async () => {
    const q = query([listed]);
    GroupWalk.find.mockReturnValue(q);

    const walks = await listGroupWalks(me, "invitations");

    expect(GroupWalk.find).toHaveBeenCalledWith({
      participants: { $elemMatch: { user: me, status: "invited" } },
      status: "scheduled",
      scheduledAt: { $gte: NOW },
    });
    expect(q.select).toHaveBeenCalledWith("-route.coordinates");
    expect(q.sort).toHaveBeenCalledWith({ scheduledAt: 1 });
    expect(walks).toEqual([
      {
        _id: walkId,
        title: "Sunday walk",
        scheduledAt: LATER,
        status: "scheduled",
        organiser: { _id: ann, name: "Ann" },
        route: listed.route,
        myStatus: "invited",
        counts: { accepted: 1, invited: 1, declined: 1 },
      },
    ]);
  });

  it("lists upcoming walks I accepted, cancelled ones included", async () => {
    GroupWalk.find.mockReturnValue(query([]));

    await listGroupWalks(me, "upcoming");

    expect(GroupWalk.find).toHaveBeenCalledWith({
      participants: { $elemMatch: { user: me, status: "accepted" } },
      scheduledAt: { $gte: NOW },
    });
  });

  it("lists past walks newest first", async () => {
    const q = query([]);
    GroupWalk.find.mockReturnValue(q);

    await listGroupWalks(me, "past");

    expect(GroupWalk.find).toHaveBeenCalledWith({
      "participants.user": me,
      scheduledAt: { $lt: NOW },
    });
    expect(q.sort).toHaveBeenCalledWith({ scheduledAt: -1 });
  });

  it("returns 400 for an unknown scope", async () => {
    await expectHttpError(listGroupWalks(me, "everything"), 400);
  });
});

describe("getGroupWalk", () => {
  it("returns the full walk with my status, my role and counts", async () => {
    GroupWalk.findOne.mockReturnValue(
      query({
        _id: walkId,
        title: "Sunday walk",
        note: "Bring water",
        scheduledAt: LATER,
        status: "scheduled",
        organiser: { _id: ann, name: "Ann" },
        route: savedRoute,
        participants: [
          { user: { _id: ann, name: "Ann" }, role: "organiser", status: "accepted" },
          { user: { _id: me, name: "Me" }, role: "invitee", status: "invited" },
        ],
      }),
    );

    const walk = await getGroupWalk(me, walkId);

    expect(GroupWalk.findOne).toHaveBeenCalledWith({ _id: walkId, "participants.user": me });
    expect(walk).toEqual(
      expect.objectContaining({
        _id: walkId,
        route: savedRoute,
        organiser: { _id: ann, name: "Ann" },
        participants: [
          expect.objectContaining({ user: { _id: ann, name: "Ann" }, role: "organiser", status: "accepted" }),
          expect.objectContaining({ user: { _id: me, name: "Me" }, role: "invitee", status: "invited" }),
        ],
        myStatus: "invited",
        isOrganiser: false,
        counts: { accepted: 1, invited: 1, declined: 0 },
      }),
    );
  });

  it("shows an organiser or participant whose account was deleted as 'Deleted user'", async () => {
    GroupWalk.findOne.mockReturnValue(
      query({
        _id: walkId,
        scheduledAt: EARLIER,
        status: "scheduled",
        organiser: null,
        route: savedRoute,
        participants: [
          { user: null, role: "organiser", status: "accepted" },
          { user: { _id: me, name: "Me" }, role: "invitee", status: "accepted" },
        ],
      }),
    );

    const walk = await getGroupWalk(me, walkId);

    expect(walk.organiser).toEqual({ _id: null, name: "Deleted user" });
    expect(walk.participants[0].user).toEqual({ _id: null, name: "Deleted user" });
    expect(walk.myStatus).toBe("accepted");
    expect(walk.isOrganiser).toBe(false);
  });

  it("returns 404 when I'm not part of the walk", async () => {
    GroupWalk.findOne.mockReturnValue(query(null));

    await expectHttpError(getGroupWalk(me, walkId), 404);
  });

  it("returns 404 for an invalid id", async () => {
    await expectHttpError(getGroupWalk(me, "bad"), 404);
    expect(GroupWalk.findOne).not.toHaveBeenCalled();
  });
});

/* ---------------- organiser changes ---------------- */

describe("updateGroupWalk", () => {
  it("lets the organiser change the title, note and time", async () => {
    const walk = walkDoc();
    withDetailReload(walk);
    const newTime = new Date("2030-05-04T09:00:00Z");

    const result = await updateGroupWalk(me, walkId, {
      title: "New title",
      note: "New note",
      scheduledAt: newTime.toISOString(),
    });

    expect(walk.title).toBe("New title");
    expect(walk.note).toBe("New note");
    expect(walk.scheduledAt).toEqual(newTime);
    expect(walk.save).toHaveBeenCalled();
    expect(result).toEqual(expect.objectContaining({ _id: walkId }));
  });

  it("returns 403 for an invitee", async () => {
    GroupWalk.findOne.mockResolvedValueOnce(walkDoc({ organiser: ann }));

    await expectHttpError(updateGroupWalk(me, walkId, { title: "x" }), 403);
  });

  it("returns 404 when I'm not part of the walk", async () => {
    GroupWalk.findOne.mockResolvedValueOnce(null);

    await expectHttpError(updateGroupWalk(me, walkId, { title: "x" }), 404);
  });

  it.each([
    ["cancelled", { status: "cancelled" }],
    ["already happened", { scheduledAt: EARLIER }],
  ])("returns 400 when the walk is %s", async (_label, overrides) => {
    GroupWalk.findOne.mockResolvedValueOnce(walkDoc(overrides));

    await expectHttpError(updateGroupWalk(me, walkId, { title: "x" }), 400);
  });

  it("returns 400 when moving the walk into the past", async () => {
    GroupWalk.findOne.mockResolvedValueOnce(walkDoc());

    await expectHttpError(updateGroupWalk(me, walkId, { scheduledAt: EARLIER.toISOString() }), 400);
  });
});

describe("cancelGroupWalk", () => {
  it("marks the walk cancelled", async () => {
    const walk = walkDoc();
    withDetailReload(walk);

    await cancelGroupWalk(me, walkId);

    expect(walk.status).toBe("cancelled");
    expect(walk.cancelledAt).toEqual(NOW);
    expect(walk.save).toHaveBeenCalled();
  });

  it("returns 403 for an invitee", async () => {
    GroupWalk.findOne.mockResolvedValueOnce(walkDoc({ organiser: ann }));

    await expectHttpError(cancelGroupWalk(me, walkId), 403);
  });

  it("returns 400 when already cancelled", async () => {
    GroupWalk.findOne.mockResolvedValueOnce(walkDoc({ status: "cancelled" }));

    await expectHttpError(cancelGroupWalk(me, walkId), 400);
  });
});

describe("inviteToGroupWalk", () => {
  it("invites new friends and re-invites those who declined", async () => {
    const walk = walkDoc({
      participants: [
        { user: me, role: "organiser", status: "accepted" },
        { user: ann, role: "invitee", status: "declined", respondedAt: EARLIER },
      ],
    });
    withDetailReload(walk);

    await inviteToGroupWalk(me, walkId, [ann, bob]);

    expect(walk.participants).toEqual([
      { user: me, role: "organiser", status: "accepted" },
      { user: ann, role: "invitee", status: "invited", respondedAt: undefined, invitedAt: NOW },
      { user: bob, role: "invitee", status: "invited" },
    ]);
    expect(walk.save).toHaveBeenCalled();
  });

  it("leaves people who are already invited or coming unchanged", async () => {
    const walk = walkDoc();
    withDetailReload(walk);

    await inviteToGroupWalk(me, walkId, [ann]);

    expect(walk.participants[1]).toEqual({ user: ann, role: "invitee", status: "invited" });
  });

  it("returns 400 listing users who aren't my friends", async () => {
    const stranger = id();
    GroupWalk.findOne.mockResolvedValueOnce(walkDoc());

    const error = await expectHttpError(inviteToGroupWalk(me, walkId, [bob, stranger]), 400);

    expect(error.details).toEqual({ invalidIds: [stranger] });
  });

  it("returns 400 for an empty list", async () => {
    GroupWalk.findOne.mockResolvedValueOnce(walkDoc());

    await expectHttpError(inviteToGroupWalk(me, walkId, []), 400);
  });

  it("keeps the participant limit", async () => {
    const friends = Array.from({ length: MAX_PARTICIPANTS }, id);
    getFriendIds.mockResolvedValue(friends);
    GroupWalk.findOne.mockResolvedValueOnce(walkDoc());

    await expectHttpError(inviteToGroupWalk(me, walkId, friends.slice(0, MAX_PARTICIPANTS - 1)), 400);
  });

  it("returns 403 for an invitee", async () => {
    GroupWalk.findOne.mockResolvedValueOnce(walkDoc({ organiser: ann }));

    await expectHttpError(inviteToGroupWalk(me, walkId, [bob]), 403);
  });
});

describe("removeParticipant", () => {
  it("removes an invitee", async () => {
    const walk = walkDoc();
    withDetailReload(walk);

    await removeParticipant(me, walkId, ann);

    expect(walk.participants.map((p) => p.user)).toEqual([me]);
    expect(walk.save).toHaveBeenCalled();
  });

  it("returns 400 when removing the organiser", async () => {
    GroupWalk.findOne.mockResolvedValueOnce(walkDoc());

    await expectHttpError(removeParticipant(me, walkId, me), 400);
  });

  it("returns 404 when the user isn't a participant", async () => {
    GroupWalk.findOne.mockResolvedValueOnce(walkDoc());

    await expectHttpError(removeParticipant(me, walkId, bob), 404);
  });

  it("returns 403 for an invitee", async () => {
    GroupWalk.findOne.mockResolvedValueOnce(walkDoc({ organiser: ann }));

    await expectHttpError(removeParticipant(me, walkId, bob), 403);
  });
});

/* ---------------- invitee response ---------------- */

describe("respondToGroupWalk", () => {
  const invitedWalk = () =>
    walkDoc({
      organiser: ann,
      participants: [
        { user: ann, role: "organiser", status: "accepted" },
        { user: me, role: "invitee", status: "invited" },
      ],
    });

  it("records my answer atomically", async () => {
    GroupWalk.findOne.mockResolvedValueOnce(invitedWalk());
    GroupWalk.updateOne.mockResolvedValue({ matchedCount: 1 });

    const result = await respondToGroupWalk(me, walkId, "accepted");

    expect(GroupWalk.updateOne).toHaveBeenCalledWith(
      {
        _id: walkId,
        status: "scheduled",
        scheduledAt: { $gt: NOW },
        participants: { $elemMatch: { user: me, role: "invitee" } },
      },
      { $set: { "participants.$.status": "accepted", "participants.$.respondedAt": NOW } },
    );
    expect(result).toEqual({ myStatus: "accepted" });
  });

  it("lets me change my answer (declining is how I leave)", async () => {
    const walk = invitedWalk();
    walk.participants[1].status = "accepted";
    GroupWalk.findOne.mockResolvedValueOnce(walk);
    GroupWalk.updateOne.mockResolvedValue({ matchedCount: 1 });

    await expect(respondToGroupWalk(me, walkId, "declined")).resolves.toEqual({
      myStatus: "declined",
    });
  });

  it("returns 400 for an unknown answer", async () => {
    await expectHttpError(respondToGroupWalk(me, walkId, "maybe"), 400);
    expect(GroupWalk.findOne).not.toHaveBeenCalled();
  });

  it("returns 400 when the organiser tries to respond", async () => {
    GroupWalk.findOne.mockResolvedValueOnce(walkDoc());

    await expectHttpError(respondToGroupWalk(me, walkId, "declined"), 400);
  });

  it.each([
    ["cancelled", { status: "cancelled" }],
    ["already happened", { scheduledAt: EARLIER }],
  ])("returns 400 when the walk is %s", async (_label, overrides) => {
    GroupWalk.findOne.mockResolvedValueOnce({ ...invitedWalk(), ...overrides });

    await expectHttpError(respondToGroupWalk(me, walkId, "accepted"), 400);
    expect(GroupWalk.updateOne).not.toHaveBeenCalled();
  });

  it("returns 400 if the walk changed just before the answer was saved", async () => {
    GroupWalk.findOne.mockResolvedValueOnce(invitedWalk());
    GroupWalk.updateOne.mockResolvedValue({ matchedCount: 0 });

    await expectHttpError(respondToGroupWalk(me, walkId, "accepted"), 400);
  });

  it("returns 404 when I'm not part of the walk", async () => {
    GroupWalk.findOne.mockResolvedValueOnce(null);

    await expectHttpError(respondToGroupWalk(me, walkId, "accepted"), 404);
  });
});
