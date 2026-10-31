import mongoose, { Schema, Model } from "mongoose";
import { CoachClass } from "@/lib/coach-templates";

export interface ICoachEntry {
  coachId: string;
  coachClass: CoachClass;
  sequence: number;
  layoutTemplateId: string;
  totalCapacity: number;
  isActive: boolean;
}

export interface ICoachConfiguration {
  trainNumber: string;
  coaches: ICoachEntry[];
  totalCoaches: number;
  totalCapacity: number;
  configurationSource: "demo" | "verified";
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const CoachEntrySchema = new Schema<ICoachEntry>(
  {
    coachId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    coachClass: {
      type: String,
      enum: ["SL", "3A", "2A", "1A", "CC", "2S"],
      required: true,
    },
    sequence: {
      type: Number,
      required: true,
      min: 1,
    },
    layoutTemplateId: {
      type: String,
      required: true,
      trim: true,
    },
    totalCapacity: {
      type: Number,
      required: true,
      min: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const CoachConfigurationSchema = new Schema<ICoachConfiguration>(
  {
    trainNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    coaches: {
      type: [CoachEntrySchema],
      required: true,
      validate: {
        validator: (value: ICoachEntry[]) =>
          Array.isArray(value) && value.length > 0,
        message: "A train must have at least one coach configured.",
      },
    },
    totalCoaches: {
      type: Number,
      required: true,
      min: 1,
    },
    totalCapacity: {
      type: Number,
      required: true,
      min: 1,
    },
    configurationSource: {
      type: String,
      enum: ["demo", "verified"],
      default: "demo",
      required: true,
    },
    version: {
      type: Number,
      default: 1,
      required: true,
    },
  },
  { timestamps: true }
);

CoachConfigurationSchema.index({ "coaches.coachClass": 1 });
CoachConfigurationSchema.index({ configurationSource: 1 });

const CoachConfiguration: Model<ICoachConfiguration> =
  (mongoose.models.CoachConfiguration as Model<ICoachConfiguration>) ||
  mongoose.model<ICoachConfiguration>(
    "CoachConfiguration",
    CoachConfigurationSchema
  );

export default CoachConfiguration;
