import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAdminSession } from "@/lib/auth";
import Station from "@/models/Station";
import { ensureDefaultAdminData } from "@/lib/seed-admin-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/stations
 */
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
    await ensureDefaultAdminData();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const pageParam = parseInt(searchParams.get("page") || "1", 10);
    const page = Math.max(1, isNaN(pageParam) ? 1 : pageParam);
    const limitParam = searchParams.get("limit");
    const isAll = limitParam === "all";
    const limit = isAll ? 5000 : Math.min(Math.max(1, parseInt(limitParam || "50", 10)), 200);

    const filter: Record<string, unknown> = {};
    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ code: regex }, { name: regex }, { city: regex }, { state: regex }];
    }

    const total = await Station.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    const stations = await Station.find(filter)
      .sort({ code: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json(
      {
        success: true,
        stations: stations.map((s) => ({
          id: s._id.toString(),
          code: s.code,
          name: s.name,
          city: s.city,
          state: s.state || "",
          zone: s.zone || "",
          platforms: s.platforms || 2,
          isActive: s.isActive,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        })),
        total,
        page,
        totalPages,
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error("[Admin API] GET /stations error:", error);
    return NextResponse.json({ success: false, message: "Unable to retrieve stations." }, { status: 500 });
  }
}

/**
 * POST /api/admin/stations
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Administrator privileges required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const city = typeof body.city === "string" ? body.city.trim() : "";
    const state = typeof body.state === "string" ? body.state.trim() : "";
    const zone = typeof body.zone === "string" ? body.zone.trim() : "Northern Railway (NR)";
    const platforms = Number(body.platforms) || 2;

    if (!code || !name || !city || !state) {
      return NextResponse.json(
        { success: false, message: "Station code, name, city, and state are required." },
        { status: 400 }
      );
    }

    if (code.length < 2 || code.length > 10) {
      return NextResponse.json(
        { success: false, message: "Station code must be between 2 and 10 characters." },
        { status: 400 }
      );
    }

    await connectDB();

    const existing = await Station.findOne({ code }).lean();
    if (existing) {
      return NextResponse.json(
        { success: false, message: `Station with code "${code}" already exists.` },
        { status: 409 }
      );
    }

    const station = await Station.create({
      code,
      name,
      city,
      state,
      zone,
      platforms,
      isActive: true,
    });

    return NextResponse.json(
      {
        success: true,
        message: `Station ${station.code} - ${station.name} added successfully.`,
        station: {
          id: station._id.toString(),
          code: station.code,
          name: station.name,
          city: station.city,
          state: station.state,
          zone: station.zone,
          platforms: station.platforms,
          isActive: station.isActive,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Admin API] POST /stations error:", error);
    return NextResponse.json({ success: false, message: "Unable to create station." }, { status: 500 });
  }
}

