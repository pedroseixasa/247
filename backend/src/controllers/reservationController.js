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

    // ========== VALIDAÇÃO 1: Dados obrigatórios ==========
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

    // ========== VALIDAÇÃO 2: Telefone português ==========
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

    // ========== VALIDAÇÃO 3: Email válido e domínio real ==========
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientEmail)) {
      return res.status(400).json({
        error: "Email inválido",
      });
    }

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

    // ========== VALIDAÇÃO 4: barberId e serviceId são ObjectIds válidos ==========
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

    // ========== VALIDAÇÃO 5: Barbeiro existe e isActive ==========
    const barber = await Barber.findById(barberIdObj).select("-password");
    if (!barber || !barber.isActive) {
      return res.status(404).json({ error: "Barbeiro não encontrado" });
    }

    // ========== VALIDAÇÃO 6: Serviço existe e isActive ==========
    const service = await Service.findById(serviceIdObj);
    if (!service || !service.isActive) {
      return res.status(404).json({ error: "Serviço não encontrado" });
    }

    // ========== VALIDAÇÃO 7: Barbeiro trabalha naquele dia (workingHours da DB) ==========
    const reservationDateTime = new Date(reservationDate);
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const dayKey = days[reservationDateTime.getDay()];
    const todayHours = barber.workingHours[dayKey];

    if (!todayHours || !todayHours.start || !todayHours.end) {
      return res.status(400).json({ error: "Barbeiro não trabalha neste dia" });
    }

    // ========== VALIDAÇÃO 8: Serviço cabe no horário de fecho ==========
    // Parsing timeSlot para criar a hora de início da nova marcação
    const [slotHour, slotMinute] = timeSlot.split(":").map(Number);
    const newStart = new Date(reservationDateTime);
    newStart.setHours(slotHour, slotMinute, 0, 0);

    // Duração vem SEMPRE da DB - nunca inventar
    const newEnd = new Date(newStart.getTime() + service.duration * 60000);

    // Hora de fecho do barbeiro
    const [closeH, closeM] = todayHours.end.split(":").map(Number);
    const closeTime = new Date(newStart);
    closeTime.setHours(closeH, closeM, 0, 0);

    if (newEnd > closeTime) {
      return res.status(400).json({
        error: "O serviço excede o horário de funcionamento. Serviço termina às " +
          new Date(newEnd).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" }) +
          ", mas a barbearia fecha às " + todayHours.end
      });
    }

    // ========== VALIDAÇÃO 9: Barbeiro tem ausência? ==========
    const hasAbsence = barber.absences?.some((absence) => {
      const absDate = new Date(absence.date).toDateString();
      const resDate = reservationDateTime.toDateString();
      
      // Data não bate
      if (absDate !== resDate) {
        return false;
      }

      // Ausência de dia inteiro
      if (absence.type === "full") {
        return true;
      }

      // Ausência de manhã (antes das 12:00)
      if (absence.type === "morning") {
        return slotHour < 12;
      }

      // Ausência de tarde (a partir das 12:00)
      if (absence.type === "afternoon") {
        return slotHour >= 12;
      }

      // Ausência específica (overlap real com intervalo)
      if (absence.type === "specific" && absence.startTime && absence.endTime) {
        const [absStartH, absStartM] = absence.startTime.split(":").map(Number);
        const [absEndH, absEndM] = absence.endTime.split(":").map(Number);

        const absStart = new Date(reservationDateTime);
        absStart.setHours(absStartH, absStartM, 0, 0);
        
        const absEnd = new Date(reservationDateTime);
        absEnd.setHours(absEndH, absEndM, 0, 0);

        // Regra de overlap: A.start < B.end && B.start < A.end
        return newStart < absEnd && absStart < newEnd;
      }

      return false;
    });

    if (hasAbsence) {
      return res.status(409).json({
        error: "Barbeiro indisponível nesta data/hora. Marque outra data.",
      });
    }

    // ========== VALIDAÇÃO 10: Existe overlap com marcação existente? ==========
    const startOfDay = new Date(reservationDateTime);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(reservationDateTime);
    endOfDay.setHours(23, 59, 59, 999);

    // Trazer todas as reservas do dia (não canceladas)
    const existingReservations = await Reservation.find({
      barberId: barberIdObj,
      status: { $ne: "cancelled" },
      reservationDate: { $gte: startOfDay, $lte: endOfDay },
    }).populate("serviceId");

    // Verificar overlap real (duration da DB)
    const hasConflict = existingReservations.some((existing) => {
      const existStart = new Date(existing.reservationDate);
      const existEnd = new Date(
        existStart.getTime() + existing.serviceId.duration * 60000
      );

      // Regra de overlap: A.start < B.end && B.start < A.end
      return newStart < existEnd && existStart < newEnd;
    });

    if (hasConflict) {
      return res.status(409).json({ error: "Esta hora já está reservada" });
    }

    // ========== ✅ TUDO OK → Salvar reserva ==========
    const cancelToken = crypto.randomBytes(32).toString("hex");

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

    // Enviar SMS de confirmação (não bloqueia)
    try {
      const twilioClient = getTwilioClient();
      if (twilioClient && clientPhone) {
        await twilioClient.messages.create({
          body: `Olá ${clientName}! Sua reserva na barbearia 247 está confirmada para ${new Date(reservationDate).toLocaleDateString("pt-PT")} às ${timeSlot}. Serviço: ${service.name}. Obrigado!`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: clientPhone,
        });
      }
    } catch (smsError) {
      // Não falha se SMS não enviar
    }

    // Popular referências
    await reservation.populate("barberId serviceId");

    // Enviar emails de confirmação (não bloqueia resposta)
    Promise.all([
      sendBookingConfirmation({
        clientName,
        clientEmail,
        barberName: barber.name,
        serviceName: service.name,
        reservationDate,
        timeSlot,
        cancelToken,
      }),
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

// ========== FUNÇÕES DE AUSÊNCIA ==========

// Adicionar ausência ao barbeiro
exports.addAbsence = async (req, res) => {
  try {
    const { date, type, startTime, endTime, reason } = req.body;
    
    // Se vem de admin (com params), se é barber (usa seu own ID)
    let targetBarberId = req.params.barberId || req.user._id;

    // Authorization: apenas o barbeiro dele mesmo ou admin
    const currentUser = req.user; // Vem do authMiddleware
    if (currentUser.role !== "admin" && currentUser._id.toString() !== targetBarberId.toString()) {
      return res.status(403).json({ error: "Sem permissão" });
    }

    // Validações
    if (!date || !type) {
      return res.status(400).json({ error: "Data e tipo são obrigatórios" });
    }

    if (!["full", "morning", "afternoon", "specific"].includes(type)) {
      return res.status(400).json({ error: "Tipo de ausência inválido" });
    }

    if (type === "specific" && (!startTime || !endTime)) {
      return res.status(400).json({ error: "startTime e endTime obrigatórios para tipo 'specific'" });
    }

    // Buscar barbeiro
    const barber = await Barber.findById(targetBarberId);
    if (!barber) {
      return res.status(404).json({ error: "Barbeiro não encontrado" });
    }

    // Verificar se já tem ausência nesta data
    const existingAbsence = barber.absences?.find(
      (abs) => new Date(abs.date).toDateString() === new Date(date).toDateString()
    );

    if (existingAbsence) {
      return res.status(409).json({ error: "Já existe ausência nesta data" });
    }

    // Adicionar ausência
    const newAbsence = {
      date: new Date(date),
      type,
      startTime: type === "specific" ? startTime : null,
      endTime: type === "specific" ? endTime : null,
      reason: reason || null,
    };

    barber.absences = barber.absences || [];
    barber.absences.push(newAbsence);
    await barber.save();

    res.status(201).json({
      message: "Ausência adicionada",
      absence: newAbsence,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Remover ausência do barbeiro
exports.removeAbsence = async (req, res) => {
  try {
    const { barberId, absenceId } = req.params;

    // Authorization: apenas o barbeiro dele mesmo ou admin
    const currentUser = req.user;
    if (currentUser.role !== "admin" && currentUser._id.toString() !== barberId) {
      return res.status(403).json({ error: "Sem permissão" });
    }

    // Buscar barbeiro
    const barber = await Barber.findById(barberId);
    if (!barber) {
      return res.status(404).json({ error: "Barbeiro não encontrado" });
    }

    // Converter absenceId para ObjectId para comparação
    let absenceIdObj;
    try {
      if (mongoose.Types.ObjectId.isValid(absenceId)) {
        absenceIdObj = new mongoose.Types.ObjectId(absenceId);
      } else {
        return res.status(400).json({ error: "ID de ausência inválido" });
      }
    } catch (err) {
      return res.status(400).json({ error: "Erro ao processar ID: " + err.message });
    }

    // Remover ausência
    const absenceIndex = barber.absences?.findIndex(
      (abs) => abs._id?.toString() === absenceIdObj.toString()
    );

    if (absenceIndex === undefined || absenceIndex === -1) {
      return res.status(404).json({ error: "Ausência não encontrada" });
    }

    barber.absences.splice(absenceIndex, 1);
    await barber.save();

    res.json({
      message: "Ausência removida com sucesso",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Listar ausências do barbeiro (público - sem validação extra)
exports.getAbsences = async (req, res) => {
  try {
    const { barberId } = req.params;

    const barber = await Barber.findById(barberId).select("absences name");
    if (!barber) {
      return res.status(404).json({ error: "Barbeiro não encontrado" });
    }

    res.json({
      barberId,
      barberName: barber.name,
      absences: barber.absences || [],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ========== CONTROLO DE ACESSO PARA RESERVAS ==========

// Para dashboard: barber vê apenas dele, admin vê todos
exports.getReservationsForDashboard = async (req, res) => {
  try {
    const currentUser = req.user; // Vem do authMiddleware
    const { month, year, barberId: queryBarberId } = req.query;

    let query = {};

    // Barber não-admin: vê apenas suas reservas
    if (currentUser.role !== "admin") {
      query.barberId = currentUser._id;
    } else if (queryBarberId) {
      // Admin: pode filtrar por barbeiro específico
      if (mongoose.Types.ObjectId.isValid(queryBarberId)) {
        query.barberId = new mongoose.Types.ObjectId(queryBarberId);
      }
    }

    // Filtro de mês/ano (se fornecido)
    if (month && year) {
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);

      if (monthNum < 1 || monthNum > 12 || yearNum < 2000) {
        return res.status(400).json({ error: "Mês/ano inválidos" });
      }

      const startDate = new Date(yearNum, monthNum - 1, 1);
      const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);

      query.reservationDate = { $gte: startDate, $lte: endDate };
    }

    const reservations = await Reservation.find(query)
      .populate("barberId", "name")
      .populate("serviceId", "name price duration")
      .sort({ reservationDate: 1, timeSlot: 1 });

    res.json({
      total: reservations.length,
      reservations,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
