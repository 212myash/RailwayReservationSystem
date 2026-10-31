import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAdminSession } from "@/lib/auth";
import Booking from "@/models/Booking";

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
    const status = searchParams.get("status")?.trim().toLowerCase() || "all";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "15", 10) || 15));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    if (status === "confirmed" || status === "cancelled") {
      filter.status = status;
    }

    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [
        { bookingReference: regex },
        { trainNumber: regex },
        { trainName: regex },
        { from: regex },
        { to: regex },
        { "passengers.name": regex },
      ];
    }

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Booking.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json(
      {
        success: true,
        bookings: bookings.map((b) => ({
          id: b._id.toString(),
          bookingReference: b.bookingReference,
          trainNumber: b.trainNumber,
          trainName: b.trainName,
          from: b.from,
          to: b.to,
          journeyDate: b.journeyDate,
          coach: b.coach,
          seats: b.seats,
          passengerCount: b.passengerCount,
          passengers: b.passengers.map((p) => ({
            name: p.name,
            age: p.age,
            gender: p.gender,
          })),
          totalFare: b.totalFare,
          status: b.status,
          createdAt: b.createdAt,
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
    console.error("[Admin API] GET /bookings error:", error);
    return NextResponse.json({ success: false, message: "Unable to retrieve bookings." }, { status: 500 });
  }
}

