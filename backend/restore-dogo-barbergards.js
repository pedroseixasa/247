#!/usr/bin/env node
/**
 * Restore Diogo's barberCards with proper structure
 * Keeps only barber1 data for Diogo Cunha
 */

require("dotenv").config();
const mongoose = require("mongoose");
const SiteSettings = require("./src/models/SiteSettings");

async function restoreBarberCards() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error("❌ MONGODB_URI not set in .env");
      process.exit(1);
    }

    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    console.log("📄 Restoring Diogo's barberCards structure...");

    // Only restore barber1 with Diogo's info
    const result = await SiteSettings.updateOne(
      {},
      {
        $set: {
          barberCards: {
            barber1Name: "Diogo Cunha",
            barber1Role: "Fundador e Barbeiro",
            barber1Description:
              "Especialista em cortes clássicos e modernos, com mais de 5 anos de experiência. Dedicado a criar o estilo perfeito para cada cliente.",
            barber1CoverImage: "images/cunhacorte.png",
            barber1Image: "images/cunha.png",
            barber1LunchBreak: {
              enabled: false,
            },
          },
        },
      }
    );

    console.log(`✅ barberCards restored!`);
    console.log(`   Modified: ${result.modifiedCount} document(s)`);

    // Verify
    const settings = await SiteSettings.findOne();
    console.log("\n📋 Current barberCards:");
    console.log(JSON.stringify(settings?.barberCards, null, 2));

    await mongoose.connection.close();
    console.log("\n✅ Operation complete");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

restoreBarberCards();
