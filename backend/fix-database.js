require("dotenv").config();
const mongoose = require("mongoose");
const Barber = require("./src/models/Barber");

// Forçar conexão à base barbearia
const MONGODB_URI =
  "mongodb+srv://247_barbearia:%23AlmadaAC2001@cluster0.udfm2dw.mongodb.net/barbearia?appName=Cluster0";

async function fixDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Conectado à base: barbearia");

    // Verificar barbeiros existentes
    const barbers = await Barber.find();
    console.log("\n📋 Barbeiros na base barbearia:");
    barbers.forEach((b) => {
      console.log(`  - ${b.name}: ${b._id}`);
      console.log(`    Email: ${b.email}`);
      console.log(`    Role: ${b.role}`);
    });

    console.log(
      "\n✅ Use estes IDs no frontend (js/main.js, linhas ~320-340):",
    );
    const diogo = barbers.find((b) => b.email === "diogo@barbearia247.pt");
    const ricardo = barbers.find((b) => b.email === "ricardo@barbearia247.pt");

    if (diogo) {
      console.log(`  Diogo: "${diogo._id}"`);
    }
    if (ricardo) {
      console.log(`  Ricardo: "${ricardo._id}"`);
    }

    await mongoose.connection.close();
    console.log("\n✅ Concluído!");
  } catch (error) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  }
}

fixDatabase();
