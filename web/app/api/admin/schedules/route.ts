import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAdminSession } from "@/lib/auth";
import Train from "@/models/Train";
import { ensureDefaultAdminData } from "@/lib/seed-admin-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/schedules
 * Returns scheduled routes and timings for all trains.
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

    const filter: Record<string, unknown> = {};
    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ trainNumber: regex }, { trainName: regex }, { source: regex }, { destination: regex }];
    }

    const schedules = await Train.find(filter)
      .sort({ departure: 1 })
      .select("trainNumber trainName source destination departure arrival duration runsOn isActive fare")
      .lean();

    return NextResponse.json(
      {
        success: true,
        schedules: schedules.map((s) => ({
          id: s._id.toString(),
          trainNumber: s.trainNumber,
          trainName: s.trainName,
          source: s.source,
          destination: s.destination,
          departure: s.departure,
          arrival: s.arrival,
          duration: s.duration,
          runsOn: s.runsOn,
          fare: s.fare,
          isActive: s.isActive,
        })),
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("[Admin API] GET /schedules error:", error);
    return NextResponse.json({ success: false, message: "Unable to retrieve schedules." }, { status: 500 });
  }
}

/**
 * PUT /api/admin/schedules
 * Bulk or single update of train schedule timings.
 */
export async function PUT(request: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Administrator privileges required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { trainNumber, departure, arrival, duration, runsOn, isActive } = body;

    if (!trainNumber || !departure || !arrival) {
      return NextResponse.json(
        { success: false, message: "trainNumber, departure, and arrival are required." },
        { status: 400 }
      );
    }

    if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(departure) || !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(arrival)) {
      return NextResponse.json(
        { success: false, message: "Times must be in valid HH:mm 24-hour format." },
        { status: 400 }
      );
    }

    await connectDB();

    const train = await Train.findOne({ trainNumber });
    if (!train) {
      return NextResponse.json({ success: false, message: "Train not found." }, { status: 404 });
    }

    train.departure = departure.trim();
    train.arrival = arrival.trim();
    if (typeof duration === "string" && duration.trim()) train.duration = duration.trim();
    if (Array.isArray(runsOn) && runsOn.length > 0) train.runsOn = runsOn;
    if (typeof isActive === "boolean") train.isActive = isActive;

    await train.save();

    return NextResponse.json({
      success: true,
      message: `Schedule for train ${train.trainNumber} updated successfully.`,
      schedule: {
        id: train._id.toString(),
        trainNumber: train.trainNumber,
        trainName: train.trainName,
        source: train.source,
        destination: train.destination,
        departure: train.departure,
        arrival: train.arrival,
        duration: train.duration,
        runsOn: train.runsOn,
        isActive: train.isActive,
      },
    });
  } catch (error) {
    console.error("[Admin API] PUT /schedules error:", error);
    return NextResponse.json({ success: false, message: "Failed to update schedule." }, { status: 500 });
  }
}

