const BLOCKED_EMAIL_DOMAINS = [
  "test.com",
  "fake.com",
  "example.com",
  "mailinator.com",
  "tempmail.com",
];

const BLOCKED_NAMES = new Set([
  "test",
  "teste",
  "asdf",
  "qwerty",
  "1234",
  "aaa",
  "admin",
  "bot",
]);

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function normalizePhoneForComparison(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";

  if (digits.startsWith("00351") && digits.length > 9) {
    return digits.slice(5);
  }

  if (digits.startsWith("351") && digits.length > 9) {
    return digits.slice(3);
  }

  return digits.length > 9 ? digits.slice(-9) : digits;
}

function normalizeIpForComparison(value) {
  return normalizeText(value);
}

function isSuspiciousName(value) {
  const normalized = normalizeText(value);
  return Boolean(normalized) && BLOCKED_NAMES.has(normalized);
}

function isValidPortuguesePhone(value) {
  const normalized = String(value || "").trim().replace(/\s+/g, "");
  return /^[29]\d{8}$/.test(normalized);
}

function isStrictPublicEmail(value) {
  const email = normalizeText(value);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return false;
  }

  const domain = email.split("@")[1] || "";
  if (!domain || domain.split(".").length < 2) {
    return false;
  }

  return !BLOCKED_EMAIL_DOMAINS.some(
    (blockedDomain) =>
      domain === blockedDomain || domain.endsWith(`.${blockedDomain}`),
  );
}

function logAbuseAttempt(req, reason, extra = {}) {
  console.warn("[ABUSE]", {
    ip: req?.ip || req?.headers?.["x-forwarded-for"] || null,
    timestamp: new Date().toISOString(),
    reason,
    clientName: req?.body?.clientName || null,
    clientPhone: req?.body?.clientPhone || null,
    ...extra,
  });
}

module.exports = {
  normalizePhoneForComparison,
  normalizeIpForComparison,
  isSuspiciousName,
  isValidPortuguesePhone,
  isStrictPublicEmail,
  logAbuseAttempt,
};