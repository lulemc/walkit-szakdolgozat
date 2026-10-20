import User from "../models/User.js";
import Friendship from "../models/Friendship.js";
import { HttpError } from "../utils/httpError.js";
import { normalizeEmail } from "../utils/email.js";
import { pairKey } from "./friendshipService.js";
import { displayName } from "../utils/userSummary.js";

export const MAX_RESULTS = 20;
export const MIN_QUERY_LENGTH = 2;

// So a query like ".*" matches the literal characters, not every name
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const relationshipOf = (friendship, userId) => {
  if (!friendship) return "none";
  if (friendship.status === "accepted") return "friends";
  return String(friendship.requester) === String(userId) ? "outgoing" : "incoming";
};

/**
 * Finds other users by name (partial, case-insensitive) or by exact email
 * when the query contains "@". Results contain only id and name - never the
 * email - plus how the searcher is related to each user.
 */
export const searchUsers = async (userId, rawQuery) => {
  const q = typeof rawQuery === "string" ? rawQuery.trim() : "";
  if (q.length < MIN_QUERY_LENGTH) {
    throw new HttpError(400, `Search query must be at least ${MIN_QUERY_LENGTH} characters`);
  }

  const match = q.includes("@")
    ? { email: normalizeEmail(q) }
    : { name: { $regex: escapeRegex(q), $options: "i" } };

  const users = await User.find({ _id: { $ne: userId }, ...match })
    .select("name")
    .sort({ name: 1 })
    .limit(MAX_RESULTS)
    .lean();

  if (users.length === 0) return [];

  const friendships = await Friendship.find({
    pairKey: { $in: users.map((user) => pairKey(userId, user._id)) },
  })
    .select("pairKey requester status")
    .lean();
  const byPair = new Map(friendships.map((friendship) => [friendship.pairKey, friendship]));

  return users.map((user) => {
    const friendship = byPair.get(pairKey(userId, user._id));
    return {
      _id: user._id,
      name: displayName(user),
      relationship: relationshipOf(friendship, userId),
      ...(friendship && { friendshipId: friendship._id }),
    };
  });
};
