import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Station from "@/models/Station";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/stations
 * Public search endpoint for All-India railway stations with debounced autocomplete.
 *
 * Query Params:
 *   q: search term (code, name, city)
 *   limit: maximum results to return (default 20, max 100)
 *   page: page number for pagination (default 1)
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();
    const limitParam = parseInt(searchParams.get("limit") || "20", 10);
    const limit = Math.min(Math.max(1, isNaN(limitParam) ? 20 : limitParam), 100);
    const pageParam = parseInt(searchParams.get("page") || "1", 10);
    const page = Math.max(1, isNaN(pageParam) ? 1 : pageParam);

    const filter: Record<string, unknown> = { isActive: true };

    if (q) {
      const sanitized = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(sanitized, "i");
      filter.$or = [{ code: regex }, { name: regex }, { city: regex }, { state: regex }];
    }

    const skip = (page - 1) * limit;

    // Use aggregation to rank exact/prefix code matches first
    const stations = await Station.find(filter, {
      code: 1,
      name: 1,
      city: 1,
      state: 1,
      zone: 1,
      platforms: 1,
    })
      .sort({ code: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Station.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    // If a search query was provided, prioritize matches where code starts with query
    if (q) {
      const upperQ = q.toUpperCase();
      stations.sort((a, b) => {
        const aExact = a.code === upperQ;
        const bExact = b.code === upperQ;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        const aPrefix = a.code.startsWith(upperQ);
        const bPrefix = b.code.startsWith(upperQ);
        if (aPrefix && !bPrefix) return -1;
        if (!aPrefix && bPrefix) return 1;

        const aNamePrefix = a.name.toUpperCase().startsWith(upperQ);
        const bNamePrefix = b.name.toUpperCase().startsWith(upperQ);
        if (aNamePrefix && !bNamePrefix) return -1;
        if (!aNamePrefix && bNamePrefix) return 1;

        return a.code.localeCompare(b.code);
      });
    }

    return NextResponse.json(
      {
        success: true,
        stations: stations.map((s) => ({
          code: s.code,
          name: s.name,
          city: s.city,
          state: s.state || "",
          zone: s.zone || "",
          platforms: s.platforms || 2,
        })),
        total,
        page,
        totalPages,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("[API] GET /stations error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to retrieve stations." },
      { status: 500 }
    );
  }
}
