/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * RailConnect — Repeatable Coach Configuration Generator / Seeder
 *
 * Scans MongoDB Train records and ensures every train has a realistic coach composition
 * matching its train category and coach types.
 *
 * Usage:
 *   node web/scripts/seed-coach-configurations.js [--dry-run] [--limit=100]
 */

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

// Load environment variables from .env.local
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

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/railconnect";

const isDryRun = process.argv.includes("--dry-run");
const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const maxLimit = limitArg ? parseInt(limitArg.split("=")[1], 10) : 0;

// Schema definitions
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

const TrainSchema = new mongoose.Schema(
  {
    trainNumber: { type: String },
    number: { type: String },
    name: { type: String, required: true },
    category: { type: String, default: "Express" },
    coachTypes: [String],
    totalSeats: { type: Number, default: 0 },
  },
  { collection: "trains" }
);

const CoachConfiguration =
  mongoose.models.CoachConfiguration ||
  mongoose.model("CoachConfiguration", CoachConfigurationSchema);

const Train = mongoose.models.Train || mongoose.model("Train", TrainSchema);

function generateDefaultComposition(train) {
  const trainNumber = String(train.trainNumber || train.number || "").trim().toUpperCase();
  const category = (train.category || "").toLowerCase();
  const rawClasses = train.coachTypes || [];
  const coaches = [];
  let seq = 1;

  const supported = new Set(rawClasses.map((c) => c.trim().toUpperCase()));

  if (category.includes("rajdhani") || category.includes("tejas")) {
    coaches.push({
      coachId: "H1",
      coachClass: "1A",
      sequence: seq++,
      layoutTemplateId: "1A-22",
      totalCapacity: 22,
      isActive: true,
    });
    for (let i = 1; i <= 2; i++) {
      coaches.push({
        coachId: `A${i}`,
        coachClass: "2A",
        sequence: seq++,
        layoutTemplateId: "2A-48",
        totalCapacity: 48,
        isActive: true,
      });
    }
    for (let i = 1; i <= 5; i++) {
      coaches.push({
        coachId: `B${i}`,
        coachClass: "3A",
        sequence: seq++,
        layoutTemplateId: "3A-64",
        totalCapacity: 64,
        isActive: true,
      });
    }
  } else if (category.includes("shatabdi")) {
    if (category.includes("jan")) {
      for (let i = 1; i <= 2; i++) {
        coaches.push({
          coachId: `C${i}`,
          coachClass: "CC",
          sequence: seq++,
          layoutTemplateId: "CC-73",
          totalCapacity: 73,
          isActive: true,
        });
      }
      for (let i = 1; i <= 6; i++) {
        coaches.push({
          coachId: `D${i}`,
          coachClass: "2S",
          sequence: seq++,
          layoutTemplateId: "2S-108",
          totalCapacity: 108,
          isActive: true,
        });
      }
    } else {
      coaches.push({
        coachId: "E1",
        coachClass: "1A",
        sequence: seq++,
        layoutTemplateId: "1A-22",
        totalCapacity: 22,
        isActive: true,
      });
      for (let i = 1; i <= 6; i++) {
        coaches.push({
          coachId: `C${i}`,
          coachClass: "CC",
          sequence: seq++,
          layoutTemplateId: "CC-73",
          totalCapacity: 73,
          isActive: true,
        });
      }
    }
  } else if (category.includes("garib rath")) {
    for (let i = 1; i <= 8; i++) {
      coaches.push({
        coachId: `G${i}`,
        coachClass: "3A",
        sequence: seq++,
        layoutTemplateId: "3A-64",
        totalCapacity: 64,
        isActive: true,
      });
    }
  } else {
    if (supported.has("1A")) {
      coaches.push({
        coachId: "H1",
        coachClass: "1A",
        sequence: seq++,
        layoutTemplateId: "1A-22",
        totalCapacity: 22,
        isActive: true,
      });
    }
    if (supported.has("2A")) {
      for (let i = 1; i <= 2; i++) {
        coaches.push({
          coachId: `A${i}`,
          coachClass: "2A",
          sequence: seq++,
          layoutTemplateId: "2A-48",
          totalCapacity: 48,
          isActive: true,
        });
      }
    }
    if (supported.has("3A")) {
      for (let i = 1; i <= 4; i++) {
        coaches.push({
          coachId: `B${i}`,
          coachClass: "3A",
          sequence: seq++,
          layoutTemplateId: "3A-64",
          totalCapacity: 64,
          isActive: true,
        });
      }
    }
    if (supported.has("CC")) {
      for (let i = 1; i <= 3; i++) {
        coaches.push({
          coachId: `C${i}`,
          coachClass: "CC",
          sequence: seq++,
          layoutTemplateId: "CC-73",
          totalCapacity: 73,
          isActive: true,
        });
      }
    }
    if (
      supported.has("SL") ||
      (!supported.has("1A") &&
        !supported.has("2A") &&
        !supported.has("3A") &&
        !supported.has("CC") &&
        !supported.has("2S"))
    ) {
      for (let i = 1; i <= 6; i++) {
        coaches.push({
          coachId: `S${i}`,
          coachClass: "SL",
          sequence: seq++,
          layoutTemplateId: "SL-72",
          totalCapacity: 72,
          isActive: true,
        });
      }
    }
    if (supported.has("2S")) {
      for (let i = 1; i <= 3; i++) {
        coaches.push({
          coachId: `D${i}`,
          coachClass: "2S",
          sequence: seq++,
          layoutTemplateId: "2S-108",
          totalCapacity: 108,
          isActive: true,
        });
      }
    }
  }

  if (coaches.length === 0) {
    coaches.push({
      coachId: "S1",
      coachClass: "SL",
      sequence: 1,
      layoutTemplateId: "SL-72",
      totalCapacity: 72,
      isActive: true,
    });
  }

  const totalCapacity = coaches.reduce((sum, c) => sum + c.totalCapacity, 0);

  return {
    trainNumber,
    coaches,
    totalCoaches: coaches.length,
    totalCapacity,
    configurationSource: "demo",
    version: 1,
  };
}

