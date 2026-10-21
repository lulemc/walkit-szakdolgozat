import * as walkSessionService from "../services/walkSessionService.js";
import { sendError } from "../utils/httpError.js";

export const recordWalk = async (req, res) => {
  try {
    const walk = await walkSessionService.recordWalk(req.user.id, req.body);
    res.status(201).json({ success: true, data: walk });
  } catch (error) {
    sendError(res, error, "Failed to save walk");
  }
};

export const listWalks = async (req, res) => {
  try {
    const walks = await walkSessionService.listWalks(req.user.id, req.query);
    res.json({ success: true, data: walks });
  } catch (error) {
    sendError(res, error, "Failed to load walks");
  }
};

export const getWalkStats = async (req, res) => {
  try {
    const stats = await walkSessionService.getWalkStats(req.user.id, req.query);
    res.json({ success: true, data: stats });
  } catch (error) {
    sendError(res, error, "Failed to load walk statistics");
  }
};

export const getWalk = async (req, res) => {
  try {
    const walk = await walkSessionService.getWalk(req.user.id, req.params.id);
    res.json({ success: true, data: walk });
  } catch (error) {
    sendError(res, error, "Failed to load walk");
  }
};
