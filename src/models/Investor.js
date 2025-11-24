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

  // senha SEM default direto
  senha: { type: String, required: true },

  carros: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Car" }
  ],

}, { timestamps: true });


// Middleware para garantir hash SEMPRE
InvestorSchema.pre("save", async function (next) {
  // Se a senha não existe → aplica padrão
  if (!this.senha) {
    this.senha = "123456";
  }

  // Se a senha não foi modificada, não rehache
  if (!this.isModified("senha")) return next();

  // Criptografa
  this.senha = await bcrypt.hash(this.senha, 10);
  next();
});

module.exports = mongoose.model("Investor", InvestorSchema);
