require("dotenv").config();
const mongoose = require("mongoose");
const Reservation = require("./src/models/Reservation");
const Service = require("./src/models/Service");

/**
 * Script para inspecionar reservas na BD
 */

async function inspectReservations() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Conectado ao MongoDB\n");

    // Buscar todas as reservas
    const reservations = await Reservation.find({}).populate(
      "serviceId",
      "price name",
    );

    console.log(`📊 Total de reservas: ${reservations.length}\n`);

    if (reservations.length === 0) {
      console.log("⚠️  Nenhuma reserva encontrada!");
      await mongoose.disconnect();
      return;
    }

    // Agrupar por data e mostrar detalhes
    reservations.sort(
      (a, b) => new Date(a.reservationDate) - new Date(b.reservationDate),
    );

    console.log("📋 RESERVAS ENCONTRADAS:");
    console.log("==================================================");

    reservations.forEach((res, idx) => {
      const date = new Date(res.reservationDate);
      console.log(`\n#${idx + 1}`);
      console.log(`  Data: ${date.toLocaleString("pt-PT")}`);
      console.log(`  Hora: ${res.timeSlot}`);
      console.log(`  Cliente: ${res.clientName}`);
      console.log(
        `  Serviço: ${res.serviceId?.name} (€${res.serviceId?.price})`,
      );
      console.log(`  Status: ${res.status}`);
      console.log(`  ID: ${res._id}`);
    });

    console.log("\n==================================================");
    console.log(`\n💡 Se houver reservas com datas erradas, apaga com:`);
    console.log(`   node delete-all-reservations.js\n`);

    await mongoose.disconnect();
  } catch (error) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  }
}

inspectReservations();
