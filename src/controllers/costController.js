// controllers/costController.js
const Cost = require("../models/Cost");
const Car = require("../models/Car"); 
const Rent = require("../models/Rent");
// Importe aqui outros Models necessários para o resumo (como Investidor)

// =========================================================
// 1. CRIAR NOVO CUSTO (Cost)
// =========================================================
exports.createCost = async (req, res) => {
    try {
        const { description, value, category, car: carId, date } = req.body;

        // 1. Cria o novo registro de custo
        const newCost = new Cost({
            description,
            value,
            category,
            car: carId || null,
            date: date || Date.now()
        });

        await newCost.save();

        // 2. LÓGICA CONDICIONAL: Atualiza o gastoManutencao do carro se a categoria for "Manutenção"
        if (newCost.category === "Manutenção" && newCost.car) {
            // Usa $inc para incrementar o campo gastoManutencao pelo valor do custo
            await Car.findByIdAndUpdate(
                newCost.car,
                { $inc: { gastoManutencao: newCost.value } },
                { new: true }
            );
        }

        res.status(201).json(newCost);
    } catch (err) {
        console.error("Erro ao criar custo:", err);
        res.status(400).json({ mensagem: "Erro ao criar custo.", erro: err.message });
    }
};

// =========================================================
// 2. LISTAR CUSTOS
// =========================================================
exports.listCosts = async (req, res) => {
    try {
        const costs = await Cost.find().populate('car', 'modelo placa'); // Popula com info básica do carro
        res.json(costs);
    } catch (err) {
        console.error("Erro ao listar custos:", err);
        res.status(500).json({ mensagem: "Erro ao listar custos." });
    }
};

// =========================================================
// 3. RESUMO FINANCEIRO (Lógica Simplificada)
// =========================================================
exports.financeSummary = async (req, res) => {
    try {
        // Receita Total (Soma o faturamento de todos os carros)
        const carros = await Car.find();
        const receitaTotal = carros.reduce((sum, car) => sum + (car.faturamento || 0), 0);

        // Despesas de Manutenção (Já estão nos carros - gastoManutencao)
        const gastosManutencaoCarros = carros.reduce((sum, car) => sum + (car.gastoManutencao || 0), 0);

        // Despesas Extras (Soma os custos registrados no novo Model Cost)
        const custosExtras = await Cost.aggregate([
            { $group: { _id: null, total: { $sum: "$value" } } }
        ]);
        const despesasExtras = custosExtras.length > 0 ? custosExtras[0].total : 0;

        // Despesas Totais
        const despesasTotais = gastosManutencaoCarros + despesasExtras;

        // Lucro
        const lucroTotal = receitaTotal - despesasTotais;
        
        // Investidores Ativos
        const investidoresAtivos = await Car.distinct('investor', { investor: { $ne: null } });
        const countInvestidores = investidoresAtivos.length;

        // Retorno dos dados detalhados por carro e resumo
        const dadosCarrosFinanceiro = carros.map(car => {
            const repasse = (car.faturamento || 0) * (car.porcentagem || 0) / 100;
            const gastoTotal = (car.gastoManutencao || 0) + repasse; 
            const lucro = (car.faturamento || 0) - gastoTotal;

            return {
                modelo: car.modelo,
                faturamento: car.faturamento || 0,
                repasse: repasse,
                gastoManutencao: car.gastoManutencao || 0,
                gastoTotal: gastoTotal,
                lucro: lucro,
            };
        });

        res.json({
            receitaTotal,
            despesasTotais,
            lucroTotal,
            investidoresAtivos: countInvestidores,
            dadosCarrosFinanceiro
        });

    } catch (err) {
        console.error("Erro ao gerar resumo financeiro:", err);
        res.status(500).json({ mensagem: "Erro ao gerar resumo financeiro." });
    }
};

// =========================================================
// 4. ATUALIZAR CUSTO
// =========================================================
exports.updateCost = async (req, res) => {
    try {
        const { id } = req.params;
        const { description, value, category, car, date } = req.body;

        const updatedCost = await Cost.findByIdAndUpdate(
            id,
            { description, value, category, car: category === 'Manutenção' ? car : null, date },
            { new: true }
        );

        if (!updatedCost) return res.status(404).json({ mensagem: 'Custo não encontrado.' });

        // Se for manutenção, atualiza gastoManutencao do carro
        if (category === 'Manutenção' && car) {
            // Recalcula gastoManutencao total do carro
            const totalManut = await Cost.aggregate([
                { $match: { car: mongoose.Types.ObjectId(car), category: 'Manutenção' } },
                { $group: { _id: null, total: { $sum: "$value" } } }
            ]);
            const gastoTotal = totalManut[0]?.total || 0;
            await Car.findByIdAndUpdate(car, { gastoManutencao: gastoTotal });
        }

        res.json(updatedCost);
    } catch (err) {
        console.error("Erro ao atualizar custo:", err);
        res.status(400).json({ mensagem: 'Erro ao atualizar custo.', erro: err.message });
    }
};

// =========================================================
// 5. DELETAR CUSTO
// =========================================================
exports.deleteCost = async (req, res) => {
    try {
        const { id } = req.params;

        const cost = await Cost.findById(id);
        if (!cost) return res.status(404).json({ mensagem: 'Custo não encontrado.' });

        await cost.remove();

        // Se for manutenção, atualiza gastoManutencao do carro
        if (cost.category === 'Manutenção' && cost.car) {
            const totalManut = await Cost.aggregate([
                { $match: { car: mongoose.Types.ObjectId(cost.car), category: 'Manutenção' } },
                { $group: { _id: null, total: { $sum: "$value" } } }
            ]);
            const gastoTotal = totalManut[0]?.total || 0;
            await Car.findByIdAndUpdate(cost.car, { gastoManutencao: gastoTotal });
        }

        res.json({ mensagem: 'Custo excluído com sucesso.' });
    } catch (err) {
        console.error("Erro ao deletar custo:", err);
        res.status(500).json({ mensagem: 'Erro ao excluir custo.', erro: err.message });
    }
};