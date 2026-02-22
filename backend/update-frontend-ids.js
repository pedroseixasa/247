require("dotenv").config();
const mongoose = require("mongoose");
const Barber = require("./src/models/Barber");
const fs = require("fs");
const path = require("path");

const MONGODB_URI =
  "mongodb+srv://247_barbearia:%23AlmadaAC2001@cluster0.udfm2dw.mongodb.net/test?appName=Cluster0";

async function updateFrontendIds() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Conectado à base: test\n");

    const barbers = await Barber.find();
    const diogo = barbers.find((b) => b.email === "diogo@barbearia247.pt");
    const ricardo = barbers.find((b) => b.email === "ricardo@barbearia247.pt");

    if (!diogo || !ricardo) {
      console.error(
        "❌ Barbeiros não encontrados! Execute: node seed.js primeiro",
      );
      process.exit(1);
    }

    console.log("📋 IDs encontrados:");
    console.log(`  Diogo: ${diogo._id}`);
    console.log(`  Ricardo: ${ricardo._id}\n`);

    // Atualizar main.js
    const mainJsPath = path.join(__dirname, "..", "js", "main.js");
    let mainJs = fs.readFileSync(mainJsPath, "utf-8");

    mainJs = mainJs.replace(
      /id: "[^"]+",\s+name: "Diogo Cunha"/,
      `id: "${diogo._id}",\n      name: "Diogo Cunha"`,
    );

    mainJs = mainJs.replace(
      /id: "[^"]+",\s+name: "Ricardo Silva"/,
      `id: "${ricardo._id}",\n      name: "Ricardo Silva"`,
    );

    fs.writeFileSync(mainJsPath, mainJs, "utf-8");

    console.log("✅ IDs atualizados no frontend (js/main.js)");
    console.log("\n🎉 Tudo pronto! Agora podes:");
    console.log("  1. Reiniciar o backend: npm run dev");
    console.log("  2. Testar uma reserva no site");

    await mongoose.connection.close();
  } catch (error) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  }
}

updateFrontendIds();
