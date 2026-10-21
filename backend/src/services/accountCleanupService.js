import Friendship from "../models/Friendship.js";
import GroupWalk from "../models/GroupWalk.js";
import GroupWalkComment from "../models/GroupWalkComment.js";
import Route from "../models/Route.js";
import WalkSession from "../models/WalkSession.js";

/**
 * Removes a user's data before their account is deleted, so nothing points
 * at a missing user afterwards. Every step is idempotent: if one fails, the
 * whole deletion can simply be run again.
 *
 * Walks the user organised that already happened are kept for the other
 * participants; the organiser then shows as "Deleted user".
 */
export const deleteUserData = async (userId) => {
  const now = new Date();

  const friendships = await Friendship.deleteMany({
    $or: [{ requester: userId }, { recipient: userId }],
  });
  const comments = await GroupWalkComment.deleteMany({ author: userId });
  const routes = await Route.deleteMany({ userId });
  const walkSessions = await WalkSession.deleteMany({ user: userId });

  const cancelledWalks = await GroupWalk.updateMany(
    { organiser: userId, status: "scheduled", scheduledAt: { $gte: now } },
    { $set: { status: "cancelled", cancelledAt: now } },
  );
  const leftWalks = await GroupWalk.updateMany(
    { organiser: { $ne: userId }, "participants.user": userId },
    { $pull: { participants: { user: userId } } },
  );

  return {
    friendships: friendships.deletedCount,
    comments: comments.deletedCount,
    routes: routes.deletedCount,
    walkSessions: walkSessions.deletedCount,
    cancelledWalks: cancelledWalks.modifiedCount,
    leftWalks: leftWalks.modifiedCount,
  };
};
