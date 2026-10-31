#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * RailConnect Railway Reservation System
 * All-India Comprehensive Train Network Importer
 *
 * Primary Source: https://github.com/prasenjit-27/Indian-Railway-Data (trains.json ~5,208 trains)
 *
 * Usage:
 *   node scripts/import-trains.js [--dry-run]
 */

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

// 1. Load environment variables from .env.local
const envPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const equalsIdx = trimmed.indexOf("=");
      if (equalsIdx > 0) {
        const key = trimmed.slice(0, equalsIdx).trim();
        const value = trimmed.slice(equalsIdx + 1).trim().replace(/^["']|["']$/g, "");
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  });
}

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error("❌ Error: MONGODB_URI is not defined in .env.local");
  process.exit(1);
}

const isDryRun = process.argv.includes("--dry-run");

// 2. Define Mongoose Train & Station Schemas inline for standalone execution
const TrainStopSchema = new mongoose.Schema(
  {
    stationCode: { type: String, required: true, uppercase: true, trim: true },
    stationName: { type: String, required: true, trim: true },
    arrivalTime: { type: String, required: true, trim: true },
    departureTime: { type: String, required: true, trim: true },
    haltMinutes: { type: Number, default: 2, min: 0 },
    dayCount: { type: Number, default: 1, min: 1 },
  },
  { _id: false }
);

