import mongoose from "mongoose";

const coordinateSchema = new mongoose.Schema(
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

const locationSchema = new mongoose.Schema(
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
    // NEW: Favorites support
    isFavorite: {
      type: Boolean,
      default: false,
      index: true, // Index for efficient queries
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

// Compound index for efficient favorite queries
routeSchema.index({ userId: 1, isFavorite: 1, favoritedAt: -1 });

// Compound index for recent routes
routeSchema.index({ userId: 1, createdAt: -1 });

const Route = mongoose.model("Route", routeSchema);

export default Route;
