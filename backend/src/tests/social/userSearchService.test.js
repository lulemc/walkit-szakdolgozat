import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import User from "../../models/User.js";
import Friendship from "../../models/Friendship.js";
import { HttpError } from "../../utils/httpError.js";
import { pairKey } from "../../services/friendshipService.js";
import { MAX_RESULTS, searchUsers } from "../../services/userSearchService.js";

vi.mock("../../models/User.js", () => ({ default: { find: vi.fn() } }));
vi.mock("../../models/Friendship.js", () => ({ default: { find: vi.fn() } }));

/* ---------------- helpers ---------------- */

const id = () => new mongoose.Types.ObjectId().toString();

const query = (result) => {
  const q = {
    select: vi.fn(() => q),
    sort: vi.fn(() => q),
    limit: vi.fn(() => q),
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
let userQuery;

beforeEach(() => {
  vi.clearAllMocks();
  userQuery = query([]);
  User.find.mockReturnValue(userQuery);
  Friendship.find.mockReturnValue(query([]));
});

/* ---------------- query handling ---------------- */

describe("searchUsers - query", () => {
  it("rejects a query shorter than 2 characters with 400", async () => {
    await expectHttpError(searchUsers(me, "a"), 400);
    await expectHttpError(searchUsers(me, "   "), 400);
    await expectHttpError(searchUsers(me, undefined), 400);
    expect(User.find).not.toHaveBeenCalled();
  });

  it("matches names case-insensitively and excludes me", async () => {
    await searchUsers(me, "  ann ");

    expect(User.find).toHaveBeenCalledWith({
      _id: { $ne: me },
      name: { $regex: "ann", $options: "i" },
    });
  });

  it("treats regex characters in the query as literal text", async () => {
    await searchUsers(me, ".*(a+)");

    const filter = User.find.mock.calls[0][0];
    expect(filter.name.$regex).toBe("\\.\\*\\(a\\+\\)");
    expect(new RegExp(filter.name.$regex, "i").test("anything")).toBe(false);
    expect(new RegExp(filter.name.$regex, "i").test("x.*(a+)y")).toBe(true);
  });

  it("matches an email exactly, in normalised form", async () => {
    await searchUsers(me, " Ann@Example.COM ");

    expect(User.find).toHaveBeenCalledWith({ _id: { $ne: me }, email: "ann@example.com" });
  });

  it(`reads only names and returns at most ${MAX_RESULTS} users`, async () => {
    await searchUsers(me, "ann");

    expect(userQuery.select).toHaveBeenCalledWith("name");
    expect(userQuery.limit).toHaveBeenCalledWith(MAX_RESULTS);
  });
});

/* ---------------- relationships ---------------- */

describe("searchUsers - relationship", () => {
  it("labels each result with my relationship to them", async () => {
    const stranger = id();
    const friend = id();
    const askedByMe = id();
    const askedMe = id();
    User.find.mockReturnValue(
      query([
        { _id: stranger, name: "Stranger" },
        { _id: friend, name: "Friend" },
        { _id: askedByMe, name: "Asked by me" },
        { _id: askedMe, name: "Asked me" },
      ]),
    );
    Friendship.find.mockReturnValue(
      query([
        { _id: "f1", pairKey: pairKey(me, friend), requester: friend, status: "accepted" },
        { _id: "f2", pairKey: pairKey(me, askedByMe), requester: me, status: "pending" },
        { _id: "f3", pairKey: pairKey(me, askedMe), requester: askedMe, status: "pending" },
      ]),
    );

    const results = await searchUsers(me, "a@");

    expect(results).toEqual([
      { _id: stranger, name: "Stranger", relationship: "none" },
      { _id: friend, name: "Friend", relationship: "friends", friendshipId: "f1" },
      { _id: askedByMe, name: "Asked by me", relationship: "outgoing", friendshipId: "f2" },
      { _id: askedMe, name: "Asked me", relationship: "incoming", friendshipId: "f3" },
    ]);
    expect(Friendship.find).toHaveBeenCalledWith({
      pairKey: {
        $in: [stranger, friend, askedByMe, askedMe].map((userId) => pairKey(me, userId)),
      },
    });
  });

  it("never returns email addresses", async () => {
    User.find.mockReturnValue(query([{ _id: id(), name: "Ann", email: "ann@example.com" }]));

    const [result] = await searchUsers(me, "ann");

    expect(result).not.toHaveProperty("email");
  });

  it("skips the friendship lookup when nobody matches", async () => {
    await expect(searchUsers(me, "nobody")).resolves.toEqual([]);
    expect(Friendship.find).not.toHaveBeenCalled();
  });
});

describe("searchUsers - names", () => {
  it("gives accounts without a name a placeholder name", async () => {
    const other = id();
    User.find.mockReturnValue(query([{ _id: other }]));

    const results = await searchUsers(me, "someone@x.com");

    expect(results[0].name).toBe("Unnamed user");
  });
});
