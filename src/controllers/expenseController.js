// controllers/expenseController.js
const Expense = require("../models/Expense");
const Car = require("../models/Car");
const Income = require("../models/Income");
const Investor = require("../models/Investor"); // <-- IMPORTADO AQUI

// ----------------------------------------------------
// 🔹 Criar gasto
// ----------------------------------------------------
exports.criarDespesa = async (req, res) => {
  try {
    const { description, category, value, car } = req.body;

    const expense = await Expense.create({
      description,
      category,
      value,
      car: car || null
    });

    res.json(expense);

  } catch (error) {
    console.error("Erro ao criar gasto:", error);
    res.status(500).json({ error: error.message });
  }
};

// ----------------------------------------------------
// 🔹 Listar todos os gastos
// ----------------------------------------------------
exports.listarDespesas = async (req, res) => {
  try {
    const gastos = await Expense.find()
      .populate("car")
      .sort({ createdAt: -1 });

    res.json(gastos);

  } catch (error) {
    console.error("Erro ao listar despesas:", error);
    res.status(500).json({ error: error.message });
  }
};

// ----------------------------------------------------
// 🔹 Resumo Financeiro COMPLETO
// ----------------------------------------------------
exports.resumoFinanceiro = async (req, res) => {
  try {
    const incomes = await Income.find();
    const expenses = await Expense.find();
    const cars = await Car.find();

    // ================================
    // 🔹 FINANCEIRO INDIVIDUAL POR CARRO
    // ================================
    const dadosCarrosFinanceiro = cars.map(c => {
      const faturamento = c.faturamento || 0;
      const porcentagem = c.porcentagem || 0;
      const gastoManutencao = c.gastoManutencao || 0;

      const repasse = faturamento * (porcentagem / 100);
      const gastoTotal = repasse + gastoManutencao;
      const lucro = faturamento - gastoTotal;

      return {
        modelo: c.modelo,
        faturamento,
        porcentagem,
        repasse,
        gastoManutencao,
        gastoTotal,
        lucro
      };
    });

    // ================================
    // 🔹 AGREGADOS (somatórios)
    // ================================
    const receitaTotal = dadosCarrosFinanceiro.reduce(
      (s, c) => s + c.faturamento,
      0
    );

    const despesasTotais = dadosCarrosFinanceiro.reduce(
      (s, c) => s + c.gastoTotal,
      0
    );

    const lucroTotal = dadosCarrosFinanceiro.reduce(
      (s, c) => s + c.lucro,
      0
    );

    // ================================
    // 🔹 OCUPAÇÃO MÉDIA
    // ================================
    const ocupacaoMedia = cars.length
      ? cars.reduce((s, c) => s + (c.ocupacao || 0), 0) / cars.length
      : 0;

    // ================================
    // 🔹 INVESTIDORES ATIVOS (CORRETO!)
    // ================================
    const investidoresAtivos = await Investor.countDocuments({
      status: "Ativo"
    });

    // ================================
    // 🔹 MENSAL (últimos 6 meses)
    // ================================
    const meses = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return d;
    });

    const mensalEntradas = meses.map(m =>
      incomes
        .filter(i => new Date(i.createdAt).getMonth() === m.getMonth())
        .reduce((s, i) => s + i.value, 0)
    );

    const mensalSaidas = meses.map(m =>
      expenses
        .filter(e => new Date(e.createdAt).getMonth() === m.getMonth())
        .reduce((s, e) => s + (e.value || 0), 0)
    );

    const mensalCrescimento = mensalEntradas.map((v, idx) => {
      if (idx === 0) return 0;
      const anterior = mensalEntradas[idx - 1] || 1;
      return (((v - anterior) / anterior) * 100).toFixed(2);
    });

    // ================================
    // 🔹 GASTOS POR CATEGORIA
    // ================================
    const gastosCategorias = await Expense.aggregate([
      {
        $group: {
          _id: "$category",
          total: { $sum: "$value" }
        }
      }
    ]);

    // ================================
    // 🔹 RETORNO FINAL COMPLETO
    // ================================
    return res.json({
      receitaTotal,
      despesasTotais,
      lucroTotal,
      ocupacaoMedia,
      investidoresAtivos,
      mensalEntradas,
      mensalSaidas,
      mensalCrescimento,
      gastosCategorias,
      dadosCarrosFinanceiro
    });

  } catch (err) {
    console.error("Erro no resumo financeiro:", err);
    res.status(500).json({ error: err.message });
  }
};
