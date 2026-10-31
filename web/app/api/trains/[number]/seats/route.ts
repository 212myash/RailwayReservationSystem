import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { getCoachSeatMatrix } from "@/lib/seat-inventory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ number: string }> }
) {
  try {
    const { number } = await params;
    const trainNumber = number?.trim();

    const searchParams = request.nextUrl.searchParams;
    const journeyDate = searchParams.get("journeyDate");
    const coachId = searchParams.get("coachId");

    if (!trainNumber) {
      return NextResponse.json(
        { success: false, message: "Train number is required." },
        { status: 400 }
      );
    }

    if (!journeyDate || !/^\d{4}-\d{2}-\d{2}$/.test(journeyDate)) {
      return NextResponse.json(
        { success: false, message: "A valid journey date (YYYY-MM-DD) is required." },
        { status: 400 }
      );
    }

    if (!coachId || !coachId.trim()) {
      return NextResponse.json(
        { success: false, message: "Coach identifier (coachId) is required." },
        { status: 400 }
      );
    }

    const session = await getAuthSession();
    const guestId =
      request.cookies.get("railconnect_guest_id")?.value ||
      request.headers.get("x-session-id") ||
      undefined;

    const currentUserId = session?.userId || guestId;

    const matrix = await getCoachSeatMatrix(
      trainNumber,
      journeyDate,
      coachId,
      currentUserId
    );

    return NextResponse.json(
      {
        success: true,
        matrix,
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error("Fetching coach seat matrix failed:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Failed to load seat availability.";

    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
