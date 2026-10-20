export const DELETED_USER_NAME = "Deleted user";
export const UNNAMED_USER_NAME = "Unnamed user";

/** The name to show for a user; accounts created without one still get text */
export const displayName = (user) => user.name?.trim() || UNNAMED_USER_NAME;

/**
 * The public part of a (populated) user: id and name only. A reference to an
 * account that no longer exists populates as null and is shown as "Deleted user".
 */
export const toUserSummary = (user) =>
  user ? { _id: user._id, name: displayName(user) } : { _id: null, name: DELETED_USER_NAME };
