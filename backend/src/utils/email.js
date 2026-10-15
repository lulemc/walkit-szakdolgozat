/**
 * Canonical form used to store and look up email addresses, so "John@X.com "
 * and "john@x.com" are the same account. Non-strings pass through untouched
 * so the caller's validation can reject them.
 */
export const normalizeEmail = (email) =>
  typeof email === "string" ? email.trim().toLowerCase() : email;

/**
 * Works out how to normalise existing users' emails without breaking the
 * unique index: accounts whose emails differ only by case are reported as
 * collisions and left unchanged, so a person can decide which one to keep.
 *
 * @param {{ _id: unknown, email?: string | null }[]} users
 * @returns {{
 *   updates: { _id: unknown, from: string, to: string }[],
 *   collisions: { email: string, users: { _id: unknown, email: string }[] }[]
 * }}
 */
export const planEmailNormalisation = (users) => {
  const byNormalisedEmail = new Map();

  for (const user of users) {
    if (typeof user.email !== "string") continue;
    const key = normalizeEmail(user.email);
    if (!byNormalisedEmail.has(key)) byNormalisedEmail.set(key, []);
    byNormalisedEmail.get(key).push({ _id: user._id, email: user.email });
  }

  const updates = [];
  const collisions = [];

  for (const [email, group] of byNormalisedEmail) {
    if (group.length > 1) {
      collisions.push({ email, users: group });
    } else if (group[0].email !== email) {
      updates.push({ _id: group[0]._id, from: group[0].email, to: email });
    }
  }

  return { updates, collisions };
};
