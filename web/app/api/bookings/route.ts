
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { getAuthSession } from "@/lib/auth";
import Booking from "@/models/Booking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET: Fetch bookings belonging only to the logged-in user.
export async function GET() {
  try {
    const session = await getAuthSession();

    if (!session || !mongoose.isValidObjectId(session.userId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please login to view your bookings.",
        },
        { status: 401 }
      );
    }

    await connectDB();

    const bookings = await Booking.find({
      userId: new mongoose.Types.ObjectId(session.userId),
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        bookings: bookings.map((booking) => ({
          id: booking._id.toString(),
          bookingReference: booking.bookingReference,
          trainNumber: booking.trainNumber,
          trainName: booking.trainName,
          from: booking.from,
          to: booking.to,
          journeyDate: booking.journeyDate,
          passengers: booking.passengers.map((passenger) => ({
            name: passenger.name,
            age: passenger.age,
            gender: passenger.gender,
          })),
          passengerCount: booking.passengerCount,
          coach: booking.coach,
          seats: booking.seats,
          totalFare: booking.totalFare,
          status: booking.status,
          createdAt: booking.createdAt,
        })),
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error("Fetching bookings failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load bookings. Please try again.",
      },
      { status: 500 }
    );
  }
}

// POST: Validate and save a booking.
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session || !mongoose.isValidObjectId(session.userId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please login to confirm your booking.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      trainNumber,
      trainName,
      from,
      to,
      date,
      passengers,
      passengerCount,
      coach,
      seats,
      fare,
    } = body;

    if (
      typeof trainNumber !== "string" ||
      !trainNumber.trim() ||
      trainNumber.length > 30 ||
      typeof trainName !== "string" ||
      !trainName.trim() ||
      trainName.length > 120 ||
      typeof from !== "string" ||
      !from.trim() ||
      from.length > 120 ||
      typeof to !== "string" ||
      !to.trim() ||
      to.length > 120 ||
      from.trim().toLowerCase() === to.trim().toLowerCase()
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid train or journey details." },
        { status: 400 }
      );
    }

    if (
      typeof date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date)
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid journey date." },
        { status: 400 }
      );
    }

    const journeyDate = new Date(`${date}T00:00:00.000Z`);
    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    });

    if (
      Number.isNaN(journeyDate.getTime()) ||
      journeyDate.toISOString().slice(0, 10) !== date ||
      date < today
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Journey date cannot be in the past.",
        },
        { status: 400 }
      );
    }

    if (
      !Array.isArray(passengers) ||
      passengers.length < 1 ||
      passengers.length > 6 ||
      passengerCount !== passengers.length ||
      !Array.isArray(seats) ||
      seats.length !== passengers.length ||
      !seats.every(
        (seat: unknown) =>
          typeof seat === "string" &&
          /^[A-Za-z0-9 ()-]{1,12}$/.test(seat) &&
          seat.trim().length > 0
      ) ||
      new Set(seats).size !== seats.length
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Passenger count and seat details are invalid. Check selected seats.",
        },
        { status: 400 }
      );
    }

    const validPassengers: {
      name: string;
      age: number;
      gender: "Male" | "Female" | "Other";
    }[] = [];

    for (const passenger of passengers) {
      if (
        !passenger ||
        typeof passenger.name !== "string" ||
        passenger.name.trim().length < 2 ||
        passenger.name.trim().length > 80 ||
        !Number.isInteger(Number(passenger.age)) ||
        Number(passenger.age) < 1 ||
        Number(passenger.age) > 120 ||
        !["Male", "Female", "Other"].includes(passenger.gender)
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid passenger information.",
          },
          { status: 400 }
        );
      }

      validPassengers.push({
        name: passenger.name.trim(),
        age: Number(passenger.age),
        gender: passenger.gender as "Male" | "Female" | "Other",
      });
    }

    if (
      typeof coach !== "string" ||
      !/^[A-Za-z0-9-]{1,10}$/.test(coach)
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid coach details." },
        { status: 400 }
      );
    }

    // Demo fare only. Real bookings need server-side fare verification.
    const totalFare = Number(fare);

    if (
      !Number.isFinite(totalFare) ||
      totalFare < 0 ||
      totalFare > 10000000
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid fare." },
        { status: 400 }
      );
    }

    await connectDB();

    const bookingReference = `RC${Date.now()}${crypto
      .randomUUID()
      .replace(/-/g, "")
      .slice(0, 8)
      .toUpperCase()}`;

    const booking = await Booking.create({
      userId: new mongoose.Types.ObjectId(session.userId),
      bookingReference,
      trainNumber: trainNumber.trim(),
      trainName: trainName.trim(),
      from: from.trim(),
      to: to.trim(),
      journeyDate: date,
      passengers: validPassengers,
      passengerCount: validPassengers.length,
      coach: coach.trim(),
      seats: seats.map((seat: string) => seat.trim()),
      totalFare,
      status: "confirmed",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Booking saved successfully.",
        booking: {
          id: booking._id.toString(),
          bookingReference: booking.bookingReference,
          trainNumber: booking.trainNumber,
          trainName: booking.trainName,
          from: booking.from,
          to: booking.to,
          journeyDate: booking.journeyDate,
          passengers: booking.passengers,
          passengerCount: booking.passengerCount,
          coach: booking.coach,
          seats: booking.seats,
          totalFare: booking.totalFare,
          status: booking.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Booking creation failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to save booking. Please try again.",
      },
      { status: 500 }
    );
  }
}
