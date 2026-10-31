import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { unlockSeats } from "@/lib/seat-inventory";

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
    const { journeyDate, coachId, seatNumbers, guestId } = body;

    if (!journeyDate || !coachId || !Array.isArray(seatNumbers)) {
      return NextResponse.json(
        { success: false, message: "Invalid unlock parameters." },
        { status: 400 }
      );
    }

    const session = await getAuthSession();
    const existingGuestId =
      request.cookies.get("railconnect_guest_id")?.value ||
      request.headers.get("x-session-id") ||
      guestId;

    const effectiveUserId = session?.userId || existingGuestId;

    if (!effectiveUserId) {
      return NextResponse.json(
        { success: true, message: "No active lock owner to release." },
        { status: 200 }
      );
    }

    await unlockSeats(
      trainNumber,
      journeyDate,
      coachId,
      seatNumbers.map(Number).filter((n) => Number.isInteger(n)),
      effectiveUserId
    );

    return NextResponse.json({
      success: true,
      message: "Seats unlocked successfully.",
    });
  } catch (error) {
    console.error("Unlocking seats failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to unlock seats.",
      },
      { status: 500 }
    );
  }
}
