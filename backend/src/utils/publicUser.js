/** The fields of a user that the API sends to the user themselves */
const PUBLIC_FIELDS = [
  "_id",
  "name",
  "email",
  "dateOfBirth",
  "sex",
  "height",
  "weight",
  "activityLevel",
  "createdAt",
  "updatedAt",
];

/**
 * The user as the API returns it to themselves (login, register, profile).
 * An allowlist, so a field added to the model later isn't sent by accident.
 */
export const toPublicUser = (user) => {
  const fields = typeof user.toObject === "function" ? user.toObject() : user;
  return Object.fromEntries(
    PUBLIC_FIELDS.filter((field) => fields[field] !== undefined).map((field) => [field, fields[field]]),
  );
};
