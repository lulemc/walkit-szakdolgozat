import * as groupWalkService from "../services/groupWalkService.js";
import * as commentService from "../services/groupWalkCommentService.js";
import * as summaryService from "../services/socialSummaryService.js";

// Errors are passed on to middleware/errorHandler.js

export const createGroupWalk = async (req, res) => {
  const walk = await groupWalkService.createGroupWalk(req.user.id, req.body);
  res.status(201).json({ success: true, data: walk });
};

export const listGroupWalks = async (req, res) => {
  const walks = await groupWalkService.listGroupWalks(
    req.user.id,
    req.query.scope ?? "upcoming",
  );
  res.json({ success: true, data: walks });
};

export const getGroupWalk = async (req, res) => {
  const walk = await groupWalkService.getGroupWalk(req.user.id, req.params.id);
  res.json({ success: true, data: walk });
};

export const updateGroupWalk = async (req, res) => {
  const walk = await groupWalkService.updateGroupWalk(req.user.id, req.params.id, req.body);
  res.json({ success: true, data: walk });
};

export const cancelGroupWalk = async (req, res) => {
  const walk = await groupWalkService.cancelGroupWalk(req.user.id, req.params.id);
  res.json({ success: true, data: walk });
};

export const inviteToGroupWalk = async (req, res) => {
  const walk = await groupWalkService.inviteToGroupWalk(
    req.user.id,
    req.params.id,
    req.body.userIds,
  );
  res.json({ success: true, data: walk });
};

export const removeGroupWalkParticipant = async (req, res) => {
  const walk = await groupWalkService.removeParticipant(
    req.user.id,
    req.params.id,
    req.params.userId,
  );
  res.json({ success: true, data: walk });
};

export const respondToGroupWalk = async (req, res) => {
  const result = await groupWalkService.respondToGroupWalk(
    req.user.id,
    req.params.id,
    req.body.status,
  );
  res.json({ success: true, data: result });
};

export const listGroupWalkComments = async (req, res) => {
  const { before, limit } = req.query;
  const comments = await commentService.listComments(req.user.id, req.params.id, {
    before,
    limit,
  });
  res.json({ success: true, data: comments });
};

export const addGroupWalkComment = async (req, res) => {
  const comment = await commentService.addComment(req.user.id, req.params.id, req.body.text);
  res.status(201).json({ success: true, data: comment });
};

export const deleteGroupWalkComment = async (req, res) => {
  await commentService.deleteComment(req.user.id, req.params.id, req.params.commentId);
  res.json({ success: true, message: "Comment deleted" });
};

/** Counts for the Social tab's badge */
export const getSocialSummary = async (req, res) => {
  const summary = await summaryService.getSocialSummary(req.user.id);
  res.json({ success: true, data: summary });
};
