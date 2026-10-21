import jwt from "jsonwebtoken";

/**
 * The login token for a user. It carries the user's token version, which
 * changes when the password changes, so older tokens stop working (see protect).
 */
export const generateToken = (user) =>
  jwt.sign({ id: user._id, tokenVersion: user.tokenVersion ?? 0 }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
