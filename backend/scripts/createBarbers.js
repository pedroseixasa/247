require("dotenv").config();
const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");
const Barber = require("../src/models/Barber");

const DEFAULT_WORKING_HOURS = {
  monday: { start: "09:00", end: "18:00" },
  tuesday: { start: "09:00", end: "18:00" },
  wednesday: { start: "09:00", end: "18:00" },
  thursday: { start: "09:00", end: "18:00" },
  friday: { start: "09:00", end: "18:00" },
  saturday: { start: "10:00", end: "16:00" },
  sunday: null,
};

const barbers = [
  {
    name: process.env.BARBER_1_NAME || "NOME_BARBEIRO_1",
    email: process.env.BARBER_1_EMAIL || "barbeiro1@247barbearia.pt",
    password: process.env.BARBER_1_PASSWORD || "PASSWORD_SEGURA_1",
    role: "barber",
    photo: process.env.BARBER_1_PHOTO || "/assets/barbeiro1.jpg",
    avatar: process.env.BARBER_1_PHOTO || "/assets/barbeiro1.jpg",
    phone: process.env.BARBER_1_PHONE || "+351900000001",
    notificationEmail: process.env.BARBER_1_NOTIFICATION_EMAIL || null,
    workingHours: DEFAULT_WORKING_HOURS,
    lunchBreak: {
      enabled: false,
      startTime: "12:00",
      endTime: "13:00",
    },
    isActive: true,
  },
  {
    name: process.env.BARBER_2_NAME || "NOME_BARBEIRO_2",
    email: process.env.BARBER_2_EMAIL || "barbeiro2@247barbearia.pt",
    password: process.env.BARBER_2_PASSWORD || "PASSWORD_SEGURA_2",
    role: "barber",
    photo: process.env.BARBER_2_PHOTO || "/assets/barbeiro2.jpg",
    avatar: process.env.BARBER_2_PHOTO || "/assets/barbeiro2.jpg",
    phone: process.env.BARBER_2_PHONE || "+351900000002",
    notificationEmail: process.env.BARBER_2_NOTIFICATION_EMAIL || null,
    workingHours: DEFAULT_WORKING_HOURS,
    lunchBreak: {
      enabled: false,
      startTime: "12:00",
      endTime: "13:00",
    },
    isActive: true,
  },
];

async function run() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI não está definido");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    for (const barber of barbers) {
      const hash = await bcryptjs.hash(barber.password, 10);

      await Barber.findOneAndUpdate(
        { email: barber.email },
        { ...barber, password: hash },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        },
      );

      console.log(`✅ Barbeiro criado/atualizado: ${barber.name}`);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error("❌ Erro ao criar barbeiros:", error.message);
    process.exit(1);
  }
}

run();
