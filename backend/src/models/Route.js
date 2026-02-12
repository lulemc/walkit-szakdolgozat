import mongoose from "mongoose";

const coordinateSchema = new mongoose.Schema(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
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
      trim: true,
    },
    type: {
      type: String,
      enum: ["circular", "point-to-point"],
      required: true,
    },
    startLocation: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      address: { type: String, required: true },
    },
    endLocation: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      address: { type: String, required: true },
    },
    coordinates: {
      type: [coordinateSchema],
      required: true,
      validate: {
        validator: function (arr) {
          return arr.length >= 2;
        },
        message: "Route must have at least 2 coordinates",
      },
    },
    totalDistance: {
      type: Number,
      required: true,
      min: 0,
    },
    estimatedDuration: {
      type: Number,
      required: true,
      min: 0,
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
    },
    elevationGain: {
      type: Number,
      default: 0,
      min: 0,
    },
    elevationLoss: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxElevation: {
      type: Number,
      default: null,
    },
    minElevation: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true },
);

routeSchema.index({ userId: 1, createdAt: -1 });
routeSchema.index({ type: 1 });
routeSchema.index({ "preferences.uphill": 1 });
routeSchema.index({ "preferences.mountain": 1 });

routeSchema.virtual("distanceKm").get(function () {
  return (this.totalDistance / 1000).toFixed(2);
});

routeSchema.virtual("totalElevationChange").get(function () {
  return this.elevationGain + this.elevationLoss;
});

routeSchema.set("toJSON", { virtuals: true });

const Route = mongoose.model("Route", routeSchema);
export default Route;
