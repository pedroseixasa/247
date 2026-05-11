const rateLimit = require("express-rate-limit");
const { logAbuseAttempt } = require("../utils/bookingAbuse");

const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Demasiadas tentativas de reserva. Tenta novamente mais tarde.",
  },
  handler: (req, res, _next, options) => {
    logAbuseAttempt(req, "rate-limit", {
      limitWindowMs: 60 * 60 * 1000,
      limitMax: 5,
    });

    return res.status(options.statusCode || 429).json(options.message);
  },
});

module.exports = { bookingLimiter };