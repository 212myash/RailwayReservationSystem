import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { getAdminSession } from "@/lib/auth";
import Station from "@/models/Station";
import Train from "@/models/Train";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/stations/[id]
 */
export async function GET(
  _request: NextRequest,
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
      return NextResponse.json({ success: false, message: "Invalid station ID." }, { status: 400 });
    }

    await connectDB();
    const station = await Station.findById(id).lean();

    if (!station) {
      return NextResponse.json({ success: false, message: "Station not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
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
    });
  } catch (error) {
    console.error("[Admin API] GET /stations/[id] error:", error);
    return NextResponse.json({ success: false, message: "Server error." }, { status: 500 });
  }
}

/**
 * PUT /api/admin/stations/[id]
 */
export async function PUT(
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
      return NextResponse.json({ success: false, message: "Invalid station ID." }, { status: 400 });
    }

    const body = await request.json();
    await connectDB();

    const station = await Station.findById(id);
    if (!station) {
      return NextResponse.json({ success: false, message: "Station not found." }, { status: 404 });
    }

    if (typeof body.name === "string" && body.name.trim()) station.name = body.name.trim();
    if (typeof body.city === "string" && body.city.trim()) station.city = body.city.trim();
    if (typeof body.state === "string" && body.state.trim()) station.state = body.state.trim();
    if (typeof body.zone === "string" && body.zone.trim()) station.zone = body.zone.trim();
    if (typeof body.platforms === "number" && body.platforms > 0) station.platforms = body.platforms;
    if (typeof body.isActive === "boolean") station.isActive = body.isActive;

    await station.save();

    return NextResponse.json({
      success: true,
      message: `Station ${station.code} updated successfully.`,
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
    });
  } catch (error) {
    console.error("[Admin API] PUT /stations/[id] error:", error);
    return NextResponse.json({ success: false, message: "Failed to update station." }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/stations/[id]
 */
export async function DELETE(
  _request: NextRequest,
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
      return NextResponse.json({ success: false, message: "Invalid station ID." }, { status: 400 });
    }

    await connectDB();
    const station = await Station.findById(id);

    if (!station) {
      return NextResponse.json({ success: false, message: "Station not found." }, { status: 404 });
    }

    // Check if any train routes use this station name or city
    const referencedTrains = await Train.countDocuments({
      $or: [
        { source: new RegExp(station.city, "i") },
        { destination: new RegExp(station.city, "i") },
      ],
    });

    if (referencedTrains > 0) {
      // Soft deactivate
      station.isActive = false;
      await station.save();

      return NextResponse.json({
        success: true,
        action: "deactivated",
        message: `Station ${station.code} is referenced by ${referencedTrains} active train route(s). It has been deactivated instead of permanently deleted.`,
      });
    }

    await Station.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      action: "deleted",
      message: `Station ${station.code} permanently deleted.`,
    });
  } catch (error) {
    console.error("[Admin API] DELETE /stations/[id] error:", error);
    return NextResponse.json({ success: false, message: "Failed to delete station." }, { status: 500 });
  }
}

