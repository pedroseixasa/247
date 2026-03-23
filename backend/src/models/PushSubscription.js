const mongoose = require("mongoose");

const pushSubscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Barber",
    required: false,
  },
  deviceId: {
    type: String,
    default: null,
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  subscription: {
    type: Object,
    required: true,
    // Estrutura esperada: { endpoint, keys: { auth, p256dh } }
  },
  userAgent: {
    type: String,
    default: null,
  },
  deviceType: {
    type: String,
    enum: ["desktop", "mobile", "tablet"],
    default: "desktop",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastUsed: {
    type: Date,
    default: null,
  },
});

// Índice para queries rápidas por userId
pushSubscriptionSchema.index({ userId: 1 });
// Índice para queries rápidas por deviceId
pushSubscriptionSchema.index({ deviceId: 1 });
// Índice de TTL para limpar subscriptions inativas após 90 dias
pushSubscriptionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model("PushSubscription", pushSubscriptionSchema);
