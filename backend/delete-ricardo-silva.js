#!/usr/bin/env node
/**
 * Delete Ricardo Silva from Barbers collection
 * Ricardo ID: 6998aaf59119a721cdc1e137
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Barber = require("./src/models/Barber");

const RICARDO_ID = "6998aaf59119a721cdc1e137";

async function deleteRicardo() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error("❌ MONGODB_URI not set in .env");
      process.exit(1);
    }

    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    console.log(`\n🗑️  Deleting Ricardo Silva (ID: ${RICARDO_ID})...`);
    const result = await Barber.findByIdAndDelete(RICARDO_ID);

    if (result) {
      console.log("✅ Ricardo Silva deleted successfully!");
      console.log(`   Name: ${result.name}`);
      console.log(`   Email: ${result.email}`);
    } else {
      console.warn("⚠️  Ricardo Silva not found in database");
    }

    console.log("\n✅ Operation complete");
    await mongoose.connection.close();
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

deleteRicardo();
