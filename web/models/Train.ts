import mongoose, { Schema, Model } from "mongoose";

export interface ITrainStop {
  stationCode: string;
  stationName: string;
  arrivalTime: string;
  departureTime: string;
  haltMinutes: number;
  dayCount: number;
}

export interface ITrain {
  trainNumber: string;
  trainName: string;
  source: string;
  sourceCode?: string;
  destination: string;
  destinationCode?: string;
  departure: string;
  arrival: string;
  duration: string;
  fare: number;
  totalSeats: number;
  availableSeats: number;
  coachTypes: string[];
  runsOn: string[];
  category?: string;
  stops?: ITrainStop[];
  isDemo?: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TrainStopSchema = new Schema<ITrainStop>(
  {
    stationCode: { type: String, required: true, uppercase: true, trim: true },
    stationName: { type: String, required: true, trim: true },
    arrivalTime: { type: String, required: true, trim: true },
    departureTime: { type: String, required: true, trim: true },
    haltMinutes: { type: Number, default: 2, min: 0 },
    dayCount: { type: Number, default: 1, min: 1 },
  },
  { _id: false }
);

const TrainSchema = new Schema<ITrain>(
  {
    trainNumber: {
      type: String,
      required: [true, "Train number is required"],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    trainName: {
      type: String,
      required: [true, "Train name is required"],
      trim: true,
      maxlength: 120,
    },
    source: {
      type: String,
      required: [true, "Source station is required"],
      trim: true,
      maxlength: 80,
    },
    sourceCode: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 10,
    },
    destination: {
      type: String,
      required: [true, "Destination station is required"],
      trim: true,
      maxlength: 80,
    },
    destinationCode: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 10,
    },
    departure: {
      type: String,
      required: [true, "Departure time is required"],
      trim: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Departure time must be in HH:mm format"],
    },
    arrival: {
      type: String,
      required: [true, "Arrival time is required"],
      trim: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Arrival time must be in HH:mm format"],
    },
    duration: {
      type: String,
      required: [true, "Duration is required"],
      trim: true,
      default: "4h 00m",
    },
    fare: {
      type: Number,
      required: [true, "Fare is required"],
      min: [0, "Fare must be positive"],
      default: 500,
    },
    totalSeats: {
      type: Number,
      required: true,
      min: 1,
      default: 72,
    },
    availableSeats: {
      type: Number,
      required: true,
      min: 0,
      default: 72,
    },
    coachTypes: {
      type: [String],
      default: ["SL", "3A", "2A", "CC"],
    },
    runsOn: {
      type: [String],
      default: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    },
    category: {
      type: String,
      trim: true,
      default: "Express",
    },
    stops: {
      type: [TrainStopSchema],
      default: [],
    },
    isDemo: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

TrainSchema.index({ source: 1, destination: 1, isActive: 1 });
TrainSchema.index({ sourceCode: 1, destinationCode: 1, isActive: 1 });
TrainSchema.index({ "stops.stationCode": 1 });

const Train: Model<ITrain> =
  (mongoose.models.Train as Model<ITrain>) ||
  mongoose.model<ITrain>("Train", TrainSchema);

export default Train;
