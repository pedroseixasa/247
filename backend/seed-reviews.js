require("dotenv").config();
const mongoose = require("mongoose");
const Review = require("./src/models/Review");

const MONGODB_URI = process.env.MONGODB_URI;

async function seedReviews() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✓ Conectado ao MongoDB");

    // Limpar reviews antigos
    await Review.deleteMany({});
    console.log("✓ Reviews anteriores removidas");

    // Criar 3 reviews de teste
    const reviews = [
      {
        author: "João Silva",
        rating: 5,
        text: "Excelente barbearia! Atendimento muito atencioso e trabalho de primeira qualidade. Recomendo vivamente!",
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 dias atrás
        isActive: true,
      },
      {
        author: "Pedro Costa",
        rating: 5,
        text: "Melhor corte que já tive! Diogo é muito profissional e atencioso. Voltarei com certeza.",
        date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 dias atrás
        isActive: true,
      },
      {
        author: "Miguel Santos",
        rating: 4,
        text: "Ótimo ambiente, trabalho bem feito. Ambiente muito descontraído e acolhedor. Adorei!",
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 dias atrás
        isActive: true,
      },
    ];

    await Review.insertMany(reviews);
    // Reviews criadas

    process.exit(0);
  } catch (error) {
    console.error("✗ Erro ao adicionar reviews:", error);
    process.exit(1);
  }
}

seedReviews();
