const mongoose = require("mongoose");
const Reservation = require("../models/Reservation");
const Barber = require("../models/Barber");
const Service = require("../models/Service");
const SiteSettings = require("../models/SiteSettings");
const twilio = require("twilio");
const crypto = require("crypto");
const {
  sendBookingConfirmation,
  sendAdminNotification,
  sendBarberNotification,
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

const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const DAY_LABELS_PT = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

function normalizeText(value) {
  return (value || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}

function toMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return null;
  const match = timeStr.match(/^([0-1][0-9]|2[0-3]):([0-5][0-9])$/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function toHHmm(totalMinutes) {
  const h = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const m = String(totalMinutes % 60).padStart(2, "0");
  return `${h}:${m}`;
}

function parseRangeFromValue(value) {
  const text = normalizeText(value);
  if (!text || text.includes("ENCERRADO") || text.includes("FECHADO")) {
    return null;
  }
  const match = text.match(/(\d{1,2}:\d{2})\s*[\u2013\-]\s*(\d{1,2}:\d{2})/);
  if (!match) return null;
  const start = match[1].padStart(5, "0");
  const end = match[2].padStart(5, "0");
  if (toMinutes(start) === null || toMinutes(end) === null) return null;
  return { start, end };
}

function parseSiteHoursRows(hoursRows) {
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

  const result = {};
  (hoursRows || []).forEach((row) => {
    const label = normalizeText(row.label || "").replace(/\s+/g, " ");
    if (!label) return;

    const days = [];
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
        days.push(dayMap[key]);
      }
    }

    const range = parseRangeFromValue(row.value || "");
    days.forEach((dayIndex) => {
      result[DAY_KEYS[dayIndex]] = range;
    });
  });

  return result;
}

function normalizeWorkingHours(hours) {
  if (!hours || !hours.start || !hours.end) return null;
  if (hours.start === "closed" || hours.end === "closed") return null;
  if (toMinutes(hours.start) === null || toMinutes(hours.end) === null)
    return null;
  return { start: hours.start, end: hours.end };
}

function getRestrictiveHours(globalHours, barberHours) {
  if (globalHours && barberHours) {
    const openMinutes = Math.max(
      toMinutes(globalHours.start),
      toMinutes(barberHours.start),
    );
    const closeMinutes = Math.min(
      toMinutes(globalHours.end),
      toMinutes(barberHours.end),
    );
    if (closeMinutes <= openMinutes) return null;
    return { start: toHHmm(openMinutes), end: toHHmm(closeMinutes) };
  }
  return globalHours || barberHours || null;
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

    // ========== VALIDAÇÃO 7: Horários de funcionamento ==========
    const reservationDateTime = new Date(reservationDate);
    const dayIndex = reservationDateTime.getDay();
    const dayKey = DAY_KEYS[dayIndex];

    // Fonte principal: SiteSettings (horário da barbearia)
    const siteSettings = await SiteSettings.findOne();
    const parsedSiteHours = parseSiteHoursRows(siteSettings?.hoursRows || []);
    const globalHours = normalizeWorkingHours(parsedSiteHours[dayKey]);

    // Fallback/Restrição adicional: horário específico do barbeiro
    const barberHours = normalizeWorkingHours(barber.workingHours?.[dayKey]);

    // Regra: se ambos existem, usa o mais restritivo
    const todayHours = getRestrictiveHours(globalHours, barberHours);

    if (!todayHours || !todayHours.start || !todayHours.end) {
      return res.status(400).json({
        error: `Horários de funcionamento não definidos para ${
          DAY_LABELS_PT[dayIndex]
        }`,
      });
    }

    // ========== VALIDAÇÃO 8: Serviço cabe no horário de fecho ==========
    // Parsing timeSlot para criar a hora de início da nova marcação
    const [slotHour, slotMinute] = timeSlot.split(":").map(Number);
    const newStart = new Date(reservationDateTime);
    newStart.setHours(slotHour, slotMinute, 0, 0);

    // Duração vem SEMPRE da DB - nunca inventar
    const newEnd = new Date(newStart.getTime() + service.duration * 60000);

    // Hora de abertura/fecho efetiva (barbearia + barbeiro, mais restritiva)
    const [openH, openM] = todayHours.start.split(":").map(Number);
    const openTime = new Date(newStart);
    openTime.setHours(openH, openM, 0, 0);

    const [closeH, closeM] = todayHours.end.split(":").map(Number);
    const closeTime = new Date(newStart);
    closeTime.setHours(closeH, closeM, 0, 0);

    if (newStart < openTime) {
      return res.status(400).json({
        error:
          "A marcação está fora do horário de funcionamento. A barbearia abre às " +
          todayHours.start,
      });
    }

    if (newEnd > closeTime) {
      return res.status(400).json({
        error:
          "O serviço excede o horário de funcionamento. Serviço termina às " +
          new Date(newEnd).toLocaleTimeString("pt-PT", {
            hour: "2-digit",
            minute: "2-digit",
          }) +
          ", mas a barbearia fecha às " +
          todayHours.end,
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
        existStart.getTime() + existing.serviceId.duration * 60000,
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
    const emailPromises = [
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
    ];

    // Enviar notificação ao barbeiro se tiver email pessoal configurado
    if (barber.notificationEmail) {
      emailPromises.push(
        sendBarberNotification({
          barberEmail: barber.notificationEmail,
          barberName: barber.name,
          clientName,
          clientPhone,
          serviceName: service.name,
          reservationDate,
          timeSlot,
        }),
      );
    }

    // Enviar notificações push (background, não bloqueia resposta)
    Promise.all(emailPromises).catch((emailError) => {
      console.error("Erro ao enviar emails:", emailError);
    });

    // Enviar push notifications em background (graceful fallback)
    sendPushNotifications(
      barber,
      clientName,
      service.name,
      reservationDate,
      timeSlot,
    ).catch((pushError) => {
      console.warn("Erro ao enviar push notifications:", pushError);
      // Não falha a reserva se push falhar
    });

    res.status(201).json({
      message: "Reserva criada com sucesso!",
      reservation,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Função auxiliar para enviar push notifications
 * Envia notificações para todos os dispositivos inscritos do barbeiro
 */
async function sendPushNotifications(
  barber,
  clientName,
  serviceName,
  reservationDate,
  timeSlot,
) {
  try {
    const webpush = require("web-push");
    const PushSubscription = require("../models/PushSubscription");

    // Configurar VAPID details
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || "mailto:admin@247barbearia.pt",
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY,
    );

    const dateObj = new Date(reservationDate);
    const dateStr = dateObj.toLocaleDateString("pt-PT", {
      weekday: "short",
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });

    const notificationTitle = "🔔 Nova Marcação!";
    const notificationBody = `${clientName} - ${serviceName} às ${timeSlot}`;
    const notificationTag = `reservation-${barber._id}`;

    const notificationPayload = {
      title: notificationTitle,
      body: notificationBody,
      icon: process.env.NOTIFICATION_ICON || "/images/logo.png",
      badge: "/images/badge-192x192.png",
      tag: notificationTag,
      data: {
        dateCreated: new Date().getTime(),
        dateTime: `${dateStr} ${timeSlot}`,
        clientName: clientName,
        serviceName: serviceName,
        barberId: barber._id.toString(),
      },
    };

    // Buscar subscrições ativas do barbeiro
    const subscriptions = await PushSubscription.find({
      $or: [
        { userId: barber._id, isActive: true },
        { isPublic: true, isActive: true }, // Also send to public app users
      ],
    });

    if (subscriptions.length === 0) {
      console.log(
        `⚠️ Sem subscrições push ativas para barbeiro ${barber.name}`,
      );
      return { success: true, sent: 0 };
    }

    let successCount = 0;
    let failureCount = 0;

    // Enviar para cada subscrição
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          sub.subscription,
          JSON.stringify(notificationPayload),
        );
        successCount++;
        console.log(
          `✅ Push enviada com sucesso para ${sub.deviceType || "desktop"} (${sub._id})`,
        );
      } catch (error) {
        failureCount++;
        console.warn(
          `⚠️ Erro ao enviar push para ${sub._id}:`,
          error.statusCode || error.message,
        );

        // Se subscription expirou (410), marcar como inativa
        if (error.statusCode === 410) {
          sub.isActive = false;
          await sub.save();
          console.log(`🗑️ Subscription ${sub._id} marcada como inativa`);
        }
      }
    }

    console.log(
      `📢 PUSH NOTIFICATIONS: ${notificationTitle} (${successCount}/${subscriptions.length} entregues)`,
    );
    console.log(`   Cliente: ${clientName}`);
    console.log(`   Serviço: ${serviceName}`);
    console.log(`   Data/Hora: ${dateStr} ${timeSlot}`);
    console.log(`   Barbeiro: ${barber.name}`);

    return {
      success: successCount > 0,
      sent: successCount,
      failed: failureCount,
      total: subscriptions.length,
    };
  } catch (error) {
    console.error("❌ Erro ao enviar push notifications:", error);
    // Não lançar erro - fallback gracioso
    return { success: false, error: error.message };
  }
}

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
    if (
      currentUser.role !== "admin" &&
      currentUser._id.toString() !== targetBarberId.toString()
    ) {
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
      return res.status(400).json({
        error: "startTime e endTime obrigatórios para tipo 'specific'",
      });
    }

    // Buscar barbeiro
    const barber = await Barber.findById(targetBarberId);
    if (!barber) {
      return res.status(404).json({ error: "Barbeiro não encontrado" });
    }

    // Verificar se já tem ausência nesta data
    const existingAbsence = barber.absences?.find(
      (abs) =>
        new Date(abs.date).toDateString() === new Date(date).toDateString(),
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
    if (
      currentUser.role !== "admin" &&
      currentUser._id.toString() !== barberId
    ) {
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
      return res
        .status(400)
        .json({ error: "Erro ao processar ID: " + err.message });
    }

    // Remover ausência
    const absenceIndex = barber.absences?.findIndex(
      (abs) => abs._id?.toString() === absenceIdObj.toString(),
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
