import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { lockSeats } from "@/lib/seat-inventory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ number: string }> }
) {
  try {
    const { number } = await params;
    const trainNumber = number?.trim();

    if (!trainNumber) {
      return NextResponse.json(
        { success: false, message: "Train number is required." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { journeyDate, coachId, coachClass, seats, guestId } = body;

    if (!journeyDate || !/^\d{4}-\d{2}-\d{2}$/.test(journeyDate)) {
      return NextResponse.json(
        { success: false, message: "Valid journey date is required." },
        { status: 400 }
      );
    }

    if (!coachId || typeof coachId !== "string") {
      return NextResponse.json(
        { success: false, message: "Coach identifier is required." },
        { status: 400 }
      );
    }

    if (!coachClass || typeof coachClass !== "string") {
      return NextResponse.json(
        { success: false, message: "Coach class is required." },
        { status: 400 }
      );
    }

    if (!Array.isArray(seats) || seats.length === 0 || seats.length > 6) {
      return NextResponse.json(
        { success: false, message: "Between 1 and 6 seats must be specified." },
        { status: 400 }
      );
    }

    // Validate seat numbers
    for (const seat of seats) {
      if (
        !seat ||
        typeof seat.seatNumber !== "number" ||
        seat.seatNumber < 1 ||
        seat.seatNumber > 108 ||
        typeof seat.berthType !== "string"
      ) {
        return NextResponse.json(
          { success: false, message: "Invalid seat specifications." },
          { status: 400 }
        );
      }
    }

    const session = await getAuthSession();
    const existingGuestId =
      request.cookies.get("railconnect_guest_id")?.value ||
      request.headers.get("x-session-id") ||
      guestId;

    const effectiveUserId =
      session?.userId || existingGuestId || `guest_${crypto.randomUUID()}`;

    const lockResult = await lockSeats({
      trainNumber,
      journeyDate,
      coachId,
      coachClass,
      seats,
      userId: effectiveUserId,
      durationMinutes: 10,
    });

    if (!lockResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: lockResult.message || "Failed to lock requested seats.",
          conflictSeats: lockResult.conflictSeats,
        },
        { status: 409 }
      );
    }

    const response = NextResponse.json(
      {
        success: true,
        message: "Seats locked successfully for 10 minutes.",
        lockedUntil: lockResult.lockedUntil,
        sessionId: effectiveUserId,
      },
      { status: 200 }
    );

    // If unauthenticated guest, attach guest cookie
    if (!session && !request.cookies.has("railconnect_guest_id")) {
      response.cookies.set("railconnect_guest_id", effectiveUserId, {
        path: "/",
        httpOnly: false,
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 24 hours
      });
    }

    return response;
  } catch (error) {
    console.error("Locking seats failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "An unexpected error occurred while locking seats.",
      },
      { status: 500 }
    );
  }
}
