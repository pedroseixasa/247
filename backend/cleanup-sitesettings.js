#!/usr/bin/env node
require("dotenv").config();
const mongoose = require("mongoose");
const SiteSettings = require("./src/models/SiteSettings");

async function cleanupSiteSettings() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error("❌ MONGODB_URI not set in .env");
      process.exit(1);
    }

    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    console.log("🗑️  Removing Ricardo Silva data from SiteSettings...");

    // Update SiteSettings to remove all barber2 fields
    const result = await SiteSettings.updateOne(
      {},
      {
        $unset: {
          barberCards: 1,
        },
      }
    );

    console.log(`✅ SiteSettings cleaned!`);
    console.log(`   Modified: ${result.modifiedCount} document(s)`);

    // Verify the update
    const settings = await SiteSettings.findOne();
    console.log("\n📋 Current SiteSettings barberCards:");
    console.log(JSON.stringify(settings?.barberCards || "REMOVED", null, 2));

    await mongoose.connection.close();
    console.log("\n✅ Operation complete - Ricardo Silva removed from SiteSettings");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

cleanupSiteSettings();
