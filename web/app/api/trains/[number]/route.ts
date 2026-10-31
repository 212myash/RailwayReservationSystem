import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Train from "@/models/Train";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/trains/[number]/route
 * Returns the complete ordered route stops for a specific train number.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ number: string }> }
) {
  try {
    const { number } = await params;
    const trainNum = (number || "").trim().toUpperCase();

    if (!trainNum) {
      return NextResponse.json(
        { success: false, message: "Train number is required." },
        { status: 400 }
      );
    }

    await connectDB();

    const train = await Train.findOne({ trainNumber: trainNum, isActive: true }).lean();

    if (!train) {
      return NextResponse.json(
        { success: false, message: `Train #${trainNum} not found or inactive.` },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        train: {
          trainNumber: train.trainNumber,
          trainName: train.trainName,
          category: train.category || "Express",
          source: train.source,
          sourceCode: train.sourceCode || "",
          destination: train.destination,
          destinationCode: train.destinationCode || "",
          departure: train.departure,
          arrival: train.arrival,
          duration: train.duration,
          fare: train.fare,
          runsOn: train.runsOn || [],
          totalStops: train.stops?.length || 0,
          stops: (train.stops || []).map((s, idx) => ({
            sequence: idx + 1,
            stationCode: s.stationCode,
            stationName: s.stationName,
            arrivalTime: s.arrivalTime,
            departureTime: s.departureTime,
            haltMinutes: s.haltMinutes || (idx === 0 || idx === (train.stops?.length || 1) - 1 ? 0 : 2),
            dayCount: s.dayCount || 1,
          })),
        },
      },
      {
        status: 200,
        headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
      }
    );
  } catch (error) {
    console.error("[API] GET /trains/[number]/route error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to retrieve train route details." },
      { status: 500 }
    );
  }
}
