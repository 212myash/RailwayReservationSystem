
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { getAuthSession } from "@/lib/auth";
import Booking from "@/models/Booking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();

    if (!session || !mongoose.isValidObjectId(session.userId)) {
      return NextResponse.json(
        { success: false, message: "Please login to cancel your booking." },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid booking ID." },
        { status: 400 }
      );
    }

    await connectDB();

    // Atomically cancel only this user's currently confirmed booking.
    const booking = await Booking.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
        userId: new mongoose.Types.ObjectId(session.userId),
        status: "confirmed",
      },
      { $set: { status: "cancelled" } },
      { new: true, runValidators: true }
    ).lean();

    if (!booking) {
      const existing = await Booking.findOne({
        _id: new mongoose.Types.ObjectId(id),
        userId: new mongoose.Types.ObjectId(session.userId),
      })
        .select("status")
        .lean();

      if (!existing) {
        return NextResponse.json(
          { success: false, message: "Booking not found." },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          message:
            existing.status === "cancelled"
              ? "This booking has already been cancelled."
              : "This booking cannot be cancelled.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Booking cancelled successfully.",
      booking: {
        id: booking._id.toString(),
        bookingReference: booking.bookingReference,
        status: booking.status,
      },
    });
  } catch (error) {
    console.error("Booking cancellation failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to cancel booking. Please try again.",
      },
      { status: 500 }
    );
  }
}
