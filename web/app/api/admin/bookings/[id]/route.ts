import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { getAdminSession } from "@/lib/auth";
import Booking from "@/models/Booking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/bookings/[id]
 * Fetch complete booking details including passenger manifest.
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
      return NextResponse.json({ success: false, message: "Invalid booking ID." }, { status: 400 });
    }

    await connectDB();
    const booking = await Booking.findById(id).lean();

    if (!booking) {
      return NextResponse.json({ success: false, message: "Booking record not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: booking._id.toString(),
        bookingReference: booking.bookingReference,
        trainNumber: booking.trainNumber,
        trainName: booking.trainName,
        from: booking.from,
        to: booking.to,
        journeyDate: booking.journeyDate,
        coach: booking.coach,
        seats: booking.seats,
        passengerCount: booking.passengerCount,
        passengers: booking.passengers,
        totalFare: booking.totalFare,
        status: booking.status,
        createdAt: booking.createdAt,
      },
    });
  } catch (error) {
    console.error("[Admin API] GET /bookings/[id] error:", error);
    return NextResponse.json({ success: false, message: "Failed to retrieve booking." }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/bookings/[id]
 * Administrator cancellation or status management.
 */
export async function PATCH(
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
      return NextResponse.json({ success: false, message: "Invalid booking ID." }, { status: 400 });
    }

    const body = await request.json();
    const newStatus = body.status;

    if (newStatus !== "confirmed" && newStatus !== "cancelled") {
      return NextResponse.json(
        { success: false, message: "Status must be either 'confirmed' or 'cancelled'." },
        { status: 400 }
      );
    }

    await connectDB();

    const booking = await Booking.findById(id);
    if (!booking) {
      return NextResponse.json({ success: false, message: "Booking record not found." }, { status: 404 });
    }

    booking.status = newStatus;
    await booking.save();

    return NextResponse.json({
      success: true,
      message: `Booking ${booking.bookingReference} status updated to ${booking.status}.`,
      booking: {
        id: booking._id.toString(),
        bookingReference: booking.bookingReference,
        status: booking.status,
      },
    });
  } catch (error) {
    console.error("[Admin API] PATCH /bookings/[id] error:", error);
    return NextResponse.json({ success: false, message: "Failed to update booking." }, { status: 500 });
  }
}

