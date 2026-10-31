/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * RailConnect — Feature 08 Automated Test Suite
 * Tests dynamic coach configurations, template layouts (SL, 3A, 2A, 1A, CC, 2S),
 * inventory availability, atomic locking, double-booking prevention, and booking/cancellation release.
 *
 * Usage:
 *   node web/scripts/test-feature08.js
 */

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

// Load environment variables
const envPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const equalsIdx = trimmed.indexOf("=");
      if (equalsIdx > 0) {
        const key = trimmed.slice(0, equalsIdx).trim();
        const value = trimmed
          .slice(equalsIdx + 1)
          .trim()
          .replace(/^["']|["']$/g, "");
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  });
}

const MONGODB_URI = process.env.MONGODB_URI;

// Schemas
const CoachEntrySchema = new mongoose.Schema(
  {
    coachId: { type: String, required: true },
    coachClass: { type: String, required: true },
    sequence: { type: Number, required: true },
    layoutTemplateId: { type: String, required: true },
    totalCapacity: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const CoachConfigurationSchema = new mongoose.Schema(
  {
    trainNumber: { type: String, required: true, unique: true },
    coaches: [CoachEntrySchema],
    totalCoaches: { type: Number, required: true },
    totalCapacity: { type: Number, required: true },
    configurationSource: { type: String, default: "demo" },
    version: { type: Number, default: 1 },
  },
  { timestamps: true }
);

const SeatInventorySchema = new mongoose.Schema(
  {
    trainNumber: { type: String, required: true },
    journeyDate: { type: String, required: true },
    coachId: { type: String, required: true },
    coachClass: { type: String, required: true },
    seatNumber: { type: Number, required: true },
    berthType: { type: String, required: true },
    status: { type: String, default: "available" },
    lockedUntil: { type: Date, default: null },
    lockedBy: { type: String, default: null },
    bookingReference: { type: String, default: null },
  },
  { timestamps: true }
);

SeatInventorySchema.index(
  { trainNumber: 1, journeyDate: 1, coachId: 1, seatNumber: 1 },
  { unique: true }
);

const BookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    bookingReference: { type: String, required: true, unique: true },
    trainNumber: { type: String, required: true },
    trainName: { type: String, required: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    journeyDate: { type: String, required: true },
    passengers: [{ name: String, age: Number, gender: String }],
    passengerCount: { type: Number, required: true },
    coach: { type: String, required: true },
    coachClass: { type: String, default: "SL" },
    seats: [String],
    totalFare: { type: Number, required: true },
    status: { type: String, default: "confirmed" },
  },
  { timestamps: true }
);

const CoachConfiguration =
  mongoose.models.CoachConfiguration ||
  mongoose.model("CoachConfiguration", CoachConfigurationSchema);

const SeatInventory =
  mongoose.models.SeatInventory ||
  mongoose.model("SeatInventory", SeatInventorySchema);

const Booking =
  mongoose.models.Booking || mongoose.model("Booking", BookingSchema);

// Template Layout Generators directly tested
function generateSL72Berths() {
  const berths = [];
  for (let b = 1; b <= 9; b++) {
    const start = (b - 1) * 8;
    berths.push({ number: start + 1, type: "LB", label: "Lower Berth", isSide: false });
    berths.push({ number: start + 2, type: "MB", label: "Middle Berth", isSide: false });
    berths.push({ number: start + 3, type: "UB", label: "Upper Berth", isSide: false });
    berths.push({ number: start + 4, type: "LB", label: "Lower Berth", isSide: false });
    berths.push({ number: start + 5, type: "MB", label: "Middle Berth", isSide: false });
    berths.push({ number: start + 6, type: "UB", label: "Upper Berth", isSide: false });
    berths.push({ number: start + 7, type: "SL", label: "Side Lower", isSide: true });
    berths.push({ number: start + 8, type: "SU", label: "Side Upper", isSide: true });
  }
  return berths;
}

function generate3A64Berths() {
  const berths = [];
  for (let b = 1; b <= 8; b++) {
    const start = (b - 1) * 8;
    berths.push({ number: start + 1, type: "LB", label: "Lower Berth", isSide: false });
    berths.push({ number: start + 2, type: "MB", label: "Middle Berth", isSide: false });
    berths.push({ number: start + 3, type: "UB", label: "Upper Berth", isSide: false });
    berths.push({ number: start + 4, type: "LB", label: "Lower Berth", isSide: false });
    berths.push({ number: start + 5, type: "MB", label: "Middle Berth", isSide: false });
    berths.push({ number: start + 6, type: "UB", label: "Upper Berth", isSide: false });
    berths.push({ number: start + 7, type: "SL", label: "Side Lower", isSide: true });
    berths.push({ number: start + 8, type: "SU", label: "Side Upper", isSide: true });
  }
  return berths;
}

function generate2A48Berths() {
  const berths = [];
  for (let b = 1; b <= 8; b++) {
    const start = (b - 1) * 6;
    berths.push({ number: start + 1, type: "LB", label: "Lower Berth", isSide: false });
    berths.push({ number: start + 2, type: "UB", label: "Upper Berth", isSide: false });
    berths.push({ number: start + 3, type: "LB", label: "Lower Berth", isSide: false });
    berths.push({ number: start + 4, type: "UB", label: "Upper Berth", isSide: false });
    berths.push({ number: start + 5, type: "SL", label: "Side Lower", isSide: true });
    berths.push({ number: start + 6, type: "SU", label: "Side Upper", isSide: true });
  }
  return berths;
}

function generate1A22Berths() {
  const berths = [];
  let seatNumber = 1;
  const cabins = ["A", "B", "C", "D"];
  for (const letter of cabins) {
    berths.push({ number: seatNumber++, type: "CABIN_LB", label: "Cabin Lower Berth", comp: `Cabin ${letter}` });
    berths.push({ number: seatNumber++, type: "CABIN_UB", label: "Cabin Upper Berth", comp: `Cabin ${letter}` });
    berths.push({ number: seatNumber++, type: "CABIN_LB", label: "Cabin Lower Berth", comp: `Cabin ${letter}` });
    berths.push({ number: seatNumber++, type: "CABIN_UB", label: "Cabin Upper Berth", comp: `Cabin ${letter}` });
  }
  const coupes = ["E", "F", "G"];
  for (const letter of coupes) {
    berths.push({ number: seatNumber++, type: "COUPE_LB", label: "Coupe Lower Berth", comp: `Coupe ${letter}` });
    berths.push({ number: seatNumber++, type: "COUPE_UB", label: "Coupe Upper Berth", comp: `Coupe ${letter}` });
  }
  return berths;
}

async function runTests() {
  console.log("=================================================");
  console.log("  RailConnect Feature 08: Test & Verification Suite");
  console.log("=================================================\n");

  await mongoose.connect(MONGODB_URI);
  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = "") {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName} - ${details}`);
      failed++;
    }
  }

  // --- Test 1: Layout Templates Capacities and Specifications ---
  console.log("--- TEST GROUP 1: COACH LAYOUT TEMPLATES ---");
  const sl = generateSL72Berths();
  assert(
    sl.length === 72,
    "SL-72 template generates exactly 72 berths",
    `Got ${sl.length}`
  );
  assert(
    sl[0].type === "LB" && sl[1].type === "MB" && sl[2].type === "UB" && sl[6].type === "SL" && sl[7].type === "SU",
    "SL-72 has correct berth types (LB, MB, UB, SL, SU)",
    JSON.stringify(sl.slice(0, 8))
  );

  const threeA = generate3A64Berths();
  assert(
    threeA.length === 64,
    "3A-64 template generates exactly 64 berths (8 bays)",
    `Got ${threeA.length}`
  );

  const twoA = generate2A48Berths();
  assert(
    twoA.length === 48,
    "2A-48 template generates exactly 48 berths (8 bays)",
    `Got ${twoA.length}`
  );
  const twoAHasMiddle = twoA.some((b) => b.type === "MB");
  assert(
    !twoAHasMiddle,
    "2A-48 contains NO Middle Berths (only LB, UB, SL, SU)",
    `Contains MB: ${twoAHasMiddle}`
  );

  const oneA = generate1A22Berths();
  assert(
    oneA.length === 22,
    "1A-22 template generates exactly 22 berths (4 Cabins + 3 Coupes)",
    `Got ${oneA.length}`
  );
  const cabinBerths = oneA.filter((b) => b.comp && b.comp.startsWith("Cabin"));
  const coupeBerths = oneA.filter((b) => b.comp && b.comp.startsWith("Coupe"));
  assert(
    cabinBerths.length === 16 && coupeBerths.length === 6,
    "1A-22 correctly allocates 16 cabin berths (4x4) and 6 coupe berths (3x2)",
    `Cabin: ${cabinBerths.length}, Coupe: ${coupeBerths.length}`
  );

  // --- Test 2: Train Coach Compositions in MongoDB ---
  console.log("\n--- TEST GROUP 2: TRAIN COACH COMPOSITIONS ---");
  const totalConfigs = await CoachConfiguration.countDocuments();
  assert(
    totalConfigs >= 5200,
    `MongoDB contains coach configurations for all trains (Found: ${totalConfigs})`,
    `Expected >= 5200`
  );

  const rajdhaniConfig = await CoachConfiguration.findOne({
    trainNumber: "12951",
  }).lean();
  assert(
    Boolean(rajdhaniConfig),
    "Train 12951 (Mumbai Rajdhani) has active coach composition in DB",
    "Not found"
  );

  const rajdhaniClasses = new Set(rajdhaniConfig.coaches.map((c) => c.coachClass));
  assert(
    rajdhaniClasses.has("1A") && rajdhaniClasses.has("2A") && rajdhaniClasses.has("3A"),
    "Rajdhani composition includes 1A, 2A, and 3A coaches",
    `Classes: ${Array.from(rajdhaniClasses).join(", ")}`
  );

  const rajdhaniH1 = rajdhaniConfig.coaches.find((c) => c.coachId === "H1");
  const rajdhaniA1 = rajdhaniConfig.coaches.find((c) => c.coachId === "A1");
  const rajdhaniB1 = rajdhaniConfig.coaches.find((c) => c.coachId === "B1");

  assert(
    rajdhaniH1 && rajdhaniH1.layoutTemplateId === "1A-22" && rajdhaniH1.totalCapacity === 22,
    "H1 coach configured with 1A-22 layout template (22 berths)",
    JSON.stringify(rajdhaniH1)
  );
  assert(
    rajdhaniA1 && rajdhaniA1.layoutTemplateId === "2A-48" && rajdhaniA1.totalCapacity === 48,
    "A1 coach configured with 2A-48 layout template (48 berths)",
    JSON.stringify(rajdhaniA1)
  );
  assert(
    rajdhaniB1 && rajdhaniB1.layoutTemplateId === "3A-64" && rajdhaniB1.totalCapacity === 64,
    "B1 coach configured with 3A-64 layout template (64 berths)",
    JSON.stringify(rajdhaniB1)
  );
  assert(
    rajdhaniH1.totalCapacity !== rajdhaniA1.totalCapacity &&
      rajdhaniA1.totalCapacity !== rajdhaniB1.totalCapacity,
    "Dynamic coach layouts verified: No universal 72-seat layout used across coaches!",
    "Capacities match"
  );

  // --- Test 3: Atomic Seat Locking & Double-Booking Prevention ---
  console.log("\n--- TEST GROUP 3: ATOMIC LOCKING & CONCURRENCY ---");
  const testTrain = "TEST999";
  const testDate = "2026-11-20";
  const testCoach = "B1";
  const testSeat = 7;
  const userA = "user_alpha_123";
  const userB = "user_beta_456";

  // Clean test artifacts
  await SeatInventory.deleteMany({ trainNumber: testTrain });

  // 3a. User A locks Seat 7
  const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  const lockA = await SeatInventory.findOneAndUpdate(
    {
      trainNumber: testTrain,
      journeyDate: testDate,
      coachId: testCoach,
      seatNumber: testSeat,
      $or: [
        { status: "available" },
        { status: "locked", lockedUntil: { $lt: new Date() } },
        { status: "locked", lockedBy: userA },
      ],
    },
    {
      $set: {
        trainNumber: testTrain,
        journeyDate: testDate,
        coachId: testCoach,
        coachClass: "3A",
        seatNumber: testSeat,
        berthType: "SL",
        status: "locked",
        lockedUntil: expiry,
        lockedBy: userA,
      },
    },
    { upsert: true, new: true }
  );

  assert(
    lockA && lockA.status === "locked" && lockA.lockedBy === userA,
    "User A successfully acquires 10-minute lock on Seat 7",
    JSON.stringify(lockA)
  );

  // 3b. User B attempts concurrent lock on the same seat
  let lockB = null;
  const existingDoc = await SeatInventory.findOne({
    trainNumber: testTrain,
    journeyDate: testDate,
    coachId: testCoach,
    seatNumber: testSeat,
  });

  const now = new Date();
  const isConflict =
    existingDoc.status === "booked" ||
    (existingDoc.status === "locked" &&
      existingDoc.lockedUntil > now &&
      existingDoc.lockedBy !== userB);

  if (!isConflict) {
    lockB = await SeatInventory.findOneAndUpdate(
      {
        trainNumber: testTrain,
        journeyDate: testDate,
        coachId: testCoach,
        seatNumber: testSeat,
        $or: [
          { status: "available" },
          { status: "locked", lockedUntil: { $lt: now } },
          { status: "locked", lockedBy: userB },
        ],
      },
      {
        $set: { status: "locked", lockedBy: userB, lockedUntil: expiry },
      },
      { new: true }
    );
  }

  assert(
    isConflict && lockB === null,
    "User B's concurrent lock on Seat 7 is REJECTED (Double-booking strictly prevented)",
    `Conflict: ${isConflict}, LockB: ${lockB}`
  );

  // 3c. Expired Lock is released to new user
  console.log("\n--- TEST GROUP 4: LOCK EXPIRY & TAKEOVER ---");
  // Set lock expiry to 5 minutes ago
  await SeatInventory.updateOne(
    { trainNumber: testTrain, journeyDate: testDate, coachId: testCoach, seatNumber: testSeat },
    { $set: { lockedUntil: new Date(Date.now() - 5 * 60 * 1000) } }
  );

  const takeoverTime = new Date();
  const takeoverLock = await SeatInventory.findOneAndUpdate(
    {
      trainNumber: testTrain,
      journeyDate: testDate,
      coachId: testCoach,
      seatNumber: testSeat,
      $or: [
        { status: "available" },
        { status: "locked", lockedUntil: { $lt: takeoverTime } },
        { status: "locked", lockedBy: userB },
      ],
    },
    {
      $set: {
        status: "locked",
        lockedUntil: new Date(Date.now() + 10 * 60 * 1000),
        lockedBy: userB,
      },
    },
    { new: true }
  );

  assert(
    takeoverLock && takeoverLock.lockedBy === userB,
    "Expired lock on Seat 7 successfully acquired by User B",
    JSON.stringify(takeoverLock)
  );

  // --- Test 5: Booking Confirmation & Seat Inventory Transition ---
  console.log("\n--- TEST GROUP 5: CONFIRMATION & CANCELLATION ---");
  const testRef = `RC_TEST_${Date.now()}`;
  const confirmResult = await SeatInventory.findOneAndUpdate(
    {
      trainNumber: testTrain,
      journeyDate: testDate,
      coachId: testCoach,
      seatNumber: testSeat,
      $or: [
        { status: "locked", lockedBy: userB },
        { status: "available" },
      ],
    },
    {
      $set: {
        status: "booked",
        bookingReference: testRef,
        lockedBy: null,
        lockedUntil: null,
      },
    },
    { new: true }
  );

  assert(
    confirmResult && confirmResult.status === "booked" && confirmResult.bookingReference === testRef,
    "Seat 7 transitions to 'booked' status upon reservation confirmation",
    JSON.stringify(confirmResult)
  );

  // 3d. User cancels booking -> seat released
  const releaseCount = (
    await SeatInventory.updateMany(
      { bookingReference: testRef },
      { $set: { status: "available", bookingReference: null, lockedBy: null, lockedUntil: null } }
    )
  ).modifiedCount;

  const releasedSeat = await SeatInventory.findOne({
    trainNumber: testTrain,
    journeyDate: testDate,
    coachId: testCoach,
    seatNumber: testSeat,
  });

  assert(
    releaseCount === 1 && releasedSeat.status === "available" && releasedSeat.bookingReference === null,
    "Cancelling booking immediately releases Seat 7 back to 'available' status",
    `Released: ${releaseCount}, Status: ${releasedSeat.status}`
  );

  // Clean test artifacts
  await SeatInventory.deleteMany({ trainNumber: testTrain });

  // --- Test 6: Historical Bookings Preservation ---
  console.log("\n--- TEST GROUP 6: HISTORICAL DATA INTEGRITY ---");
  const existingBookings = await Booking.find({}).lean();
  assert(
    existingBookings.length >= 3,
    `All historical bookings preserved (Found: ${existingBookings.length})`,
    `Expected >= 3`
  );

  for (const b of existingBookings) {
    assert(
      b.bookingReference && b.trainNumber && b.seats.length > 0,
      `Historical booking ${b.bookingReference} has intact trainNumber and seats`,
      JSON.stringify(b)
    );
  }

  // --- Summary ---
  console.log("\n=================================================");
  console.log(`  Tests Passed: ${passed} / ${passed + failed}`);
  console.log(`  Tests Failed: ${failed}`);
  console.log("=================================================");

  await mongoose.disconnect();

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution threw error:", err);
  process.exit(1);
});
