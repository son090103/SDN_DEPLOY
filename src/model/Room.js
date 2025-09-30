const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, default: "standard" },
    capacity: { type: Number, default: 2 },
    pricePerNight: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("rooms", roomSchema);
