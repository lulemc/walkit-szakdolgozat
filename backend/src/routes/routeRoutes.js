import express from "express";
import {
  generateRoute,
  getUserRoutes,
  getRoute,
  deleteRoute,
} from "../controllers/routeController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Routes
 *   description: Walking route generation and management
 */

/**
 * @swagger
 * /api/routes/generate:
 *   post:
 *     summary: Generate a new walking route
 *     tags: [Routes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - startLocation
 *               - distance
 *               - routeType
 *             properties:
 *               startLocation:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                     example: 47.4979
 *                   longitude:
 *                     type: number
 *                     example: 19.0402
 *               destinationLocation:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *               distance:
 *                 type: number
 *                 example: 5
 *                 description: Target distance in kilometers
 *               routeType:
 *                 type: string
 *                 enum: [circular, point-to-point]
 *                 example: circular
 *               preferences:
 *                 type: object
 *                 properties:
 *                   parks:
 *                     type: boolean
 *                     example: true
 *                   waterfront:
 *                     type: boolean
 *                     example: true
 *                   avoidHighways:
 *                     type: boolean
 *                     example: true
 *                   scenic:
 *                     type: boolean
 *                     example: false
 *     responses:
 *       201:
 *         description: Route generated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
router.post("/generate", protect, generateRoute);

/**
 * @swagger
 * /api/routes/user/{userId}:
 *   get:
 *     summary: Get all routes for a user
 *     tags: [Routes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Routes retrieved successfully
 *       403:
 *         description: Forbidden
 */
router.get("/user/:userId", protect, getUserRoutes);

/**
 * @swagger
 * /api/routes/{routeId}:
 *   get:
 *     summary: Get a single route by ID
 *     tags: [Routes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: routeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Route retrieved successfully
 *       404:
 *         description: Route not found
 */
router.get("/:routeId", protect, getRoute);

/**
 * @swagger
 * /api/routes/{routeId}:
 *   delete:
 *     summary: Delete a route
 *     tags: [Routes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: routeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Route deleted successfully
 *       404:
 *         description: Route not found
 */
router.delete("/:routeId", protect, deleteRoute);

export default router;
