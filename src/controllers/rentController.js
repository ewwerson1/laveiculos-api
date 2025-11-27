const mongoose = require("mongoose");
const Rent = require("../models/Rent");

// Criar novo aluguel
exports.criarAluguel = async (req, res) => {
  try {
    const novoAluguel = await Rent.create(req.body);

    const result = await Rent.findById(novoAluguel._id)
      .populate("investor", "nome email")
      .populate("carroId", "modelo placa marca");

    res.json(result);
  } catch (error) {
    console.error("ERRO criarAluguel:", error);
    res.status(500).json({ error: error.message });
  }
};

// Listar todos os alugueis
exports.listarAlugueis = async (req, res) => {
  try {
    const alugueis = await Rent.find()
      .sort({ createdAt: -1 })
      .populate("investor", "nome email")
      .populate("carroId", "modelo placa marca");

    res.json(alugueis);
  } catch (error) {
    console.error("ERRO listarAlugueis:", error);
    res.status(500).json({ error: error.message });
  }
};

// Listar alugueis por carro
exports.listarAlugueisPorCarro = async (req, res) => {
  try {
    const { carroId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(carroId)) {
      return res.status(400).json({ error: "ID do Carro inválido." });
    }

    const alugueis = await Rent.find({ carroId })
      .sort({ inicio: -1 })
      .populate("investor", "nome email");

    res.json(alugueis);
  } catch (error) {
    console.error("ERRO listarAlugueisPorCarro:", error);
    res.status(500).json({ error: error.message });
  }
};

// Atualizar aluguel existente
exports.atualizarAluguel = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID do Aluguel inválido." });
    }

    const aluguel = await Rent.findById(id);
    if (!aluguel) return res.status(404).json({ error: "Aluguel não encontrado." });

    // Se vier "kilometragem" no body, somar ao valor existente
    if (req.body.kilometragem !== undefined) {
      const kmAdicional = Number(req.body.kilometragem);
      aluguel.kilometragem = (aluguel.kilometragem || 0) + kmAdicional;
      delete req.body.kilometragem;
    }

    // Atualiza os demais campos
    Object.assign(aluguel, req.body);

    const aluguelAtualizado = await aluguel.save();

    const result = await Rent.findById(aluguelAtualizado._id)
      .populate("investor", "nome email")
      .populate("carroId", "modelo placa marca");

    res.json(result);
  } catch (error) {
    console.error("ERRO atualizarAluguel:", error);
    res.status(500).json({ error: error.message });
  }
}

// Atualização de quilometragem
exports.updateKilometragem = async (req, res) => {
  try {
    const { id } = req.params;
    const km = Number(req.body.kilometragem); // aqui aceita 'kilometragem'

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID do Aluguel inválido." });
    }

    if (isNaN(km)) {
      return res.status(400).json({ error: "Informe kilometragem válida." });
    }

    const aluguel = await Rent.findById(id);
    if (!aluguel) return res.status(404).json({ error: "Aluguel não encontrado." });

    aluguel.kilometragem = (aluguel.kilometragem || 0) + km;
    await aluguel.save();

    res.json(aluguel);

  } catch (error) {
    console.error("Erro updateKilometragem:", error);
    res.status(500).json({ error: error.message });
  }
};

