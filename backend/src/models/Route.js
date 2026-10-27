import mongoose from "mongoose";

// Shared with the route copy stored in a GroupWalk
export const coordinateSchema = new mongoose.Schema(
  {
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
  },
  { _id: false },
);

export const locationSchema = new mongoose.Schema(
  {
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
  },
  { _id: false },
);

const routeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      default: null,
    },
    type: {
      type: String,
      enum: ["circular", "point-to-point"],
      required: true,
    },
    startLocation: {
      type: locationSchema,
      required: true,
    },
    endLocation: {
      type: locationSchema,
      required: true,
    },
    coordinates: {
      type: [coordinateSchema],
      required: true,
    },
    totalDistance: {
      type: Number,
      required: true,
    },
    estimatedDuration: {
      type: Number,
      required: true,
    },
    preferenceScore: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    preferences: {
      parks: { type: Boolean, default: false },
      waterfront: { type: Boolean, default: false },
      avoidHighways: { type: Boolean, default: false },
      scenic: { type: Boolean, default: false },
      uphill: { type: Boolean, default: false },
      mountain: { type: Boolean, default: false },
      quietStreets: { type: Boolean, default: false },
      beach: { type: Boolean, default: false },
    },
    elevationGain: {
      type: Number,
      default: 0,
    },
    elevationLoss: {
      type: Number,
      default: 0,
    },
    maxElevation: {
      type: Number,
      default: null,
    },
    minElevation: {
      type: Number,
      default: null,
    },
    // Generated routes are drafts until the user keeps them (favourite, name, walk,
    // group walk); drafts are removed after DRAFT_LIFETIME_DAYS by the TTL index below.
    // Routes from before drafts existed have no status and count as saved.
    status: {
      type: String,
      enum: ["draft", "saved"],
      default: "saved",
    },
    draftExpiresAt: {
      type: Date,
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    favoritedAt: {
      type: Date,
      default: null,
    },
    // Track when route was actually walked
    lastWalkedAt: {
      type: Date,
      default: null,
    },
    walkCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

// MongoDB deletes a draft once its draftExpiresAt has passed; saved routes have none
routeSchema.index({ draftExpiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for efficient favorite queries
routeSchema.index({ userId: 1, isFavorite: 1, favoritedAt: -1 });

// Compound index for recent routes
routeSchema.index({ userId: 1, createdAt: -1 });

export const DRAFT_LIFETIME_DAYS = 7;

/** When a route generated now expires, unless it is kept */
export const draftExpiry = () => new Date(Date.now() + DRAFT_LIFETIME_DAYS * 24 * 60 * 60 * 1000);

/** For updateOne: keeps a draft for good */
export const SAVE_ROUTE_UPDATE = { $set: { status: "saved" }, $unset: { draftExpiresAt: 1 } };

/** Keeps a draft for good, on a loaded document (save it afterwards) */
export const markSaved = (route) => {
  route.status = "saved";
  route.draftExpiresAt = undefined;
};

const Route = mongoose.model("Route", routeSchema);

export default Route;
