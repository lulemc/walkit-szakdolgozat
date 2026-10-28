import * as friendshipService from "../services/friendshipService.js";
import { notifyFriendAccepted, notifyFriendRequest } from "../services/socialNotifications.js";

// Errors are passed on to middleware/errorHandler.js.
// Notifications are sent after the response and never fail the request.

export const listFriends = async (req, res) => {
  const friends = await friendshipService.listFriends(req.user.id);
  res.json({ success: true, data: friends });
};

export const listRequests = async (req, res) => {
  const requests = await friendshipService.listRequests(req.user.id);
  res.json({ success: true, data: requests });
};

export const sendFriendRequest = async (req, res) => {
  const { friendship, autoAccepted } = await friendshipService.sendRequest(
    req.user.id,
    req.body.userId,
  );
  res.status(autoAccepted ? 200 : 201).json({
    success: true,
    data: friendship,
    message: autoAccepted ? "Friend request accepted" : "Friend request sent",
  });
  // Accepting automatically means the other user had asked first
  if (autoAccepted) void notifyFriendAccepted(friendship.requester, req.user.name);
  else void notifyFriendRequest(friendship.recipient, req.user.name);
};

export const acceptFriendRequest = async (req, res) => {
  const friendship = await friendshipService.acceptRequest(req.user.id, req.params.id);
  res.json({ success: true, data: friendship, message: "Friend request accepted" });
  void notifyFriendAccepted(friendship.requester, req.user.name);
};

export const declineFriendRequest = async (req, res) => {
  await friendshipService.declineRequest(req.user.id, req.params.id);
  res.json({ success: true, message: "Friend request declined" });
};

export const cancelFriendRequest = async (req, res) => {
  await friendshipService.cancelRequest(req.user.id, req.params.id);
  res.json({ success: true, message: "Friend request cancelled" });
};

export const unfriend = async (req, res) => {
  await friendshipService.unfriend(req.user.id, req.params.userId);
  res.json({ success: true, message: "Friend removed" });
};
