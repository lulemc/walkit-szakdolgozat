import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import GroupWalk from "../../models/GroupWalk.js";
import GroupWalkComment from "../../models/GroupWalkComment.js";
import { HttpError } from "../../utils/httpError.js";
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  listComments,
  addComment,
  deleteComment,
} from "../../services/groupWalkCommentService.js";

vi.mock("../../models/GroupWalk.js", async (importOriginal) => ({
  ...(await importOriginal()),
  default: { findOne: vi.fn() },
}));
vi.mock("../../models/GroupWalkComment.js", async (importOriginal) => ({
  ...(await importOriginal()),
  default: { find: vi.fn(), findById: vi.fn(), findOne: vi.fn(), create: vi.fn(), deleteOne: vi.fn() },
}));

/* ---------------- helpers ---------------- */

const id = () => new mongoose.Types.ObjectId().toString();

const query = (result) => {
  const q = {
    select: vi.fn(() => q),
    populate: vi.fn(() => q),
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
const ann = id();
const walkId = id();

const walk = (overrides = {}) => ({
  _id: walkId,
  organiser: ann,
  status: "scheduled",
  participants: [
    { user: ann, role: "organiser", status: "accepted" },
    { user: me, role: "invitee", status: "accepted" },
  ],
  ...overrides,
});

const asMyStatus = (status) =>
  walk({
    participants: [
      { user: ann, role: "organiser", status: "accepted" },
      { user: me, role: "invitee", status },
    ],
  });

beforeEach(() => {
  vi.clearAllMocks();
  GroupWalk.findOne.mockReturnValue(query(walk()));
});

/* ---------------- list ---------------- */

describe("listComments", () => {
  const stored = {
    _id: "c1",
    author: { _id: ann, name: "Ann" },
    text: "See you there",
    createdAt: new Date("2030-05-01T09:00:00Z"),
    groupWalk: walkId,
  };

  it("returns the newest comments first with their author's name", async () => {
    const q = query([stored]);
    GroupWalkComment.find.mockReturnValue(q);

    const comments = await listComments(me, walkId);

    expect(GroupWalk.findOne).toHaveBeenCalledWith({ _id: walkId, "participants.user": me });
    expect(GroupWalkComment.find).toHaveBeenCalledWith({ groupWalk: walkId });
    expect(q.sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(q.limit).toHaveBeenCalledWith(DEFAULT_PAGE_SIZE);
    expect(q.populate).toHaveBeenCalledWith("author", "name");
    expect(comments).toEqual([
      { _id: "c1", author: { _id: ann, name: "Ann" }, text: "See you there", createdAt: stored.createdAt },
    ]);
  });

  it("shows the author of an old comment whose account was deleted as 'Deleted user'", async () => {
    GroupWalkComment.find.mockReturnValue(query([{ ...stored, author: null }]));

    const [comment] = await listComments(me, walkId);

    expect(comment.author).toEqual({ _id: null, name: "Deleted user" });
  });

  it("loads older comments with before and limit", async () => {
    const q = query([]);
    GroupWalkComment.find.mockReturnValue(q);
    const before = "2030-05-01T09:00:00.000Z";

    await listComments(me, walkId, { before, limit: "5" });

    expect(GroupWalkComment.find).toHaveBeenCalledWith({
      groupWalk: walkId,
      createdAt: { $lt: new Date(before) },
    });
    expect(q.limit).toHaveBeenCalledWith(5);
  });

  it("lets participants who declined read the comments", async () => {
    GroupWalk.findOne.mockReturnValue(query(asMyStatus("declined")));
    GroupWalkComment.find.mockReturnValue(query([]));

    await expect(listComments(me, walkId)).resolves.toEqual([]);
  });

  it.each([
    ["an invalid before date", { before: "yesterday" }],
    ["a limit of 0", { limit: "0" }],
    [`a limit above ${MAX_PAGE_SIZE}`, { limit: String(MAX_PAGE_SIZE + 1) }],
    ["a non-numeric limit", { limit: "ten" }],
  ])("returns 400 for %s", async (_label, options) => {
    await expectHttpError(listComments(me, walkId, options), 400);
  });

  it("returns 404 when I'm not part of the walk", async () => {
    GroupWalk.findOne.mockReturnValue(query(null));

    await expectHttpError(listComments(me, walkId), 404);
    expect(GroupWalkComment.find).not.toHaveBeenCalled();
  });

  it("returns 404 for an invalid walk id", async () => {
    await expectHttpError(listComments(me, "bad"), 404);
  });
});

/* ---------------- add ---------------- */

describe("addComment", () => {
  beforeEach(() => {
    GroupWalkComment.create.mockResolvedValue({ _id: "c2" });
    GroupWalkComment.findById.mockReturnValue(
      query({ _id: "c2", author: { _id: me, name: "Me" }, text: "On my way", createdAt: new Date() }),
    );
  });

  it("stores the trimmed text and returns it with my name", async () => {
    const comment = await addComment(me, walkId, "  On my way ");

    expect(GroupWalkComment.create).toHaveBeenCalledWith({
      groupWalk: walkId,
      author: me,
      text: "On my way",
    });
    expect(GroupWalkComment.findById).toHaveBeenCalledWith("c2");
    expect(comment).toEqual(
      expect.objectContaining({ _id: "c2", author: { _id: me, name: "Me" }, text: "On my way" }),
    );
  });

  it("allows comments after the walk has happened", async () => {
    GroupWalk.findOne.mockReturnValue(query(walk({ scheduledAt: new Date("2000-01-01") })));

    await expect(addComment(me, walkId, "That was fun")).resolves.toBeDefined();
  });

  it.each([
    ["empty", "   "],
    ["too long", "x".repeat(501)],
    ["missing", undefined],
  ])("returns 400 when the text is %s", async (_label, text) => {
    await expectHttpError(addComment(me, walkId, text), 400);
    expect(GroupWalkComment.create).not.toHaveBeenCalled();
  });

  it("returns 403 when I declined the walk", async () => {
    GroupWalk.findOne.mockReturnValue(query(asMyStatus("declined")));

    await expectHttpError(addComment(me, walkId, "Hi"), 403);
  });

  it("returns 400 on a cancelled walk", async () => {
    GroupWalk.findOne.mockReturnValue(query(walk({ status: "cancelled" })));

    await expectHttpError(addComment(me, walkId, "Hi"), 400);
  });

  it("returns 404 when I'm not part of the walk", async () => {
    GroupWalk.findOne.mockReturnValue(query(null));

    await expectHttpError(addComment(me, walkId, "Hi"), 404);
  });
});

/* ---------------- delete ---------------- */

describe("deleteComment", () => {
  const commentId = id();

  it("lets the author delete their comment", async () => {
    GroupWalkComment.findOne.mockReturnValue(query({ _id: commentId, author: me }));

    await deleteComment(me, walkId, commentId);

    expect(GroupWalkComment.findOne).toHaveBeenCalledWith({ _id: commentId, groupWalk: walkId });
    expect(GroupWalkComment.deleteOne).toHaveBeenCalledWith({ _id: commentId });
  });

  it("lets the organiser delete anyone's comment", async () => {
    GroupWalk.findOne.mockReturnValue(query(walk({ organiser: me })));
    GroupWalkComment.findOne.mockReturnValue(query({ _id: commentId, author: ann }));

    await deleteComment(me, walkId, commentId);

    expect(GroupWalkComment.deleteOne).toHaveBeenCalledWith({ _id: commentId });
  });

  it("returns 403 for another participant's comment", async () => {
    GroupWalkComment.findOne.mockReturnValue(query({ _id: commentId, author: ann }));

    await expectHttpError(deleteComment(me, walkId, commentId), 403);
    expect(GroupWalkComment.deleteOne).not.toHaveBeenCalled();
  });

  it("returns 404 when the comment isn't on this walk", async () => {
    GroupWalkComment.findOne.mockReturnValue(query(null));

    await expectHttpError(deleteComment(me, walkId, commentId), 404);
  });

  it("returns 404 for an invalid comment id", async () => {
    await expectHttpError(deleteComment(me, walkId, "bad"), 404);
  });

  it("returns 404 when I'm not part of the walk", async () => {
    GroupWalk.findOne.mockReturnValue(query(null));

    await expectHttpError(deleteComment(me, walkId, commentId), 404);
  });
});
