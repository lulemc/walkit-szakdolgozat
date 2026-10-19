export const DELETED_USER_NAME = "Deleted user";

/**
 * The public part of a (populated) user: id and name only. A reference to an
 * account that no longer exists populates as null and is shown as "Deleted user".
 */
export const toUserSummary = (user) =>
  user ? { _id: user._id, name: user.name } : { _id: null, name: DELETED_USER_NAME };
