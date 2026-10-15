/**
 * Compares two ids that may be strings, ObjectIds or populated documents.
 */
export const sameId = (a, b) => String(a?._id ?? a) === String(b?._id ?? b);
