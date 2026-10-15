import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Friendship from "../../models/Friendship.js";
import GroupWalk from "../../models/GroupWalk.js";
import { getSocialSummary } from "../../services/socialSummaryService.js";

vi.mock("../../models/Friendship.js", () => ({ default: { countDocuments: vi.fn() } }));
vi.mock("../../models/GroupWalk.js", async (importOriginal) => ({
  ...(await importOriginal()),
  default: { countDocuments: vi.fn() },
}));

const NOW = new Date("2030-05-01T10:00:00Z");

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ["Date"], now: NOW });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("getSocialSummary", () => {
  it("counts friend requests to me and open invitations awaiting my answer", async () => {
    Friendship.countDocuments.mockResolvedValue(2);
    GroupWalk.countDocuments.mockResolvedValue(3);

    const summary = await getSocialSummary("me");

    expect(Friendship.countDocuments).toHaveBeenCalledWith({ recipient: "me", status: "pending" });
    expect(GroupWalk.countDocuments).toHaveBeenCalledWith({
      participants: { $elemMatch: { user: "me", status: "invited" } },
      status: "scheduled",
      scheduledAt: { $gte: NOW },
    });
    expect(summary).toEqual({ pendingFriendRequests: 2, pendingInvitations: 3 });
  });
});
