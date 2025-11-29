const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const InvestorSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  cpf: String,
  telefone: String,
  endereco: String,
  foto: String,
  status: { type: String, default: "Ativo" },
  pix: String,
  senha: { type: String, required: true },

  carros: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Car" }
  ],

  // -------------------------------------------
  // CAMPOS DE RECUPERAÇÃO DE SENHA
  // -------------------------------------------
  resetPasswordCode: { type: String, default: null },
  resetPasswordExpires: { type: Number, default: null },

}, { timestamps: true });


// Middleware para garantir hash SEMPRE
InvestorSchema.pre("save", async function (next) {
  if (!this.senha) {
    this.senha = "123456";
  }

  if (!this.isModified("senha")) return next();

  this.senha = await bcrypt.hash(this.senha, 10);
  next();
});

module.exports = mongoose.model("Investor", InvestorSchema);
