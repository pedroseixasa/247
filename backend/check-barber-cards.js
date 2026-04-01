#!/usr/bin/env node
/**
 * Check and clean Ricardo Silva from SiteSettings barberCards
 */

require("dotenv").config();
const mongoose = require("mongoose");
const SiteSettings = require("./src/models/SiteSettings");

async function checkAndClean() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error("❌ MONGODB_URI not set in .env");
      process.exit(1);
    }

    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB\n");

    const settings = await SiteSettings.findOne();
    if (!settings) {
      console.log("⚠️  No SiteSettings found");
      process.exit(0);
    }

    console.log("📊 Current barberCards in SiteSettings:");
    console.log(JSON.stringify(settings.barberCards, null, 2));
    console.log("\n");

    // Check if barber2 fields exist
    if (settings.barberCards?.barber2Name || settings.barberCards?.barber2Role) {
      console.log("🗑️  Found Ricardo Silva (barber2) - removing...\n");
      
      // Remove barber2 fields
      settings.barberCards = {
        barber1Name: settings.barberCards.barber1Name,
        barber1Role: settings.barberCards.barber1Role,
        barber1Description: settings.barberCards.barber1Description,
        barber1Image: settings.barberCards.barber1Image,
        barber1CoverImage: settings.barberCards.barber1CoverImage,
      };

      await settings.save();
      console.log("✅ Removed Ricardo Silva from SiteSettings\n");
      console.log("📊 Updated barberCards:");
      console.log(JSON.stringify(settings.barberCards, null, 2));
    } else {
      console.log("✅ Ricardo Silva already removed from SiteSettings");
    }

    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

checkAndClean();
