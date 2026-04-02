const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema({
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
    required: true,
  },
  reservationDate: {
    type: Date,
    required: true,
  },
  timeSlot: {
    type: String, // formato "09:00", "09:30", etc
    required: true,
  },
  status: {
    type: String,
    enum: ["confirmed", "pending", "cancelled", "completed"],
    default: "confirmed",
  },
  notes: String,
  reminderSent: {
    type: Boolean,
    default: false,
  },
  cancelToken: {
    type: String,
    unique: true,
    sparse: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Add unique index to prevent double bookings (race condition fix)
// Allows multiple cancelled reservations at same slot but only one confirmed/pending per slot
reservationSchema.index(
  {
    barberId: 1,
    reservationDate: 1,
    timeSlot: 1,
    status: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      status: { $ne: "cancelled" }, // Allow multiple cancelled at same slot
    },
  },
);

module.exports = mongoose.model("Reservation", reservationSchema);
