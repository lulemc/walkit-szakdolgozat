// routes/groupWalkRoutes.js
import express from "express";
import {
  createGroupWalk,
  listGroupWalks,
  getGroupWalk,
  updateGroupWalk,
  cancelGroupWalk,
  inviteToGroupWalk,
  removeGroupWalkParticipant,
  respondToGroupWalk,
  listGroupWalkComments,
  addGroupWalkComment,
  deleteGroupWalkComment,
  getSocialSummary,
} from "../controllers/groupWalkController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Documented in config/swagger.js under the "Group Walks" tag.
// Fixed paths must be declared above /:id, which would otherwise treat them as an id.
router.get("/summary", protect, getSocialSummary);

router.post("/", protect, createGroupWalk);
router.get("/", protect, listGroupWalks);
router.get("/:id", protect, getGroupWalk);
router.patch("/:id", protect, updateGroupWalk);
router.post("/:id/cancel", protect, cancelGroupWalk);
router.post("/:id/invites", protect, inviteToGroupWalk);
router.delete("/:id/participants/:userId", protect, removeGroupWalkParticipant);
router.post("/:id/respond", protect, respondToGroupWalk);

router.get("/:id/comments", protect, listGroupWalkComments);
router.post("/:id/comments", protect, addGroupWalkComment);
router.delete("/:id/comments/:commentId", protect, deleteGroupWalkComment);

export default router;
