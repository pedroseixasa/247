require("dotenv").config();
const mongoose = require("mongoose");
const Barber = require("./src/models/Barber");

const TARGET_WORKING_HOURS = {
  monday: { start: "closed", end: "closed" },
  tuesday: { start: "09:30", end: "20:00" },
  wednesday: { start: "09:30", end: "20:00" },
  thursday: { start: "09:30", end: "20:00" },
  friday: { start: "09:30", end: "20:00" },
  saturday: { start: "09:00", end: "18:00" },
  sunday: { start: "closed", end: "closed" },
};

async function fixBarberWorkingHours() {
  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("🔍 Updating barber working hours...\n");

    const barbers = await Barber.find({});
    if (barbers.length === 0) {
      console.log("✅ Nenhum barbeiro encontrado");
      await mongoose.connection.close();
      process.exit(0);
    }

    let updatedCount = 0;

    for (const barber of barbers) {
      await Barber.updateOne(
        { _id: barber._id },
        { $set: { workingHours: TARGET_WORKING_HOURS } },
      );
      updatedCount++;
      console.log(`✅ [${barber._id}] ${barber.name} atualizado`);
    }

    console.log(`\n${"=".repeat(60)}`);
    console.log(`Resumo:`);
    console.log(`  ✅ Barbeiros atualizados: ${updatedCount}`);
    console.log(`  📅 Terça a sexta: 09:30`);
    console.log(`  📅 Sábado: 09:00-18:00`);
    console.log(`  🚫 Segunda e domingo: closed`);
    console.log(`${"=".repeat(60)}\n`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  }
}

fixBarberWorkingHours();
