import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Friendship from "../../models/Friendship.js";
import GroupWalk from "../../models/GroupWalk.js";
import GroupWalkComment from "../../models/GroupWalkComment.js";
import Route from "../../models/Route.js";
import { deleteUserData } from "../../services/accountCleanupService.js";

vi.mock("../../models/Friendship.js", () => ({ default: { deleteMany: vi.fn() } }));
vi.mock("../../models/GroupWalkComment.js", async (importOriginal) => ({
  ...(await importOriginal()),
  default: { deleteMany: vi.fn() },
}));
vi.mock("../../models/Route.js", async (importOriginal) => ({
  ...(await importOriginal()),
  default: { deleteMany: vi.fn() },
}));
vi.mock("../../models/GroupWalk.js", async (importOriginal) => ({
  ...(await importOriginal()),
  default: { updateMany: vi.fn() },
}));

const NOW = new Date("2030-05-01T10:00:00Z");
const me = "u1";

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ["Date"], now: NOW });
  Friendship.deleteMany.mockResolvedValue({ deletedCount: 2 });
  GroupWalkComment.deleteMany.mockResolvedValue({ deletedCount: 5 });
  Route.deleteMany.mockResolvedValue({ deletedCount: 3 });
  GroupWalk.updateMany
    .mockResolvedValueOnce({ modifiedCount: 1 })
    .mockResolvedValueOnce({ modifiedCount: 4 });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("deleteUserData", () => {
  it("removes the user's friendships in both directions", async () => {
    await deleteUserData(me);

    expect(Friendship.deleteMany).toHaveBeenCalledWith({
      $or: [{ requester: me }, { recipient: me }],
    });
  });

  it("removes the user's comments and routes", async () => {
    await deleteUserData(me);

    expect(GroupWalkComment.deleteMany).toHaveBeenCalledWith({ author: me });
    expect(Route.deleteMany).toHaveBeenCalledWith({ userId: me });
  });

  it("cancels the upcoming walks the user organises", async () => {
    await deleteUserData(me);

    expect(GroupWalk.updateMany).toHaveBeenCalledWith(
      { organiser: me, status: "scheduled", scheduledAt: { $gte: NOW } },
      { $set: { status: "cancelled", cancelledAt: NOW } },
    );
  });

  it("takes the user out of other people's walks", async () => {
    await deleteUserData(me);

    expect(GroupWalk.updateMany).toHaveBeenCalledWith(
      { organiser: { $ne: me }, "participants.user": me },
      { $pull: { participants: { user: me } } },
    );
  });

  it("reports what was cleaned up", async () => {
    await expect(deleteUserData(me)).resolves.toEqual({
      friendships: 2,
      comments: 5,
      routes: 3,
      cancelledWalks: 1,
      leftWalks: 4,
    });
  });
});
