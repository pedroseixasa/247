require("dotenv").config();
const mongoose = require("mongoose");
const Reservation = require("./src/models/Reservation");

const MONGODB_URI = process.env.MONGODB_URI;
const DEBUG = false;

async function clearOldReservations() {
  try {
    await mongoose.connect(MONGODB_URI);

    const result = await Reservation.deleteMany({});

    if (DEBUG) console.log(`${result.deletedCount} reservas removidas`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Erro:", error.message);
    process.exit(1);
  }
}

clearOldReservations();
