import mongoose, { Schema, Model } from "mongoose";

export interface IStationCoordinates {
  latitude: number;
  longitude: number;
}

export interface IStation {
  code: string;
  name: string;
  city: string;
  state?: string;
  zone?: string;
  address?: string;
  coordinates?: IStationCoordinates;
  platforms?: number;
  isActive: boolean;
  source?: string;
  importedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const StationSchema = new Schema<IStation>(
  {
    code: {
      type: String,
      required: [true, "Station code is required"],
      unique: true,
      trim: true,
      uppercase: true,
      minlength: 1,
      maxlength: 12,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Station name is required"],
      trim: true,
      maxlength: 140,
    },
    city: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },
    state: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },
    zone: {
      type: String,
      trim: true,
      default: "",
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    coordinates: {
      latitude: { type: Number, default: 0 },
      longitude: { type: Number, default: 0 },
    },
    platforms: {
      type: Number,
      min: 1,
      default: 2,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    source: {
      type: String,
      trim: true,
      default: "github/prasenjit-27/Indian-Railway-Data",
    },
    importedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

StationSchema.index({ code: 1 });
StationSchema.index({ name: 1 });
StationSchema.index({ city: 1 });
StationSchema.index({ state: 1 });
StationSchema.index({ city: 1, state: 1, isActive: 1 });
StationSchema.index({ name: "text", city: "text", code: "text", state: "text" });

const Station: Model<IStation> =
  (mongoose.models.Station as Model<IStation>) ||
  mongoose.model<IStation>("Station", StationSchema);

export default Station;
