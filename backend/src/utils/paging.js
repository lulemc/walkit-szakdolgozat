import { HttpError } from "./httpError.js";

/**
 * Reads `?before=&limit=` for a list that pages backwards in time: `before`
 * is the oldest date already loaded. Throws 400 for values that don't fit.
 */
export const parsePage = ({ before, limit } = {}, { defaultLimit, maxLimit }) => {
  let beforeDate;
  if (before !== undefined) {
    beforeDate = new Date(before);
    if (Number.isNaN(beforeDate.getTime())) throw new HttpError(400, "before must be a date");
  }

  const pageSize = limit === undefined ? defaultLimit : Number(limit);
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > maxLimit) {
    throw new HttpError(400, `limit must be a whole number from 1 to ${maxLimit}`);
  }

  return { before: beforeDate, limit: pageSize };
};
