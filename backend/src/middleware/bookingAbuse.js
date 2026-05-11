const Blocklist = require("../models/Blocklist");
const {
  normalizePhoneForComparison,
  normalizeIpForComparison,
  logAbuseAttempt,
} = require("../utils/bookingAbuse");

async function bookingAbusePrecheck(req, res, next) {
  try {
    const requestIp = normalizeIpForComparison(req.ip);
    if (requestIp) {
      const blockedIp = await Blocklist.findOne({
        type: "ip",
        value: requestIp,
      }).lean();

      if (blockedIp) {
        logAbuseAttempt(req, "blocklist-ip", {
          blocklistType: "ip",
          blocklistValue: requestIp,
        });
        return res.status(403).json({ error: "Reserva não permitida." });
      }
    }

    const phoneValue = normalizePhoneForComparison(req.body?.clientPhone);
    if (phoneValue) {
      const blockedPhone = await Blocklist.findOne({
        type: "phone",
        value: phoneValue,
      }).lean();

      if (blockedPhone) {
        logAbuseAttempt(req, "blocklist-phone", {
          blocklistType: "phone",
          blocklistValue: phoneValue,
        });
        return res.status(403).json({ error: "Reserva não permitida." });
      }
    }

    if (req.body?._hp) {
      logAbuseAttempt(req, "honeypot", {
        honeypot: true,
      });
      return res.status(400).json({ error: "Reserva inválida" });
    }

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { bookingAbusePrecheck };
