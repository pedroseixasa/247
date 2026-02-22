require("dotenv").config();
const mongoose = require("mongoose");
const Reservation = require("./src/models/Reservation");

/**
 * Script para deletar TODAS as reservas de teste
 * CUIDADO: Isto apaga tudo!
 */

async function deleteAllReservations() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Conectado ao MongoDB\n");

    const result = await Reservation.deleteMany({});

    console.log(`🗑️  ${result.deletedCount} reserva(s) deletada(s)\n`);
    console.log("✅ BD limpa! Agora podes criar novas reservas de teste.\n");

    await mongoose.disconnect();
  } catch (error) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  }
}

// Confirmação
const readline = require("readline");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("⚠️  AVISO: Isto vai DELETAR TODAS as reservas da BD!!!\n");
rl.question("Tem a certeza? (sim/não): ", (answer) => {
  if (answer.toLowerCase() === "sim") {
    rl.close();
    deleteAllReservations();
  } else {
    console.log("❌ Operação cancelada.");
    rl.close();
  }
});
