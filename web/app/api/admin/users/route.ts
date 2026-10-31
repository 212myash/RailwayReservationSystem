import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAdminSession } from "@/lib/auth";
import User from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Administrator privileges required." },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const role = searchParams.get("role")?.trim().toLowerCase() || "all";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "15", 10) || 15));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    if (role === "user" || role === "admin") {
      filter.role = role;
    }

    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ name: regex }, { email: regex }];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-password")
        .lean(),
      User.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json(
      {
        success: true,
        users: users.map((u) => ({
          id: u._id.toString(),
          name: u.name,
          email: u.email,
          role: u.role,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
        })),
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasMore: page < totalPages,
        },
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("[Admin API] GET /users error:", error);
    return NextResponse.json({ success: false, message: "Unable to retrieve users." }, { status: 500 });
  }
}

