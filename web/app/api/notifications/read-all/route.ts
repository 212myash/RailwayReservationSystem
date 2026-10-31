import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { getAuthSession } from "@/lib/auth";
import Notification from "@/models/Notification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * PATCH /api/notifications/read-all
 * Marks all unread notifications belonging to the authenticated user as read.
 */
export async function PATCH() {
  try {
    const session = await getAuthSession();

    if (!session || !mongoose.isValidObjectId(session.userId)) {
      return NextResponse.json(
        { success: false, message: "Please log in to update notifications." },
        { status: 401 }
      );
    }

    await connectDB();

    const userObjectId = new mongoose.Types.ObjectId(session.userId);

    const result = await Notification.updateMany(
      { userId: userObjectId, isRead: false },
      { $set: { isRead: true } }
    );

    return NextResponse.json(
      {
        success: true,
        message: "All notifications marked as read.",
        modifiedCount: result.modifiedCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Notifications API] PATCH read-all error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to mark notifications as read." },
      { status: 500 }
    );
  }
}

