import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Booking from "@/models/Booking";
import { getAuthSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Please log in to track your booking status.",
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const pnrParam = searchParams.get("pnr") || searchParams.get("reference") || "";
    const pnr = pnrParam.trim();

    if (!pnr || pnr.length < 4 || pnr.length > 50) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid booking reference or PNR.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    // Exact case-insensitive match for the reference code
    const escaped = pnr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const booking = await Booking.findOne({
      bookingReference: { $regex: new RegExp(`^${escaped}$`, "i") },
    }).lean();

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          message: `No booking found with reference "${pnr}". Please check the reference and try again.`,
        },
        { status: 404 }
      );
    }

    // Verify ownership: authenticated user can only view their own booking details
    if (booking.userId.toString() !== session.userId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You are not authorized to view this booking. It is associated with another account.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        booking: {
          bookingReference: booking.bookingReference,
          trainNumber: booking.trainNumber,
          trainName: booking.trainName,
          from: booking.from,
          to: booking.to,
          journeyDate: booking.journeyDate,
          passengerCount: booking.passengerCount,
          coach: booking.coach,
          seats: booking.seats,
          totalFare: booking.totalFare,
          status: booking.status,
          createdAt: booking.createdAt,
          passengers: booking.passengers.map((p) => ({
            name: p.name,
            age: p.age,
            gender: p.gender,
          })),
        },
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error("PNR Status lookup error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve booking status right now. Please try again.",
      },
      { status: 500 }
    );
  }
}

