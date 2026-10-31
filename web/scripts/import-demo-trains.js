#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * RailConnect Railway Reservation System
 * Demo Train Importer
 *
 * Imports curated DEMO trains into MongoDB.
 *
 * Usage:
 *   node scripts/import-demo-trains.js [--dry-run]
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

// 2. Define Mongoose Train Schema inline for standalone CLI script
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
    trainNumber: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    trainName: { type: String, required: true, trim: true },
    source: { type: String, required: true, trim: true },
    sourceCode: { type: String, trim: true, uppercase: true },
    destination: { type: String, required: true, trim: true },
    destinationCode: { type: String, trim: true, uppercase: true },
    departure: { type: String, required: true, trim: true },
    arrival: { type: String, required: true, trim: true },
    duration: { type: String, required: true, trim: true },
    fare: { type: Number, required: true, min: 0 },
    totalSeats: { type: Number, default: 72 },
    availableSeats: { type: Number, default: 72 },
    coachTypes: { type: [String], default: ["SL", "3A", "2A"] },
    runsOn: { type: [String], default: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
    category: { type: String, trim: true, default: "Express" },
    stops: { type: [TrainStopSchema], default: [] },
    isDemo: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

const Train = mongoose.models.Train || mongoose.model("Train", TrainSchema);

async function runTrainImport() {
  console.log("============================================================");
  console.log("🚆 RailConnect — Demo Train Database Importer");
  console.log("============================================================");
  if (isDryRun) {
    console.log("🔍 MODE: DRY RUN (No changes will be written to MongoDB)");
  } else {
    console.log("⚡ MODE: LIVE UPSERT (Safe merge into MongoDB)");
  }
  console.log("Notice: All imported services are DEMO simulation trains.");
  console.log("------------------------------------------------------------");

  const dataPath = path.resolve(__dirname, "../data/demoTrains.json");
  if (!fs.existsSync(dataPath)) {
    console.error(`❌ Error: Demo train dataset not found at: ${dataPath}`);
    console.error("Please run node scripts/generate-demo-trains.js first.");
    process.exit(1);
  }

  const rawTrains = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  const sourceRecordCount = rawTrains.length;
  console.log(`📦 Loaded ${sourceRecordCount} demo train definitions.`);

  // Validation
  let validRecords = 0;
  let invalidRecords = 0;
  const normalizedTrains = [];
  const seenNumbers = new Set();
  let duplicateCount = 0;

  for (const t of rawTrains) {
    const num = (t.trainNumber || "").trim().toUpperCase();
    const name = (t.trainName || "").trim();
    const src = (t.source || "").trim();
    const dst = (t.destination || "").trim();

    if (!num || !name || !src || !dst) {
      invalidRecords++;
      continue;
    }

    if (src.toLowerCase() === dst.toLowerCase()) {
      console.warn(`⚠ Rejected train ${num}: identical source and destination (${src})`);
      invalidRecords++;
      continue;
    }

    if (seenNumbers.has(num)) {
      duplicateCount++;
      continue;
    }

    seenNumbers.add(num);
    validRecords++;
    normalizedTrains.push({
      ...t,
      trainNumber: num,
      trainName: name,
      source: src,
      destination: dst,
      fare: Math.max(0, Number(t.fare) || 500),
      totalSeats: t.totalSeats || 72,
      availableSeats: t.availableSeats || 50,
      isActive: true,
      isDemo: true,
    });
  }

  console.log(`✓ Validated records: ${validRecords}`);
  if (invalidRecords > 0) console.log(`⚠ Invalid records: ${invalidRecords}`);
  if (duplicateCount > 0) console.log(`⚠ Duplicates: ${duplicateCount}`);

  // Connect
  console.log("Connecting to MongoDB...");
  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000 });
    console.log("✓ Connected to MongoDB successfully.");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }

  const existingTrains = await Train.find({}, { trainNumber: 1 }).lean();
  const existingMap = new Map(existingTrains.map((t) => [t.trainNumber.toUpperCase(), t]));
  const existingCountBefore = existingTrains.length;
  console.log(`ℹ Found ${existingCountBefore} existing trains in database.`);

  let newlyInserted = 0;
  let existingPreserved = 0;
  const operations = [];

  for (const train of normalizedTrains) {
    if (existingMap.has(train.trainNumber)) {
      existingPreserved++;
      if (!isDryRun) {
        operations.push({
          updateOne: {
            filter: { trainNumber: train.trainNumber },
            update: {
              $set: {
                trainName: train.trainName,
                source: train.source,
                sourceCode: train.sourceCode,
                destination: train.destination,
                destinationCode: train.destinationCode,
                departure: train.departure,
                arrival: train.arrival,
                duration: train.duration,
                fare: train.fare,
                category: train.category,
                coachTypes: train.coachTypes,
                runsOn: train.runsOn,
                stops: train.stops,
                isDemo: true,
                isActive: true,
              },
            },
          },
        });
      }
    } else {
      newlyInserted++;
      if (!isDryRun) {
        operations.push({
          insertOne: {
            document: {
              ...train,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
        });
      }
    }
  }

  console.log(`Analysis: ${newlyInserted} new trains to insert, ${existingPreserved} existing trains updated/preserved.`);

  if (!isDryRun && operations.length > 0) {
    console.log(`Writing ${operations.length} train operations to MongoDB...`);
    await Train.bulkWrite(operations, { ordered: false });
    console.log("✓ Bulk train write complete.");
  }

  const finalTotalCount = isDryRun
    ? existingCountBefore + newlyInserted
    : await Train.countDocuments();

  console.log("============================================================");
  console.log("📊 DEMO TRAIN IMPORT REPORT");
  console.log("============================================================");
  console.log(`  Source Record Count:         ${sourceRecordCount}`);
  console.log(`  Valid Records:               ${validRecords}`);
  console.log(`  Invalid Records:             ${invalidRecords}`);
  console.log(`  Duplicate Records:           ${duplicateCount}`);
  console.log(`  Existing Trains Preserved:   ${existingPreserved}`);
  console.log(`  Newly Inserted Trains:       ${newlyInserted}`);
  console.log(`  Final Total Train Count:     ${finalTotalCount}`);
  console.log("============================================================");

  if (isDryRun) {
    console.log("ℹ Dry-run finished. No data was modified.");
  } else {
    console.log("🎉 Demo trains imported successfully!");
  }

  await mongoose.disconnect();
  process.exit(0);
}

runTrainImport().catch((err) => {
  console.error("❌ Fatal Train Import Error:", err);
  process.exit(1);
});
