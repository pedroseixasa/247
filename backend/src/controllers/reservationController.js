const mongoose = require("mongoose");
const Reservation = require("../models/Reservation");
const Barber = require("../models/Barber");
const Service = require("../models/Service");
const twilio = require("twilio");
const crypto = require("crypto");
const {
  sendBookingConfirmation,
  sendAdminNotification,
} = require("../services/emailService");

// Inicializar Twilio sob demanda (lazy loading)
let client = null;

function getTwilioClient() {
  if (
    !client &&
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_ACCOUNT_SID.startsWith("AC")
  ) {
    try {
      client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN,
      );
    } catch (error) {
      // Twilio not configured
    }
  }
  return client;
}

exports.createReservation = async (req, res) => {
  try {
    const {
      barberId,
      serviceId,
      clientName,
      clientPhone,
      clientEmail,
      reservationDate,
      timeSlot,
      notes,
    } = req.body;

    // Validar dados
    if (
      !barberId ||
      !serviceId ||
      !clientName ||
      !clientEmail ||
      !reservationDate ||
      !timeSlot
    ) {
      return res.status(400).json({ error: "Dados obrigatórios faltando" });
    }

    // Validar formato de telefone português
    if (clientPhone) {
      const phoneRegex = /^(\+351\s?)?[29]\d{8}$/;
      const cleanPhone = clientPhone.replace(/\s/g, "");
      if (!phoneRegex.test(cleanPhone)) {
        return res.status(400).json({
          error:
            "Número de telefone inválido. Use formato: +351 912345678 ou 912345678",
        });
      }
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientEmail)) {
      return res.status(400).json({
        error: "Email inválido",
      });
    }

    // Verificar se o email tem domínio válido
    const domain = clientEmail.split("@")[1];
    if (
      !domain ||
      domain.split(".").length < 2 ||
      domain.endsWith(".test") ||
      domain.endsWith(".fake")
    ) {
      return res.status(400).json({
        error: "Por favor, use um email real",
      });
    }

    // Converter IDs para ObjectId com validação
    let barberIdObj, serviceIdObj;
    try {
      if (typeof barberId === "string") {
        if (!mongoose.Types.ObjectId.isValid(barberId)) {
          return res.status(400).json({ error: "ID do barbeiro inválido" });
        }
        barberIdObj = new mongoose.Types.ObjectId(barberId);
      } else {
        barberIdObj = barberId;
      }

      if (typeof serviceId === "string") {
        if (!mongoose.Types.ObjectId.isValid(serviceId)) {
          return res.status(400).json({ error: "ID do serviço inválido" });
        }
        serviceIdObj = new mongoose.Types.ObjectId(serviceId);
      } else {
        serviceIdObj = serviceId;
      }
    } catch (err) {
      return res
        .status(400)
        .json({ error: "Erro ao processar IDs: " + err.message });
    }

    // Verificar se o barbeiro existe
    const barber = await Barber.findById(barberIdObj).select("-password");
    if (!barber) {
      return res.status(404).json({ error: "Barbeiro não encontrado" });
    }

    // Verificar se o serviço existe
    const service = await Service.findById(serviceIdObj);
    if (!service) {
      return res.status(404).json({ error: "Serviço não encontrado" });
    }

    // Verificar se o barbeiro tem ausência nesta data
    const reservationDateTime = new Date(reservationDate);
    const reservationDateOnly = new Date(
      reservationDateTime.setHours(0, 0, 0, 0),
    );

    const barberAbsence = barber.absences?.find((absence) => {
      const absenseDate = new Date(absence.date);
      const absenseDateOnly = new Date(absenseDate.setHours(0, 0, 0, 0));

      if (absenseDateOnly.getTime() !== reservationDateOnly.getTime()) {
        return false;
      }

      // Se é ausência de dia inteiro
      if (absence.type === "full") {
        return true;
      }

      // Verificar se o timeslot cai dentro da ausência específica
      const [hours, minutes] = timeSlot.split(":").map(Number);
      const appointmentTime = hours * 60 + minutes;

      if (absence.type === "morning") {
        return appointmentTime < 12 * 60; // Antes do meio-dia
      } else if (absence.type === "afternoon") {
        return appointmentTime >= 12 * 60; // A partir do meio-dia
      } else if (
        absence.type === "specific" &&
        absence.startTime &&
        absence.endTime
      ) {
        const [sHours, sMinutes] = absence.startTime.split(":").map(Number);
        const [eHours, eMinutes] = absence.endTime.split(":").map(Number);
        const startTime = sHours * 60 + sMinutes;
        const endTime = eHours * 60 + eMinutes;
        return appointmentTime >= startTime && appointmentTime < endTime;
      }

      return false;
    });

    if (barberAbsence) {
      return res
        .status(409)
        .json({
          error: "Barbeiro indisponível nesta data/hora. Marque outra data.",
        });
    }

    // Verificar se já existe reserva para esse barbeiro à essa hora
    const existingReservation = await Reservation.findOne({
      barberId: barberIdObj,
      reservationDate: {
        $gte: new Date(reservationDate).setHours(0, 0, 0, 0),
        $lt: new Date(reservationDate).setHours(23, 59, 59, 999),
      },
      timeSlot,
      status: { $ne: "cancelled" },
    });

    if (existingReservation) {
      return res.status(409).json({ error: "Esta hora já está reservada" });
    }

    // Gerar token único para cancelamento
    const cancelToken = crypto.randomBytes(32).toString("hex");

    // Criar reserva
    const reservation = new Reservation({
      barberId: barberIdObj,
      serviceId: serviceIdObj,
      clientName,
      clientPhone,
      clientEmail,
      reservationDate,
      timeSlot,
      notes,
      status: "confirmed",
      cancelToken,
    });

    await reservation.save();

    // Enviar SMS de confirmação
    try {
      const twilioClient = getTwilioClient();
      if (twilioClient) {
        await twilioClient.messages.create({
          body: `Olá ${clientName}! Sua reserva na barbearia 247 está confirmada para ${new Date(reservationDate).toLocaleDateString("pt-PT")} às ${timeSlot}. Serviço: ${service.name}. Obrigado!`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: clientPhone,
        });
      } else {
        // SMS not sent - Twilio not configured
      }
    } catch (smsError) {
      // Não falha se SMS não enviar
    }

    // Popular referências
    await reservation.populate("barberId serviceId");

    // Enviar emails de confirmação (não bloqueia resposta)
    Promise.all([
      // Email ao cliente
      sendBookingConfirmation({
        clientName,
        clientEmail,
        barberName: barber.name,
        serviceName: service.name,
        reservationDate,
        timeSlot,
        cancelToken,
      }),
      // Email à administração
      sendAdminNotification({
        clientName,
        clientEmail,
        clientPhone,
        barberName: barber.name,
        serviceName: service.name,
        reservationDate,
        timeSlot,
      }),
    ]).catch((emailError) => {
      console.error("Erro ao enviar emails:", emailError);
      // Não falha a requisição se emails não enviar
    });

    res.status(201).json({
      message: "Reserva criada com sucesso!",
      reservation,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getReservationsByBarber = async (req, res) => {
  try {
    const { barberId } = req.params;
    const { date } = req.query;

    let query = { barberId };

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      query.reservationDate = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    const reservations = await Reservation.find(query)
      .populate("serviceId")
      .sort({ reservationDate: 1, timeSlot: 1 });

    res.json(reservations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateReservationStatus = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const { status } = req.body;

    if (!["confirmed", "pending", "cancelled", "completed"].includes(status)) {
      return res.status(400).json({ error: "Status inválido" });
    }

    const reservation = await Reservation.findByIdAndUpdate(
      reservationId,
      { status },
      { new: true },
    ).populate("serviceId");

    if (!reservation) {
      return res.status(404).json({ error: "Reserva não encontrada" });
    }

    res.json(reservation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteReservation = async (req, res) => {
  try {
    const { reservationId } = req.params;

    const reservation = await Reservation.findByIdAndDelete(reservationId);
    if (!reservation) {
      return res.status(404).json({ error: "Reserva não encontrada" });
    }

    res.json({ message: "Reserva cancelada" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Cancelar reserva por token (público - sem autenticação)
exports.cancelReservationByToken = async (req, res) => {
  try {
    const { token } = req.params;

    const reservation = await Reservation.findOne({
      cancelToken: token,
    }).populate("barberId serviceId");

    if (!reservation) {
      return res
        .status(404)
        .json({ error: "Reserva não encontrada ou já cancelada" });
    }

    // Guardar dados para resposta antes de deletar
    const reservationData = {
      clientName: reservation.clientName,
      serviceName: reservation.serviceId.name,
      date: reservation.reservationDate,
      time: reservation.timeSlot,
    };

    // Deletar reserva da base de dados
    await Reservation.findByIdAndDelete(reservation._id);

    res.json({
      message: "Reserva cancelada com sucesso!",
      reservation: reservationData,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
