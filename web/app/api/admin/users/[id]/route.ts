import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { getAdminSession } from "@/lib/auth";
import User from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/users/[id]
 * Updates user role (admin/user) with lockout prevention.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Administrator privileges required." },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ success: false, message: "Invalid user ID." }, { status: 400 });
    }

    const body = await request.json();
    const newRole = body.role;

    if (newRole !== "user" && newRole !== "admin") {
      return NextResponse.json(
        { success: false, message: "Role must be either 'user' or 'admin'." },
        { status: 400 }
      );
    }

    // Lockout prevention: Admin cannot demote their own account!
    if (admin.userId === id && newRole === "user") {
      return NextResponse.json(
        { success: false, message: "Security guard: You cannot demote your own administrator account." },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ success: false, message: "User account not found." }, { status: 404 });
    }

    user.role = newRole;
    await user.save();

    return NextResponse.json({
      success: true,
      message: `User ${user.email} updated to ${user.role} role.`,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("[Admin API] PATCH /users/[id] error:", error);
    return NextResponse.json({ success: false, message: "Failed to update user." }, { status: 500 });
  }
}

