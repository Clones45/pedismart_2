import mongoose from "mongoose";

const AccuracyLogSchema = new mongoose.Schema(
  {
    metric: {
      type: String,
      required: true,
      enum: ["OTP_VALIDATION", "FSM_TRANSITION", "GPS_ACCURACY", "WS_DELIVERY", "WS_EMIT", "WS_RECEIVE"],
    },
    success: {
      type: Boolean,
      default: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      description: "Numerical value (e.g., GPS accuracy in meters) or other payload",
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    rideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

export default mongoose.model("AccuracyLog", AccuracyLogSchema);
