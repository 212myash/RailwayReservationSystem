import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Train, { ITrainStop } from "@/models/Train";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAYS_MAP = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Calculate duration between departure at origin and arrival at destination.
 * Returns human-readable duration e.g. "4h 25m" and numeric minutes for filtering/sorting.
 */
function calculateDuration(
  depTime: string,
  arrTime: string,
  depDay = 1,
  arrDay = 1
): { durationText: string; durationMinutes: number; dayOffset: number } {
  const [dh = 0, dm = 0] = depTime.split(":").map(Number);
  const [ah = 0, am = 0] = arrTime.split(":").map(Number);
  const depMinutesTotal = dh * 60 + dm;
  let dayOffset = Math.max(0, arrDay - depDay);
  let arrMinutesTotal = dayOffset * 1440 + ah * 60 + am;

  // Handle overnight trip where dayCount might not have incremented in raw data
  if (arrMinutesTotal < depMinutesTotal) {
    arrMinutesTotal += 1440;
    dayOffset += 1;
  }

  const diffMinutes = Math.max(15, arrMinutesTotal - depMinutesTotal);
  const hours = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;
  return {
    durationText: `${hours}h ${mins.toString().padStart(2, "0")}m`,
    durationMinutes: diffMinutes,
    dayOffset,
  };
}

/**
 * Categorize a time string "HH:mm" into time slot:
 * - morning:   06:00 - 11:59
 * - afternoon: 12:00 - 17:59
 * - evening:   18:00 - 23:59
 * - night:     00:00 - 05:59
 */
function getTimeSlot(timeStr: string): "morning" | "afternoon" | "evening" | "night" {
  const [h = 0] = timeStr.split(":").map(Number);
  if (h >= 6 && h < 12) return "morning";
  if (h >= 12 && h < 18) return "afternoon";
  if (h >= 18 && h < 24) return "evening";
  return "night";
}

/**
 * Determine origin departure day of week given user's boarding date and stop's dayCount.
 * For example, if user boards on Wed (dayCount = 2), the train started from origin on Tue.
 */
function getOriginRunDay(journeyDateStr: string, boardingDayCount = 1): string {
  const [y, m, d] = journeyDateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - Math.max(0, boardingDayCount - 1));
  return DAYS_MAP[dt.getUTCDay()];
}

function parseStationQuery(input: string): { code: string; regex: RegExp | null } {
  const trimmed = input.trim();
  if (!trimmed) return { code: "", regex: null };
  const parenMatch = trimmed.match(/\(([A-Z0-9]+)\)$/i);
  if (parenMatch) {
    const code = parenMatch[1].toUpperCase();
    const namePart = trimmed.replace(/\s*\([A-Z0-9]+\)$/i, "").trim();
    return {
      code,
      regex: namePart ? new RegExp(escapeRegex(namePart), "i") : new RegExp(`^${escapeRegex(code)}$`, "i"),
    };
  }
  return {
    code: trimmed.toUpperCase(),
    regex: new RegExp(escapeRegex(trimmed), "i"),
  };
}

/**
 * Helper to match a station term (code or name) against a station stop
 */
function isStationMatch(
  stop: ITrainStop,
  termCode: string,
  termRegex: RegExp | null
): boolean {
  if (termCode && stop.stationCode.toUpperCase() === termCode) return true;
  if (termRegex && termRegex.test(stop.stationName)) return true;
  return false;
}

