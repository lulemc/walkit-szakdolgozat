import * as groupWalkService from "../services/groupWalkService.js";
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
