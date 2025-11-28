const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    telefone: { type: String, required: true },
    cpf: { type: String, required: true, unique: true },

    // Data da validade da CNH
    validadeCnh: {
      type: Date,
      required: true,
    },

    // Status automático baseado na validade da CNH
    validadeStatus: {
      type: String,
      enum: ["ok", "atencao", "vencida"],
      default: "ok",
    },
  },
  { timestamps: true }
);

// Atualiza o status da CNH baseado na data
clientSchema.pre("save", function (next) {
  if (!this.validadeCnh) {
    this.validadeStatus = "ok";
    return next();
  }

  const hoje = new Date();
  const validade = new Date(this.validadeCnh);

  const diferencaDias = Math.ceil((validade - hoje) / (1000 * 60 * 60 * 24));

  if (diferencaDias < 0) {
    this.validadeStatus = "vencida";
  } else if (diferencaDias <= 30) {
    this.validadeStatus = "atencao";
  } else {
    this.validadeStatus = "ok";
  }

  next();
});

module.exports = mongoose.model("Client", clientSchema);