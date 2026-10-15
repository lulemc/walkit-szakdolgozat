import mongoose from "mongoose";
import { coordinateSchema, locationSchema } from "./Route.js";

export const PARTICIPANT_STATUSES = ["invited", "accepted", "declined"];

/**
 * A copy of the route at the time the walk was planned. Invitees can't read
 * the organiser's routes, and the walk must not change or break if the
 * organiser later renames or deletes the original route.
 */
const routeSnapshotSchema = new mongoose.Schema(
  {
    name: { type: String, default: null },
    type: { type: String, enum: ["circular", "point-to-point"], required: true },
    startLocation: { type: locationSchema, required: true },
    endLocation: { type: locationSchema, required: true },
    coordinates: { type: [coordinateSchema], required: true },
    totalDistance: { type: Number, required: true }, // meters
    estimatedDuration: { type: Number, required: true }, // minutes
    preferences: { type: Object, default: {} },
    elevationGain: { type: Number, default: 0 },
    elevationLoss: { type: Number, default: 0 },
    maxElevation: { type: Number, default: null },
    minElevation: { type: Number, default: null },
  },
  { _id: false },
);

const participantSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["organiser", "invitee"], default: "invitee" },
    status: { type: String, enum: PARTICIPANT_STATUSES, default: "invited" },
    invitedAt: { type: Date, default: Date.now },
    respondedAt: { type: Date },
  },
  { _id: false },
);

const groupWalkSchema = new mongoose.Schema(
  {
    organiser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // Informational only: the route may since have been deleted
    sourceRouteId: { type: mongoose.Schema.Types.ObjectId, ref: "Route" },
    route: { type: routeSnapshotSchema, required: true },
    title: { type: String, trim: true, maxlength: 80 },
    note: { type: String, trim: true, maxlength: 500 },
    scheduledAt: { type: Date, required: true }, // stored in UTC
    status: { type: String, enum: ["scheduled", "cancelled"], default: "scheduled" },
    cancelledAt: { type: Date },
    // Includes the organiser (accepted), so one query finds every walk a user is in
    participants: { type: [participantSchema], default: [] },
  },
  { timestamps: true },
);

groupWalkSchema.index({ "participants.user": 1, scheduledAt: 1 });
groupWalkSchema.index({ organiser: 1, scheduledAt: -1 });

const GroupWalk = mongoose.model("GroupWalk", groupWalkSchema);
export default GroupWalk;
