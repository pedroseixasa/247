require("dotenv").config();
const mongoose = require("mongoose");
const Reservation = require("./src/models/Reservation");
const Barber = require("./src/models/Barber");
const Service = require("./src/models/Service");

/**
 * Script para criar uma reserva de teste às 14:20 para hoje
 * Use para testar a transição de receita estimada para realizada
 * Uso: node create-test-reservation.js
 */

async function createTestReservation() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Conectado ao MongoDB");

    // Obter primeira serviço
    const service = await Service.findOne({ isActive: true });
    if (!service) {
      throw new Error("Nenhum serviço ativo encontrado");
    }

    // Obter primeiro barbeiro ativo
    const barber = await Barber.findOne({ isActive: true });
    if (!barber) {
      throw new Error("Nenhum barbeiro ativo encontrado");
    }

    // Data de hoje às 14:20
    const today = new Date();
    const reservationDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      14,
      20,
      0,
      0,
    );

    console.log(`\n📅 Criando reserva de teste:`);
    console.log(`   Barbeiro: ${barber.name}`);
    console.log(`   Serviço: ${service.name} (€${service.price})`);
    console.log(`   Data: ${reservationDate.toLocaleString("pt-PT")}`);
    console.log(`   Hora: 14:20`);

    // Verificar se já existe uma reserva para este horário
    const existing = await Reservation.findOne({
      barberId: barber._id,
      reservationDate: {
        $gte: new Date(reservationDate.getTime() - 60000),
        $lte: new Date(reservationDate.getTime() + 60000),
      },
      timeSlot: "14:20",
    });

    if (existing) {
      console.log("\n⚠️  Já existe uma reserva para este horário!");
      console.log("   ID:", existing._id);
      console.log("   Status:", existing.status);

      if (existing.status !== "confirmed") {
        await Reservation.findByIdAndUpdate(existing._id, {
          status: "confirmed",
        });
        console.log("\n✅ Reserva atualizada para 'confirmed'");
      }
    } else {
      // Criar nova reserva
      const reservation = new Reservation({
        barberId: barber._id,
        serviceId: service._id,
        clientName: "Teste",
        clientPhone: "+351 912 345 678",
        clientEmail: "teste@247.pt",
        reservationDate: reservationDate,
        timeSlot: "14:20",
        status: "confirmed",
        notes: "🧪 RESERVA DE TESTE - Deletar após testes",
      });

      await reservation.save();
      console.log("\n✅ Reserva de teste criada com sucesso!");
      console.log("   ID:", reservation._id);
    }

    console.log("\n📊 Como testar:");
    console.log("   1. Abra o painel admin em produção");
    console.log("   2. O dashboard mostrará receita prevista");
    console.log("   3. Quando passar de 14:20, recarregue a página");
    console.log(
      "   4. A receita deve passar de 'prevista' para 'realizada' ✅",
    );

    console.log("\n🗑️  Para deletar esta reserva depois:");
    console.log(`   node delete-test-reservation.js\n`);

    await mongoose.disconnect();
  } catch (error) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  }
}

createTestReservation();
