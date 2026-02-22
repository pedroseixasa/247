const mongoose = require("mongoose");

const monthlyStatsSchema = new mongoose.Schema({
  year: {
    type: Number,
    required: true,
  },
  month: {
    type: Number, // 0-11 (Janeiro = 0, Dezembro = 11)
    required: true,
  },
  barberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Barber",
    default: null, // null = estatísticas globais
  },

  // Totais
  totalReservations: {
    type: Number,
    default: 0,
  },
  totalRevenue: {
    type: Number,
    default: 0,
  },

  // Por barbeiro (se global)
  barberStats: [
    {
      barberId: mongoose.Schema.Types.ObjectId,
      barberName: String,
      reservations: Number,
      revenue: Number,
    },
  ],

  // Serviços mais populares
  topServices: [
    {
      serviceId: mongoose.Schema.Types.ObjectId,
      serviceName: String,
      count: Number,
      revenue: Number,
    },
  ],

  // Dias da semana
  dayOfWeekStats: {
    monday: { count: Number, revenue: Number },
    tuesday: { count: Number, revenue: Number },
    wednesday: { count: Number, revenue: Number },
    thursday: { count: Number, revenue: Number },
    friday: { count: Number, revenue: Number },
    saturday: { count: Number, revenue: Number },
    sunday: { count: Number, revenue: Number },
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Índice único por mês/ano/barbeiro
monthlyStatsSchema.index({ year: 1, month: 1, barberId: 1 }, { unique: true });

module.exports = mongoose.model("MonthlyStats", monthlyStatsSchema);
