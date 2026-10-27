import { describe, it, expect, vi, beforeEach } from "vitest";
import * as commentService from "../../services/groupWalkCommentService.js";
import * as summaryService from "../../services/socialSummaryService.js";
import { HttpError } from "../../utils/httpError.js";
import {
  listGroupWalkComments,
  addGroupWalkComment,
  deleteGroupWalkComment,
  getSocialSummary,
} from "../../controllers/groupWalkController.js";

vi.mock("../../services/groupWalkCommentService.js", () => ({
  listComments: vi.fn(),
  addComment: vi.fn(),
  deleteComment: vi.fn(),
}));
vi.mock("../../services/socialSummaryService.js", () => ({ getSocialSummary: vi.fn() }));

const mockRes = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn(),
});

const user = { id: "me" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("groupWalkController: comments and summary", () => {
  it("lists comments with the paging options from the query", async () => {
    const comments = [{ _id: "c1", text: "Hi" }];
    commentService.listComments.mockResolvedValue(comments);
    const res = mockRes();

    await listGroupWalkComments(
      { user, params: { id: "w1" }, query: { before: "2030-05-01T09:00:00Z", limit: "5" } },
      res,
    );

    expect(commentService.listComments).toHaveBeenCalledWith("me", "w1", {
      before: "2030-05-01T09:00:00Z",
      limit: "5",
    });
    expect(res.json).toHaveBeenCalledWith({ success: true, data: comments });
  });

  it("adds a comment and responds 201", async () => {
    const comment = { _id: "c2", text: "On my way" };
    commentService.addComment.mockResolvedValue(comment);
    const res = mockRes();

    await addGroupWalkComment({ user, params: { id: "w1" }, body: { text: "On my way" } }, res);

    expect(commentService.addComment).toHaveBeenCalledWith("me", "w1", "On my way");
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: comment });
  });

  it("deletes a comment", async () => {
    const res = mockRes();

    await deleteGroupWalkComment({ user, params: { id: "w1", commentId: "c1" } }, res);

    expect(commentService.deleteComment).toHaveBeenCalledWith("me", "w1", "c1");
    expect(res.json).toHaveBeenCalledWith({ success: true, message: "Comment deleted" });
  });

  it("returns the badge counts", async () => {
    summaryService.getSocialSummary.mockResolvedValue({ pendingFriendRequests: 1, pendingInvitations: 2 });
    const res = mockRes();

    await getSocialSummary({ user }, res);

    expect(summaryService.getSocialSummary).toHaveBeenCalledWith("me");
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { pendingFriendRequests: 1, pendingInvitations: 2 },
    });
  });

  it.each([
    ["a service HttpError", new HttpError(403, "Participants who declined can't comment")],
    ["an unexpected error", new Error("connection lost")],
  ])("leaves %s to the error handler", async (_case, error) => {
    commentService.addComment.mockRejectedValue(error);

    await expect(
      addGroupWalkComment({ user, params: { id: "w1" }, body: { text: "Hi" } }, mockRes()),
    ).rejects.toBe(error);
  });
});
