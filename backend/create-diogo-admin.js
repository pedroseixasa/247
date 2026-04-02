require("dotenv").config();
const mongoose = require("mongoose");
const Barber = require("./src/models/Barber");

async function createDiogoCunha() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✓ Conectado ao MongoDB");

    // Verificar se já existe
    const existing = await Barber.findOne({ email: "diogo@247barbearia.com" });

    if (existing) {
      console.log("✅ Admin 'Diogo Cunha' já existe!");
      console.log("Email:", existing.email);
      console.log("Nome:", existing.name);
      process.exit(0);
    }

    // Criar Diogo Cunha como admin
    const admin = new Barber({
      name: "Diogo Cunha",
      email: "diogo@247barbearia.com",
      phone: "+351912345678",
      password: "DiogoCunha2024!", // ⚠️ MUDA no primeiro login!
      role: "admin",
      bio: "Administrador principal da 24.7 Barbearia",
      isActive: true,
      workingHours: {
        monday: { start: "closed", end: "closed" },
        tuesday: { start: "09:30", end: "20:00" },
        wednesday: { start: "09:30", end: "20:00" },
        thursday: { start: "09:30", end: "20:00" },
        friday: { start: "09:30", end: "20:00" },
        saturday: { start: "09:00", end: "18:00" },
        sunday: { start: "closed", end: "closed" },
      },
    });

    await admin.save();

    console.log("✅ Admin 'Diogo Cunha' criado com sucesso!");
    console.log("\n🔐 CREDENCIAIS DE LOGIN:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Email:    diogo@247barbearia.com");
    console.log("Password: DiogoCunha2024!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n⚠️  IMPORTANTE: Muda esta password após o primeiro login!");
    console.log("\n🌐 Painel Admin: https://pedroseixasa.github.io/247/admin/");

    process.exit(0);
  } catch (error) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  }
}

createDiogoCunha();
