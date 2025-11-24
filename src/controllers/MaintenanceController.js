const Car = require("../models/Car");

exports.updateMaintenanceStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const car = await Car.findById(id);
  if (!car) return res.status(404).json({ error: "Carro não encontrado" });

  const estavaEmManutencao = car.status === "Manutenção";

  // ======================
  // ENTRAR EM MANUTENÇÃO
  // ======================
  if (status === "Manutenção" && !estavaEmManutencao) {
    const agora = new Date();

    car.dataEntradaManutencao = agora;
    car.dataSaidaManutencao = null;
    car.gastoManutencao = 0;

    // Adiciona ao histórico
    car.manutencoes.push({
      entrada: agora,
      saida: null,
      gasto: 0
    });

    car.markModified("manutencoes");
  }

  // ======================
  // SAIR DA MANUTENÇÃO
  // ======================
  if (estavaEmManutencao && status !== "Manutenção") {
    const agora = new Date();

    car.dataSaidaManutencao = agora;

    // Atualiza o último item do histórico
    const ultima = car.manutencoes[car.manutencoes.length - 1];
    if (ultima) {
      ultima.saida = agora;
      ultima.gasto = car.gastoManutencao;
    }

    car.markModified("manutencoes");
  }

  // Atualiza status
  car.status = status;

  await car.save();

  res.json(car);
};


exports.addMaintenanceCost = async (req, res) => {
  const { id } = req.params;
  const { valor } = req.body;

  const car = await Car.findById(id);
  if (!car) return res.status(404).json({ error: "Carro não encontrado" });

  if (car.status !== "Manutenção") {
    return res.status(400).json({ error: "Carro não está em manutenção" });
  }

  car.gastoManutencao += valor;

  // Atualiza o item no histórico
  const ultima = car.manutencoes[car.manutencoes.length - 1];
  if (ultima) {
    ultima.gasto += valor;
  }

  car.markModified("manutencoes");
  await car.save();

  res.json(car);
};
