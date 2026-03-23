const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");

const barberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["admin", "barber"],
    default: "barber",
  },
  // Dados do perfil
  avatar: String,
  bio: String,
  // Horários de funcionamento
  workingHours: {
    monday: { start: String, end: String },
    tuesday: { start: String, end: String },
    wednesday: { start: String, end: String },
    thursday: { start: String, end: String },
    friday: { start: String, end: String },
    saturday: { start: String, end: String },
    sunday: { start: String, end: String },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  // Ausências/Faltas do barbeiro
  absences: [
    {
      date: {
        type: Date,
        required: true,
      },
      type: {
        type: String,
        enum: ["morning", "afternoon", "full", "specific"],
        default: "full",
      },
      startTime: String, // HH:mm para tipo "specific"
      endTime: String, // HH:mm para tipo "specific"
      reason: String,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password antes de guardar
barberSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar passwords
barberSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcryptjs.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("Barber", barberSchema);
