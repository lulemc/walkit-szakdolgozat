import mongoose from "mongoose";

/**
 * A friend request and, once accepted, the friendship itself.
 * Declining, cancelling and unfriending delete the document, so a new
 * request can be sent later.
 */
const friendshipSchema = new mongoose.Schema(
  {
    requester: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // Both user ids sorted and joined, so A->B and B->A share one key
    pairKey: { type: String, required: true },
    status: { type: String, enum: ["pending", "accepted"], default: "pending" },
    acceptedAt: { type: Date },
  },
  { timestamps: true },
);

friendshipSchema.index({ pairKey: 1 }, { unique: true });
friendshipSchema.index({ recipient: 1, status: 1 });
friendshipSchema.index({ requester: 1, status: 1 });

const Friendship = mongoose.model("Friendship", friendshipSchema);
export default Friendship;
