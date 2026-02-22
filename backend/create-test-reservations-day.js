require("dotenv").config();
const mongoose = require("mongoose");
const Reservation = require("./src/models/Reservation");
const Barber = require("./src/models/Barber");
const Service = require("./src/models/Service");
const SiteSettings = require("./src/models/SiteSettings");

function normalizeText(value) {
  return (value || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}

function parseTimeRange(value) {
  const text = normalizeText(value);
  if (!text || text.includes("ENCERRADO") || text.includes("FECHADO")) {
    return null;
  }

  const match = text.match(/(\d{1,2}:\d{2})\s*[\u2013\-]\s*(\d{1,2}:\d{2})/);
  if (!match) return null;

  const [openStr, closeStr] = [match[1], match[2]];
  const [openH, openM] = openStr.split(":").map(Number);
  const [closeH, closeM] = closeStr.split(":").map(Number);
  return {
    openMinutes: openH * 60 + openM,
    closeMinutes: closeH * 60 + closeM,
  };
}

function parseHoursRowsToSchedule(hoursRows) {
  const dayMap = {
    DOMINGO: 0,
    SEGUNDA: 1,
    SEGUNDAFEIRA: 1,
    TERCA: 2,
    TERCAFEIRA: 2,
    QUARTA: 3,
    QUARTAFEIRA: 3,
    QUINTA: 4,
    QUINTAFEIRA: 4,
    SEXTA: 5,
    SEXTAFEIRA: 5,
    SABADO: 6,
  };

  const schedule = {};

  (hoursRows || []).forEach((row) => {
    const label = normalizeText(row.label || "").replace(/\s+/g, " ");
    if (!label) return;

    let days = [];
    const parts = label.split(" A ");
    if (parts.length === 2) {
      const startKey = parts[0].replace(/\s|\-FEIRA/g, "");
      const endKey = parts[1].replace(/\s|\-FEIRA/g, "");
      const start = dayMap[startKey];
      const end = dayMap[endKey];
      if (start !== undefined && end !== undefined) {
        if (start <= end) {
          for (let d = start; d <= end; d++) days.push(d);
        } else {
          for (let d = start; d <= 6; d++) days.push(d);
          for (let d = 0; d <= end; d++) days.push(d);
        }
      }
    } else {
      const key = label.replace(/\s|\-FEIRA/g, "");
      if (dayMap[key] !== undefined) {
        days = [dayMap[key]];
      }
    }

    const range = parseTimeRange(row.value || "");
    days.forEach((day) => {
      schedule[day] = range
        ? {
            open: true,
            openMinutes: range.openMinutes,
            closeMinutes: range.closeMinutes,
          }
        : { open: false };
    });
  });

  return schedule;
}

function formatTime(minutes) {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function getTimeSlotsForDate(date, schedule) {
  const day = date.getDay();
  const daySchedule = schedule && schedule[day];
  if (!daySchedule || !daySchedule.open) return [];

  const slots = [];
  const slotMinutes = 60;
  for (
    let t = daySchedule.openMinutes;
    t + slotMinutes <= daySchedule.closeMinutes;
    t += slotMinutes
  ) {
    slots.push(formatTime(t));
  }

  return slots;
}

async function createDayReservations(targetDate) {
  await mongoose.connect(process.env.MONGODB_URI);

  const settings = await SiteSettings.findOne();
  if (!settings || !settings.hoursRows || settings.hoursRows.length === 0) {
    throw new Error("Sem horarios configurados em SiteSettings");
  }

  const schedule = parseHoursRowsToSchedule(settings.hoursRows);
  const slots = getTimeSlotsForDate(targetDate, schedule);
  if (slots.length === 0) {
    throw new Error("Dia sem horarios disponiveis");
  }

  const service = await Service.findOne({ isActive: true });
  if (!service) {
    throw new Error("Nenhum servico ativo encontrado");
  }

  const barbers = await Barber.find({ isActive: true });
  if (!barbers.length) {
    throw new Error("Nenhum barbeiro ativo encontrado");
  }

  let created = 0;
  let skipped = 0;

  for (const barber of barbers) {
    for (const timeSlot of slots) {
      const [h, m] = timeSlot.split(":").map(Number);
      const reservationDate = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate(),
        h,
        m,
        0,
        0,
      );

      const exists = await Reservation.findOne({
        barberId: barber._id,
        timeSlot,
        reservationDate: {
          $gte: new Date(reservationDate.getTime() - 60000),
          $lte: new Date(reservationDate.getTime() + 60000),
        },
      });

      if (exists) {
        skipped += 1;
        continue;
      }

      const clientName = `Teste ${timeSlot}`;
      const clientEmail = `teste+${targetDate.toISOString().slice(0, 10)}-${timeSlot.replace(":", "")}@247.pt`;

      const reservation = new Reservation({
        barberId: barber._id,
        serviceId: service._id,
        clientName,
        clientPhone: "+351 900 000 000",
        clientEmail,
        reservationDate,
        timeSlot,
        status: "confirmed",
        notes: "🧪 RESERVA DE TESTE - Deletar depois",
      });

      await reservation.save();
      created += 1;
    }
  }

  await mongoose.disconnect();

  console.log("Criadas:", created);
  console.log("Ignoradas (ja existiam):", skipped);
  console.log("Dia:", targetDate.toLocaleDateString("pt-PT"));
  console.log("Horarios:", slots.join(", "));
  console.log("Barbeiros:", barbers.length);
}

const input = process.argv[2] || "2026-04-23";
const parsed = new Date(`${input}T00:00:00`);
if (Number.isNaN(parsed.getTime())) {
  console.error("Data invalida. Use YYYY-MM-DD, exemplo 2026-04-23");
  process.exit(1);
}

createDayReservations(parsed).catch((err) => {
  console.error("Erro:", err.message);
  process.exit(1);
});
