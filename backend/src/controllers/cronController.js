const Reservation = require("../models/Reservation");
const MonthlyStats = require("../models/MonthlyStats");
const Barber = require("../models/Barber");
const Service = require("../models/Service");
const mongoose = require("mongoose");

/**
 * Endpoint minimalista para cronjob de agregação mensal
 * Retorna apenas status para não exceder 64 KB do cron-job.org free
 */
exports.aggregateMonthlyStats = async (req, res) => {
  try {
    const now = new Date();
    const twelveMonthsAgo = new Date(now);
    twelveMonthsAgo.setMonth(now.getMonth() - 12);

    // Procurar meses com mais de 12 meses que ainda não foram agregados
    const oldReservations = await Reservation.find({
      reservationDate: { $lt: twelveMonthsAgo },
      status: { $in: ["confirmed", "completed"] },
    }).limit(1);

    if (oldReservations.length === 0) {
      return res.json({
        status: "ok",
        message: "No old reservations to aggregate",
      });
    }

    // Agregar o mês mais antigo encontrado
    const oldestDate = oldReservations[0].reservationDate;
    const year = oldestDate.getFullYear();
    const month = oldestDate.getMonth();

    await aggregateMonth(year, month);

    res.json({
      status: "ok",
      aggregated: `${year}-${String(month + 1).padStart(2, "0")}`,
    });
  } catch (error) {
    res.status(500).json({ status: "error" });
  }
};

/**
 * Endpoint minimalista para cronjob de limpeza de duplicados
 */
exports.cleanDuplicates = async (req, res) => {
  try {
    // Buscar todos os barbeiros
    const barbers = await Barber.find({});
    const nameMap = {};
    let deletedCount = 0;

    for (const barber of barbers) {
      const normalizedName = barber.name.toLowerCase().trim();

      if (nameMap[normalizedName]) {
        // Duplicado encontrado - deletar
        await Barber.findByIdAndDelete(barber._id);
        deletedCount++;
      } else {
        nameMap[normalizedName] = barber._id;
      }
    }

    res.json({ status: "ok", deleted: deletedCount });
  } catch (error) {
    res.status(500).json({ status: "error" });
  }
};

/**
 * Endpoint minimalista para limpar reservas antigas
 */
exports.clearOldReservations = async (req, res) => {
  try {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    // Primeiro agregar, depois deletar
    const result = await Reservation.deleteMany({
      reservationDate: { $lt: twelveMonthsAgo },
    });

    res.json({ status: "ok", deleted: result.deletedCount || 0 });
  } catch (error) {
    res.status(500).json({ status: "error" });
  }
};

// Helper function para agregar um mês
async function aggregateMonth(year, month) {
  const monthStart = new Date(year, month, 1);
  monthStart.setHours(0, 0, 0, 0);
  const monthEnd = new Date(year, month + 1, 0);
  monthEnd.setHours(23, 59, 59, 999);

  const reservations = await Reservation.find({
    reservationDate: { $gte: monthStart, $lte: monthEnd },
    status: { $in: ["confirmed", "completed"] },
  })
    .populate("barberId", "name")
    .populate("serviceId", "name price");

  if (reservations.length === 0) return null;

  let totalRevenue = 0;
  const barberMap = {};
  const serviceMap = {};

  reservations.forEach((res) => {
    const price = res.serviceId?.price || 0;
    totalRevenue += price;

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
  });

  // Guardar estatísticas globais
  await MonthlyStats.findOneAndUpdate(
    { year, month, barberId: null },
    {
      totalReservations: reservations.length,
      totalRevenue,
      services: Object.values(serviceMap),
    },
    { upsert: true },
  );

  // Guardar estatísticas por barbeiro
  for (const stats of Object.values(barberMap)) {
    await MonthlyStats.findOneAndUpdate(
      {
        year,
        month,
        barberId: new mongoose.Types.ObjectId(stats.barberId),
      },
      {
        totalReservations: stats.reservations,
        totalRevenue: stats.revenue,
        barberName: stats.barberName,
      },
      { upsert: true },
    );
  }

  return { year, month, total: reservations.length };
}
