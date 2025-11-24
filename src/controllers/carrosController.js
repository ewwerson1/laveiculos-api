const Car = require("../models/Car");
const Investor = require("../models/Investor");

// LISTAR TODOS OS CARROS
exports.listarCarros = async (req, res) => {
  try {
    const carros = await Car.find().populate("investor");
    res.json(carros);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Erro ao buscar carros" });
  }
};

// LISTAR CARROS DO INVESTIDOR LOGADO
exports.listarMeusCarros = async (req, res) => {
  try {
    const idInvestidor = req.user.id;

    const investidor = await Investor.findById(idInvestidor).populate("carros");

    if (!investidor) {
      return res.status(404).json({ error: "Investidor não encontrado" });
    }

    return res.json(investidor.carros || []);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Erro ao buscar seus carros" });
  }
};
