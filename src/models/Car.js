// models/Car.js

const mongoose = require('mongoose');

// --- Sub-esquemas ---
const ManutencaoSchema = new mongoose.Schema({
    entrada: { 
        type: Date, 
        required: true 
    },
    saida: { 
        type: Date, 
        default: null 
    },
    gasto: { 
        type: Number, 
        default: 0 
    },

    gastoLocadora: { 
        type: Number, 
        default: 0 
    },
    gastoCliente: { 
        type: Number, 
        default: 0 
    }

}, { _id: false });


// 2. Aluguel (Histórico)
const RentalHistorySchema = new mongoose.Schema({
    carroId: { type: mongoose.Schema.Types.ObjectId, ref: 'Car' },
    modelo: { type: String },
    placa: { type: String },
    // O ID ou nome do investidor no momento do aluguel
    investor: { type: mongoose.Schema.Types.ObjectId, ref: 'Investor' },
    
    // Cliente pode ser uma string (nome) ou ObjectId (se tiver um modelo Cliente)
    cliente: { type: String }, 
    
    inicio: { type: Date,  },
    fim: { type: Date,  },
    dias: { type: Number, default: 0 },
    
    // Valores de faturamento
    total: { type: Number, default: 0 },
    locadora: { type: Number, default: 0 },
    investidor: { type: Number, default: 0 },

    // Quilometragem registrada na devolução
    kilometragem: { type: Number, default: 0 },
    
    // Flag para saber se o aluguel está ativo ou não
    ativo: { type: Boolean, default: false } 
}, { timestamps: true });

// --- Esquema Principal (Carro) ---

const CarSchema = new mongoose.Schema(
    {
        modelo: { 
            type: String, 
            required: true 
        },
        placa: { 
            type: String, 
            required: true, 
            unique: true 
        },
        cor: { 
            type: String, 
            required: true 
        },
        ano: {type: Number},

        valorInvestimento: {type: Number},
        
        // 🖼️ NOVO CAMPO: URL da foto (armazenado pelo Multer)
        foto: { 
            type: String, 
            default: 'https://placehold.co/120x120?text=Carro' // Imagem placeholder padrão
        },

        // Informações Financeiras e de Parceria
        valorAluguel: { // Valor base mensal do aluguel
            type: Number, 
            required: true 
        },
        porcentagem: { // Porcentagem do investidor
            type: Number, 
            required: true 
        },
        investor: { // Referência ao modelo de investidor
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Investor', 
            default: null 
        },
        
        // Faturamento Acumulado
        faturamento: { 
            type: Number, 
            default: 0 
        },
        
        // Status e Manutenção
        status: { 
            type: String, 
            enum: ['Disponível', 'Alugado', 'Manutenção'], 
            default: 'Disponível' 
        },
        gastoManutencao: { // Gasto atual enquanto está em Manutenção
            type: Number, 
            default: 0 
        },
        
        // Históricos
        manutencoes: [ManutencaoSchema], // Histórico de manutenções
        rentalHistory: [RentalHistorySchema] // Histórico de aluguéis
        
    },
    { 
        timestamps: true // Adiciona createdAt e updatedAt
    }
);

module.exports = mongoose.model('Car', CarSchema);