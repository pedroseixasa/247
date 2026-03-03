const mongoose = require("mongoose");
require("dotenv").config();

const Service = require("./src/models/Service");

const MONGODB_URI = process.env.MONGODB_URI;

// Mapeamento de serviços para imagens
const serviceImages = {
  "Corte + Pintura (preto)":
    "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&q=80",
  "Corte degradé":
    "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=600&q=80",
  "Corte Social + barba":
    "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=600&q=80",
  "Corte Social":
    "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&q=80",
  "Corte + Madeixas":
    "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600&q=80",
  "Corte + platinado":
    "https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=600&q=80",
  "Barba completa":
    "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=600&q=80",
  "Corte (Degradé) + Barba + sobrancelha":
    "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=600&q=80",
  "Corte criança até 7 anos":
    "https://images.unsplash.com/photo-1598880940371-c756e015faf1?w=600&q=80",
};

async function addServiceImages() {
  try {
    console.log("🔗 Conectando ao MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Conectado ao MongoDB!\n");

    const services = await Service.find();
    console.log(`📋 Encontrados ${services.length} serviços\n`);

    let updated = 0;
    let notFound = 0;

    for (const service of services) {
      const imageUrl = serviceImages[service.name];

      if (imageUrl) {
        service.image = imageUrl;
        await service.save();
        console.log(`✅ ${service.name} - Imagem adicionada`);
        updated++;
      } else {
        console.log(`⚠️  ${service.name} - Sem imagem correspondente`);
        notFound++;
      }
    }

    console.log(`\n📊 Resumo:`);
    console.log(`   ✅ Atualizados: ${updated}`);
    console.log(`   ⚠️  Sem imagem: ${notFound}`);
    console.log(`   📦 Total: ${services.length}`);

    console.log("\n🎉 Processo concluído!");
  } catch (error) {
    console.error("❌ Erro:", error.message);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Conexão fechada");
  }
}

addServiceImages();
