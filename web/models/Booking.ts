
import mongoose, { Schema, Model } from "mongoose";

export interface IBookingPassenger {
  name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
}

export interface IBooking {
  userId: mongoose.Types.ObjectId;
  bookingReference: string;
  trainNumber: string;
  trainName: string;
  from: string;
  to: string;
  journeyDate: string;
  passengers: IBookingPassenger[];
  passengerCount: number;
  coach: string;
  seats: string[];
  totalFare: number;
  status: "confirmed" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

const PassengerSchema = new Schema<IBookingPassenger>(
  {
    name: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 1, max: 120 },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },
  },
  { _id: false }
);

const BookingSchema = new Schema<IBooking>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    bookingReference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    trainNumber: { type: String, required: true, trim: true },
    trainName: { type: String, required: true, trim: true },
    from: { type: String, required: true, trim: true },
    to: { type: String, required: true, trim: true },
    journeyDate: { type: String, required: true },
    passengers: {
      type: [PassengerSchema],
      required: true,
      validate: {
        validator: (value: IBookingPassenger[]) =>
          value.length >= 1 && value.length <= 6,
        message: "A booking must have 1 to 6 passengers.",
      },
    },
    passengerCount: { type: Number, required: true, min: 1, max: 6 },
    coach: { type: String, required: true, trim: true },
    seats: {
      type: [String],
      required: true,
      validate: {
        validator: (value: string[]) =>
          value.length >= 1 && value.length <= 6 &&
          new Set(value).size === value.length,
        message: "Seats must be unique and match passenger count.",
      },
    },
    totalFare: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["confirmed", "cancelled"],
      default: "confirmed",
      required: true,
    },
  },
  { timestamps: true }
);

const Booking: Model<IBooking> =
  (mongoose.models.Booking as Model<IBooking>) ||
  mongoose.model<IBooking>("Booking", BookingSchema);

export default Booking;
