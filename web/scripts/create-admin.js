#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * RailConnect Railway Reservation System
 * CLI Utility to safely provision or promote an Administrator account.
 *
 * Usage:
 *   node scripts/create-admin.js <email> [password] [name]
 *
 * Example:
 *   node scripts/create-admin.js admin@railconnect.demo Admin@123 "System Admin"
 */

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

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

const args = process.argv.slice(2);
const email = (args[0] || "").trim().toLowerCase();
const password = args[1] || "Admin@RailConnect2026";
const name = args[2] || "RailConnect Admin";

if (!email || !email.includes("@")) {
  console.error("❌ Error: A valid email address is required.");
  console.log("Usage: node scripts/create-admin.js <email> [password] [name]");
  process.exit(1);
}

if (password.length < 8) {
  console.error("❌ Error: Password must be at least 8 characters long.");
  process.exit(1);
}

// User Schema Definition
const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

async function main() {
  console.log("Connecting to MongoDB Atlas...");
  await mongoose.connect(mongoUri);
  console.log("Connected successfully.\n");

  const existingUser = await User.findOne({ email }).select("+password");

  if (existingUser) {
    console.log(`User with email "${email}" already exists.`);
    if (existingUser.role === "admin") {
      console.log(`User is ALREADY an Administrator (role: admin).`);
    } else {
      existingUser.role = "admin";
      await existingUser.save();
      console.log(`✓ Promoted "${existingUser.name}" (${email}) to Administrator role.`);
    }
  } else {
    console.log(`Creating new Administrator account for "${email}"...`);
    const hashedPassword = await bcrypt.hash(password, 12);
    const newAdmin = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "admin",
    });
    console.log(`✓ Created new Administrator account: "${newAdmin.name}" (${newAdmin.email}) with role: admin.`);
  }

  console.log("\nAdmin setup complete. You may now log in at http://localhost:3000/login and access /admin.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Execution error:", err);
  process.exit(1);
});
