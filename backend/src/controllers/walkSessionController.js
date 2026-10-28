import * as walkSessionService from "../services/walkSessionService.js";

// Errors are passed on to middleware/errorHandler.js

export const recordWalk = async (req, res) => {
  const walk = await walkSessionService.recordWalk(req.user.id, req.body);
  res.status(201).json({ success: true, data: walk });
};

export const listWalks = async (req, res) => {
  const walks = await walkSessionService.listWalks(req.user.id, req.query);
  res.json({ success: true, data: walks });
};

export const getWalkStats = async (req, res) => {
  const stats = await walkSessionService.getWalkStats(req.user.id, req.query);
  res.json({ success: true, data: stats });
};

export const getWalkActivity = async (req, res) => {
  const activity = await walkSessionService.getWalkActivity(req.user.id, req.query);
  res.json({ success: true, data: activity });
};

export const getWalk = async (req, res) => {
  const walk = await walkSessionService.getWalk(req.user.id, req.params.id);
  res.json({ success: true, data: walk });
};
