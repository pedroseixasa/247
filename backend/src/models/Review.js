const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  author: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  text: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Índice para melhorar performance na seleção aleatória
reviewSchema.index({ rating: 1, isActive: 1 });

module.exports = mongoose.model("Review", reviewSchema);
