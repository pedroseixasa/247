const mongoose = require("mongoose");

const blocklistSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["phone", "ip"],
    required: true,
  },
  value: {
    type: String,
    required: true,
  },
  reason: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Blocklist", blocklistSchema);
