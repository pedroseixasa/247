require("dotenv").config();
const mongoose = require("mongoose");
const Barber = require("./src/models/Barber");

async function cleanDuplicates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✓ Conectado ao MongoDB\n");

    // Buscar todos os barbers
    const allBarbers = await Barber.find().sort({ createdAt: 1 }); // Ordenar por data de criação
    
    console.log("📋 Barbers na base de dados:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    allBarbers.forEach((b, index) => {
      console.log(`${index + 1}. ${b.name} (${b.email})`);
      console.log(`   ID: ${b._id}`);
      console.log(`   Role: ${b.role}`);
      console.log(`   Criado: ${b.createdAt}`);
      console.log();
    });

    // Encontrar duplicados de "Diogo Cunha"
    const diogos = await Barber.find({ 
      name: { $regex: /diogo.*cunha/i } 
    }).sort({ createdAt: 1 });

    if (diogos.length > 1) {
      console.log(`⚠️  Encontrados ${diogos.length} utilizadores "Diogo Cunha"\n`);
      
      // Manter o mais antigo (primeiro na lista ordenada)
      const manter = diogos[0];
      const remover = diogos.slice(1);

      console.log("✅ A MANTER (mais antigo):");
      console.log(`   Nome: ${manter.name}`);
      console.log(`   Email: ${manter.email}`);
      console.log(`   ID: ${manter._id}`);
      console.log(`   Criado: ${manter.createdAt}\n`);

      console.log("❌ A REMOVER (duplicados):");
      for (const dup of remover) {
        console.log(`   - ${dup.name} (${dup.email})`);
        console.log(`     ID: ${dup._id}`);
        console.log(`     Criado: ${dup.createdAt}`);
        
        // Remover duplicado
        await Barber.deleteOne({ _id: dup._id });
        console.log(`     ✓ Removido!\n`);
      }

      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("✅ Base de dados limpa!");
      console.log("\n🔐 CREDENCIAIS DO ADMIN:");
      console.log("Email:", manter.email);
      console.log("Password: (a que foi definida anteriormente)");
      console.log("\n🌐 Painel Admin: https://pedroseixasa.github.io/247/admin/");
      
    } else if (diogos.length === 1) {
      console.log("✅ Apenas 1 'Diogo Cunha' encontrado - Base de dados OK!");
      console.log(`   Email: ${diogos[0].email}`);
    } else {
      console.log("⚠️  Nenhum 'Diogo Cunha' encontrado!");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  }
}

cleanDuplicates();
