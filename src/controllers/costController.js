// controllers/costController.js
const Cost = require("../models/Cost");
const Car = require("../models/Car");
const Rent = require("../models/Rent");

// ... (Mantenha createCost, listCosts e financeSummary como estão) ...

// =========================================================
// 4. ATUALIZAR CUSTO
// =========================================================
exports.updateCost = async (req, res) => {
    try {
        const { id } = req.params;
        const { description, value, category, car: newCarId, date } = req.body;

        // 1. Busca o custo antigo para desfazer alterações no Carro (se necessário)
        const oldCost = await Cost.findById(id);
        if (!oldCost) {
            return res.status(404).json({ mensagem: "Custo não encontrado." });
        }

        // 2. Lógica de Reversão: Se o custo antigo era "Manutenção", removemos o valor do carro antigo
        if (oldCost.category === "Manutenção" && oldCost.car) {
            await Car.findByIdAndUpdate(oldCost.car, { 
                $inc: { gastoManutencao: -oldCost.value } 
            });
        }

        // 3. Atualiza o Custo com os novos dados
        const updatedCost = await Cost.findByIdAndUpdate(
            id,
            {
                description,
                value,
                category,
                car: category === "Manutenção" ? newCarId : null, // Só salva carro se for manutenção
                date
            },
            { new: true } // Retorna o novo objeto
        );

        // 4. Lógica de Aplicação: Se o novo custo é "Manutenção", adicionamos o valor ao (novo) carro
        if (updatedCost.category === "Manutenção" && updatedCost.car) {
            await Car.findByIdAndUpdate(updatedCost.car, { 
                $inc: { gastoManutencao: updatedCost.value } 
            });
        }

        res.json(updatedCost);

    } catch (err) {
        console.error("Erro ao atualizar custo:", err);
        res.status(500).json({ mensagem: "Erro ao atualizar custo." });
    }
};

// =========================================================
// 5. EXCLUIR CUSTO
// =========================================================
exports.deleteCost = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Busca o custo antes de deletar
        const costToDelete = await Cost.findById(id);
        if (!costToDelete) {
            return res.status(404).json({ mensagem: "Custo não encontrado." });
        }

        // 2. Se for Manutenção, desconta do Carro antes de excluir
        if (costToDelete.category === "Manutenção" && costToDelete.car) {
            await Car.findByIdAndUpdate(costToDelete.car, { 
                $inc: { gastoManutencao: -costToDelete.value } 
            });
        }

        // 3. Deleta o registro
        await Cost.findByIdAndDelete(id);

        res.json({ mensagem: "Custo removido com sucesso." });

    } catch (err) {
        console.error("Erro ao excluir custo:", err);
        res.status(500).json({ mensagem: "Erro ao excluir custo." });
    }
};