import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import Friendship from "../../models/Friendship.js";
import User from "../../models/User.js";
import { HttpError } from "../../utils/httpError.js";
import {
  MAX_OUTGOING_PENDING,
  pairKey,
  areFriends,
  getFriendIds,
  sendRequest,
  acceptRequest,
  declineRequest,
  cancelRequest,
  unfriend,
  listFriends,
  listRequests,
} from "../../services/friendshipService.js";

vi.mock("../../models/Friendship.js", () => ({
  default: {
    exists: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
    findOneAndDelete: vi.fn(),
    countDocuments: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock("../../models/User.js", () => ({
  default: { exists: vi.fn() },
}));

/* ---------------- helpers ---------------- */

const id = () => new mongoose.Types.ObjectId().toString();

// Chainable query mock: populate/sort/select return the query, lean() resolves
const query = (result) => {
  const q = {
    populate: vi.fn(() => q),
    sort: vi.fn(() => q),
    select: vi.fn(() => q),
    lean: vi.fn(() => Promise.resolve(result)),
  };
  return q;
};

const expectHttpError = async (promise, status) => {
  const error = await promise.catch((e) => e);
  expect(error).toBeInstanceOf(HttpError);
  expect(error.status).toBe(status);
};

const me = id();
const other = id();

beforeEach(() => {
  vi.clearAllMocks();
  User.exists.mockResolvedValue({ _id: other });
  Friendship.findOne.mockResolvedValue(null);
  Friendship.countDocuments.mockResolvedValue(0);
});

/* ---------------- helpers ---------------- */

describe("pairKey", () => {
  it("is the same in both directions", () => {
    expect(pairKey(me, other)).toBe(pairKey(other, me));
  });
});

describe("areFriends", () => {
  it("is true only for an accepted friendship", async () => {
    Friendship.exists.mockResolvedValue({ _id: id() });

    await expect(areFriends(me, other)).resolves.toBe(true);
    expect(Friendship.exists).toHaveBeenCalledWith({
      pairKey: pairKey(me, other),
      status: "accepted",
    });
  });

  it("is false when there is no accepted friendship", async () => {
    Friendship.exists.mockResolvedValue(null);

    await expect(areFriends(me, other)).resolves.toBe(false);
  });
});

describe("getFriendIds", () => {
  it("returns the other user of each accepted friendship", async () => {
    const a = id();
    const b = id();
    Friendship.find.mockReturnValue(
      query([
        { requester: me, recipient: a },
        { requester: b, recipient: me },
      ]),
    );

    const friendIds = await getFriendIds(me);

    expect(friendIds.map(String)).toEqual([a, b]);
    expect(Friendship.find).toHaveBeenCalledWith({
      status: "accepted",
      $or: [{ requester: me }, { recipient: me }],
    });
  });
});

/* ---------------- sending ---------------- */

describe("sendRequest", () => {
  it("creates a pending request", async () => {
    const created = { _id: id(), requester: me, recipient: other, status: "pending" };
    Friendship.create.mockResolvedValue(created);

    const result = await sendRequest(me, other);

    expect(Friendship.create).toHaveBeenCalledWith({
      requester: me,
      recipient: other,
      pairKey: pairKey(me, other),
    });
    expect(result).toEqual({ friendship: created, autoAccepted: false });
  });

  it("rejects a missing user id with 400", async () => {
    await expectHttpError(sendRequest(me, undefined), 400);
  });

  it("rejects a request to yourself with 400", async () => {
    await expectHttpError(sendRequest(me, me), 400);
  });

  it("rejects an invalid user id with 404", async () => {
    await expectHttpError(sendRequest(me, "not-an-id"), 404);
  });

  it("rejects an unknown user with 404", async () => {
    User.exists.mockResolvedValue(null);

    await expectHttpError(sendRequest(me, other), 404);
  });

  it("rejects a request to an existing friend with 409", async () => {
    Friendship.findOne.mockResolvedValue({ requester: other, recipient: me, status: "accepted" });

    await expectHttpError(sendRequest(me, other), 409);
  });

  it("rejects a duplicate request with 409", async () => {
    Friendship.findOne.mockResolvedValue({ requester: me, recipient: other, status: "pending" });

    await expectHttpError(sendRequest(me, other), 409);
    expect(Friendship.create).not.toHaveBeenCalled();
  });

  it("accepts the other user's pending request instead of creating a new one", async () => {
    const reverse = { requester: other, recipient: me, status: "pending", save: vi.fn() };
    Friendship.findOne.mockResolvedValue(reverse);

    const result = await sendRequest(me, other);

    expect(reverse.status).toBe("accepted");
    expect(reverse.acceptedAt).toBeInstanceOf(Date);
    expect(reverse.save).toHaveBeenCalled();
    expect(result).toEqual({ friendship: reverse, autoAccepted: true });
    expect(Friendship.create).not.toHaveBeenCalled();
  });

  it(`rejects with 429 once ${MAX_OUTGOING_PENDING} outgoing requests are pending`, async () => {
    Friendship.countDocuments.mockResolvedValue(MAX_OUTGOING_PENDING);

    await expectHttpError(sendRequest(me, other), 429);
    expect(Friendship.countDocuments).toHaveBeenCalledWith({ requester: me, status: "pending" });
  });

  it("turns a duplicate-key race into 409", async () => {
    Friendship.create.mockRejectedValue(Object.assign(new Error("E11000"), { code: 11000 }));

    await expectHttpError(sendRequest(me, other), 409);
  });
});

/* ---------------- responding ---------------- */

describe("acceptRequest", () => {
  it("accepts a pending request addressed to me", async () => {
    const request = { status: "pending", save: vi.fn() };
    Friendship.findOne.mockResolvedValue(request);
    const requestId = id();

    const result = await acceptRequest(me, requestId);

    expect(Friendship.findOne).toHaveBeenCalledWith({
      _id: requestId,
      recipient: me,
      status: "pending",
    });
    expect(request.status).toBe("accepted");
    expect(request.acceptedAt).toBeInstanceOf(Date);
    expect(request.save).toHaveBeenCalled();
    expect(result).toBe(request);
  });

  it("returns 404 when the request isn't addressed to me", async () => {
    Friendship.findOne.mockResolvedValue(null);

    await expectHttpError(acceptRequest(me, id()), 404);
  });

  it("returns 404 for an invalid id", async () => {
    await expectHttpError(acceptRequest(me, "bad"), 404);
    expect(Friendship.findOne).not.toHaveBeenCalled();
  });
});

describe("declineRequest", () => {
  it("deletes a pending request addressed to me", async () => {
    const requestId = id();
    Friendship.findOneAndDelete.mockResolvedValue({ _id: requestId });

    await declineRequest(me, requestId);

    expect(Friendship.findOneAndDelete).toHaveBeenCalledWith({
      _id: requestId,
      recipient: me,
      status: "pending",
    });
  });

  it("returns 404 when the request isn't addressed to me", async () => {
    Friendship.findOneAndDelete.mockResolvedValue(null);

    await expectHttpError(declineRequest(me, id()), 404);
  });
});

describe("cancelRequest", () => {
  it("deletes a pending request I sent", async () => {
    const requestId = id();
    Friendship.findOneAndDelete.mockResolvedValue({ _id: requestId });

    await cancelRequest(me, requestId);

    expect(Friendship.findOneAndDelete).toHaveBeenCalledWith({
      _id: requestId,
      requester: me,
      status: "pending",
    });
  });

  it("returns 404 when I didn't send the request", async () => {
    Friendship.findOneAndDelete.mockResolvedValue(null);

    await expectHttpError(cancelRequest(me, id()), 404);
  });
});

describe("unfriend", () => {
  it("deletes the accepted friendship", async () => {
    Friendship.findOneAndDelete.mockResolvedValue({ _id: id() });

    await unfriend(me, other);

    expect(Friendship.findOneAndDelete).toHaveBeenCalledWith({
      pairKey: pairKey(me, other),
      status: "accepted",
    });
  });

  it("returns 404 when we aren't friends", async () => {
    Friendship.findOneAndDelete.mockResolvedValue(null);

    await expectHttpError(unfriend(me, other), 404);
  });

  it("returns 404 for an invalid user id", async () => {
    await expectHttpError(unfriend(me, "bad"), 404);
  });
});

/* ---------------- lists ---------------- */

describe("listFriends", () => {
  it("returns the other user whichever direction the request went", async () => {
    const since = new Date("2026-10-01");
    Friendship.find.mockReturnValue(
      query([
        {
          _id: "f1",
          requester: { _id: me, name: "Me" },
          recipient: { _id: other, name: "Ann" },
          acceptedAt: since,
        },
        {
          _id: "f2",
          requester: { _id: "u3", name: "Bob" },
          recipient: { _id: me, name: "Me" },
          acceptedAt: since,
        },
      ]),
    );

    const friends = await listFriends(me);

    expect(friends).toEqual([
      { friendshipId: "f1", user: { _id: other, name: "Ann" }, since },
      { friendshipId: "f2", user: { _id: "u3", name: "Bob" }, since },
    ]);
  });
});

describe("listRequests", () => {
  it("splits pending requests into incoming and outgoing", async () => {
    const createdAt = new Date("2026-10-02");
    Friendship.find
      .mockReturnValueOnce(
        query([{ _id: "r1", requester: { _id: other, name: "Ann" }, createdAt }]),
      )
      .mockReturnValueOnce(query([{ _id: "r2", recipient: { _id: "u3", name: "Bob" }, createdAt }]));

    const requests = await listRequests(me);

    expect(Friendship.find).toHaveBeenNthCalledWith(1, { recipient: me, status: "pending" });
    expect(Friendship.find).toHaveBeenNthCalledWith(2, { requester: me, status: "pending" });
    expect(requests).toEqual({
      incoming: [{ _id: "r1", user: { _id: other, name: "Ann" }, createdAt }],
      outgoing: [{ _id: "r2", user: { _id: "u3", name: "Bob" }, createdAt }],
    });
  });
});
