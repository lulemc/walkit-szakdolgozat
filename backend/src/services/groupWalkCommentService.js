import mongoose from "mongoose";
import GroupWalk from "../models/GroupWalk.js";
import GroupWalkComment, { MAX_COMMENT_LENGTH } from "../models/GroupWalkComment.js";
import { HttpError } from "../utils/httpError.js";
import { sameId } from "../utils/ids.js";

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;

const walkNotFound = () => new HttpError(404, "Group walk not found");
const commentNotFound = () => new HttpError(404, "Comment not found");

/** Loads a walk the user takes part in (any status); outsiders get 404 */
const findWalkForParticipant = async (userId, walkId) => {
  if (!mongoose.isValidObjectId(walkId)) throw walkNotFound();
  const walk = await GroupWalk.findOne({ _id: walkId, "participants.user": userId })
    .select("organiser status participants")
    .lean();
  if (!walk) throw walkNotFound();
  return walk;
};

const parsePageOptions = ({ before, limit } = {}) => {
  let beforeDate;
  if (before !== undefined) {
    beforeDate = new Date(before);
    if (Number.isNaN(beforeDate.getTime())) throw new HttpError(400, "before must be a date");
  }

  const pageSize = limit === undefined ? DEFAULT_PAGE_SIZE : Number(limit);
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
    throw new HttpError(400, `limit must be a whole number from 1 to ${MAX_PAGE_SIZE}`);
  }

  return { beforeDate, pageSize };
};

const toComment = (comment) => ({
  _id: comment._id,
  author: comment.author ? { _id: comment.author._id, name: comment.author.name } : null,
  text: comment.text,
  createdAt: comment.createdAt,
});

/**
 * Comments on a walk, newest first. Pass the oldest loaded comment's
 * createdAt as `before` to load the next older page.
 */
export const listComments = async (userId, walkId, options) => {
  if (!mongoose.isValidObjectId(walkId)) throw walkNotFound();
  const { beforeDate, pageSize } = parsePageOptions(options);
  await findWalkForParticipant(userId, walkId);

  const comments = await GroupWalkComment.find({
    groupWalk: walkId,
    ...(beforeDate && { createdAt: { $lt: beforeDate } }),
  })
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .populate("author", "name")
    .lean();

  return comments.map(toComment);
};

/** Participants who haven't declined can comment, also after the walk; not on cancelled walks */
export const addComment = async (userId, walkId, rawText) => {
  const walk = await findWalkForParticipant(userId, walkId);

  const me = walk.participants.find((participant) => sameId(participant.user, userId));
  if (me?.status === "declined") {
    throw new HttpError(403, "Participants who declined can't comment");
  }
  if (walk.status === "cancelled") {
    throw new HttpError(400, "Comments are closed on cancelled walks");
  }

  const text = typeof rawText === "string" ? rawText.trim() : "";
  if (text.length === 0 || text.length > MAX_COMMENT_LENGTH) {
    throw new HttpError(400, `Comment text must be 1 to ${MAX_COMMENT_LENGTH} characters`);
  }

  const created = await GroupWalkComment.create({ groupWalk: walkId, author: userId, text });
  const comment = await GroupWalkComment.findById(created._id).populate("author", "name").lean();

  return toComment(comment);
};

/** The comment's author or the walk's organiser can delete it */
export const deleteComment = async (userId, walkId, commentId) => {
  if (!mongoose.isValidObjectId(commentId)) throw commentNotFound();
  const walk = await findWalkForParticipant(userId, walkId);

  const comment = await GroupWalkComment.findOne({ _id: commentId, groupWalk: walkId }).lean();
  if (!comment) throw commentNotFound();

  if (!sameId(comment.author, userId) && !sameId(walk.organiser, userId)) {
    throw new HttpError(403, "Only the author or the organiser can delete this comment");
  }

  await GroupWalkComment.deleteOne({ _id: commentId });
};
