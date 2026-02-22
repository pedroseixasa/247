require("dotenv").config();
const mongoose = require("mongoose");
const Reservation = require("./src/models/Reservation");

/**
 * Script para deletar reservas de teste de 14:20/14:25
 * Uso: node delete-test-reservation.js
 */

async function deleteTestReservation() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Conectado ao MongoDB");

    // Encontrar e deletar reserva de teste
    const today = new Date();
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      0,
      0,
      0,
    );
    const todayEnd = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
    );

    const result = await Reservation.deleteMany({
      timeSlot: { $in: ["14:20", "14:25"] },
      reservationDate: { $gte: todayStart, $lte: todayEnd },
    });

    console.log(`\n✅ ${result.deletedCount} reserva(s) de teste deletada(s)`);

    if (result.deletedCount === 0) {
      console.log("   ℹ️  Nenhuma reserva de teste encontrada");
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  }
}

deleteTestReservation();
