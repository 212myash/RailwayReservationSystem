import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Notification, { NotificationType } from "@/models/Notification";

export type CreateNotificationParams = {
  userId: string | mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  actionUrl?: string | null;
  dedupKey?: string | null;
  metadata?: Record<string, unknown>;
};

/**
 * Creates a persistent notification for a user.
 * Idempotent: If a dedupKey is provided, subsequent calls with the same key for the same user
 * will be safely ignored without raising duplicate key errors.
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    const { userId, title, message, type, actionUrl, dedupKey, metadata } = params;

    if (!userId || !mongoose.isValidObjectId(userId.toString())) {
      console.warn("[Notification] Skipped: invalid userId", userId);
      return null;
    }

    await connectDB();

    const userObjectId = new mongoose.Types.ObjectId(userId.toString());

    // If dedupKey is supplied, check existence first to avoid duplicate notifications
    if (dedupKey) {
      const existing = await Notification.findOne({
        userId: userObjectId,
        dedupKey: dedupKey.trim(),
      }).lean();

      if (existing) {
        return existing;
      }
    }

    const notification = await Notification.create({
      userId: userObjectId,
      title: title.trim().slice(0, 140),
      message: message.trim().slice(0, 500),
      type,
      actionUrl: actionUrl?.trim() || null,
      dedupKey: dedupKey?.trim() || null,
      metadata: metadata || undefined,
      isRead: false,
    });

    return notification;
  } catch (error: unknown) {
    // Mongo duplicate key error (11000) on unique index { userId: 1, dedupKey: 1 }
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: number }).code === 11000
    ) {
      console.info("[Notification] Duplicate notification ignored via dedupKey.");
      return null;
    }

    console.error("[Notification] Failed to create notification:", error);
    return null;
  }
}

/**
 * Architecture helper for Journey Reminders.
 * Designed to be called by a cron scheduler or serverless task runner.
 * Computes window hours and emits a notification with a deterministic dedupKey.
 */
export async function createJourneyReminder({
  userId,
  bookingReference,
  trainName,
  trainNumber,
  from,
  to,
  journeyDate,
  windowHours,
}: {
  userId: string;
  bookingReference: string;
  trainName: string;
  trainNumber: string;
  from: string;
  to: string;
  journeyDate: string;
  windowHours: 24 | 2;
}) {
  const dedupKey = `reminder_${windowHours}h_${bookingReference}`;
  const title = `Journey Reminder: ${windowHours} Hours to Departure`;
  const message = `Your journey on ${trainName} (${trainNumber}) from ${from} to ${to} is scheduled for ${journeyDate}. Please arrive at the station on time. Reference: ${bookingReference}.`;

  return createNotification({
    userId,
    title,
    message,
    type: "journey_reminder",
    actionUrl: `/pnr-status?pnr=${encodeURIComponent(bookingReference)}`,
    dedupKey,
    metadata: {
      bookingReference,
      journeyDate,
      windowHours,
    },
  });
}

/**
 * System announcement helper for admin actions.
 * Safely creates an announcement notification for a specific user.
 */
export async function createSystemAnnouncement({
  userId,
  title,
  message,
  actionUrl,
}: {
  userId: string;
  title: string;
  message: string;
  actionUrl?: string;
}) {
  return createNotification({
    userId,
    title,
    message,
    type: "system_announcement",
    actionUrl: actionUrl || null,
    dedupKey: null,
  });
}
