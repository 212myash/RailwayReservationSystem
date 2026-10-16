
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getAuthSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Please log in again." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const name =
      typeof body.name === "string" ? body.name.trim() : "";

    if (name.length < 2 || name.length > 80) {
      return NextResponse.json(
        {
          success: false,
          message: "Name 2 se 80 characters ke beech hona chahiye.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findByIdAndUpdate(
      session.userId,
      { $set: { name } },
      { new: true, runValidators: true }
    ).select("name email role");

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User account nahi mila." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Profile successfully update ho gaya.",
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error("Profile update error:", error);

    return NextResponse.json(
      { success: false, message: "Profile update nahi ho paya." },
      { status: 500 }
    );
  }
}
