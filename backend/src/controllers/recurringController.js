const mongoose = require("mongoose");
const Barber = require("../models/Barber");
const Service = require("../models/Service");
const RecurringReservationRule = require("../models/RecurringReservationRule");
const {
  syncRecurringRuleReservations,
  clearFutureRecurringReservations,
  getFrequencyStepLabel,
} = require("../services/recurringReservationService");

function normalizeDateInput(dateInput) {
  if (!dateInput) return null;
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return null;
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

function validateTimeSlot(timeSlot) {
  return /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(String(timeSlot || ""));
}

function validateEmail(email) {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email));
}

function validatePhone(phone) {
  if (!phone) return true;
  return /^(\+351\s?)?[29]\d{8}$/.test(String(phone).replace(/\s/g, ""));
}

function isAuthorizedForBarber(currentUser, barberId) {
  if (!currentUser) return false;
  if (currentUser.role === "admin") return true;
  return String(currentUser._id) === String(barberId);
}

async function loadBarberAndService(barberId, serviceId) {
  const barber = await Barber.findById(barberId).select("-password");
  if (!barber || !barber.isActive) {
    return { barber: null, service: null };
  }

  const service = await Service.findById(serviceId);
  if (!service || !service.isActive) {
    return { barber, service: null };
  }

  return { barber, service };
}

function buildRuleResponse(rule) {
  const plain = rule.toObject ? rule.toObject() : { ...rule };
  return {
    ...plain,
    frequencyLabel: getFrequencyStepLabel(rule.frequency),
  };
}

