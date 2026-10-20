/**
 * Input rules shared by registration, profile updates and the User model.
 * Each check returns a message for the user, or null when the value is fine.
 */

export const MIN_PASSWORD_LENGTH = 8;
export const NAME_MAX_LENGTH = 50;

export const NAME_REQUIRED_MESSAGE = "Name can't be empty";
export const NAME_TOO_LONG_MESSAGE = `Name can be at most ${NAME_MAX_LENGTH} characters`;

// something@something.tld without spaces; a basic sanity check, not full RFC validation
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const passwordProblem = (password) =>
  typeof password === "string" && password.length >= MIN_PASSWORD_LENGTH
    ? null
    : `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`;

export const emailProblem = (email) =>
  typeof email === "string" && EMAIL_PATTERN.test(email)
    ? null
    : "Please enter a valid email address";

export const nameProblem = (name) => {
  const trimmed = typeof name === "string" ? name.trim() : "";
  if (!trimmed) return NAME_REQUIRED_MESSAGE;
  if (trimmed.length > NAME_MAX_LENGTH) return NAME_TOO_LONG_MESSAGE;
  return null;
};

/**
 * For the one-off migration in scripts/fixUserNames.js: accounts created before
 * names were required get the same placeholder the API already shows for them;
 * names over the limit are only reported, since shortening them is a person's call.
 */
export const planNameFixes = (users, placeholder = "Unnamed user") => {
  const fill = [];
  const tooLong = [];
  for (const user of users) {
    const problem = nameProblem(user.name);
    if (problem === NAME_REQUIRED_MESSAGE) fill.push({ _id: user._id, to: placeholder });
    if (problem === NAME_TOO_LONG_MESSAGE) tooLong.push({ _id: user._id, name: user.name });
  }
  return { fill, tooLong };
};
