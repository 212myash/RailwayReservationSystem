import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Booking from "@/models/Booking";
import { getAuthSession } from "@/lib/auth";
import { generateTicketPdf } from "@/lib/pdf-ticket";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();

    if (!session || !mongoose.isValidObjectId(session.userId)) {
      return NextResponse.json(
        { success: false, message: "Please log in to download your e-ticket." },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { success: false, message: "Invalid ticket identifier." },
        { status: 400 }
      );
    }

    await connectDB();

    // Query either by MongoDB ObjectId or by Booking Reference (PNR)
    let booking = null;

    if (mongoose.isValidObjectId(id)) {
      booking = await Booking.findById(id).lean();
    }

    if (!booking) {
      const escaped = id.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      booking = await Booking.findOne({
        bookingReference: { $regex: new RegExp(`^${escaped}$`, "i") },
      }).lean();
    }

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking record not found." },
        { status: 404 }
      );
    }

    // Enforce ownership: only the user who made the reservation can download it
    if (booking.userId.toString() !== session.userId) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorized to download this ticket. It belongs to another account.",
        },
        { status: 403 }
      );
    }

    const pdfBuffer = await generateTicketPdf({
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
    });

    return new Response(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="RailConnect_Ticket_${booking.bookingReference}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("E-Ticket PDF generation error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to generate ticket PDF. Please try again." },
      { status: 500 }
    );
  }
}

