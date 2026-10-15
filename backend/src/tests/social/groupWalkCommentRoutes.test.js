import { describe, it, expect, vi, beforeEach } from "vitest";
import * as groupWalkService from "../../services/groupWalkService.js";
import * as commentService from "../../services/groupWalkCommentService.js";
import * as summaryService from "../../services/socialSummaryService.js";
import { protect } from "../../middleware/authMiddleware.js";
import app from "../../app.js";
import { inject } from "../helpers/inject.js";

vi.mock("../../middleware/authMiddleware.js", () => ({
  protect: vi.fn((req, res, next) => {
    req.user = { id: "me" };
    next();
  }),
  requireSelf: vi.fn((req, res, next) => next()),
}));

vi.mock("../../services/groupWalkService.js", () => ({
  createGroupWalk: vi.fn(),
  listGroupWalks: vi.fn(),
  getGroupWalk: vi.fn(),
  updateGroupWalk: vi.fn(),
  cancelGroupWalk: vi.fn(),
  inviteToGroupWalk: vi.fn(),
  removeParticipant: vi.fn(),
  respondToGroupWalk: vi.fn(),
}));
vi.mock("../../services/groupWalkCommentService.js", () => ({
  listComments: vi.fn(),
  addComment: vi.fn(),
  deleteComment: vi.fn(),
}));
vi.mock("../../services/socialSummaryService.js", () => ({ getSocialSummary: vi.fn() }));

beforeEach(() => {
  vi.clearAllMocks();
  summaryService.getSocialSummary.mockResolvedValue({ pendingFriendRequests: 0, pendingInvitations: 0 });
  commentService.listComments.mockResolvedValue([]);
  commentService.addComment.mockResolvedValue({});
});

describe("group walk comment and summary routes", () => {
  it("serves /summary itself instead of treating 'summary' as a walk id", async () => {
    const res = await inject(app, { url: "/api/group-walks/summary" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      data: { pendingFriendRequests: 0, pendingInvitations: 0 },
    });
    expect(summaryService.getSocialSummary).toHaveBeenCalledWith("me");
    expect(groupWalkService.getGroupWalk).not.toHaveBeenCalled();
    expect(protect).toHaveBeenCalled();
  });

  it("lists comments with paging from the query string", async () => {
    const res = await inject(app, { url: "/api/group-walks/w1/comments?limit=5" });

    expect(res.status).toBe(200);
    expect(commentService.listComments).toHaveBeenCalledWith("me", "w1", {
      before: undefined,
      limit: "5",
    });
  });

  it("adds a comment", async () => {
    const res = await inject(app, {
      method: "POST",
      url: "/api/group-walks/w1/comments",
      body: { text: "Hi" },
    });

    expect(res.status).toBe(201);
    expect(commentService.addComment).toHaveBeenCalledWith("me", "w1", "Hi");
  });

  it("deletes a comment", async () => {
    const res = await inject(app, { method: "DELETE", url: "/api/group-walks/w1/comments/c1" });

    expect(res.status).toBe(200);
    expect(commentService.deleteComment).toHaveBeenCalledWith("me", "w1", "c1");
  });
});
