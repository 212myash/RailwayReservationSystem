import mongoose, { Schema, Model } from "mongoose";

export type SeatStatus = "available" | "locked" | "booked";

export interface ISeatInventory {
  trainNumber: string;
  journeyDate: string; // "YYYY-MM-DD"
  coachId: string; // e.g. "S1", "B1", "A1", "H1"
  coachClass: string; // "SL", "3A", "2A", "1A", "CC", "2S"
  seatNumber: number; // 1 to 108
  berthType: string; // "LB", "MB", "UB", "SL", "SU", "CABIN_LB", etc.
  status: SeatStatus;
  lockedUntil?: Date | null;
  lockedBy?: string | null; // userId or session ID
  bookingReference?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const SeatInventorySchema = new Schema<ISeatInventory>(
  {
    trainNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    journeyDate: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    coachId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    coachClass: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    seatNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    berthType: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["available", "locked", "booked"],
      default: "available",
      required: true,
    },
    lockedUntil: {
      type: Date,
      default: null,
    },
    lockedBy: {
      type: String,
      default: null,
    },
    bookingReference: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { timestamps: true }
);

// Compound unique index ensuring no seat can be duplicated for a train/journey/coach
SeatInventorySchema.index(
  { trainNumber: 1, journeyDate: 1, coachId: 1, seatNumber: 1 },
  { unique: true }
);

SeatInventorySchema.index({
  trainNumber: 1,
  journeyDate: 1,
  coachId: 1,
  status: 1,
});

SeatInventorySchema.index(
  { bookingReference: 1 },
  { sparse: true }
);

SeatInventorySchema.index({ status: 1, lockedUntil: 1 });

const SeatInventory: Model<ISeatInventory> =
  (mongoose.models.SeatInventory as Model<ISeatInventory>) ||
  mongoose.model<ISeatInventory>("SeatInventory", SeatInventorySchema);

export default SeatInventory;
