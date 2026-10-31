#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * RailConnect Railway Reservation System
 * All-India Railway Station Importer
 *
 * Primary Source: https://github.com/prasenjit-27/Indian-Railway-Data (stations.json ~8,990 stations)
 * Secondary Reconciliation Source: https://github.com/IamYVJ/Indian_Railway_Stations_JSON (railwayStationsList.json)
 *
 * Usage:
 *   node scripts/import-stations.js [--dry-run]
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

// 2. Define Mongoose Station Schema inline for standalone execution
const StationSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    city: { type: String, trim: true, default: "" },
    state: { type: String, trim: true, default: "" },
    zone: { type: String, trim: true, default: "" },
    address: { type: String, trim: true, default: "" },
    coordinates: {
      latitude: { type: Number, default: 0 },
      longitude: { type: Number, default: 0 },
    },
    platforms: { type: Number, default: 2 },
    isActive: { type: Boolean, default: true, index: true },
    source: { type: String, trim: true, default: "github/prasenjit-27/Indian-Railway-Data" },
    importedAt: { type: Date },
  },
  { timestamps: true }
);

const Station = mongoose.models.Station || mongoose.model("Station", StationSchema);

async function runStationImport() {
  console.log("============================================================");
  console.log("🚉 RailConnect — Comprehensive All-India Station Importer");
  console.log("============================================================");
  if (isDryRun) {
    console.log("🔍 MODE: DRY RUN (No changes will be written to MongoDB)");
  } else {
    console.log("⚡ MODE: LIVE UPSERT (Safe merge into MongoDB)");
  }
  console.log("Primary Source: https://github.com/prasenjit-27/Indian-Railway-Data (stations.json)");
  console.log("Secondary Source: https://github.com/IamYVJ/Indian_Railway_Stations_JSON (railwayStationsList.json)");
  console.log("------------------------------------------------------------");

  // 3. Load Primary Dataset (prasenjit-27/Indian-Railway-Data)
  const primaryPath = path.resolve(__dirname, "../data/stations.json");
  if (!fs.existsSync(primaryPath)) {
    console.error(`❌ Error: Primary dataset not found at: ${primaryPath}`);
    process.exit(1);
  }

  let primaryData;
  try {
    primaryData = JSON.parse(fs.readFileSync(primaryPath, "utf8"));
  } catch (err) {
    console.error("❌ Error parsing primary JSON dataset:", err.message);
    process.exit(1);
  }
  const primaryRecordCount = primaryData.length;
  console.log(`📦 Loaded ${primaryRecordCount} stations from primary dataset.`);

  // 4. Load Secondary Dataset for City reconciliation (IamYVJ)
  const secondaryPath = path.resolve(__dirname, "../data/railwayStationsList.json");
  let secondaryMap = new Map();
  let secondaryRecordCount = 0;
  if (fs.existsSync(secondaryPath)) {
    try {
      const rawSec = JSON.parse(fs.readFileSync(secondaryPath, "utf8"));
      const listSec = Array.isArray(rawSec) ? rawSec : rawSec.stations || [];
      secondaryRecordCount = listSec.length;
      for (const item of listSec) {
        const code = (item.stnCode || "").trim().toUpperCase();
        if (code) {
          secondaryMap.set(code, {
            name: (item.stnName || "").trim(),
            city: (item.stnCity || "").trim(),
          });
        }
      }
      console.log(`📦 Loaded ${secondaryRecordCount} stations from secondary dataset for city reconciliation.`);
    } catch {
      console.warn("⚠ Warning: Secondary dataset could not be parsed; continuing with primary source.");
    }
  }

  // 5. Reconcile & Validate Records
  let validRecords = 0;
  let invalidRecords = 0;
  let duplicateCount = 0;
  const stationMap = new Map();

  // Process Primary Records
  for (const s of primaryData) {
    const code = (s.code || "").trim().toUpperCase();
    const name = (s.name || "").trim();

    if (!code || !name) {
      invalidRecords++;
      continue;
    }

    if (stationMap.has(code)) {
      duplicateCount++;
      continue;
    }

    // Determine city: address part or secondary mapping or name
    let city = "";
    if (secondaryMap.has(code)) {
      city = secondaryMap.get(code).city;
    }
    if (!city && s.address) {
      const parts = s.address.split(",").map((p) => p.trim());
      if (parts.length > 1) {
        city = parts[0];
      }
    }
    if (!city) {
      city = name;
    }

    const state = (s.state || "").trim();
    const zone = (s.zone || "").trim();
    const address = (s.address || "").trim();
    const lat = s.coordinates && typeof s.coordinates.latitude === "number" ? s.coordinates.latitude : 0;
    const lng = s.coordinates && typeof s.coordinates.longitude === "number" ? s.coordinates.longitude : 0;

    stationMap.set(code, {
      code,
      name,
      city,
      state,
      zone,
      address,
      coordinates: { latitude: lat, longitude: lng },
      source: "github/prasenjit-27/Indian-Railway-Data",
    });
    validRecords++;
  }

  // Check if secondary dataset has any additional station codes
  let secondaryAdded = 0;
  for (const [secCode, secData] of secondaryMap.entries()) {
    if (!stationMap.has(secCode) && secData.name) {
      stationMap.set(secCode, {
        code: secCode,
        name: secData.name,
        city: secData.city || secData.name,
        state: "",
        zone: "",
        address: "",
        coordinates: { latitude: 0, longitude: 0 },
        source: "github/IamYVJ/Indian_Railway_Stations_JSON",
      });
      secondaryAdded++;
      validRecords++;
    }
  }

  console.log(`✓ Valid reconciled station records: ${validRecords}`);
  if (secondaryAdded > 0) {
    console.log(`✓ Incorporated ${secondaryAdded} additional station codes from secondary dataset.`);
  }
  if (invalidRecords > 0) console.log(`⚠ Invalid/rejected records: ${invalidRecords}`);
  if (duplicateCount > 0) console.log(`⚠ Duplicate codes skipped: ${duplicateCount}`);

  // 6. Connect to MongoDB
  console.log("Connecting to MongoDB...");
  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000 });
    console.log("✓ Connected to MongoDB successfully.");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }

  // 7. Query Existing Stations in MongoDB
  const existingStations = await Station.find({}, { code: 1, name: 1, platforms: 1, state: 1, zone: 1, address: 1 }).lean();
  const existingMap = new Map(existingStations.map((s) => [s.code.toUpperCase(), s]));
  const existingCountBefore = existingStations.length;
  console.log(`ℹ Found ${existingCountBefore} existing station records in database.`);

  let newlyInserted = 0;
  let existingUpdated = 0;
  let existingPreserved = 0;
  const operations = [];
  const now = new Date();

  for (const station of stationMap.values()) {
    const existing = existingMap.get(station.code);

    if (existing) {
      existingPreserved++;
      // Safe update: augment missing fields (state, zone, address, coordinates) without overwriting manual fields
      const updates = {};
      if (!existing.state && station.state) updates.state = station.state;
      if (!existing.zone && station.zone) updates.zone = station.zone;
      if (!existing.address && station.address) updates.address = station.address;
      if (station.coordinates && (station.coordinates.latitude !== 0 || station.coordinates.longitude !== 0)) {
        updates.coordinates = station.coordinates;
      }
      updates.importedAt = now;

      if (Object.keys(updates).length > 1) {
        existingUpdated++;
        if (!isDryRun) {
          operations.push({
            updateOne: {
              filter: { code: station.code },
              update: { $set: updates },
            },
          });
        }
      }
    } else {
      newlyInserted++;
      if (!isDryRun) {
        operations.push({
          updateOne: {
            filter: { code: station.code },
            update: {
              $setOnInsert: {
                code: station.code,
                name: station.name,
                city: station.city,
                state: station.state,
                zone: station.zone,
                address: station.address,
                coordinates: station.coordinates,
                platforms: 2,
                isActive: true,
                source: station.source,
                importedAt: now,
                createdAt: now,
              },
            },
            upsert: true,
          },
        });
      }
    }
  }

  console.log("------------------------------------------------------------");
  console.log(`Analysis: ${newlyInserted} new stations to insert, ${existingUpdated} stations to enrich, ${existingPreserved} existing stations preserved.`);

  // 8. Execute Bulk Operations
  if (!isDryRun && operations.length > 0) {
    console.log(`Executing ${operations.length} bulk operations in MongoDB...`);
    const batchSize = 1000;
    for (let i = 0; i < operations.length; i += batchSize) {
      const chunk = operations.slice(i, i + batchSize);
      await Station.bulkWrite(chunk, { ordered: false });
      process.stdout.write(`  Processed ${Math.min(i + batchSize, operations.length)} / ${operations.length} records...\r`);
    }
    console.log("\n✓ Bulk write complete.");
  }

  // 9. Final Count Verification
  const finalTotalCount = isDryRun
    ? existingCountBefore + newlyInserted
    : await Station.countDocuments();

  console.log("============================================================");
  console.log("📊 ALL-INDIA STATION IMPORT REPORT");
  console.log("============================================================");
  console.log(`  Primary Source Records:      ${primaryRecordCount}`);
  console.log(`  Secondary Source Records:    ${secondaryRecordCount}`);
  console.log(`  Total Valid Stations:        ${validRecords}`);
  console.log(`  Invalid / Empty Records:     ${invalidRecords}`);
  console.log(`  Duplicate Source Records:    ${duplicateCount}`);
  console.log(`  Existing Stations Preserved: ${existingPreserved}`);
  console.log(`  Existing Stations Enriched:  ${existingUpdated}`);
  console.log(`  Newly Inserted Stations:     ${newlyInserted}`);
  console.log(`  Final Total Station Count:   ${finalTotalCount}`);
  console.log("============================================================");

  if (isDryRun) {
    console.log("ℹ Dry-run finished. No data was modified.");
  } else {
    console.log("🎉 All-India stations imported successfully!");
  }

  await mongoose.disconnect();
  process.exit(0);
}

runStationImport().catch((err) => {
  console.error("❌ Fatal Station Import Error:", err);
  process.exit(1);
});