async function run() {
  console.log("=== RailConnect Coach Configuration Generator ===");
  if (isDryRun) console.log(">>> DRY RUN MODE: No database changes will be saved.");

  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB:", MONGODB_URI);

  const totalTrains = await Train.countDocuments();
  console.log(`Total trains in database: ${totalTrains}`);

  // Remove any legacy empty trainNumber documents
  if (!isDryRun) {
    await CoachConfiguration.deleteMany({
      $or: [{ trainNumber: "" }, { trainNumber: null }, { trainNumber: { $exists: false } }],
    });
  }

  // Fetch all existing coach configuration train numbers
  const existingConfigNumbers = new Set(
    (await CoachConfiguration.find({}).select("trainNumber").lean()).map(
      (c) => c.trainNumber
    )
  );

  console.log(
    `Already configured trains: ${existingConfigNumbers.size}`
  );

  const trainsQuery = Train.find({}).select("trainNumber number name category coachTypes");
  if (maxLimit > 0) trainsQuery.limit(maxLimit);

  const trains = await trainsQuery.lean();
  console.log(`Evaluating ${trains.length} trains...`);

  let newlyConfigured = 0;
  let batchOps = [];
  const BATCH_SIZE = 500;

  for (let i = 0; i < trains.length; i++) {
    const train = trains[i];
    const trainNum = String(train.trainNumber || train.number || "").trim().toUpperCase();

    if (!trainNum || existingConfigNumbers.has(trainNum)) {
      continue;
    }

    const config = generateDefaultComposition(train);
    batchOps.push({
      updateOne: {
        filter: { trainNumber: trainNum },
        update: { $set: config },
        upsert: true,
      },
    });

    newlyConfigured++;

    if (batchOps.length >= BATCH_SIZE) {
      if (!isDryRun) {
        await CoachConfiguration.bulkWrite(batchOps, { ordered: false });
      }
      process.stdout.write(
        `Configured ${newlyConfigured} new trains (${i + 1}/${trains.length})...\r`
      );
      batchOps = [];
    }
  }

  if (batchOps.length > 0 && !isDryRun) {
    await CoachConfiguration.bulkWrite(batchOps, { ordered: false });
  }

  const finalConfigCount = await CoachConfiguration.countDocuments();

  console.log("\n==========================================");
  console.log("Coach Configuration Seeding Complete!");
  console.log(`Total Trains in Master:      ${totalTrains}`);
  console.log(`Previously Configured:       ${existingConfigNumbers.size}`);
  console.log(`Newly Configured:            ${newlyConfigured}`);
  console.log(`Total Active Configurations: ${finalConfigCount}`);
  console.log("==========================================");

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Coach Configuration seeding failed:", err);
  process.exit(1);
});