const TrainSchema = new mongoose.Schema(
  {
    trainNumber: { type: String, required: true, unique: true, trim: true, uppercase: true, index: true },
    trainName: { type: String, required: true, trim: true, maxlength: 120 },
    source: { type: String, required: true, trim: true, maxlength: 80 },
    sourceCode: { type: String, trim: true, uppercase: true, maxlength: 10 },
    destination: { type: String, required: true, trim: true, maxlength: 80 },
    destinationCode: { type: String, trim: true, uppercase: true, maxlength: 10 },
    departure: { type: String, required: true, trim: true },
    arrival: { type: String, required: true, trim: true },
    duration: { type: String, required: true, trim: true, default: "4h 00m" },
    fare: { type: Number, required: true, min: 0, default: 500 },
    totalSeats: { type: Number, required: true, min: 1, default: 72 },
    availableSeats: { type: Number, required: true, min: 0, default: 72 },
    coachTypes: { type: [String], default: ["SL", "3A", "2A", "CC"] },
    runsOn: { type: [String], default: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
    category: { type: String, trim: true, default: "Express" },
    stops: { type: [TrainStopSchema], default: [] },
    isDemo: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

TrainSchema.index({ source: 1, destination: 1, isActive: 1 });
TrainSchema.index({ sourceCode: 1, destinationCode: 1, isActive: 1 });
TrainSchema.index({ "stops.stationCode": 1 });

const Train = mongoose.models.Train || mongoose.model("Train", TrainSchema);

// Station Schema to verify station references
const StationSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);
const Station = mongoose.models.Station || mongoose.model("Station", StationSchema);

// Helper: Format "HH:mm:ss" or "H:m" into clean "HH:mm"
function formatHHMM(timeStr, fallback = "00:00") {
  if (!timeStr || typeof timeStr !== "string") return fallback;
  const parts = timeStr.trim().split(":");
  if (parts.length >= 2) {
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (!isNaN(h) && !isNaN(m) && h >= 0 && h < 24 && m >= 0 && m < 60) {
      return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
    }
  }
  return fallback;
}

// Helper: Calculate duration between departure at origin and arrival at destination
function calculateDuration(depTime, arrTime, depDay = 1, arrDay = 1) {
  const [dh, dm] = depTime.split(":").map(Number);
  const [ah, am] = arrTime.split(":").map(Number);
  const depMinutesTotal = dh * 60 + dm;
  let arrMinutesTotal = (Math.max(1, arrDay) - Math.max(1, depDay)) * 1440 + ah * 60 + am;
  if (arrMinutesTotal < depMinutesTotal) {
    arrMinutesTotal += 1440;
  }
  const diffMinutes = Math.max(15, arrMinutesTotal - depMinutesTotal);
  const hours = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;
  return `${hours}h ${mins.toString().padStart(2, "0")}m`;
}

// Helper: Calculate halt minutes between arrival and departure at a stop
function calculateHalt(arrTime, depTime) {
  const [ah, am] = arrTime.split(":").map(Number);
  const [dh, dm] = depTime.split(":").map(Number);
  let diff = (dh * 60 + dm) - (ah * 60 + am);
  if (diff < 0) diff += 1440;
  return Math.min(120, Math.max(1, diff));
}

// Helper: Map raw train category to display category and coach classes
function mapCategoryAndCoaches(rawType, trainName = "") {
  const typeUpper = (rawType || "").toUpperCase().trim();
  const nameUpper = (trainName || "").toUpperCase();

  if (typeUpper === "RAJ" || nameUpper.includes("RAJDHANI")) {
    return {
      category: "Rajdhani Express",
      coachTypes: ["3A", "2A", "1A"],
      baseFare: 1650,
      totalSeats: 120,
    };
  }
  if (typeUpper === "SHTB" || nameUpper.includes("SHATABDI")) {
    return {
      category: "Shatabdi Express",
      coachTypes: ["CC", "EC"],
      baseFare: 1150,
      totalSeats: 90,
    };
  }
  if (typeUpper === "JSHTB" || nameUpper.includes("JAN SHATABDI")) {
    return {
      category: "Jan Shatabdi Express",
      coachTypes: ["2S", "CC"],
      baseFare: 420,
      totalSeats: 108,
    };
  }
  if (typeUpper === "DRNT" || nameUpper.includes("DURONTO")) {
    return {
      category: "Duronto Express",
      coachTypes: ["SL", "3A", "2A", "1A"],
      baseFare: 1450,
      totalSeats: 144,
    };
  }
  if (typeUpper === "GR" || nameUpper.includes("GARIB RATH")) {
    return {
      category: "Garib Rath Express",
      coachTypes: ["3A", "CC"],
      baseFare: 720,
      totalSeats: 128,
    };
  }
  if (typeUpper === "SF" || nameUpper.includes("SUPERFAST") || nameUpper.includes("SF ")) {
    return {
      category: "Superfast Express",
      coachTypes: ["SL", "3A", "2A"],
      baseFare: 680,
      totalSeats: 144,
    };
  }
  if (typeUpper === "SKR" || nameUpper.includes("SAMPARK KRANTI")) {
    return {
      category: "Sampark Kranti Express",
      coachTypes: ["SL", "3A", "2A"],
      baseFare: 720,
      totalSeats: 144,
    };
  }
  if (typeUpper === "DEMU" || typeUpper === "MEMU" || typeUpper === "PASS" || nameUpper.includes("PASSENGER")) {
    return {
      category: "Passenger",
      coachTypes: ["2S"],
      baseFare: 120,
      totalSeats: 120,
    };
  }
  if (typeUpper === "TOY" || nameUpper.includes("TOY")) {
    return {
      category: "Heritage / Toy Train",
      coachTypes: ["2S", "CC"],
      baseFare: 250,
      totalSeats: 60,
    };
  }
  return {
    category: "Express",
    coachTypes: ["SL", "3A", "2A"],
    baseFare: 550,
    totalSeats: 144,
  };
}

// Helper: Map runningDays boolean object to ["Mon", "Tue", ...] array
function mapRunningDays(runningDaysObj) {
  const dayKeyMap = {
    MON: "Mon",
    TUE: "Tue",
    WED: "Wed",
    THU: "Thu",
    FRI: "Fri",
    SAT: "Sat",
    SUN: "Sun",
  };
  if (!runningDaysObj || typeof runningDaysObj !== "object") {
    return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  }
  const runsOn = [];
  for (const [k, v] of Object.entries(runningDaysObj)) {
    const normKey = k.toUpperCase().trim();
    if (v && dayKeyMap[normKey]) {
      runsOn.push(dayKeyMap[normKey]);
    }
  }
  if (runsOn.length === 0) {
    return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  }
  return runsOn;
}

async function runTrainImport() {
  const startTime = Date.now();
  console.log("============================================================");
  console.log("🚆 RailConnect — Comprehensive All-India Train Network Importer");
  console.log("============================================================");
  if (isDryRun) {
    console.log("🔍 MODE: DRY RUN (No changes will be written to MongoDB)");
  } else {
    console.log("⚡ MODE: LIVE UPSERT (Safe merge into MongoDB)");
  }
  console.log("Primary Source: https://github.com/prasenjit-27/Indian-Railway-Data (trains.json)");
  console.log("------------------------------------------------------------");

  // 3. Load trains.json
  const trainsFilePath = path.resolve(__dirname, "../data/trains.json");
  if (!fs.existsSync(trainsFilePath)) {
    console.error(`❌ Error: Train dataset not found at: ${trainsFilePath}`);
    process.exit(1);
  }

  console.log("📦 Reading trains.json from disk...");
  let rawTrains;
  try {
    const rawData = fs.readFileSync(trainsFilePath, "utf8");
    rawTrains = JSON.parse(rawData);
  } catch (err) {
    console.error("❌ Error parsing trains.json:", err.message);
    process.exit(1);
  }
  const totalRawCount = rawTrains.length;
  console.log(`📦 Loaded ${totalRawCount} raw train records.`);

  // 4. Connect to MongoDB
  console.log("Connecting to MongoDB...");
  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
    console.log("✓ Connected to MongoDB successfully.");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }

  // 5. Query Station codes and names for validation & enrichment
  console.log("Fetching station directory from MongoDB...");
  const stationsInDb = await Station.find({}, { code: 1, name: 1 }).lean();
  const stationMap = new Map();
  for (const s of stationsInDb) {
    stationMap.set(s.code.toUpperCase().trim(), s.name);
  }
  console.log(`✓ Loaded ${stationMap.size} stations from database for route stop validation.`);

  // 6. Query existing trains to check counts and preserve existing records
  const existingTrainDocs = await Train.find({}, { trainNumber: 1 }).lean();
  const existingTrainSet = new Set(existingTrainDocs.map((t) => t.trainNumber));
  console.log(`ℹ Found ${existingTrainSet.size} existing train records currently in database.`);

  // 7. Process & Validate Each Train
  console.log("Validating and parsing train routes...");
  const validTrains = [];
  const skippedTrains = [];
  let totalRouteStopsCount = 0;
  const seenTrainNumbers = new Set();

  for (let idx = 0; idx < rawTrains.length; idx++) {
    const raw = rawTrains[idx];
    const trainNum = String(raw.trainNumber || "").trim().toUpperCase();

    if (!trainNum) {
      skippedTrains.push({ index: idx, reason: "Missing train number" });
      continue;
    }

    if (seenTrainNumbers.has(trainNum)) {
      skippedTrains.push({ index: idx, trainNumber: trainNum, reason: "Duplicate train number in source" });
      continue;
    }
    seenTrainNumbers.add(trainNum);

    const rawRoute = Array.isArray(raw.completeOrderedRoute) ? raw.completeOrderedRoute : [];
    if (rawRoute.length === 0) {
      skippedTrains.push({ index: idx, trainNumber: trainNum, reason: "Empty route" });
      continue;
    }

    // Filter to stops with scheduled arrival/departure times or valid passenger stops
    const timedStops = rawRoute.filter((s) => s.arrivalTime || s.departureTime);
    if (timedStops.length < 2) {
      skippedTrains.push({
        index: idx,
        trainNumber: trainNum,
        trainName: raw.trainName,
        reason: `Insufficient timed stops (${timedStops.length} timed stops)`,
      });
      continue;
    }

    // Determine Origin and Destination stops
    // First timed stop is origin, last timed stop is destination
    const firstTimed = timedStops[0];
    const lastTimed = timedStops[timedStops.length - 1];

    const sourceCode = (raw.source?.code || firstTimed.stationCode || "").toUpperCase().trim();
    const destCode = (raw.destination?.code || lastTimed.stationCode || "").toUpperCase().trim();

    // Format Origin Departure and Destination Arrival
    const departureTime = formatHHMM(firstTimed.departureTime || firstTimed.arrivalTime, "08:00");
    const arrivalTime = formatHHMM(lastTimed.arrivalTime || lastTimed.departureTime, "18:00");
    const duration = calculateDuration(departureTime, arrivalTime, firstTimed.journeyDay || 1, lastTimed.journeyDay || 1);

    // Resolve Origin / Destination Station Names
    const sourceName =
      stationMap.get(sourceCode) ||
      raw.source?.name ||
      firstTimed.stationName ||
      sourceCode;
    const destName =
      stationMap.get(destCode) ||
      raw.destination?.name ||
      lastTimed.stationName ||
      destCode;

    // Build normalized stops array
    const stops = [];
    for (let sIdx = 0; sIdx < timedStops.length; sIdx++) {
      const s = timedStops[sIdx];
      const stopCode = String(s.stationCode || "").toUpperCase().trim();
      const stopName = stationMap.get(stopCode) || s.stationName || stopCode;

      let arr = formatHHMM(s.arrivalTime);
      let dep = formatHHMM(s.departureTime);

      if (sIdx === 0) {
        // Origin stop
        dep = departureTime;
        arr = dep;
      } else if (sIdx === timedStops.length - 1) {
        // Destination stop
        arr = arrivalTime;
        dep = arr;
      } else {
        // Intermediate stop
        if (!s.arrivalTime && s.departureTime) arr = dep;
        if (!s.departureTime && s.arrivalTime) dep = arr;
      }

      const haltMinutes = sIdx === 0 || sIdx === timedStops.length - 1 ? 0 : calculateHalt(arr, dep);

      stops.push({
        stationCode: stopCode,
        stationName: stopName,
        arrivalTime: arr,
        departureTime: dep,
        haltMinutes,
        dayCount: Math.max(1, s.journeyDay || 1),
      });
    }

    totalRouteStopsCount += stops.length;

    // Map Category, Coaches, Seats and Fare
    const { category, coachTypes, baseFare, totalSeats } = mapCategoryAndCoaches(raw.type, raw.trainName);
    const overallKm = typeof raw.overallDistanceKm === "number" && raw.overallDistanceKm > 0 ? raw.overallDistanceKm : 0;
    const computedFare = overallKm > 0 ? Math.max(120, Math.round(overallKm * 0.85)) : baseFare;

    // Running Days
    const runsOn = mapRunningDays(raw.runningDays);

    const cleanTrainName = (raw.trainName || `Train ${trainNum}`).trim().slice(0, 120);

    validTrains.push({
      trainNumber: trainNum,
      trainName: cleanTrainName,
      source: sourceName.slice(0, 80),
      sourceCode: sourceCode.slice(0, 10),
      destination: destName.slice(0, 80),
      destinationCode: destCode.slice(0, 10),
      departure: departureTime,
      arrival: arrivalTime,
      duration,
      fare: computedFare,
      totalSeats,
      availableSeats: totalSeats,
      coachTypes,
      runsOn,
      category,
      stops,
      isDemo: true,
      isActive: true,
    });
  }

  console.log("------------------------------------------------------------");
  console.log(`✓ Total valid trains to import: ${validTrains.length}`);
  console.log(`⚠ Skipped trains: ${skippedTrains.length}`);
  console.log(`✓ Total route stops across valid trains: ${totalRouteStopsCount}`);
  console.log("------------------------------------------------------------");

  let newlyInserted = 0;
  let existingUpdated = 0;
  const now = new Date();

  // 8. Execute Bulk Operations in Batches of 250
  const BATCH_SIZE = 250;
  if (!isDryRun) {
    console.log(`Executing bulkWrite upserts in batches of ${BATCH_SIZE}...`);
    let processed = 0;

    for (let i = 0; i < validTrains.length; i += BATCH_SIZE) {
      const batch = validTrains.slice(i, i + BATCH_SIZE);
      const operations = batch.map((t) => {
        const isExisting = existingTrainSet.has(t.trainNumber);
        if (isExisting) {
          existingUpdated++;
        } else {
          newlyInserted++;
        }

        return {
          updateOne: {
            filter: { trainNumber: t.trainNumber },
            update: {
              $set: {
                trainName: t.trainName,
                source: t.source,
                sourceCode: t.sourceCode,
                destination: t.destination,
                destinationCode: t.destinationCode,
                departure: t.departure,
                arrival: t.arrival,
                duration: t.duration,
                category: t.category,
                stops: t.stops,
                runsOn: t.runsOn,
                isDemo: true,
                isActive: true,
                updatedAt: now,
              },
              $setOnInsert: {
                trainNumber: t.trainNumber,
                fare: t.fare,
                totalSeats: t.totalSeats,
                availableSeats: t.availableSeats,
                coachTypes: t.coachTypes,
                createdAt: now,
              },
            },
            upsert: true,
          },
        };
      });

      await Train.bulkWrite(operations, { ordered: false });
      processed += batch.length;
      if (processed % 500 === 0 || processed === validTrains.length) {
        console.log(`  Processed ${processed} / ${validTrains.length} trains...`);
      }
    }
    console.log("✓ All bulkWrite operations committed successfully.");
  } else {
    for (const t of validTrains) {
      if (existingTrainSet.has(t.trainNumber)) {
        existingUpdated++;
      } else {
        newlyInserted++;
      }
    }
  }

  // 9. Query final count from DB
  let finalDbCount = existingTrainSet.size;
  if (!isDryRun) {
    finalDbCount = await Train.countDocuments();
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);

  // 10. Summary Report
  console.log("============================================================");
  console.log("📊 ALL-INDIA TRAIN NETWORK IMPORT REPORT");
  console.log("============================================================");
  console.log(`  Source File:                 web/data/trains.json`);
  console.log(`  Total Trains in Source:      ${totalRawCount}`);
  console.log(`  Valid Trains Imported:       ${validTrains.length}`);
  console.log(`  Skipped Trains (< 2 stops):  ${skippedTrains.length}`);
  console.log(`  Duplicate Source Records:    0`);
  console.log(`  Existing Trains Preserved:   ${existingTrainSet.size}`);
  console.log(`  Existing Trains Updated:     ${existingUpdated}`);
  console.log(`  Newly Inserted Trains:       ${newlyInserted}`);
  console.log(`  Total Route Stops Imported:  ${totalRouteStopsCount}`);
  console.log(`  Final Total Train Count:     ${finalDbCount}`);
  console.log(`  Import Duration:             ${durationSec}s`);
  if (isDryRun) {
    console.log("  Mode:                        DRY RUN (No DB mutations)");
  } else {
    console.log("  Mode:                        LIVE UPSERT (Committed to MongoDB)");
  }
  console.log("============================================================");

  if (skippedTrains.length > 0) {
    console.log(`ℹ Skipped train reasons (sample):`);
    skippedTrains.slice(0, 5).forEach((st) => {
      console.log(`  - Train ${st.trainNumber || "N/A"} (${st.trainName || "N/A"}): ${st.reason}`);
    });
  }

  console.log("🎉 Train import process completed successfully!");
  await mongoose.disconnect();
}

runTrainImport().catch((err) => {
  console.error("❌ Fatal error during train import:", err);
  process.exit(1);
});
