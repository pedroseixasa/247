require("dotenv").config();
const mongoose = require("mongoose");
const Barber = require("./src/models/Barber");

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✓ Conectado ao MongoDB");

    // Verificar se já existe admin
    const existingAdmin = await Barber.findOne({
      email: "cunha@247barbearia.com",
    });

    if (existingAdmin) {
      console.log("⚠️  Admin já existe!");
      console.log("Email:", existingAdmin.email);
      console.log("Nome:", existingAdmin.name);
      console.log(
        "\nSe perdeste a password, apaga este user no MongoDB Atlas e corre este script de novo.",
      );
      process.exit(0);
    }

    // Criar novo admin
    const admin = new Barber({
      name: "Cunha",
      email: "cunha@247barbearia.com",
      phone: "+351912345678",
      password: "Cunha2024!", // ⚠️ MUDA ISTO DEPOIS DO PRIMEIRO LOGIN!
      role: "admin",
      bio: "Administrador principal da 24.7 Barbearia",
      isActive: true,
      workingHours: {
        monday: { start: "closed", end: "closed" },
        tuesday: { start: "09:30", end: "20:00" },
        wednesday: { start: "09:30", end: "20:00" },
        thursday: { start: "09:30", end: "20:00" },
        friday: { start: "09:30", end: "20:00" },
        saturday: { start: "09:00", end: "19:00" },
        sunday: { start: "closed", end: "closed" },
      },
    });

    await admin.save();

    console.log("✅ Admin criado com sucesso!");
    console.log("\n🔐 CREDENCIAIS DE LOGIN:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Email:    cunha@247barbearia.com");
    console.log("Password: Cunha2024!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n⚠️  IMPORTANTE: Muda esta password após o primeiro login!");
    console.log("\n🌐 Painel Admin: https://pedroseixasa.github.io/247/admin/");

    process.exit(0);
  } catch (error) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  }
}

createAdmin();
