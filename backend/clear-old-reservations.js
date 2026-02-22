require("dotenv").config();
const mongoose = require("mongoose");
const Reservation = require("./src/models/Reservation");

const MONGODB_URI = process.env.MONGODB_URI;

async function clearOldReservations() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Conectado à base de dados\n");

    const result = await Reservation.deleteMany({});
    console.log(`🗑️  ${result.deletedCount} reservas antigas removidas`);

    console.log("\n✅ Pronto! Agora podes criar novas reservas.");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  }
}

clearOldReservations();
