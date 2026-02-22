require("dotenv").config();
const mongoose = require("mongoose");
const Reservation = require("./src/models/Reservation");
const MonthlyStats = require("./src/models/MonthlyStats");
const Barber = require("./src/models/Barber");
const Service = require("./src/models/Service");

/**
 * Script para agregar reservas antigas em estatísticas mensais
 * Uso: node aggregate-monthly-stats.js [ano] [mes] [--delete]
 *
 * Exemplos:
 *   node aggregate-monthly-stats.js 2024 0           # Agrega Janeiro 2024
 *   node aggregate-monthly-stats.js 2024 0 --delete  # Agrega e apaga reservas
 *   node aggregate-monthly-stats.js --auto           # Agrega meses com mais de 12 meses
 */

async function aggregateMonth(year, month, deleteAfter = false) {
  console.log(
    `\n📊 Agregando estatísticas de ${year}-${String(month + 1).padStart(2, "0")}...\n`,
  );

  const monthStart = new Date(year, month, 1);
  monthStart.setHours(0, 0, 0, 0);
  const monthEnd = new Date(year, month + 1, 0);
  monthEnd.setHours(23, 59, 59, 999);

  // Buscar todas as reservas confirmadas/completadas do mês
  const reservations = await Reservation.find({
    reservationDate: { $gte: monthStart, $lte: monthEnd },
    status: { $in: ["confirmed", "completed"] },
  })
    .populate("barberId", "name")
    .populate("serviceId", "name price");

  if (reservations.length === 0) {
    console.log("⚠️  Nenhuma reserva encontrada para este mês.");
    return null;
  }

  console.log(`✅ ${reservations.length} reservas encontradas`);

  // Calcular estatísticas globais
  let totalRevenue = 0;
  const barberMap = {};
  const serviceMap = {};
  const dayOfWeekMap = {
    monday: { count: 0, revenue: 0 },
    tuesday: { count: 0, revenue: 0 },
    wednesday: { count: 0, revenue: 0 },
    thursday: { count: 0, revenue: 0 },
    friday: { count: 0, revenue: 0 },
    saturday: { count: 0, revenue: 0 },
    sunday: { count: 0, revenue: 0 },
  };

  const dayNames = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  reservations.forEach((res) => {
    const price = res.serviceId?.price || 0;
    totalRevenue += price;

    // Por barbeiro
    const barberId = res.barberId?._id?.toString();
    const barberName = res.barberId?.name || "Desconhecido";
    if (barberId) {
      if (!barberMap[barberId]) {
        barberMap[barberId] = {
          barberId,
          barberName,
          reservations: 0,
          revenue: 0,
        };
      }
      barberMap[barberId].reservations++;
      barberMap[barberId].revenue += price;
    }

    // Por serviço
    const serviceId = res.serviceId?._id?.toString();
    const serviceName = res.serviceId?.name || "Desconhecido";
    if (serviceId) {
      if (!serviceMap[serviceId]) {
        serviceMap[serviceId] = {
          serviceId,
          serviceName,
          count: 0,
          revenue: 0,
        };
      }
      serviceMap[serviceId].count++;
      serviceMap[serviceId].revenue += price;
    }

    // Por dia da semana
    const dayOfWeek = dayNames[res.reservationDate.getDay()];
    dayOfWeekMap[dayOfWeek].count++;
    dayOfWeekMap[dayOfWeek].revenue += price;
  });

  // Ordenar serviços por popularidade
  const topServices = Object.values(serviceMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10

  const barberStats = Object.values(barberMap);

  // Guardar ou atualizar estatísticas
  const monthlyStats = await MonthlyStats.findOneAndUpdate(
    { year, month, barberId: null },
    {
      year,
      month,
      barberId: null,
      totalReservations: reservations.length,
      totalRevenue,
      barberStats,
      topServices,
      dayOfWeekStats: dayOfWeekMap,
      updatedAt: new Date(),
    },
    { upsert: true, new: true },
  );

  console.log(`\n✅ Estatísticas agregadas:`);
  console.log(`   Total reservas: ${reservations.length}`);
  console.log(`   Receita total: €${totalRevenue.toFixed(2)}`);
  console.log(`   Barbeiros: ${barberStats.length}`);
  console.log(`   Serviços únicos: ${topServices.length}`);

  // Apagar reservas se solicitado
  if (deleteAfter) {
    const deleteResult = await Reservation.deleteMany({
      reservationDate: { $gte: monthStart, $lte: monthEnd },
      status: { $in: ["confirmed", "completed"] },
    });
    console.log(`\n🗑️  ${deleteResult.deletedCount} reservas apagadas`);
  }

  return monthlyStats;
}

async function autoAggregate() {
  console.log("🤖 Modo automático: agregando meses com mais de 12 meses...\n");

  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 12, 1);

  // Encontrar o mês da reserva mais antiga
  const oldestReservation = await Reservation.findOne({
    status: { $in: ["confirmed", "completed"] },
  }).sort({ reservationDate: 1 });

  if (!oldestReservation) {
    console.log("⚠️  Nenhuma reserva encontrada.");
    return;
  }

  const oldestDate = new Date(oldestReservation.reservationDate);
  console.log(
    `📅 Reserva mais antiga: ${oldestDate.toLocaleDateString("pt-PT")}`,
  );
  console.log(
    `📅 Limite (12 meses atrás): ${twelveMonthsAgo.toLocaleDateString("pt-PT")}\n`,
  );

  // Agregar todos os meses desde a mais antiga até 12 meses atrás
  let currentDate = new Date(
    oldestDate.getFullYear(),
    oldestDate.getMonth(),
    1,
  );
  let aggregatedCount = 0;

  while (currentDate < twelveMonthsAgo) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Verificar se já existe
    const exists = await MonthlyStats.findOne({ year, month, barberId: null });

    if (!exists) {
      await aggregateMonth(year, month, true); // Agrega E apaga
      aggregatedCount++;
    } else {
      console.log(
        `⏭️  ${year}-${String(month + 1).padStart(2, "0")} já agregado, ignorando...`,
      );
    }

    // Próximo mês
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  console.log(`\n✅ Concluído! ${aggregatedCount} meses agregados e limpos.`);
}

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Conectado ao MongoDB");

    const args = process.argv.slice(2);

    if (args.includes("--auto")) {
      await autoAggregate();
    } else if (args.length >= 2) {
      const year = parseInt(args[0], 10);
      const month = parseInt(args[1], 10);
      const deleteAfter = args.includes("--delete");

      if (isNaN(year) || isNaN(month) || month < 0 || month > 11) {
        console.error(
          "❌ Uso: node aggregate-monthly-stats.js [ano] [mes 0-11] [--delete]",
        );
        console.error("   ou: node aggregate-monthly-stats.js --auto");
        process.exit(1);
      }

      await aggregateMonth(year, month, deleteAfter);
    } else {
      console.error(
        "❌ Uso: node aggregate-monthly-stats.js [ano] [mes 0-11] [--delete]",
      );
      console.error("   ou: node aggregate-monthly-stats.js --auto");
      process.exit(1);
    }

    await mongoose.disconnect();
    console.log("\n✅ Desconectado do MongoDB");
  } catch (error) {
    console.error("❌ Erro:", error);
    process.exit(1);
  }
}

main();
