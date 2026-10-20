import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select("-passwordHash");

      if (!req.user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Tokens from before the last password change (older tokens have no version: 0)
      if ((decoded.tokenVersion ?? 0) !== (req.user.tokenVersion ?? 0)) {
        return res
          .status(401)
          .json({ message: "Your session has expired. Please log in again." });
      }

      next();
    } catch {
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

export const requireSelf = (req, res, next) => {
  if (req.params.id !== req.user._id.toString()) {
    return res.status(403).json({ message: "Forbidden" });
  }

  next();
};
