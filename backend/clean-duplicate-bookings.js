require("dotenv").config();
const mongoose = require("mongoose");
const Reservation = require("./src/models/Reservation");
const Service = require("./src/models/Service");

async function cleanDuplicates() {
  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("🔍 Scanning for duplicate/overlapping bookings...\n");

    // Get all non-cancelled reservations
    const allReservations = await Reservation.find({
      status: { $ne: "cancelled" },
    }).populate("serviceId");

    // Group by barber and date
    const groupedByBarberAndDate = {};
    allReservations.forEach((res) => {
      const key = `${res.barberId}_${res.reservationDate.toDateString()}`;
      if (!groupedByBarberAndDate[key]) {
        groupedByBarberAndDate[key] = [];
      }
      groupedByBarberAndDate[key].push(res);
    });

    let duplicateCount = 0;
    let overlappingCount = 0;
    const toDelete = [];

    // Check for duplicates and overlaps
    Object.entries(groupedByBarberAndDate).forEach(([key, reservations]) => {
      if (reservations.length === 1) return; // Only 1 per day, OK

      // Sort by time
      reservations.sort(
        (a, b) =>
          parseInt(a.timeSlot.replace(":", "")) -
          parseInt(b.timeSlot.replace(":", "")),
      );

      console.log(`\n📅 Date: ${key}`);
      console.log("   Reservations on this date:");

      reservations.forEach((res, idx) => {
        const [hours, mins] = res.timeSlot.split(":").map(Number);
        const startTime = new Date(res.reservationDate);
        startTime.setHours(hours, mins, 0, 0);
        const endTime = new Date(
          startTime.getTime() + res.serviceId.duration * 60000,
        );
        console.log(
          `   [${idx}] ${res.timeSlot} - ${endTime.getHours()}:${String(endTime.getMinutes()).padStart(2, "0")} (${res.serviceId.name}, Client: ${res.clientName})`,
        );
      });

      // Find overlaps
      for (let i = 0; i < reservations.length; i++) {
        for (let j = i + 1; j < reservations.length; j++) {
          const resA = reservations[i];
          const resB = reservations[j];

          const [hoursA, minsA] = resA.timeSlot.split(":").map(Number);
          const startA = new Date(resA.reservationDate);
          startA.setHours(hoursA, minsA, 0, 0);
          const endA = new Date(
            startA.getTime() + resA.serviceId.duration * 60000,
          );

          const [hoursB, minsB] = resB.timeSlot.split(":").map(Number);
          const startB = new Date(resB.reservationDate);
          startB.setHours(hoursB, minsB, 0, 0);
          const endB = new Date(
            startB.getTime() + resB.serviceId.duration * 60000,
          );

          // Check overlap: A.start < B.end AND B.start < A.end
          if (startA < endB && startB < endA) {
            console.log(
              `   ⚠️  CONFLICT: [${i}] @ ${resA.timeSlot} overlaps with [${j}] @ ${resB.timeSlot}`,
            );

            // If exact same timeSlot, mark second as duplicate
            if (resA.timeSlot === resB.timeSlot) {
              console.log(`   🗑️  DELETING DUPLICATE: [${j}] ${resB._id}`);
              toDelete.push(resB._id);
              duplicateCount++;
            } else {
              console.log(
                `   ⚠️  MANUAL REVIEW NEEDED: Different times but overlap`,
              );
              overlappingCount++;
            }
          }
        }
      }
    });

    console.log(`\n${"=".repeat(50)}`);
    console.log(`Summary:`);
    console.log(`  Total reservations checked: ${allReservations.length}`);
    console.log(`  Exact duplicates found: ${duplicateCount}`);
    console.log(`  Overlapping bookings found: ${overlappingCount}`);
    console.log(`  Will delete: ${toDelete.length} exact duplicates`);

    if (toDelete.length > 0) {
      console.log(
        `\n⚠️  Confirming deletion of ${toDelete.length} duplicate records...\n`,
      );

      // Delete duplicates
      const result = await Reservation.deleteMany({ _id: { $in: toDelete } });
      console.log(`✅ Deleted ${result.deletedCount} duplicate records`);

      // Verify
      const finalCount = await Reservation.countDocuments({
        status: { $ne: "cancelled" },
      });
      console.log(`✅ Final active reservations: ${finalCount}`);
    }

    console.log("\n✅ Duplicate cleanup complete!");
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

cleanDuplicates();
