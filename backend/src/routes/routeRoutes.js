// backend/src/routes/routes.js
// UPDATED: Added favorites endpoints with Swagger documentation

import express from "express";
import {
  generateRoute,
  getUserRoutes,
  getRoute,
  deleteRoute,
  addToFavorites,
  removeFromFavorites,
  getFavoriteRoutes,
  updateRouteName,
  recordWalkCompletion,
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
 *                   uphill:
 *                     type: boolean
 *                     example: false
 *                   mountain:
 *                     type: boolean
 *                     example: false
 *                   quietStreets:
 *                     type: boolean
 *                     example: false
 *                   beach:
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
 * /api/routes/favorites/list:
 *   get:
 *     summary: Get all favorite routes for the authenticated user
 *     tags: [Routes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Favorite routes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Route'
 *                 count:
 *                   type: number
 *                   example: 5
 *       401:
 *         description: Unauthorized
 */
router.get("/favorites/list", protect, getFavoriteRoutes);

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

/**
 * @swagger
 * /api/routes/{routeId}/favorite:
 *   post:
 *     summary: Add a route to favorites
 *     tags: [Routes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: routeId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the route to favorite
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "My Morning Jog"
 *                 description: Optional custom name for the route
 *     responses:
 *       200:
 *         description: Route added to favorites successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Route added to favorites"
 *                 data:
 *                   $ref: '#/components/schemas/Route'
 *       404:
 *         description: Route not found
 *       401:
 *         description: Unauthorized
 */
router.post("/:routeId/favorite", protect, addToFavorites);

/**
 * @swagger
 * /api/routes/{routeId}/favorite:
 *   delete:
 *     summary: Remove a route from favorites
 *     tags: [Routes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: routeId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the route to unfavorite
 *     responses:
 *       200:
 *         description: Route removed from favorites successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Route removed from favorites"
 *                 data:
 *                   $ref: '#/components/schemas/Route'
 *       404:
 *         description: Route not found
 *       401:
 *         description: Unauthorized
 */
router.delete("/:routeId/favorite", protect, removeFromFavorites);

/**
 * @swagger
 * /api/routes/{routeId}/name:
 *   patch:
 *     summary: Update route name
 *     tags: [Routes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: routeId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the route to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Evening Walk in the Park"
 *                 description: New name for the route
 *     responses:
 *       200:
 *         description: Route name updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Route name updated"
 *                 data:
 *                   $ref: '#/components/schemas/Route'
 *       400:
 *         description: Invalid request - name is required
 *       404:
 *         description: Route not found
 *       401:
 *         description: Unauthorized
 */
router.patch("/:routeId/name", protect, updateRouteName);

/**
 * @swagger
 * /api/routes/{routeId}/complete:
 *   post:
 *     summary: Record walk completion for a route
 *     tags: [Routes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: routeId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the completed route
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               actualDistance:
 *                 type: number
 *                 example: 5200
 *                 description: Actual distance walked in meters
 *               actualDuration:
 *                 type: number
 *                 example: 62
 *                 description: Actual duration in minutes
 *     responses:
 *       200:
 *         description: Walk completion recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Walk recorded"
 *                 data:
 *                   type: object
 *                   properties:
 *                     walkCount:
 *                       type: number
 *                       example: 3
 *                     lastWalkedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-20T10:30:00Z"
 *       404:
 *         description: Route not found
 *       401:
 *         description: Unauthorized
 */
router.post("/:routeId/complete", protect, recordWalkCompletion);

/**
 * @swagger
 * components:
 *   schemas:
 *     Route:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         userId:
 *           type: string
 *           example: "507f1f77bcf86cd799439012"
 *         name:
 *           type: string
 *           example: "Morning Jog"
 *         type:
 *           type: string
 *           enum: [circular, point-to-point]
 *           example: circular
 *         startLocation:
 *           type: object
 *           properties:
 *             latitude:
 *               type: number
 *               example: 47.4979
 *             longitude:
 *               type: number
 *               example: 19.0402
 *             address:
 *               type: string
 *               example: "Budapest, Hungary"
 *         endLocation:
 *           type: object
 *           properties:
 *             latitude:
 *               type: number
 *             longitude:
 *               type: number
 *             address:
 *               type: string
 *         coordinates:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *         totalDistance:
 *           type: number
 *           example: 5000
 *           description: Distance in meters
 *         estimatedDuration:
 *           type: number
 *           example: 60
 *           description: Duration in minutes
 *         preferenceScore:
 *           type: number
 *           example: 85
 *           minimum: 0
 *           maximum: 100
 *         preferences:
 *           type: object
 *           properties:
 *             parks:
 *               type: boolean
 *             waterfront:
 *               type: boolean
 *             avoidHighways:
 *               type: boolean
 *             scenic:
 *               type: boolean
 *             uphill:
 *               type: boolean
 *             mountain:
 *               type: boolean
 *             quietStreets:
 *               type: boolean
 *             beach:
 *               type: boolean
 *         isFavorite:
 *           type: boolean
 *           example: true
 *         favoritedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-20T10:30:00Z"
 *         lastWalkedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-20T10:30:00Z"
 *         walkCount:
 *           type: number
 *           example: 3
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

export default router;
