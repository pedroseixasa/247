const mongoose = require("mongoose");

const recurringReservationRuleSchema = new mongoose.Schema(
  {
    barberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Barber",
      required: true,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    clientName: {
      type: String,
      required: true,
    },
    clientPhone: {
      type: String,
      required: false,
    },
    clientEmail: {
      type: String,
      required: false,
    },
    startDate: {
      type: Date,
      required: true,
    },
    timeSlot: {
      type: String,
      required: true,
    },
    frequency: {
      type: String,
      enum: ["weekly", "biweekly", "monthly"],
      required: true,
    },
    notes: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    excludedDates: {
      type: [String],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Barber",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

recurringReservationRuleSchema.index({ barberId: 1, isActive: 1 });

module.exports = mongoose.model(
  "RecurringReservationRule",
  recurringReservationRuleSchema,
);
