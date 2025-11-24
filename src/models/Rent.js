const mongoose = require("mongoose");

const RentSchema = new mongoose.Schema({
  carroId: { type: mongoose.Schema.Types.ObjectId, ref: "Car", required: true },
  modelo: String,
  placa: String,

  investor: { type: mongoose.Schema.Types.ObjectId, ref: "Investor" },

  inicio: { type: Date, required: true },
  fim: { type: Date, required: false },

  total: Number,
  locadora: Number,
  investidor: Number,

  kilometragem: { type: Number, default: 0 },
  cliente: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Rent", RentSchema);
