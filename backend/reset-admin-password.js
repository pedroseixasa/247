require("dotenv").config();
const mongoose = require("mongoose");
const Barber = require("./src/models/Barber");

async function resetPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✓ Conectado ao MongoDB\n");

    // Encontrar o Diogo Cunha
    const diogo = await Barber.findOne({ email: "diogo@barbearia247.pt" });

    if (!diogo) {
      console.log("❌ Utilizador 'diogo@barbearia247.pt' não encontrado!");
      process.exit(1);
    }

    console.log("✅ Utilizador encontrado:");
    console.log(`   Nome: ${diogo.name}`);
    console.log(`   Email: ${diogo.email}`);
    console.log(`   Role: ${diogo.role}\n`);

    // Definir nova password
    const novaPassword = "DiogoCunha123!";
    diogo.password = novaPassword;

    // Salvar (o bcrypt vai automaticamente fazer hash da password)
    await diogo.save();

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ Password resetada com sucesso!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n🔐 NOVAS CREDENCIAIS:");
    console.log("Email:    diogo@barbearia247.pt");
    console.log("Password: DiogoCunha123!");
    console.log("\n⚠️  IMPORTANTE: Muda esta password após fazer login!");
    console.log("\n🌐 Painel Admin: https://pedroseixasa.github.io/247/admin/");

    process.exit(0);
  } catch (error) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  }
}

resetPassword();
