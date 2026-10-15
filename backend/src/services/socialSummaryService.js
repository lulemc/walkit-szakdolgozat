import Friendship from "../models/Friendship.js";
import GroupWalk from "../models/GroupWalk.js";
import { openInvitationsFilter } from "./groupWalkService.js";

/**
 * Counts for the app's Social badge: friend requests sent to me, and
 * invitations to upcoming walks that are still waiting for my answer.
 */
export const getSocialSummary = async (userId) => {
  const [pendingFriendRequests, pendingInvitations] = await Promise.all([
    Friendship.countDocuments({ recipient: userId, status: "pending" }),
    GroupWalk.countDocuments(openInvitationsFilter(userId)),
  ]);

  return { pendingFriendRequests, pendingInvitations };
};
