const mongoose = require("mongoose");
const Rent = require("../models/Rent");
const Car = require("../models/Car"); 
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

// Atualização de quilometragem e encerramento do aluguel
exports.updateKilometragem = async (req, res) => {
    try {
        const { id } = req.params;
        const kmRodado = Number(req.body.kilometragem); // KM rodado enviado pelo front-end
        const dataFim = new Date(); // Data de hoje

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "ID do Aluguel inválido." });
        }

        if (isNaN(kmRodado) || kmRodado < 0) {
            return res.status(400).json({ error: "Informe quilometragem válida e positiva." });
        }
        
        // 1. Atualizar o Aluguel
        const aluguelAtualizado = await Rent.findByIdAndUpdate(
            id,
            {
                kilometragem: kmRodado, // Salva o KM rodado
                ativo: false,          // Marca como INATIVO
                fim: dataFim           // Define a data de encerramento
            },
            { new: true }
        );

        if (!aluguelAtualizado) return res.status(404).json({ error: "Aluguel não encontrado." });

        // 2. Mudar o Status do Carro (O Passo Faltante)
        await Car.findByIdAndUpdate(
            aluguelAtualizado.carroId,
            { status: "Disponível" }
        );

        res.json(aluguelAtualizado);

    } catch (error) {
        console.error("ERRO updateKilometragem:", error);
        res.status(500).json({ error: error.message });
    }
};