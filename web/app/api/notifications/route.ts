import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { getAuthSession } from "@/lib/auth";
import Notification from "@/models/Notification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/notifications
 * Retrieves paginated notifications for the authenticated user.
 * Supports ?filter=all|unread|read (or ?unread=true) & ?page=1&limit=15
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session || !mongoose.isValidObjectId(session.userId)) {
      return NextResponse.json(
        { success: false, message: "Please log in to view your notifications." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const filterParam = searchParams.get("filter")?.toLowerCase() || "";
    const unreadParam = searchParams.get("unread");

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") || "15", 10) || 15)
    );
    const skip = (page - 1) * limit;

    await connectDB();

    const userObjectId = new mongoose.Types.ObjectId(session.userId);

    // Build query based on filter
    const query: Record<string, unknown> = { userId: userObjectId };

    if (filterParam === "unread" || unreadParam === "true") {
      query.isRead = false;
    } else if (filterParam === "read" || unreadParam === "false") {
      query.isRead = true;
    }

    // Execute queries in parallel for high performance
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ userId: userObjectId, isRead: false }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json(
      {
        success: true,
        notifications: notifications.map((n) => ({
          id: n._id.toString(),
          title: n.title,
          message: n.message,
          type: n.type,
          isRead: n.isRead,
          actionUrl: n.actionUrl,
          createdAt: n.createdAt,
          updatedAt: n.updatedAt,
        })),
        pagination: {
          total,
          unreadCount,
          page,
          limit,
          totalPages,
          hasMore: page < totalPages,
        },
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error("[Notifications API] GET error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to retrieve notifications. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications
 * Bulk clear notifications for the authenticated user.
 * Optional query parameter: ?scope=read|all (defaults to "read" to prevent accidental data loss).
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session || !mongoose.isValidObjectId(session.userId)) {
      return NextResponse.json(
        { success: false, message: "Please log in to clear your notifications." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope")?.toLowerCase() || "read";

    await connectDB();

    const userObjectId = new mongoose.Types.ObjectId(session.userId);

    const deleteFilter: Record<string, unknown> = { userId: userObjectId };

    if (scope === "read") {
      deleteFilter.isRead = true;
    }

    const result = await Notification.deleteMany(deleteFilter);

    return NextResponse.json(
      {
        success: true,
        message:
          scope === "all"
            ? `Cleared all ${result.deletedCount} notifications.`
            : `Cleared ${result.deletedCount} read notifications.`,
        deletedCount: result.deletedCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Notifications API] Bulk DELETE error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to clear notifications. Please try again." },
      { status: 500 }
    );
  }
}

