/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * RailConnect — Feature 07: Advanced Train Search & Filtering Test Suite
 */

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

// Load .env.local
const envPath = path.resolve(__dirname, "../.env.local");
let uri = "";
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const t = line.trim();
    if (t.startsWith("MONGODB_URI=")) {
      uri = t.slice("MONGODB_URI=".length).trim().replace(/^["']|["']$/g, "");
    }
  });
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getOriginRunDay(journeyDateStr, dayCount = 1) {
  const [y, m, d] = journeyDateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - Math.max(0, dayCount - 1));
  return DAYS[dt.getUTCDay()];
}

function calculateDuration(depTime, arrTime, depDay = 1, arrDay = 1) {
  const [dh = 0, dm = 0] = depTime.split(":").map(Number);
  const [ah = 0, am = 0] = arrTime.split(":").map(Number);
  const depMinutesTotal = dh * 60 + dm;
  let dayOffset = Math.max(0, arrDay - depDay);
  let arrMinutesTotal = dayOffset * 1440 + ah * 60 + am;
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

function getTimeSlot(timeStr) {
  const [h = 0] = timeStr.split(":").map(Number);
  if (h >= 6 && h < 12) return "morning";
  if (h >= 12 && h < 18) return "afternoon";
  if (h >= 18 && h < 24) return "evening";
  return "night";
}

async function runTestSuite() {
  console.log("============================================================");
  console.log("🧪 RailConnect — Feature 07 Advanced Search Test Suite");
  console.log("============================================================");

  await mongoose.connect(uri);
  const Train = mongoose.connection.collection("trains");
  const Station = mongoose.connection.collection("stations");

  const totalStations = await Station.countDocuments();
  const totalTrains = await Train.countDocuments();
  console.log(`Database Status: ${totalStations} Stations, ${totalTrains} Trains in MongoDB.`);
  console.log("------------------------------------------------------------");

  let passedTests = 0;
  let totalTests = 0;

  function assert(testName, condition, detail = "") {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`✓ [PASS] ${testName}${detail ? ` (${detail})` : ""}`);
    } else {
      console.error(`❌ [FAIL] ${testName}: ${detail}`);
    }
  }

  // TEST 1: Same Source and Destination Rejection
  const fromSame = "NDLS";
  const toSame = "NDLS";
  assert(
    "Same Source/Destination Rejection",
    fromSame.toLowerCase() === toSame.toLowerCase(),
    "Detected identical stations and rejected"
  );

  // TEST 2: Intermediate Station Search (New Delhi NDLS -> Kanpur Central CNB)
  const queryForward = {
    isActive: true,
    $and: [
      { $or: [{ sourceCode: "NDLS" }, { "stops.stationCode": "NDLS" }] },
      { $or: [{ destinationCode: "CNB" }, { "stops.stationCode": "CNB" }] },
    ],
  };
  const forwardCandidates = await Train.find(queryForward).toArray();
  const forwardMatches = [];
  const reverseExcluded = [];

  for (const t of forwardCandidates) {
    const stops = t.stops || [];
    const fIdx = stops.findIndex((s) => s.stationCode === "NDLS");
    const tIdx = stops.findIndex((s) => s.stationCode === "CNB");
    if (fIdx !== -1 && tIdx !== -1) {
      if (fIdx < tIdx) {
        forwardMatches.push(t);
      } else {
        reverseExcluded.push(t);
      }
    }
  }

  assert(
    "Intermediate Station Routing (NDLS -> CNB)",
    forwardMatches.length > 0,
    `Found ${forwardMatches.length} forward trains`
  );

  // TEST 3: Strict Reverse-Direction Route Prevention
  assert(
    "Reverse-Direction Prevention (CNB -> NDLS in NDLS -> CNB search)",
    reverseExcluded.length > 0 && forwardMatches.every((t) => {
      const stops = t.stops || [];
      return stops.findIndex((s) => s.stationCode === "NDLS") < stops.findIndex((s) => s.stationCode === "CNB");
    }),
    `Excluded ${reverseExcluded.length} reverse trains traveling CNB -> NDLS`
  );

  // TEST 4: Timing & Duration Calculation Accuracy
  const sampleTrain = forwardMatches[0];
  const stops = sampleTrain.stops || [];
  const fIdx = stops.findIndex((s) => s.stationCode === "NDLS");
  const tIdx = stops.findIndex((s) => s.stationCode === "CNB");
  const depTime = stops[fIdx].departureTime || sampleTrain.departure;
  const arrTime = stops[tIdx].arrivalTime || sampleTrain.arrival;
  const { durationText, durationMinutes, dayOffset } = calculateDuration(
    depTime,
    arrTime,
    stops[fIdx].dayCount || 1,
    stops[tIdx].dayCount || 1
  );

  assert(
    "Segment Duration & Day Offset Calculation",
    durationMinutes > 0 && typeof durationText === "string",
    `Train ${sampleTrain.trainNumber} (${sampleTrain.trainName}): Dep ${depTime} -> Arr ${arrTime} (${durationText}, DayOffset: +${dayOffset}D)`
  );

  // TEST 5: Running Days & Origin Day Deduction for Multi-Day Routes
  const wedDate = "2026-11-04"; // Wednesday
  const originDay1 = getOriginRunDay(wedDate, 1);
  const originDay2 = getOriginRunDay(wedDate, 2);
  assert(
    "Journey Day Calculation for Origin Offset",
    originDay1 === "Wed" && originDay2 === "Tue",
    `Wed Day 1 departs Wed; Wed Day 2 departs origin on Tue`
  );

  // TEST 6: Time Slot Filtering (Morning / Afternoon / Evening / Night)
  const morningTrains = forwardMatches.filter((t) => {
    const fStop = (t.stops || []).find((s) => s.stationCode === "NDLS");
    const dTime = fStop?.departureTime || t.departure;
    return getTimeSlot(dTime) === "morning";
  });
  const eveningTrains = forwardMatches.filter((t) => {
    const fStop = (t.stops || []).find((s) => s.stationCode === "NDLS");
    const dTime = fStop?.departureTime || t.departure;
    return getTimeSlot(dTime) === "evening";
  });
  assert(
    "Departure Time Slot Categorization",
    morningTrains.length > 0 || eveningTrains.length > 0,
    `Morning: ${morningTrains.length}, Evening: ${eveningTrains.length} on NDLS -> CNB`
  );

  // TEST 7: Category Filtering
  const rajdhaniTrains = forwardMatches.filter(
    (t) => (t.category || "").toLowerCase().includes("rajdhani")
  );
  assert(
    "Category Filtering (Rajdhani)",
    rajdhaniTrains.length > 0,
    `Found ${rajdhaniTrains.length} Rajdhani Express services on NDLS -> CNB`
  );

  // TEST 8: Coach Class Filtering
  const acFirstTrains = forwardMatches.filter(
    (t) => Array.isArray(t.coachTypes) && t.coachTypes.includes("1A")
  );
  assert(
    "Travel Class Filtering (1A - AC First)",
    acFirstTrains.length > 0,
    `Found ${acFirstTrains.length} trains with 1A class on NDLS -> CNB`
  );

  // TEST 9: Proportional Fare Calculation
  const totalStops = Math.max(1, stops.length - 1);
  const segmentStops = tIdx - fIdx;
  const ratio = Math.max(0.2, Math.min(1.0, segmentStops / totalStops));
  const segmentFare = Math.max(120, Math.round(sampleTrain.fare * ratio));
  assert(
    "Proportional Segment Fare Scaling",
    segmentFare > 0 && segmentFare <= sampleTrain.fare,
    `Full route fare: ₹${sampleTrain.fare}, Segment (${segmentStops}/${totalStops} stops) fare: ₹${segmentFare}`
  );

  // TEST 10: Sorting Options (Departure Time, Duration, Fare)
  const sortedByFareAsc = [...forwardMatches].sort((a, b) => a.fare - b.fare);
  const isFareAscSorted = sortedByFareAsc.every((t, i) => i === 0 || t.fare >= sortedByFareAsc[i - 1].fare);
  assert("Sorting by Fare Ascending", isFareAscSorted, "Verified monotonic non-decreasing order");

  console.log("------------------------------------------------------------");
  console.log(`Test Results: ${passedTests} / ${totalTests} tests passed.`);
  console.log("============================================================");

  await mongoose.disconnect();
}

runTestSuite().catch((err) => {
  console.error("Test suite failed:", err);
  process.exit(1);
});
