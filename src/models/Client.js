const mongoose = require("mongoose");

// Sub-esquema para Manutenções do Cliente
// Sub-esquema para Manutenções do Cliente
const manutencaoClienteSchema = new mongoose.Schema({
    carroId: { type: mongoose.Schema.Types.ObjectId, ref: "Car", required: true },
    manutencaoId: { type: String, required: true }, 
    valorDevido: { type: Number, default: 0 },
    dataEntrada: { type: Date, default: Date.now },
    statusPagamento: {
        type: String,
        enum: ["a_pagar", "quitado"],
        default: "a_pagar",
    },
});
// ...
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

    // ATUALIZADO: O campo 'alugueis' agora armazena um objeto com o ID e o status
    alugueis: [
      {
        aluguelId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "rents",
        },
        statusPagamento: {
          type: String,
          enum: ["a_pagar", "quitado"], // Para pagamentos de aluguel (ex: caução, multas) - se não for usado, pode remover, mas mantive para o modelo ser flexível.
          default: "quitado",
        },
      },
    ],
    
    // NOVO CAMPO: Histórico de Manutenções com custo para o cliente
    historicoManutencoes: [manutencaoClienteSchema],
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