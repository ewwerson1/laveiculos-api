// models/Cost.js
const mongoose = require("mongoose");
const Car = require("./Car"); // Necessário se quiser popular ou referenciar

const CostSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true,
        trim: true
    },
    
    // O valor do custo é obrigatório e deve ser positivo
    value: {
        type: Number,
        required: true, 
        min: 0
    }, 

    category: {
        type: String,
        enum: ["Manutenção", "Seguro", "Impostos", "Administrativo", "Outros"],
        required: true
    },

    // Opcional: Para despesas relacionadas a um veículo específico (ex: Manutenção)
    car: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Car",
        default: null
    },

    date: {
        type: Date,
        default: Date.now 
    }
}, { timestamps: true });

module.exports = mongoose.model("Cost", CostSchema);