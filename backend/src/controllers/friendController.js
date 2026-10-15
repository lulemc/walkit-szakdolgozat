import * as friendshipService from "../services/friendshipService.js";
import { HttpError } from "../utils/httpError.js";

/** Expected failures carry their own status; anything else is a 500 without internals */
const sendError = (res, error, fallbackMessage) => {
  if (error instanceof HttpError) {
    return res.status(error.status).json({ success: false, message: error.message });
  }
  console.error(`${fallbackMessage}:`, error);
  return res.status(500).json({ success: false, message: fallbackMessage });
};

export const listFriends = async (req, res) => {
  try {
    const friends = await friendshipService.listFriends(req.user.id);
    res.json({ success: true, data: friends });
  } catch (error) {
    sendError(res, error, "Failed to load friends");
  }
};

export const listRequests = async (req, res) => {
  try {
    const requests = await friendshipService.listRequests(req.user.id);
    res.json({ success: true, data: requests });
  } catch (error) {
    sendError(res, error, "Failed to load friend requests");
  }
};

export const sendFriendRequest = async (req, res) => {
  try {
    const { friendship, autoAccepted } = await friendshipService.sendRequest(
      req.user.id,
      req.body.userId,
    );
    res.status(autoAccepted ? 200 : 201).json({
      success: true,
      data: friendship,
      message: autoAccepted ? "Friend request accepted" : "Friend request sent",
    });
  } catch (error) {
    sendError(res, error, "Failed to send friend request");
  }
};

export const acceptFriendRequest = async (req, res) => {
  try {
    const friendship = await friendshipService.acceptRequest(req.user.id, req.params.id);
    res.json({ success: true, data: friendship, message: "Friend request accepted" });
  } catch (error) {
    sendError(res, error, "Failed to accept friend request");
  }
};

export const declineFriendRequest = async (req, res) => {
  try {
    await friendshipService.declineRequest(req.user.id, req.params.id);
    res.json({ success: true, message: "Friend request declined" });
  } catch (error) {
    sendError(res, error, "Failed to decline friend request");
  }
};

export const cancelFriendRequest = async (req, res) => {
  try {
    await friendshipService.cancelRequest(req.user.id, req.params.id);
    res.json({ success: true, message: "Friend request cancelled" });
  } catch (error) {
    sendError(res, error, "Failed to cancel friend request");
  }
};

export const unfriend = async (req, res) => {
  try {
    await friendshipService.unfriend(req.user.id, req.params.userId);
    res.json({ success: true, message: "Friend removed" });
  } catch (error) {
    sendError(res, error, "Failed to remove friend");
  }
};