exports.getRecurringRules = async (req, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) {
      return res.status(401).json({ error: "Utilizador não autenticado" });
    }

    const { barberId: queryBarberId } = req.query;
    const filter = {};

    if (currentUser.role === "barber") {
      filter.barberId = currentUser._id;
      if (queryBarberId && String(queryBarberId) !== String(currentUser._id)) {
        return res.status(403).json({ error: "Sem permissão" });
      }
    } else if (queryBarberId) {
      if (!mongoose.Types.ObjectId.isValid(queryBarberId)) {
        return res.status(400).json({ error: "Barbeiro inválido" });
      }
      filter.barberId = new mongoose.Types.ObjectId(queryBarberId);
    }

    const rules = await RecurringReservationRule.find(filter)
      .populate("barberId", "name")
      .populate("serviceId", "name price duration")
      .sort({ createdAt: -1 });

    res.json(rules.map(buildRuleResponse));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createRecurringRule = async (req, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) {
      return res.status(401).json({ error: "Utilizador não autenticado" });
    }

    const {
      barberId: bodyBarberId,
      serviceId,
      clientName,
      clientPhone,
      clientEmail,
      startDate,
      reservationDate,
      timeSlot,
      frequency,
      notes,
    } = req.body;

    const barberId =
      currentUser.role === "barber"
        ? currentUser._id
        : bodyBarberId || currentUser._id;

    if (!isAuthorizedForBarber(currentUser, barberId)) {
      return res.status(403).json({ error: "Sem permissão" });
    }

    if (!mongoose.Types.ObjectId.isValid(barberId)) {
      return res.status(400).json({ error: "Barbeiro inválido" });
    }

    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({ error: "Serviço inválido" });
    }

    if (!barberId || !serviceId || !clientName || !timeSlot || !frequency) {
      return res.status(400).json({ error: "Dados obrigatórios faltando" });
    }

    const normalizedStartDate = normalizeDateInput(
      startDate || reservationDate,
    );
    if (!normalizedStartDate) {
      return res.status(400).json({ error: "Data inicial inválida" });
    }

    if (!validateTimeSlot(timeSlot)) {
      return res.status(400).json({ error: "Hora inválida" });
    }

    if (!["weekly", "biweekly", "monthly"].includes(frequency)) {
      return res.status(400).json({ error: "Frequência inválida" });
    }

    if (!validateEmail(clientEmail)) {
      return res.status(400).json({ error: "Email inválido" });
    }

    if (!validatePhone(clientPhone)) {
      return res.status(400).json({ error: "Telefone inválido" });
    }

    const barberIdObj = new mongoose.Types.ObjectId(barberId);
    const serviceIdObj = new mongoose.Types.ObjectId(serviceId);
    const { barber, service } = await loadBarberAndService(
      barberIdObj,
      serviceIdObj,
    );

    if (!barber) {
      return res.status(404).json({ error: "Barbeiro não encontrado" });
    }
    if (!service) {
      return res.status(404).json({ error: "Serviço não encontrado" });
    }

    const rule = await RecurringReservationRule.create({
      barberId: barberIdObj,
      serviceId: serviceIdObj,
      clientName,
      clientPhone: clientPhone || "",
      clientEmail: clientEmail || "",
      startDate: normalizedStartDate,
      timeSlot,
      frequency,
      notes: notes || "",
      isActive: true,
      excludedDates: [],
      createdBy: currentUser._id,
    });

    const generation = await syncRecurringRuleReservations(rule, {
      replaceFuture: true,
      fromDate: new Date(),
    });

    const populatedRule = await RecurringReservationRule.findById(rule._id)
      .populate("barberId", "name")
      .populate("serviceId", "name price duration");

    res.status(201).json({
      message: "Regra recorrente criada com sucesso",
      rule: buildRuleResponse(populatedRule),
      generation,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateRecurringRule = async (req, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) {
      return res.status(401).json({ error: "Utilizador não autenticado" });
    }

    const { ruleId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(ruleId)) {
      return res.status(400).json({ error: "Regra inválida" });
    }

    const rule = await RecurringReservationRule.findById(ruleId);
    if (!rule) {
      return res.status(404).json({ error: "Regra não encontrada" });
    }

    if (!isAuthorizedForBarber(currentUser, rule.barberId)) {
      return res.status(403).json({ error: "Sem permissão" });
    }

    const {
      barberId: bodyBarberId,
      serviceId,
      clientName,
      clientPhone,
      clientEmail,
      startDate,
      reservationDate,
      timeSlot,
      frequency,
      notes,
    } = req.body;

    const nextBarberId =
      currentUser.role === "barber"
        ? rule.barberId
        : bodyBarberId || rule.barberId;

    if (!isAuthorizedForBarber(currentUser, nextBarberId)) {
      return res.status(403).json({ error: "Sem permissão" });
    }

    const normalizedStartDate =
      startDate || reservationDate
        ? normalizeDateInput(startDate || reservationDate)
        : null;

    if (normalizedStartDate === null && (startDate || reservationDate)) {
      return res.status(400).json({ error: "Data inicial inválida" });
    }

    if (timeSlot !== undefined && !validateTimeSlot(timeSlot)) {
      return res.status(400).json({ error: "Hora inválida" });
    }

    if (
      frequency !== undefined &&
      !["weekly", "biweekly", "monthly"].includes(frequency)
    ) {
      return res.status(400).json({ error: "Frequência inválida" });
    }

    if (clientEmail !== undefined && !validateEmail(clientEmail)) {
      return res.status(400).json({ error: "Email inválido" });
    }

    if (clientPhone !== undefined && !validatePhone(clientPhone)) {
      return res.status(400).json({ error: "Telefone inválido" });
    }

    if (bodyBarberId && currentUser.role === "admin") {
      if (!mongoose.Types.ObjectId.isValid(bodyBarberId)) {
        return res.status(400).json({ error: "Barbeiro inválido" });
      }
      const barberIdObj = new mongoose.Types.ObjectId(bodyBarberId);
      const barber = await Barber.findById(barberIdObj).select("-password");
      if (!barber || !barber.isActive) {
        return res.status(404).json({ error: "Barbeiro não encontrado" });
      }
      rule.barberId = barberIdObj;
    }

    if (serviceId) {
      if (!mongoose.Types.ObjectId.isValid(serviceId)) {
        return res.status(400).json({ error: "Serviço inválido" });
      }
      const service = await Service.findById(serviceId);
      if (!service || !service.isActive) {
        return res.status(404).json({ error: "Serviço não encontrado" });
      }
      rule.serviceId = new mongoose.Types.ObjectId(serviceId);
    }

    if (clientName !== undefined) rule.clientName = clientName;
    if (clientPhone !== undefined) rule.clientPhone = clientPhone || "";
    if (clientEmail !== undefined) rule.clientEmail = clientEmail || "";
    if (normalizedStartDate) rule.startDate = normalizedStartDate;
    if (timeSlot !== undefined) rule.timeSlot = timeSlot;
    if (frequency !== undefined) rule.frequency = frequency;
    if (notes !== undefined) rule.notes = notes || "";

    await rule.save();

    const generation = await syncRecurringRuleReservations(rule, {
      replaceFuture: true,
      fromDate: new Date(),
    });

    const populatedRule = await RecurringReservationRule.findById(rule._id)
      .populate("barberId", "name")
      .populate("serviceId", "name price duration");

    res.json({
      message: "Regra recorrente atualizada com sucesso",
      rule: buildRuleResponse(populatedRule),
      generation,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.toggleRecurringRule = async (req, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) {
      return res.status(401).json({ error: "Utilizador não autenticado" });
    }

    const { ruleId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(ruleId)) {
      return res.status(400).json({ error: "Regra inválida" });
    }

    const rule = await RecurringReservationRule.findById(ruleId);
    if (!rule) {
      return res.status(404).json({ error: "Regra não encontrada" });
    }

    if (!isAuthorizedForBarber(currentUser, rule.barberId)) {
      return res.status(403).json({ error: "Sem permissão" });
    }

    rule.isActive = !rule.isActive;
    await rule.save();

    let generation = { created: 0, skipped: 0, deleted: 0, existing: 0 };

    if (rule.isActive) {
      generation = await syncRecurringRuleReservations(rule, {
        replaceFuture: true,
        fromDate: new Date(),
      });
    } else {
      generation = await clearFutureRecurringReservations(rule._id, new Date());
    }

    const populatedRule = await RecurringReservationRule.findById(rule._id)
      .populate("barberId", "name")
      .populate("serviceId", "name price duration");

    res.json({
      message: rule.isActive ? "Regra ativada" : "Regra desativada",
      rule: buildRuleResponse(populatedRule),
      generation,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteRecurringRule = async (req, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) {
      return res.status(401).json({ error: "Utilizador não autenticado" });
    }

    const { ruleId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(ruleId)) {
      return res.status(400).json({ error: "Regra inválida" });
    }

    const rule = await RecurringReservationRule.findById(ruleId);
    if (!rule) {
      return res.status(404).json({ error: "Regra não encontrada" });
    }

    if (!isAuthorizedForBarber(currentUser, rule.barberId)) {
      return res.status(403).json({ error: "Sem permissão" });
    }

    const generation = await clearFutureRecurringReservations(
      rule._id,
      new Date(),
    );
    await RecurringReservationRule.findByIdAndDelete(rule._id);

    res.json({
      message: "Regra eliminada com sucesso",
      generation,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
