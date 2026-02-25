require("dotenv").config();
const mongoose = require("mongoose");
const Barber = require("./src/models/Barber");

// Debug mode - set to true to see detailed logs
const DEBUG = false;

async function cleanDuplicates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Buscar todos os barbers
    const allBarbers = await Barber.find().sort({ createdAt: 1 }); // Ordenar por data de criação

    if (DEBUG) {
      console.log(`Encontrados ${allBarbers.length} barbers`);
      allBarbers.forEach((b) => {
        console.log(`  - ${b.name} (${b.email})`);
      });
    }

    // Encontrar duplicados de "Diogo Cunha"
    const diogos = await Barber.find({
      name: { $regex: /diogo.*cunha/i },
    }).sort({ createdAt: 1 });

    if (diogos.length > 1) {
      // Manter o mais antigo (primeiro na lista ordenada)
      const manter = diogos[0];
      const remover = diogos.slice(1);

      if (DEBUG) {
        console.log(`Encontrados ${diogos.length} duplicados de "Diogo Cunha"`);
        console.log(`A manter: ${manter.email}`);
      }

      for (const dup of remover) {
        // Remover duplicado
        await Barber.deleteOne({ _id: dup._id });
      }
    } else if (diogos.length === 1) {
      if (DEBUG) console.log("Base de dados OK - 1 Diogo encontrado");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  }
}

cleanDuplicates();
