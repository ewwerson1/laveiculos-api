// models/Expense.js
const mongoose = require("mongoose");
const Car = require("./Car");

const ExpenseSchema = new mongoose.Schema({
  description: { type: String, required: true },

  category: {
    type: String,
    enum: ["Manutenção", "Seguro", "Impostos", "Repasse", "Outros"],
    required: true
  },

  value: { type: Number, required: false }, // deixa opcional

  car: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Car",
    default: null
  },

  createdAt: { type: Date, default: Date.now }
});

/* ============================================================
   SE A CATEGORIA FOR MANUTENÇÃO → PEGAR valor do carro
   ============================================================ */
ExpenseSchema.pre("save", async function (next) {
  try {
    // Só aplica se for manutenção E se tiver carro associado
    if (this.category === "Manutenção" && this.car) {
      const car = await Car.findById(this.car);

      if (car) {
        this.value = car.gastoManutencao; // ← PEGANDO AQUI
      }
    }

    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Expense", ExpenseSchema);
