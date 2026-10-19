import mongoose from "mongoose";
import Friendship from "../models/Friendship.js";
import User from "../models/User.js";
import { HttpError } from "../utils/httpError.js";
import { sameId } from "../utils/ids.js";
import { toUserSummary } from "../utils/userSummary.js";

export const MAX_OUTGOING_PENDING = 50;

const DUPLICATE_KEY = 11000;

/** The same key for A->B and B->A, used by the unique index */
export const pairKey = (userA, userB) => [String(userA), String(userB)].sort().join("_");

const otherUser = (friendship, userId) =>
  sameId(friendship.requester, userId) ? friendship.recipient : friendship.requester;

const acceptedBy = (userId) => ({
  status: "accepted",
  $or: [{ requester: userId }, { recipient: userId }],
});

export const areFriends = async (userA, userB) =>
  Boolean(await Friendship.exists({ pairKey: pairKey(userA, userB), status: "accepted" }));

export const getFriendIds = async (userId) => {
  const friendships = await Friendship.find(acceptedBy(userId)).select("requester recipient").lean();
  return friendships.map((friendship) => otherUser(friendship, userId));
};

export const listFriends = async (userId) => {
  const friendships = await Friendship.find(acceptedBy(userId))
    .populate("requester", "name")
    .populate("recipient", "name")
    .sort({ acceptedAt: -1 })
    .lean();

  return friendships.map((friendship) => ({
    friendshipId: friendship._id,
    user: toUserSummary(otherUser(friendship, userId)),
    since: friendship.acceptedAt,
  }));
};

export const listRequests = async (userId) => {
  const [incoming, outgoing] = await Promise.all([
    Friendship.find({ recipient: userId, status: "pending" })
      .populate("requester", "name")
      .sort({ createdAt: -1 })
      .lean(),
    Friendship.find({ requester: userId, status: "pending" })
      .populate("recipient", "name")
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  return {
    incoming: incoming.map((request) => ({
      _id: request._id,
      user: toUserSummary(request.requester),
      createdAt: request.createdAt,
    })),
    outgoing: outgoing.map((request) => ({
      _id: request._id,
      user: toUserSummary(request.recipient),
      createdAt: request.createdAt,
    })),
  };
};

const accept = async (friendship) => {
  friendship.status = "accepted";
  friendship.acceptedAt = new Date();
  await friendship.save();
  return friendship;
};

/**
 * Sends a friend request. If the other user already asked me, that request
 * is accepted instead of creating a second one.
 */
export const sendRequest = async (requesterId, recipientId) => {
  if (!recipientId) {
    throw new HttpError(400, "userId is required");
  }
  if (sameId(requesterId, recipientId)) {
    throw new HttpError(400, "You can't send a friend request to yourself");
  }
  if (!mongoose.isValidObjectId(recipientId) || !(await User.exists({ _id: recipientId }))) {
    throw new HttpError(404, "User not found");
  }

  const key = pairKey(requesterId, recipientId);
  const existing = await Friendship.findOne({ pairKey: key });

  if (existing?.status === "accepted") {
    throw new HttpError(409, "You are already friends");
  }
  if (existing && sameId(existing.requester, requesterId)) {
    throw new HttpError(409, "Friend request already sent");
  }
  if (existing) {
    return { friendship: await accept(existing), autoAccepted: true };
  }

  const outgoingPending = await Friendship.countDocuments({
    requester: requesterId,
    status: "pending",
  });
  if (outgoingPending >= MAX_OUTGOING_PENDING) {
    throw new HttpError(429, "Too many pending friend requests");
  }

  try {
    const friendship = await Friendship.create({
      requester: requesterId,
      recipient: recipientId,
      pairKey: key,
    });
    return { friendship, autoAccepted: false };
  } catch (error) {
    // Both users sent a request at the same moment
    if (error.code === DUPLICATE_KEY) {
      throw new HttpError(409, "Friend request already exists");
    }
    throw error;
  }
};

const requestNotFound = () => new HttpError(404, "Friend request not found");

export const acceptRequest = async (userId, requestId) => {
  if (!mongoose.isValidObjectId(requestId)) throw requestNotFound();

  const request = await Friendship.findOne({ _id: requestId, recipient: userId, status: "pending" });
  if (!request) throw requestNotFound();

  return accept(request);
};

export const declineRequest = async (userId, requestId) => {
  if (!mongoose.isValidObjectId(requestId)) throw requestNotFound();

  const deleted = await Friendship.findOneAndDelete({
    _id: requestId,
    recipient: userId,
    status: "pending",
  });
  if (!deleted) throw requestNotFound();
};

export const cancelRequest = async (userId, requestId) => {
  if (!mongoose.isValidObjectId(requestId)) throw requestNotFound();

  const deleted = await Friendship.findOneAndDelete({
    _id: requestId,
    requester: userId,
    status: "pending",
  });
  if (!deleted) throw requestNotFound();
};

export const unfriend = async (userId, friendId) => {
  const notFriends = new HttpError(404, "You are not friends with this user");
  if (!mongoose.isValidObjectId(friendId)) throw notFriends;

  const deleted = await Friendship.findOneAndDelete({
    pairKey: pairKey(userId, friendId),
    status: "accepted",
  });
  if (!deleted) throw notFriends;
};
