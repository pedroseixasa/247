require("dotenv").config();
const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");
const Barber = require("./src/models/Barber");
const Service = require("./src/models/Service");

const MONGODB_URI = process.env.MONGODB_URI;

async function seedDatabase() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✓ Conectado ao MongoDB");

    // Limpar dados existentes
    await Barber.deleteMany({});
    await Service.deleteMany({});
    console.log("✓ Dados anteriores removidos");

    const DEFAULT_WORKING_HOURS = {
      monday: { start: "09:30", end: "20:00" },
      tuesday: { start: "09:30", end: "20:00" },
      wednesday: { start: "09:30", end: "20:00" },
      thursday: { start: "09:30", end: "20:00" },
      friday: { start: "09:30", end: "20:00" },
      saturday: { start: "09:00", end: "18:00" },
      sunday: { start: "closed", end: "closed" },
    };

    // Criar contas principais com dados personalizados por env vars
    const barbers = [
      {
        name: process.env.ADMIN_NAME || "Diogo Cunha",
        email: process.env.ADMIN_EMAIL || "diogo@barbearia247.pt",
        phone: process.env.ADMIN_PHONE || "+351912345678",
        password: process.env.ADMIN_PASSWORD || "admin123",
        role: "admin",
        bio: process.env.ADMIN_BIO || "Fundador e barbeiro experiente",
        avatar: process.env.ADMIN_PHOTO || "https://via.placeholder.com/150",
        photo: process.env.ADMIN_PHOTO || "https://via.placeholder.com/150",
        notificationEmail: process.env.ADMIN_NOTIFICATION_EMAIL || null,
        workingHours: DEFAULT_WORKING_HOURS,
        lunchBreak: {
          enabled: false,
          startTime: "12:00",
          endTime: "13:00",
        },
        isActive: true,
      },
      {
        name: process.env.BARBER_1_NAME || "Barbeiro 1",
        email: process.env.BARBER_1_EMAIL || "barbeiro1@247barbearia.pt",
        phone: process.env.BARBER_1_PHONE || "+351900000001",
        password: process.env.BARBER_1_PASSWORD || "barber123",
        role: "barber",
        bio: process.env.BARBER_1_BIO || "Especialista em cortes precisos e barba alinhada.",
        avatar: process.env.BARBER_1_PHOTO || "https://via.placeholder.com/150",
        photo: process.env.BARBER_1_PHOTO || "https://via.placeholder.com/150",
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
        name: process.env.BARBER_2_NAME || "Barbeiro 2",
        email: process.env.BARBER_2_EMAIL || "barbeiro2@247barbearia.pt",
        phone: process.env.BARBER_2_PHONE || "+351900000002",
        password: process.env.BARBER_2_PASSWORD || "barber123",
        role: "barber",
        bio: process.env.BARBER_2_BIO || "Cortes modernos, detalhe e acabamento.",
        avatar: process.env.BARBER_2_PHOTO || "https://via.placeholder.com/150",
        photo: process.env.BARBER_2_PHOTO || "https://via.placeholder.com/150",
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

    const barbersWithHashedPasswords = await Promise.all(
      barbers.map(async (barber) => ({
        ...barber,
        password: await bcryptjs.hash(barber.password, 10),
      })),
    );

    await Barber.insertMany(barbersWithHashedPasswords);
    // Barbeiros criados

    // Criar serviços com IDs fixos
    const services = [
      {
        _id: "699857f4b8fc9a78d43a43ad",
        name: "Corte + Madelxas",
        price: 12,
        duration: 30,
        description: "Corte de cabelo com aparador de barba",
      },
      {
        _id: "699857f4b8fc9a78d43a43ae",
        name: "Corte degradé",
        price: 12,
        duration: 30,
      },
      {
        _id: "699857f4b8fc9a78d43a43af",
        name: "Barba completa",
        price: 6,
        duration: 20,
      },
      {
        _id: "699857f4b8fc9a78d43a43b0",
        name: "Corte (Degradé) + Barba + sobrancelha",
        price: 15,
        duration: 40,
      },
      {
        _id: "699857f4b8fc9a78d43a43b1",
        name: "Corte + Pintura (preto)",
        price: 20,
        duration: 45,
      },
      {
        _id: "699857f4b8fc9a78d43a43b2",
        name: "Corte + platinado",
        price: 40,
        duration: 60,
      },
      {
        _id: "699857f4b8fc9a78d43a43b3",
        name: "Corte Social",
        price: 10,
        duration: 25,
      },
      {
        _id: "699857f4b8fc9a78d43a43b4",
        name: "Corte Social + barba",
        price: 13,
        duration: 35,
      },
      {
        _id: "699857f4b8fc9a78d43a43b5",
        name: "Corte criança até 7 anos",
        price: 10,
        duration: 25,
      },
    ];

    await Service.insertMany(services);
    // Serviços criados

    process.exit(0);
  } catch (error) {
    console.error("✗ Erro ao inicializar DB:", error);
    process.exit(1);
  }
}

seedDatabase();
