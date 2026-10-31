import mongoose, { Schema, Model } from "mongoose";

export type NotificationType =
  | "booking_confirmed"
  | "booking_cancelled"
  | "journey_reminder"
  | "password_changed"
  | "system_announcement";

export interface INotification {
  userId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  actionUrl?: string | null;
  dedupKey?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "userId is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "title is required"],
      trim: true,
      minlength: 1,
      maxlength: 140,
    },
    message: {
      type: String,
      required: [true, "message is required"],
      trim: true,
      minlength: 1,
      maxlength: 500,
    },
    type: {
      type: String,
      required: [true, "type is required"],
      enum: [
        "booking_confirmed",
        "booking_cancelled",
        "journey_reminder",
        "password_changed",
        "system_announcement",
      ],
      default: "system_announcement",
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    actionUrl: {
      type: String,
      trim: true,
      default: null,
      maxlength: 255,
    },
    dedupKey: {
      type: String,
      trim: true,
      default: null,
      maxlength: 120,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying user notifications sorted by recent date
NotificationSchema.index({ userId: 1, createdAt: -1 });

// Compound index for counting / filtering unread notifications
NotificationSchema.index({ userId: 1, isRead: 1 });

// Sparse unique index to prevent duplicate notifications during retries
NotificationSchema.index(
  { userId: 1, dedupKey: 1 },
  { unique: true, sparse: true }
);

const Notification: Model<INotification> =
  (mongoose.models.Notification as Model<INotification>) ||
  mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;