/**
 * GET /api/trains
 * Public advanced train search and filtering endpoint.
 *
 * Query Params:
 *   from: departure station (code or name)
 *   to: destination station (code or name)
 *   date: journey date in YYYY-MM-DD format
 *   category: optional comma-separated or single train category
 *   coachClass: optional comma-separated coach class filter (e.g. "SL,3A,2A,CC")
 *   depTime: optional departure time slot filter ("morning", "afternoon", "evening", "night")
 *   arrTime: optional arrival time slot filter ("morning", "afternoon", "evening", "night")
 *   duration: optional duration bracket ("fast", "medium", "long", "overnight")
 *   day: optional running day filter (e.g. "Mon")
 *   sortBy: sorting criteria ("departure-asc", "departure-desc", "arrival-asc", "arrival-desc", "duration-asc", "fare-asc", "fare-desc", "number", "name")
 *   page: page number for browsing (default 1)
 *   limit: page size (default 25, max 100)
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const from = (searchParams.get("from") || "").trim();
    const to = (searchParams.get("to") || "").trim();
    const dateStr = (searchParams.get("date") || "").trim();
    const categoryParam = (searchParams.get("category") || "").trim();
    const coachClassParam = (searchParams.get("coachClass") || searchParams.get("class") || "").trim();
    const depTimeParam = (searchParams.get("depTime") || searchParams.get("departureTime") || "").trim().toLowerCase();
    const arrTimeParam = (searchParams.get("arrTime") || searchParams.get("arrivalTime") || "").trim().toLowerCase();
    const durationParam = (searchParams.get("duration") || "").trim().toLowerCase();
    const dayParam = (searchParams.get("day") || "").trim();
    const sortBy = (searchParams.get("sortBy") || "departure-asc").trim();
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)));
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));

    // 1. Validate same-station selection
    if (from && to && from.toLowerCase() === to.toLowerCase()) {
      return NextResponse.json(
        {
          success: false,
          message: "Source and destination stations cannot be identical. Please select different stations.",
        },
        { status: 400 }
      );
    }

    // 2. Validate journey date (IST timezone check)
    let isPastDate = false;
    if (dateStr) {
      const parsedDate = new Date(dateStr);
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          { success: false, message: "Invalid journey date format. Please use YYYY-MM-DD." },
          { status: 400 }
        );
      }

      // Compute current date in IST (UTC + 5 hours 30 mins)
      const nowIST = new Date(Date.now() + 19800000);
      const todayIST = nowIST.toISOString().split("T")[0];
      if (dateStr < todayIST) {
        isPastDate = true;
      }
    }

    const filter: Record<string, unknown> = { isActive: true };

    const fromParsed = parseStationQuery(from);
    const toParsed = parseStationQuery(to);

    const fromUpper = fromParsed.code;
    const toUpper = toParsed.code;
    const fromRegex = fromParsed.regex;
    const toRegex = toParsed.regex;

    // Filter categories if specified at DB level
    if (categoryParam && categoryParam !== "all") {
      const categories = categoryParam.split(",").map((c) => c.trim()).filter(Boolean);
      if (categories.length === 1) {
        filter.category = new RegExp(escapeRegex(categories[0]), "i");
      } else if (categories.length > 1) {
        filter.category = { $in: categories.map((c) => new RegExp(`^${escapeRegex(c)}$`, "i")) };
      }
    }

    if (from && to) {
      // Both source and destination specified -> search route stops
      filter.$and = [
        {
          $or: [
            { sourceCode: fromUpper },
            { source: fromRegex },
            { "stops.stationCode": fromUpper },
            { "stops.stationName": fromRegex },
          ],
        },
        {
          $or: [
            { destinationCode: toUpper },
            { destination: toRegex },
            { "stops.stationCode": toUpper },
            { "stops.stationName": toRegex },
          ],
        },
      ];

      const rawCandidates = await Train.find(filter)
        .sort({ trainNumber: 1 })
        .lean();

      // Collect available facets across all valid route matches
      const allMatchingCategories = new Set<string>();
      const allMatchingCoachClasses = new Set<string>();
      let minFoundFare = Infinity;
      let maxFoundFare = 0;

      // Filter and evaluate each candidate train
      const evaluatedTrains = [];

      for (const t of rawCandidates) {
        const stops = t.stops || [];

        // Check station indexes
        let fromIdx = -1;
        let toIdx = -1;

        for (let i = 0; i < stops.length; i++) {
          const s = stops[i];
          if (fromIdx === -1 && isStationMatch(s, fromUpper, fromRegex)) {
            fromIdx = i;
          }
          if (isStationMatch(s, toUpper, toRegex)) {
            if (fromIdx !== -1 && i > fromIdx) {
              toIdx = i;
              break;
            } else if (toIdx === -1) {
              toIdx = i;
            }
          }
        }

        // STRICT VALIDATION: Both must exist and fromIdx must precede toIdx
        // Reverse-direction trains (fromIdx >= toIdx) are strictly rejected!
        if (fromIdx === -1 || toIdx === -1 || fromIdx >= toIdx) {
          continue;
        }

        const fromStop = stops[fromIdx];
        const toStop = stops[toIdx];

        // Departure and arrival times
        const departureTime = fromStop.departureTime || fromStop.arrivalTime || t.departure || "08:00";
        const arrivalTime = toStop.arrivalTime || toStop.departureTime || t.arrival || "18:00";

        // Calculate accurate duration between selected boarding and arrival stations
        const { durationText, durationMinutes, dayOffset } = calculateDuration(
          departureTime,
          arrivalTime,
          fromStop.dayCount || 1,
          toStop.dayCount || 1
        );

        // Proportional segment fare based on route distance/stops
        const totalRouteStops = Math.max(1, stops.length - 1);
        const segmentStopCount = toIdx - fromIdx;
        const stopRatio = Math.max(0.2, Math.min(1.0, segmentStopCount / totalRouteStops));
        const segmentFare = Math.max(120, Math.round(t.fare * stopRatio));

        // Track facets
        if (t.category) allMatchingCategories.add(t.category);
        if (t.coachTypes) {
          t.coachTypes.forEach((c) => allMatchingCoachClasses.add(c));
        }
        if (segmentFare < minFoundFare) minFoundFare = segmentFare;
        if (segmentFare > maxFoundFare) maxFoundFare = segmentFare;

        // Running Days & Journey Date Validation
        const trainRunsOn = Array.isArray(t.runsOn) ? t.runsOn : [];
        let runsOnSelectedDate = true;
        let scheduleUnknown = false;

        if (dateStr) {
          if (trainRunsOn.length === 0) {
            scheduleUnknown = true;
          } else {
            const requiredOriginDay = getOriginRunDay(dateStr, fromStop.dayCount || 1);
            runsOnSelectedDate = trainRunsOn.includes(requiredOriginDay);
          }
        }

        // If a specific journey date is selected and train doesn't run on this day, skip it
        if (dateStr && !runsOnSelectedDate) {
          continue;
        }

        // Specific running day filter
        if (dayParam && trainRunsOn.length > 0 && !trainRunsOn.includes(dayParam)) {
          continue;
        }

        // Time slot filters
        const depSlot = getTimeSlot(departureTime);
        const arrSlot = getTimeSlot(arrivalTime);

        if (depTimeParam && depTimeParam !== "all" && depSlot !== depTimeParam) {
          continue;
        }
        if (arrTimeParam && arrTimeParam !== "all" && arrSlot !== arrTimeParam) {
          continue;
        }

        // Duration filter
        if (durationParam && durationParam !== "all") {
          if (durationParam === "fast" && durationMinutes >= 360) continue; // < 6h
          if (durationParam === "medium" && (durationMinutes < 360 || durationMinutes >= 720)) continue; // 6-12h
          if (durationParam === "long" && (durationMinutes < 720 || durationMinutes >= 1440)) continue; // 12-24h
          if (durationParam === "overnight" && durationMinutes < 1440) continue; // > 24h
        }

        // Coach Class filter
        if (coachClassParam && coachClassParam !== "all") {
          const reqClasses = coachClassParam.split(",").map((c) => c.trim().toUpperCase());
          const hasClass = reqClasses.some((rc) => t.coachTypes?.includes(rc));
          if (!hasClass) continue;
        }

        evaluatedTrains.push({
          id: t._id.toString(),
          trainNumber: t.trainNumber,
          trainName: t.trainName,
          category: t.category || "Express",
          source: fromStop.stationName,
          sourceCode: fromStop.stationCode,
          destination: toStop.stationName,
          destinationCode: toStop.stationCode,
          departure: departureTime,
          arrival: arrivalTime,
          duration: durationText,
          durationMinutes,
          dayOffset,
          fare: segmentFare,
          totalSeats: t.totalSeats || 72,
          availableSeats: t.availableSeats || 50,
          coachTypes: t.coachTypes || ["SL", "3A", "2A"],
          runsOn: trainRunsOn,
          scheduleUnknown,
          intermediateStopsCount: Math.max(0, toIdx - fromIdx - 1),
          totalRouteStops: stops.length,
          stops: stops.map((s, idx) => ({
            sequence: idx + 1,
            stationCode: s.stationCode,
            stationName: s.stationName,
            arrivalTime: s.arrivalTime,
            departureTime: s.departureTime,
            haltMinutes: s.haltMinutes || 2,
            dayCount: s.dayCount || 1,
            isBoarding: idx === fromIdx,
            isDebarking: idx === toIdx,
            isInSegment: idx >= fromIdx && idx <= toIdx,
          })),
          routeOrigin: t.source,
          routeOriginCode: t.sourceCode || "",
          routeDestination: t.destination,
          routeDestinationCode: t.destinationCode || "",
          isDemo: true,
        });
      }

      // Sort evaluated trains
      evaluatedTrains.sort((a, b) => {
        if (sortBy === "departure-desc") {
          return b.departure.localeCompare(a.departure);
        }
        if (sortBy === "arrival-asc") {
          return a.arrival.localeCompare(b.arrival);
        }
        if (sortBy === "arrival-desc") {
          return b.arrival.localeCompare(a.arrival);
        }
        if (sortBy === "duration-asc") {
          return a.durationMinutes - b.durationMinutes;
        }
        if (sortBy === "fare-asc") {
          return a.fare - b.fare;
        }
        if (sortBy === "fare-desc") {
          return b.fare - a.fare;
        }
        if (sortBy === "number") {
          return a.trainNumber.localeCompare(b.trainNumber);
        }
        if (sortBy === "name") {
          return a.trainName.localeCompare(b.trainName);
        }
        // Default: departure-asc
        return a.departure.localeCompare(b.departure);
      });

      const totalMatches = evaluatedTrains.length;
      const paginatedTrains = evaluatedTrains.slice((page - 1) * limit, page * limit);

      return NextResponse.json(
        {
          success: true,
          trains: paginatedTrains,
          total: totalMatches,
          page,
          limit,
          totalPages: Math.ceil(totalMatches / limit),
          isPastDate,
          facets: {
            categories: Array.from(allMatchingCategories).sort(),
            coachClasses: Array.from(allMatchingCoachClasses).sort(),
            minFare: minFoundFare === Infinity ? 0 : minFoundFare,
            maxFare: maxFoundFare,
            totalBeforeFilters: rawCandidates.length,
          },
          route: {
            fromQuery: from,
            toQuery: to,
            journeyDate: dateStr,
          },
        },
        {
          status: 200,
          headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" },
        }
      );
    } else if (from) {
      filter.$or = [
        { sourceCode: fromUpper },
        { source: fromRegex },
        { "stops.stationCode": fromUpper },
        { "stops.stationName": fromRegex },
      ];
    } else if (to) {
      filter.$or = [
        { destinationCode: toUpper },
        { destination: toRegex },
        { "stops.stationCode": toUpper },
        { "stops.stationName": toRegex },
      ];
    }

    // Browsing or single-station query: server-side pagination
    const totalCount = await Train.countDocuments(filter);
    let mongoSort: Record<string, 1 | -1> = { trainNumber: 1 };
    if (sortBy === "departure-asc") mongoSort = { departure: 1 };
    if (sortBy === "departure-desc") mongoSort = { departure: -1 };
    if (sortBy === "arrival-asc") mongoSort = { arrival: 1 };
    if (sortBy === "arrival-desc") mongoSort = { arrival: -1 };
    if (sortBy === "fare-asc") mongoSort = { fare: 1 };
    if (sortBy === "fare-desc") mongoSort = { fare: -1 };
    if (sortBy === "name") mongoSort = { trainName: 1 };

    const trains = await Train.find(filter)
      .sort(mongoSort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json(
      {
        success: true,
        trains: trains.map((t) => ({
          id: t._id.toString(),
          trainNumber: t.trainNumber,
          trainName: t.trainName,
          category: t.category || "Express",
          source: t.source,
          sourceCode: t.sourceCode || "",
          destination: t.destination,
          destinationCode: t.destinationCode || "",
          departure: t.departure,
          arrival: t.arrival,
          duration: t.duration,
          durationMinutes: 240,
          dayOffset: 0,
          fare: t.fare,
          totalSeats: t.totalSeats || 72,
          availableSeats: t.availableSeats || 50,
          coachTypes: t.coachTypes || ["SL", "3A", "2A"],
          runsOn: t.runsOn || [],
          scheduleUnknown: !t.runsOn || t.runsOn.length === 0,
          intermediateStopsCount: Math.max(0, (t.stops?.length || 2) - 2),
          totalRouteStops: t.stops?.length || 0,
          stops: (t.stops || []).map((s, idx) => ({
            sequence: idx + 1,
            stationCode: s.stationCode,
            stationName: s.stationName,
            arrivalTime: s.arrivalTime,
            departureTime: s.departureTime,
            haltMinutes: s.haltMinutes || 2,
            dayCount: s.dayCount || 1,
            isBoarding: idx === 0,
            isDebarking: idx === (t.stops?.length || 1) - 1,
            isInSegment: true,
          })),
          isDemo: true,
        })),
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        isPastDate,
        facets: {
          categories: [
            "Duronto Express",
            "Express",
            "Garib Rath Express",
            "Jan Shatabdi Express",
            "Passenger",
            "Rajdhani Express",
            "Sampark Kranti Express",
            "Shatabdi Express",
            "Superfast Express",
            "Vande Bharat Express",
          ],
          coachClasses: ["1A", "2A", "2S", "3A", "CC", "EC", "SL"],
          minFare: 120,
          maxFare: 2500,
          totalBeforeFilters: totalCount,
        },
      },
      {
        status: 200,
        headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" },
      }
    );
  } catch (error) {
    console.error("[API] GET /trains error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to retrieve trains." },
      { status: 500 }
    );
  }
}
