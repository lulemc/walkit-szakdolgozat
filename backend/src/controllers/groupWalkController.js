import * as groupWalkService from "../services/groupWalkService.js";
import * as commentService from "../services/groupWalkCommentService.js";
import * as summaryService from "../services/socialSummaryService.js";
import { sendError } from "../utils/httpError.js";

export const createGroupWalk = async (req, res) => {
  try {
    const walk = await groupWalkService.createGroupWalk(req.user.id, req.body);
    res.status(201).json({ success: true, data: walk });
  } catch (error) {
    sendError(res, error, "Failed to create group walk");
  }
};

export const listGroupWalks = async (req, res) => {
  try {
    const walks = await groupWalkService.listGroupWalks(
      req.user.id,
      req.query.scope ?? "upcoming",
    );
    res.json({ success: true, data: walks });
  } catch (error) {
    sendError(res, error, "Failed to load group walks");
  }
};

export const getGroupWalk = async (req, res) => {
  try {
    const walk = await groupWalkService.getGroupWalk(req.user.id, req.params.id);
    res.json({ success: true, data: walk });
  } catch (error) {
    sendError(res, error, "Failed to load group walk");
  }
};

export const updateGroupWalk = async (req, res) => {
  try {
    const walk = await groupWalkService.updateGroupWalk(req.user.id, req.params.id, req.body);
    res.json({ success: true, data: walk });
  } catch (error) {
    sendError(res, error, "Failed to update group walk");
  }
};

export const cancelGroupWalk = async (req, res) => {
  try {
    const walk = await groupWalkService.cancelGroupWalk(req.user.id, req.params.id);
    res.json({ success: true, data: walk });
  } catch (error) {
    sendError(res, error, "Failed to cancel group walk");
  }
};

export const inviteToGroupWalk = async (req, res) => {
  try {
    const walk = await groupWalkService.inviteToGroupWalk(
      req.user.id,
      req.params.id,
      req.body.userIds,
    );
    res.json({ success: true, data: walk });
  } catch (error) {
    sendError(res, error, "Failed to invite to group walk");
  }
};

export const removeGroupWalkParticipant = async (req, res) => {
  try {
    const walk = await groupWalkService.removeParticipant(
      req.user.id,
      req.params.id,
      req.params.userId,
    );
    res.json({ success: true, data: walk });
  } catch (error) {
    sendError(res, error, "Failed to remove participant");
  }
};

export const respondToGroupWalk = async (req, res) => {
  try {
    const result = await groupWalkService.respondToGroupWalk(
      req.user.id,
      req.params.id,
      req.body.status,
    );
    res.json({ success: true, data: result });
  } catch (error) {
    sendError(res, error, "Failed to respond to group walk");
  }
};

export const listGroupWalkComments = async (req, res) => {
  try {
    const { before, limit } = req.query;
    const comments = await commentService.listComments(req.user.id, req.params.id, {
      before,
      limit,
    });
    res.json({ success: true, data: comments });
  } catch (error) {
    sendError(res, error, "Failed to load comments");
  }
};

export const addGroupWalkComment = async (req, res) => {
  try {
    const comment = await commentService.addComment(req.user.id, req.params.id, req.body.text);
    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    sendError(res, error, "Failed to add comment");
  }
};

export const deleteGroupWalkComment = async (req, res) => {
  try {
    await commentService.deleteComment(req.user.id, req.params.id, req.params.commentId);
    res.json({ success: true, message: "Comment deleted" });
  } catch (error) {
    sendError(res, error, "Failed to delete comment");
  }
};

/** Counts for the Social tab's badge */
export const getSocialSummary = async (req, res) => {
  try {
    const summary = await summaryService.getSocialSummary(req.user.id);
    res.json({ success: true, data: summary });
  } catch (error) {
    sendError(res, error, "Failed to load social summary");
  }
};
