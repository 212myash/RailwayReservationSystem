import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { getAdminSession } from "@/lib/auth";
import Train from "@/models/Train";
import Booking from "@/models/Booking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/trains/[id]
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
      return NextResponse.json({ success: false, message: "Invalid train ID." }, { status: 400 });
    }

    await connectDB();
    const train = await Train.findById(id).lean();

    if (!train) {
      return NextResponse.json({ success: false, message: "Train not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      train: {
        id: train._id.toString(),
        trainNumber: train.trainNumber,
        trainName: train.trainName,
        source: train.source,
        destination: train.destination,
        departure: train.departure,
        arrival: train.arrival,
        duration: train.duration,
        fare: train.fare,
        totalSeats: train.totalSeats,
        availableSeats: train.availableSeats,
        coachTypes: train.coachTypes,
        runsOn: train.runsOn,
        isActive: train.isActive,
      },
    });
  } catch (error) {
    console.error("[Admin API] GET /trains/[id] error:", error);
    return NextResponse.json({ success: false, message: "Server error." }, { status: 500 });
  }
}

/**
 * PUT /api/admin/trains/[id]
 * Updates train details.
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
      return NextResponse.json({ success: false, message: "Invalid train ID." }, { status: 400 });
    }

    const body = await request.json();
    await connectDB();

    const train = await Train.findById(id);
    if (!train) {
      return NextResponse.json({ success: false, message: "Train not found." }, { status: 404 });
    }

    // Optional updates
    if (typeof body.trainName === "string" && body.trainName.trim()) {
      train.trainName = body.trainName.trim();
    }
    if (typeof body.source === "string" && body.source.trim()) {
      train.source = body.source.trim();
    }
    if (typeof body.destination === "string" && body.destination.trim()) {
      train.destination = body.destination.trim();
    }
    if (typeof body.departure === "string" && body.departure.trim()) {
      train.departure = body.departure.trim();
    }
    if (typeof body.arrival === "string" && body.arrival.trim()) {
      train.arrival = body.arrival.trim();
    }
    if (typeof body.duration === "string" && body.duration.trim()) {
      train.duration = body.duration.trim();
    }
    if (typeof body.fare === "number" && body.fare > 0) {
      train.fare = body.fare;
    }
    if (typeof body.totalSeats === "number" && body.totalSeats > 0) {
      train.totalSeats = body.totalSeats;
    }
    if (Array.isArray(body.coachTypes) && body.coachTypes.length > 0) {
      train.coachTypes = body.coachTypes;
    }
    if (Array.isArray(body.runsOn) && body.runsOn.length > 0) {
      train.runsOn = body.runsOn;
    }
    if (typeof body.isActive === "boolean") {
      train.isActive = body.isActive;
    }

    await train.save();

    return NextResponse.json({
      success: true,
      message: `Train ${train.trainNumber} updated successfully.`,
      train: {
        id: train._id.toString(),
        trainNumber: train.trainNumber,
        trainName: train.trainName,
        source: train.source,
        destination: train.destination,
        departure: train.departure,
        arrival: train.arrival,
        duration: train.duration,
        fare: train.fare,
        totalSeats: train.totalSeats,
        availableSeats: train.availableSeats,
        coachTypes: train.coachTypes,
        runsOn: train.runsOn,
        isActive: train.isActive,
      },
    });
  } catch (error) {
    console.error("[Admin API] PUT /trains/[id] error:", error);
    return NextResponse.json({ success: false, message: "Failed to update train." }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/trains/[id]
 * Safely removes or deactivates train if referenced by bookings.
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
      return NextResponse.json({ success: false, message: "Invalid train ID." }, { status: 400 });
    }

    await connectDB();
    const train = await Train.findById(id);

    if (!train) {
      return NextResponse.json({ success: false, message: "Train record not found." }, { status: 404 });
    }

    // Safety check: is this train referenced in historical bookings?
    const bookingCount = await Booking.countDocuments({ trainNumber: train.trainNumber });

    if (bookingCount > 0) {
      // Soft deactivate instead of destructive delete to protect booking integrity
      train.isActive = false;
      await train.save();

      return NextResponse.json({
        success: true,
        action: "deactivated",
        message: `Train ${train.trainNumber} has ${bookingCount} historical booking(s). It has been deactivated instead of permanently deleted to preserve booking history.`,
      });
    }

    // Safe to permanently remove
    await Train.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      action: "deleted",
      message: `Train ${train.trainNumber} permanently removed.`,
    });
  } catch (error) {
    console.error("[Admin API] DELETE /trains/[id] error:", error);
    return NextResponse.json({ success: false, message: "Failed to delete train." }, { status: 500 });
  }
}

