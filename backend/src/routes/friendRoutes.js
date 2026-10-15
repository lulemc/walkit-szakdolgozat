// routes/friendRoutes.js
import express from "express";
import {
  listFriends,
  listRequests,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  unfriend,
} from "../controllers/friendController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Documented in config/swagger.js under the "Friends" tag
router.get("/", protect, listFriends);
router.get("/requests", protect, listRequests);
router.post("/requests", protect, sendFriendRequest);
router.post("/requests/:id/accept", protect, acceptFriendRequest);
router.post("/requests/:id/decline", protect, declineFriendRequest);
router.delete("/requests/:id", protect, cancelFriendRequest);
router.delete("/:userId", protect, unfriend);

export default router;
