import express from "express";
import {
  getUserById,
  updateUser,
  deleteUser,
  changePassword,
  searchUsers,
  registerPushToken,
  removePushToken,
} from "../controllers/userController.js";
import { protect, requireSelf } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management
 */

// Must stay above the /:id routes, which would otherwise treat "search" as an id.
// Documented in config/swagger.js under the "Users" tag.
router.get("/search", protect, searchUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
router.get("/:id", protect, requireSelf, getUserById);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user
 *     description: Changing the email requires `currentPassword`; an email used by another account gives 409.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: User updated
 *       400:
 *         description: Invalid name, email, height or weight, or currentPassword missing for an email change
 *       401:
 *         description: Current password is incorrect
 *       409:
 *         description: Email already in use
 */
router.put("/:id", protect, requireSelf, updateUser);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user
 *     description: Also deletes the user's friendships, comments and routes, cancels their upcoming group walks and removes them from other walks.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: User deleted
 */
router.delete("/:id", protect, requireSelf, deleteUser);

/**
 * @swagger
 * /api/users/{id}/change-password:
 *   post:
 *     summary: Change user password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 */
router.post("/:id/change-password", protect, requireSelf, changePassword);

// Documented in config/swagger.js under the "Users" tag
router.post("/:id/push-tokens", protect, requireSelf, registerPushToken);
router.delete("/:id/push-tokens", protect, requireSelf, removePushToken);

export default router;
