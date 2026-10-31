import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { getAuthSession } from "@/lib/auth";
import Notification from "@/models/Notification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * PATCH /api/notifications/[id]
 * Updates read status of a specific notification owned by the authenticated user.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();

    if (!session || !mongoose.isValidObjectId(session.userId)) {
      return NextResponse.json(
        { success: false, message: "Please log in to update notifications." },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid notification ID." },
        { status: 400 }
      );
    }

    let isRead = true;
    try {
      const body = await request.json();
      if (typeof body.isRead === "boolean") {
        isRead = body.isRead;
      }
    } catch {
      // Body is optional; default is marking as read (true)
      isRead = true;
    }

    await connectDB();

    const userObjectId = new mongoose.Types.ObjectId(session.userId);
    const notificationId = new mongoose.Types.ObjectId(id);

    // Atomically find and update strictly checking userId ownership
    const updated = await Notification.findOneAndUpdate(
      { _id: notificationId, userId: userObjectId },
      { $set: { isRead } },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      // Check if it exists under another user to return 404 (not disclosing existence)
      return NextResponse.json(
        { success: false, message: "Notification not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        notification: {
          id: updated._id.toString(),
          title: updated.title,
          message: updated.message,
          type: updated.type,
          isRead: updated.isRead,
          actionUrl: updated.actionUrl,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Notifications API] PATCH [id] error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to update notification." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications/[id]
 * Deletes a single notification strictly owned by the authenticated user.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();

    if (!session || !mongoose.isValidObjectId(session.userId)) {
      return NextResponse.json(
        { success: false, message: "Please log in to delete notifications." },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid notification ID." },
        { status: 400 }
      );
    }

    await connectDB();

    const userObjectId = new mongoose.Types.ObjectId(session.userId);
    const notificationId = new mongoose.Types.ObjectId(id);

    // Atomically delete only if matching both ID and userId
    const deleted = await Notification.findOneAndDelete({
      _id: notificationId,
      userId: userObjectId,
    }).lean();

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Notification not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Notification deleted successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Notifications API] DELETE [id] error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to delete notification." },
      { status: 500 }
    );
  }
}

