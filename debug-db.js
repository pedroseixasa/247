const mongoose = require("c:\\Users\\pedro\\Downloads\\247\\backend\\node_modules\\mongoose");
const Reservation = require("c:\\Users\\pedro\\Downloads\\247\\backend\\src\\models\\Reservation");
const Barber = require("c:\\Users\\pedro\\Downloads\\247\\backend\\src\\models\\Barber");
const Service = require("c:\\Users\\pedro\\Downloads\\247\\backend\\src\\models\\Service");

async function debugData() {
  try {
    await mongoose.connect("mongodb://localhost:27017/247barbearia");

    // Get first reservation
    console.log("=== FETCHING FIRST RESERVATION ===");
    const res1 = await Reservation.findOne();
    console.log(
      "Raw Reservation (without populate):",
      JSON.stringify(res1, null, 2),
    );

    // Get with populate
    console.log("\n=== FETCHING WITH POPULATE ===");
    const res2 = await Reservation.findOne().populate("barberId serviceId");
    console.log("Reservation with populate:", JSON.stringify(res2, null, 2));

    // Direct barber lookup
    if (res1 && res1.barberId) {
      console.log("\n=== DIRECT BARBER LOOKUP ===");
      const barber = await Barber.findById(res1.barberId);
      console.log("Barber found:", JSON.stringify(barber, null, 2));
    }

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

debugData();
