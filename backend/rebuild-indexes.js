require("dotenv").config();
const mongoose = require("mongoose");
const Reservation = require("./src/models/Reservation");

async function rebuildIndexes() {
  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("🔨 Rebuilding indexes for Reservation model...");

    // Drop existing indexes (except _id)
    try {
      await Reservation.collection.dropIndex("barberId_1_reservationDate_1_timeSlot_1_status_1");
      console.log("✅ Dropped old index");
    } catch (err) {
      console.log("ℹ️  Old index not found (OK)");
    }

    // Rebuild indexes from schema
    await Reservation.collection.deleteMany({});
    await Reservation.collection.dropIndexes();
    console.log("✅ Dropped all indexes");

    // Create indexes from schema definition
    await Reservation.syncIndexes();
    console.log("✅ Synced all schema indexes");

    // Verify index was created
    const indexes = await Reservation.collection.getIndexes();
    console.log("\n📊 Current indexes:");
    Object.keys(indexes).forEach((key) => {
      console.log(`  - ${key}: ${JSON.stringify(indexes[key])}`);
    });

    console.log("\n✨ Index rebuild complete!");
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error rebuilding indexes:", error.message);
    process.exit(1);
  }
}

rebuildIndexes();
