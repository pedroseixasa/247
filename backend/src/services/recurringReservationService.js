const Barber = require("../models/Barber");
const Service = require("../models/Service");
const SiteSettings = require("../models/SiteSettings");
const Reservation = require("../models/Reservation");
const RecurringReservationRule = require("../models/RecurringReservationRule");

const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const LOOKAHEAD_MONTHS = Number(process.env.RECURRING_LOOKAHEAD_MONTHS || 12);

function formatDateKeyUtc(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeUtcDateOnly(dateInput) {
  const date =
    dateInput instanceof Date ? new Date(dateInput) : new Date(dateInput);
  if (Number.isNaN(date.getTime())) return null;
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

function parseReservationDateInput(dateInput) {
  if (!dateInput) return null;

  const rawValue =
    dateInput instanceof Date
      ? dateInput.toISOString()
      : String(dateInput).trim();

  if (!rawValue) return null;

  const datePart = rawValue.includes("T") ? rawValue.split("T")[0] : rawValue;
  const parts = datePart.split("-");
  if (parts.length !== 3) return null;

  const [year, month, day] = parts.map(Number);
  if ([year, month, day].some((value) => Number.isNaN(value))) return null;

  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

function toMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return null;
  const match = timeStr.match(/^([0-1][0-9]|2[0-3]):([0-5][0-9])$/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function parseRangeFromValue(value) {
  const text = (value || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
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
    const label = (row.label || "")
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .replace(/\s+/g, " ")
      .trim();
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
  if (toMinutes(hours.start) === null || toMinutes(hours.end) === null) {
    return null;
  }
  return { start: hours.start, end: hours.end };
}

function getEffectiveHours(globalHours, barberHours) {
  if (barberHours && barberHours.start && barberHours.end) {
    return barberHours;
  }
  return globalHours || null;
}

function buildDateTimeUtc(dateInput, timeSlot) {
  const date = normalizeUtcDateOnly(dateInput);
  if (!date || !timeSlot) return null;

  const [hour, minute] = String(timeSlot).split(":").map(Number);
  if ([hour, minute].some((value) => Number.isNaN(value))) return null;

  const dateTime = new Date(date);
  dateTime.setUTCHours(hour, minute, 0, 0);
  return dateTime;
}

function addDaysUtc(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function addMonthsPreservingDayUtc(anchorDate, monthsToAdd) {
  const anchorDay = anchorDate.getUTCDate();
  const base = new Date(
    Date.UTC(
      anchorDate.getUTCFullYear(),
      anchorDate.getUTCMonth() + monthsToAdd,
      1,
      0,
      0,
      0,
      0,
    ),
  );
  const daysInTargetMonth = new Date(
    Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0),
  ).getUTCDate();
  const safeDay = Math.min(anchorDay, daysInTargetMonth);
  return new Date(
    Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), safeDay, 0, 0, 0, 0),
  );
}

function getOccurrenceDates(rule, fromDate, horizonDate) {
  const anchor = normalizeUtcDateOnly(rule.startDate);
  const fromDay = normalizeUtcDateOnly(fromDate);
  const horizonDay = normalizeUtcDateOnly(horizonDate);

  if (!anchor || !fromDay || !horizonDay) return [];

  const occurrences = [];

  if (rule.frequency === "monthly") {
    let monthOffset = 0;
    let current = addMonthsPreservingDayUtc(anchor, monthOffset);

    while (current < fromDay) {
      monthOffset += 1;
      current = addMonthsPreservingDayUtc(anchor, monthOffset);
    }

    while (current <= horizonDay) {
      occurrences.push(new Date(current));
      monthOffset += 1;
      current = addMonthsPreservingDayUtc(anchor, monthOffset);
    }

    return occurrences;
  }

  const intervalDays = rule.frequency === "biweekly" ? 14 : 7;
  let current = new Date(anchor);

  while (current < fromDay) {
    current = addDaysUtc(current, intervalDays);
  }

  while (current <= horizonDay) {
    occurrences.push(new Date(current));
    current = addDaysUtc(current, intervalDays);
  }

  return occurrences;
}

function getFrequencyStepLabel(frequency) {
  if (frequency === "biweekly") return "quinzenal";
  if (frequency === "monthly") return "mensal";
  return "semanal";
}

async function loadScheduleContext(barberId) {
  const barber = await Barber.findById(barberId).select("-password");
  if (!barber || !barber.isActive) {
    return { barber: null, service: null, siteSettings: null };
  }

  const siteSettings = await SiteSettings.findOne();
  return { barber, siteSettings };
}

function getLunchWindowMinutes(barber) {
  if (
    barber?.lunchBreak?.enabled !== false &&
    barber?.lunchBreak?.startTime &&
    barber?.lunchBreak?.endTime
  ) {
    const [startH, startM] = barber.lunchBreak.startTime.split(":").map(Number);
    const [endH, endM] = barber.lunchBreak.endTime.split(":").map(Number);
    if ([startH, startM, endH, endM].some((value) => Number.isNaN(value))) {
      return null;
    }
    return {
      start: startH * 60 + startM,
      end: endH * 60 + endM,
    };
  }

  return null;
}

function getTimeSlotMinutes(timeSlot) {
  const [hour, minute] = String(timeSlot || "")
    .split(":")
    .map(Number);
  if ([hour, minute].some((value) => Number.isNaN(value))) return null;
  return hour * 60 + minute;
}

function buildSlotWindow(date, timeSlot, durationMinutes) {
  const start = buildDateTimeUtc(date, timeSlot);
  if (!start) return null;
  const end = new Date(start.getTime() + durationMinutes * 60000);
  return { start, end };
}

function overlaps(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

function isOccurrenceAllowed({
  barber,
  service,
  occurrenceDate,
  timeSlot,
  siteSettings,
  existingReservations,
  excludedDates,
}) {
  const dayIndex = occurrenceDate.getUTCDay();
  const dayKey = DAY_KEYS[dayIndex];
  const siteHours = parseSiteHoursRows(siteSettings?.hoursRows || []);
  const globalHours = normalizeWorkingHours(siteHours[dayKey]);
  const barberHours = normalizeWorkingHours(barber.workingHours?.[dayKey]);
  const todayHours = getEffectiveHours(globalHours, barberHours);

  if (!todayHours || !todayHours.start || !todayHours.end) {
    return { allowed: false, reason: "closed" };
  }

  const slotWindow = buildSlotWindow(
    occurrenceDate,
    timeSlot,
    Number(service.duration || 30),
  );
  if (!slotWindow) {
    return { allowed: false, reason: "invalid-time" };
  }

  const [openH, openM] = todayHours.start.split(":").map(Number);
  const [closeH, closeM] = todayHours.end.split(":").map(Number);
  const openTime = new Date(slotWindow.start);
  openTime.setUTCHours(openH, openM, 0, 0);
  const closeTime = new Date(slotWindow.start);
  closeTime.setUTCHours(closeH, closeM, 0, 0);

  if (slotWindow.start < openTime || slotWindow.end > closeTime) {
    return { allowed: false, reason: "outside-hours" };
  }

  const lunch = getLunchWindowMinutes(barber);
  if (lunch) {
    const slotStartMinutes = getTimeSlotMinutes(timeSlot);
    const slotEndMinutes = slotStartMinutes + Number(service.duration || 30);
    if (overlaps(slotStartMinutes, slotEndMinutes, lunch.start, lunch.end)) {
      return { allowed: false, reason: "lunch" };
    }
  }

  const occurrenceKey = formatDateKeyUtc(occurrenceDate);
  if (excludedDates.has(occurrenceKey)) {
    return { allowed: false, reason: "excluded" };
  }

  const hasAbsence = (barber.absences || []).some((absence) => {
    const absenceKey = formatDateKeyUtc(new Date(absence.date));
    if (absenceKey !== occurrenceKey) {
      return false;
    }

    if (absence.type === "full") {
      return true;
    }

    const slotStartMinutes = getTimeSlotMinutes(timeSlot);
    const slotEndMinutes = slotStartMinutes + Number(service.duration || 30);

    if (absence.type === "morning") {
      return slotStartMinutes < 12 * 60;
    }

    if (absence.type === "afternoon") {
      return slotStartMinutes >= 12 * 60;
    }

    if (absence.type === "specific" && absence.startTime && absence.endTime) {
      const [absStartH, absStartM] = absence.startTime.split(":").map(Number);
      const [absEndH, absEndM] = absence.endTime.split(":").map(Number);
      if (
        [absStartH, absStartM, absEndH, absEndM].some((value) =>
          Number.isNaN(value),
        )
      ) {
        return false;
      }
      const absStart = absStartH * 60 + absStartM;
      const absEnd = absEndH * 60 + absEndM;
      return overlaps(slotStartMinutes, slotEndMinutes, absStart, absEnd);
    }

    return false;
  });

  if (hasAbsence) {
    return { allowed: false, reason: "absence" };
  }

  const slotWindowStart = slotWindow.start;
  const slotWindowEnd = slotWindow.end;

  const hasConflict = (existingReservations || []).some((reservation) => {
    if (
      String(reservation.barberId?._id || reservation.barberId) !==
      String(barber._id)
    ) {
      return false;
    }

    const existingDate = normalizeUtcDateOnly(reservation.reservationDate);
    if (!existingDate) return false;

    const existingWindow = buildSlotWindow(
      existingDate,
      reservation.timeSlot,
      Number(reservation.serviceId?.duration || 30),
    );
    if (!existingWindow) return false;

    return overlaps(
      slotWindowStart,
      slotWindowEnd,
      existingWindow.start,
      existingWindow.end,
    );
  });

  if (hasConflict) {
    return { allowed: false, reason: "conflict" };
  }

  return { allowed: true };
}

async function clearFutureRecurringReservations(ruleId, fromDate) {
  const cutoff = fromDate ? new Date(fromDate) : new Date();
  if (Number.isNaN(cutoff.getTime())) {
    return { deletedCount: 0 };
  }

  const candidateReservations = await Reservation.find({
    recurringRuleId: ruleId,
    isRecurring: true,
    reservationDate: { $gte: normalizeUtcDateOnly(cutoff) },
  }).populate("serviceId", "duration");

  const reservationIdsToDelete = candidateReservations
    .filter((reservation) => {
      const slotWindow = buildSlotWindow(
        reservation.reservationDate,
        reservation.timeSlot,
        Number(reservation.serviceId?.duration || 30),
      );
      return slotWindow && slotWindow.start >= cutoff;
    })
    .map((reservation) => reservation._id);

  if (reservationIdsToDelete.length === 0) {
    return { deletedCount: 0 };
  }

  const result = await Reservation.deleteMany({
    _id: { $in: reservationIdsToDelete },
  });

  return { deletedCount: result.deletedCount || 0 };
}

async function syncRecurringRuleReservations(ruleOrId, options = {}) {
  const now = options.now ? new Date(options.now) : new Date();
  const fromDate = options.fromDate
    ? new Date(options.fromDate)
    : new Date(now);
  const horizonMonths =
    Number.isInteger(options.horizonMonths) && options.horizonMonths > 0
      ? options.horizonMonths
      : LOOKAHEAD_MONTHS;

  const rule =
    typeof ruleOrId === "object" && ruleOrId !== null
      ? ruleOrId
      : await RecurringReservationRule.findById(ruleOrId);

  if (!rule) {
    return {
      created: 0,
      skipped: 0,
      deleted: 0,
      existing: 0,
      ruleId: ruleOrId,
      active: false,
    };
  }

  if (!rule.isActive) {
    return {
      created: 0,
      skipped: 0,
      deleted: 0,
      existing: 0,
      ruleId: rule._id,
      active: false,
    };
  }

  const { barber } = await loadScheduleContext(rule.barberId);
  if (!barber) {
    return {
      created: 0,
      skipped: 0,
      deleted: 0,
      existing: 0,
      ruleId: rule._id,
      active: true,
      reason: "barber-not-found",
    };
  }

  const service = await Service.findById(rule.serviceId);
  if (!service || !service.isActive) {
    return {
      created: 0,
      skipped: 0,
      deleted: 0,
      existing: 0,
      ruleId: rule._id,
      active: true,
      reason: "service-not-found",
    };
  }

  const siteSettings = await SiteSettings.findOne();

  const fromDay = normalizeUtcDateOnly(fromDate || now);
  const horizonDate = addMonthsPreservingDayUtc(
    normalizeUtcDateOnly(now),
    horizonMonths,
  );
  horizonDate.setUTCHours(23, 59, 59, 999);

  if (options.replaceFuture) {
    await clearFutureRecurringReservations(rule._id, now);
  }

  const excludedDates = new Set((rule.excludedDates || []).map(String));
  const existingReservations = await Reservation.find({
    barberId: rule.barberId,
    reservationDate: { $gte: fromDay, $lte: horizonDate },
    status: { $ne: "cancelled" },
  })
    .populate("serviceId", "duration name price")
    .lean();

  const occurrences = getOccurrenceDates(rule, fromDay, horizonDate);
  const createdReservations = [];
  let created = 0;
  let skipped = 0;
  let existing = 0;

  for (const occurrenceDate of occurrences) {
    const occurrenceKey = formatDateKeyUtc(occurrenceDate);
    if (excludedDates.has(occurrenceKey)) {
      skipped += 1;
      continue;
    }

    const candidateWindow = buildSlotWindow(
      occurrenceDate,
      rule.timeSlot,
      Number(service.duration || 30),
    );
    if (!candidateWindow || candidateWindow.start <= now) {
      skipped += 1;
      continue;
    }

    const validation = isOccurrenceAllowed({
      barber,
      service,
      occurrenceDate,
      timeSlot: rule.timeSlot,
      siteSettings,
      existingReservations: [...existingReservations, ...createdReservations],
      excludedDates,
    });

    if (!validation.allowed) {
      skipped += 1;
      continue;
    }

    const exactExisting = existingReservations.find((reservation) => {
      const reservationDate = normalizeUtcDateOnly(reservation.reservationDate);
      if (!reservationDate) return false;

      return (
        formatDateKeyUtc(reservationDate) === occurrenceKey &&
        reservation.timeSlot === rule.timeSlot &&
        String(reservation.barberId?._id || reservation.barberId) ===
          String(rule.barberId)
      );
    });

    if (exactExisting) {
      existing += 1;
      continue;
    }

    const reservation = await Reservation.create({
      barberId: rule.barberId,
      serviceId: rule.serviceId,
      clientName: rule.clientName,
      clientPhone: rule.clientPhone || "",
      clientEmail: rule.clientEmail || "",
      reservationDate: normalizeUtcDateOnly(occurrenceDate),
      timeSlot: rule.timeSlot,
      notes: rule.notes || "",
      status: "confirmed",
      isManual: false,
      isRecurring: true,
      recurringRuleId: rule._id,
    });

    const createdObject = reservation.toObject();
    createdReservations.push({
      ...createdObject,
      serviceId: {
        _id: service._id,
        name: service.name,
        price: service.price,
        duration: service.duration,
      },
    });

    created += 1;
  }

  return {
    created,
    skipped,
    deleted: 0,
    existing,
    ruleId: rule._id,
    active: true,
    occurrences: occurrences.length,
  };
}

async function syncAllActiveRecurringRules(options = {}) {
  const rules = await RecurringReservationRule.find({ isActive: true });
  const results = [];

  for (const rule of rules) {
    const result = await syncRecurringRuleReservations(rule, options);
    results.push(result);
  }

  return results;
}

async function syncRecurringRulesForBarber(barberId, options = {}) {
  if (!barberId) {
    return [];
  }

  const barber = await Barber.findById(barberId).select("isActive");
  const rules = await RecurringReservationRule.find({
    barberId,
  });

  const results = [];
  const shouldClearOnly = !barber || !barber.isActive;

  for (const rule of rules) {
    if (shouldClearOnly) {
      const cleanup = await clearFutureRecurringReservations(
        rule._id,
        options.now,
      );
      results.push({
        ruleId: rule._id,
        active: false,
        created: 0,
        skipped: 0,
        existing: 0,
        deleted: cleanup.deletedCount || 0,
        reason: !barber ? "barber-not-found" : "barber-inactive",
      });
      continue;
    }

    if (!rule.isActive) {
      results.push({
        ruleId: rule._id,
        active: false,
        created: 0,
        skipped: 0,
        existing: 0,
        deleted: 0,
        reason: "rule-inactive",
      });
      continue;
    }

    const result = await syncRecurringRuleReservations(rule, options);
    results.push(result);
  }

  return results;
}

module.exports = {
  syncRecurringRuleReservations,
  syncAllActiveRecurringRules,
  syncRecurringRulesForBarber,
  clearFutureRecurringReservations,
  getFrequencyStepLabel,
};
