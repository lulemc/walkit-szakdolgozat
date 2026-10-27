import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { normalizeEmail } from "../utils/email.js";
import { generateToken } from "../utils/generateToken.js";
import { HttpError } from "../utils/httpError.js";
import { toPublicUser } from "../utils/publicUser.js";
import { emailProblem, nameProblem, passwordProblem } from "../utils/validation.js";

// Errors are thrown and turned into responses by middleware/errorHandler.js

const loggedIn = (user) => ({ token: generateToken(user), user: toPublicUser(user) });

export const register = async (req, res) => {
  const { password } = req.body;
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  const email = normalizeEmail(req.body.email);

  // The app's form asks for all three; this also covers direct API calls
  if (!name || !email || !password) {
    throw new HttpError(400, "Name, email and password are required");
  }
  const problem = nameProblem(name) ?? emailProblem(email) ?? passwordProblem(password);
  if (problem) throw new HttpError(400, problem);

  if (await User.findOne({ email })) throw new HttpError(400, "User already exists");

  const user = await User.create({
    name,
    email,
    passwordHash: await bcrypt.hash(password, 10),
  });

  res.status(201).json({ success: true, data: loggedIn(user) });
};

export const login = async (req, res) => {
  const { password } = req.body;
  const email = normalizeEmail(req.body.email);
  if (!email || !password) throw new HttpError(400, "Email and password are required");

  const user = await User.findOne({ email });
  // The same answer for an unknown email and a wrong password
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new HttpError(400, "Invalid credentials");
  }

  res.json({ success: true, data: loggedIn(user) });
};
