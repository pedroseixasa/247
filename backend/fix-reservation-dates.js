require("dotenv").config();
const mongoose = require("mongoose");
const Reservation = require("./src/models/Reservation");

async function fixReservationDates() {
  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("🔍 Scanning all reservations...\n");

    // Get ALL reservations
    const allReservations = await Reservation.find({});
    
    if (allReservations.length === 0) {
      console.log("✅ Nenhuma reserva encontrada");
      await mongoose.connection.close();
      process.exit(0);
    }

    let fixedCount = 0;
    let alreadyCorrect = 0;

    // Fix each one
    for (const reservation of allReservations) {
      const currentDate = new Date(reservation.reservationDate);
      
      // Create normalized date (only date, no time)
      const normalizedDate = new Date(currentDate);
      normalizedDate.setHours(0, 0, 0, 0);

      // Check if already correct
      if (
        currentDate.getHours() === 0 &&
        currentDate.getMinutes() === 0 &&
        currentDate.getSeconds() === 0 &&
        currentDate.getMilliseconds() === 0
      ) {
        alreadyCorrect++;
        console.log(
          `✅ [${reservation._id}] Já correta: ${reservation.clientName} - ${reservation.timeSlot}`
        );
        continue;
      }

      // Update with normalized date
      await Reservation.updateOne(
        { _id: reservation._id },
        { $set: { reservationDate: normalizedDate } }
      );

      fixedCount++;
      console.log(
        `🔧 [${reservation._id}] CORRIGIDA: ${reservation.clientName} - ${reservation.timeSlot}`
      );
      console.log(
        `   De: ${currentDate.toISOString()}`
      );
      console.log(
        `   Para: ${normalizedDate.toISOString()}\n`
      );
    }

    console.log(`${"=".repeat(60)}`);
    console.log(`Resumo:`);
    console.log(`  ✅ Corridas: ${fixedCount}`);
    console.log(`  ✅ Já corretas: ${alreadyCorrect}`);
    console.log(`  📊 Total: ${allReservations.length}`);
    console.log(`${"=".repeat(60)}\n`);
    console.log(`✨ Todas as reservas agora têm formato de data correto!`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  }
}

fixReservationDates();
