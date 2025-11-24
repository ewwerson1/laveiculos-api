// models/Income.js
const mongoose = require("mongoose");

const IncomeSchema = new mongoose.Schema({
  value: { type: Number, required: true },

  description: { type: String, default: "Entrada financeira" },

  car: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Car",
    default: null
  },

  rent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Rent",
    default: null
  },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Income", IncomeSchema);
