import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAdminSession } from "@/lib/auth";
import User from "@/models/User";
import Booking from "@/models/Booking";
import Train from "@/models/Train";
import Station from "@/models/Station";
import { ensureDefaultAdminData } from "@/lib/seed-admin-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = await getAdminSession();

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Administrator privileges required." },
        { status: 403 }
      );
    }

    await connectDB();
    await ensureDefaultAdminData();

    // Query real MongoDB counts in parallel
    const [
      totalUsers,
      totalTrains,
      totalStations,
      totalBookings,
      confirmedBookings,
      cancelledBookings,
      recentBookings,
      recentUsers,
      revenueResult,
    ] = await Promise.all([
      User.countDocuments(),
      Train.countDocuments(),
      Station.countDocuments(),
      Booking.countDocuments(),
      Booking.countDocuments({ status: "confirmed" }),
      Booking.countDocuments({ status: "cancelled" }),
      Booking.find()
        .sort({ createdAt: -1 })
        .limit(6)
        .select("bookingReference trainNumber trainName from to journeyDate totalFare status createdAt passengerCount")
        .lean(),
      User.find()
        .sort({ createdAt: -1 })
        .limit(6)
        .select("name email role createdAt")
        .lean(),
      Booking.aggregate([
        { $match: { status: "confirmed" } },
        { $group: { _id: null, total: { $sum: "$totalFare" } } },
      ]),
    ]);

    const totalRevenue = revenueResult[0]?.total || 0;

    return NextResponse.json(
      {
        success: true,
        stats: {
          totalUsers,
          totalTrains,
          totalStations,
          totalBookings,
          confirmedBookings,
          cancelledBookings,
          totalRevenue,
          recentBookings: recentBookings.map((b) => ({
            id: b._id.toString(),
            bookingReference: b.bookingReference,
            trainNumber: b.trainNumber,
            trainName: b.trainName,
            from: b.from,
            to: b.to,
            journeyDate: b.journeyDate,
            totalFare: b.totalFare,
            status: b.status,
            passengerCount: b.passengerCount,
            createdAt: b.createdAt,
          })),
          recentUsers: recentUsers.map((u) => ({
            id: u._id.toString(),
            name: u.name,
            email: u.email,
            role: u.role,
            createdAt: u.createdAt,
          })),
        },
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error("[Admin API] stats error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to load dashboard statistics." },
      { status: 500 }
    );
  }
}

