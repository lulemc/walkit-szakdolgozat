// routes/walkRoutes.js
import express from "express";
import { getWalk, getWalkStats, listWalks, recordWalk } from "../controllers/walkSessionController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Documented in config/swagger.js under the "Walks" tag.
// /stats must be declared above /:id, which would otherwise treat it as an id.
router.get("/stats", protect, getWalkStats);
router.post("/", protect, recordWalk);
router.get("/", protect, listWalks);
router.get("/:id", protect, getWalk);

export default router;
