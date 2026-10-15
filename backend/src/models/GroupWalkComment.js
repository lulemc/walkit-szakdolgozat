import mongoose from "mongoose";

export const MAX_COMMENT_LENGTH = 500;

/**
 * A comment on a group walk. Kept in its own collection (not inside the walk)
 * so comments can be paged and don't make the walk document grow.
 */
const groupWalkCommentSchema = new mongoose.Schema(
  {
    groupWalk: { type: mongoose.Schema.Types.ObjectId, ref: "GroupWalk", required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, trim: true, required: true, maxlength: MAX_COMMENT_LENGTH },
  },
  { timestamps: true },
);

groupWalkCommentSchema.index({ groupWalk: 1, createdAt: -1 });

const GroupWalkComment = mongoose.model("GroupWalkComment", groupWalkCommentSchema);
export default GroupWalkComment;
