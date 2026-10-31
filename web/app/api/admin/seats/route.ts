import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAdminSession } from "@/lib/auth";
import Train from "@/models/Train";
import Booking from "@/models/Booking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getTodayInIndia() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

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
    let trainNumber = searchParams.get("trainNumber")?.trim() || "";
    const journeyDate = searchParams.get("journeyDate")?.trim() || getTodayInIndia();

    // If no train specified, pick the first active train
    if (!trainNumber) {
      const firstTrain = await Train.findOne({ isActive: true }).select("trainNumber").lean();
      trainNumber = firstTrain?.trainNumber || "12002";
    }

    const train = await Train.findOne({ trainNumber }).lean();
    const totalBerths = train?.totalSeats || 72;

    // Fetch confirmed bookings for this train and date
    const confirmedBookings = await Booking.find({
      trainNumber,
      journeyDate,
      status: "confirmed",
    })
      .select("bookingReference coach seats passengers createdAt")
      .lean();

    // Build map of booked seat indices and passenger details
    const bookedMap: Record<
      string,
      {
        bookingReference: string;
        passengerName: string;
        coach: string;
      }
    > = {};

    confirmedBookings.forEach((b) => {
      b.seats.forEach((seatStr, idx) => {
        const passenger = b.passengers[idx]?.name || "Passenger";
        bookedMap[seatStr] = {
          bookingReference: b.bookingReference,
          passengerName: passenger,
          coach: b.coach,
        };
      });
    });

    const berths = Array.from({ length: totalBerths }, (_, i) => {
      const berthNum = i + 1;
      const seatKey = `${train?.coachTypes?.[0] || "B1"}-${berthNum}`;
      const isBooked = Boolean(bookedMap[seatKey] || bookedMap[String(berthNum)]);

      const bookingInfo = bookedMap[seatKey] || bookedMap[String(berthNum)];

      const position = ((berthNum - 1) % 8) + 1;
      let berthType = "SU";
      if (position === 1 || position === 4) berthType = "LB";
      else if (position === 2 || position === 5) berthType = "MB";
      else if (position === 3 || position === 6) berthType = "UB";
      else if (position === 7) berthType = "SL";

      return {
        number: berthNum,
        seatKey,
        type: berthType,
        status: isBooked ? ("booked" as const) : ("available" as const),
        bookingReference: bookingInfo?.bookingReference || null,
        passengerName: bookingInfo?.passengerName || null,
      };
    });

    const bookedCount = berths.filter((b) => b.status === "booked").length;
    const availableCount = totalBerths - bookedCount;

    return NextResponse.json(
      {
        success: true,
        trainNumber,
        trainName: train?.trainName || "Express",
        journeyDate,
        totalBerths,
        bookedCount,
        availableCount,
        occupancyRate: Math.round((bookedCount / totalBerths) * 100),
        berths,
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("[Admin API] GET /seats error:", error);
    return NextResponse.json({ success: false, message: "Unable to retrieve seat availability." }, { status: 500 });
  }
}

