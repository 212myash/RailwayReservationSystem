import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAdminSession } from "@/lib/auth";
import Train from "@/models/Train";
import { ensureDefaultAdminData } from "@/lib/seed-admin-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/trains
 * List all trains with optional search.
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
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)));

    const filter: Record<string, unknown> = {};
    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [
        { trainNumber: regex },
        { trainName: regex },
        { source: regex },
        { sourceCode: search.toUpperCase() },
        { destination: regex },
        { destinationCode: search.toUpperCase() },
      ];
    }

    const total = await Train.countDocuments(filter);
    const trains = await Train.find(filter)
      .sort({ trainNumber: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json(
      {
        success: true,
        trains: trains.map((t) => ({
          id: t._id.toString(),
          trainNumber: t.trainNumber,
          trainName: t.trainName,
          source: t.source,
          sourceCode: t.sourceCode || "",
          destination: t.destination,
          destinationCode: t.destinationCode || "",
          departure: t.departure,
          arrival: t.arrival,
          duration: t.duration,
          fare: t.fare,
          totalSeats: t.totalSeats,
          availableSeats: t.availableSeats,
          coachTypes: t.coachTypes,
          runsOn: t.runsOn,
          category: t.category || "Express",
          stops: t.stops || [],
          isDemo: t.isDemo !== false,
          isActive: t.isActive,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error("[Admin API] GET /trains error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to retrieve trains." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/trains
 * Add a new train with full validation.
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

    const trainNumber = typeof body.trainNumber === "string" ? body.trainNumber.trim().toUpperCase() : "";
    const trainName = typeof body.trainName === "string" ? body.trainName.trim() : "";
    const source = typeof body.source === "string" ? body.source.trim() : "";
    const destination = typeof body.destination === "string" ? body.destination.trim() : "";
    const departure = typeof body.departure === "string" ? body.departure.trim() : "";
    const arrival = typeof body.arrival === "string" ? body.arrival.trim() : "";
    const duration = typeof body.duration === "string" ? body.duration.trim() : "";
    const fare = Number(body.fare);
    const totalSeats = Number(body.totalSeats) || 72;
    const coachTypes = Array.isArray(body.coachTypes) && body.coachTypes.length > 0 ? body.coachTypes : ["SL", "3A", "2A", "CC"];
    const runsOn = Array.isArray(body.runsOn) && body.runsOn.length > 0 ? body.runsOn : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    if (!trainNumber || !trainName || !source || !destination || !departure || !arrival) {
      return NextResponse.json(
        { success: false, message: "Train number, name, source, destination, departure, and arrival are required." },
        { status: 400 }
      );
    }

    if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(departure) || !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(arrival)) {
      return NextResponse.json(
        { success: false, message: "Timings must be in HH:mm format (e.g. 07:30, 16:45)." },
        { status: 400 }
      );
    }

    if (source.toLowerCase() === destination.toLowerCase()) {
      return NextResponse.json(
        { success: false, message: "Source and destination stations cannot be identical." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(fare) || fare <= 0) {
      return NextResponse.json(
        { success: false, message: "Fare must be a positive number." },
        { status: 400 }
      );
    }

    await connectDB();

    const existing = await Train.findOne({ trainNumber }).lean();
    if (existing) {
      return NextResponse.json(
        { success: false, message: `Train with number ${trainNumber} already exists.` },
        { status: 409 }
      );
    }

    const newTrain = await Train.create({
      trainNumber,
      trainName,
      source,
      destination,
      departure,
      arrival,
      duration: duration || "4h 00m",
      fare,
      totalSeats,
      availableSeats: totalSeats,
      coachTypes,
      runsOn,
      isActive: true,
    });

    return NextResponse.json(
      {
        success: true,
        message: `Train ${newTrain.trainNumber} - ${newTrain.trainName} created successfully.`,
        train: {
          id: newTrain._id.toString(),
          trainNumber: newTrain.trainNumber,
          trainName: newTrain.trainName,
          source: newTrain.source,
          destination: newTrain.destination,
          departure: newTrain.departure,
          arrival: newTrain.arrival,
          duration: newTrain.duration,
          fare: newTrain.fare,
          totalSeats: newTrain.totalSeats,
          availableSeats: newTrain.availableSeats,
          coachTypes: newTrain.coachTypes,
          runsOn: newTrain.runsOn,
          isActive: newTrain.isActive,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Admin API] POST /trains error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to create train record." },
      { status: 500 }
    );
  }
}

