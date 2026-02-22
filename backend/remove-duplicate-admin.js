require("dotenv").config();
const mongoose = require("mongoose");
const Barber = require("./src/models/Barber");

async function removeAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✓ Conectado ao MongoDB");

    // Remover o user "Cunha" (cunha@247barbearia.com)
    const result = await Barber.deleteOne({ email: "cunha@247barbearia.com" });

    if (result.deletedCount > 0) {
      console.log("✅ Utilizador 'Cunha' removido com sucesso!");
    } else {
      console.log(
        "⚠️  Utilizador 'Cunha' não encontrado (já foi removido ou nunca existiu)",
      );
    }

    // Verificar se o Diogo Cunha existe
    const diogoExists = await Barber.findOne({
      email: "diogo@247barbearia.com",
    });

    if (diogoExists) {
      console.log("\n✅ Admin 'Diogo Cunha' existe:");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("Nome:", diogoExists.name);
      console.log("Email:", diogoExists.email);
      console.log("Role:", diogoExists.role);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("\n🔐 Usa estas credenciais no painel admin:");
      console.log("Email: diogo@247barbearia.com");
      console.log("Password: (a que já estava definida)");
    } else {
      console.log(
        "\n⚠️  AVISO: Utilizador 'Diogo Cunha' não existe na base de dados!",
      );
      console.log("Precisas criar um admin primeiro.");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  }
}

removeAdmin();
