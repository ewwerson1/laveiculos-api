const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    telefone: { type: String, required: true },
    cpf: { type: String, required: true, unique: true },
    alugueis: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Aluguel",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Client", clientSchema);
