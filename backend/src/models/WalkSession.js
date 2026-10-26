import mongoose from "mongoose";
import { coordinateSchema } from "./Route.js";

/** One stretch of the walked path between two pauses */
const segmentSchema = new mongoose.Schema(
  { points: { type: [coordinateSchema], default: [] } },
  { _id: false },
);

/** A walk somebody finished: how far, how long and where they went */
const walkSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // The saved route that was walked, if any (a free walk or a group walk has none)
    route: { type: mongoose.Schema.Types.ObjectId, ref: "Route", default: null },
    groupWalk: { type: mongoose.Schema.Types.ObjectId, ref: "GroupWalk", default: null },
    // Copied when saving, so the history keeps its names if the route is renamed or deleted
    name: { type: String, trim: true, maxlength: 100, default: null },
    startedAt: { type: Date, required: true },
    endedAt: { type: Date, required: true },
    // Time actually walking, without pauses
    durationSec: { type: Number, required: true, min: 0 },
    distanceM: { type: Number, required: true, min: 0 },
    path: { type: [segmentSchema], default: [] },
  },
  { timestamps: true },
);

walkSessionSchema.index({ user: 1, startedAt: -1 });

const WalkSession = mongoose.model("WalkSession", walkSessionSchema);
export default WalkSession;
