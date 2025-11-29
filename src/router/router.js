const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Client = require('../models/Client')

// ---------------- MIDDLEWARE ----------------
const auth = require("../middleware/authMiddleware"); // Importa o middleware de autenticação

// ---------------- MODELS ----------------
const Investidor = require("../models/Investor");

// ---------------- CONTROLLERS ----------------
const { loginAdmin, loginInvestidor } = require("../controllers/authController");
const {
  atualizarMeuPerfil,
  listarInvestidores,
  listarPorId,
  criarInvestidor,
  atualizarInvestidor,
  excluirInvestidor,
  adicionarCarro,
  atualizarCarro,
  excluirCarro
} = require("../controllers/investidorController");

const {encerrarAluguel, criarAluguel, listarAlugueis, listarAlugueisPorCarro, atualizarAluguel, updateKilometragem} = require("../controllers/rentController")

const { 
    listarClientes, 
    listarClientePorId, 
    criarCliente, 
    atualizarCliente, 
    excluirCliente,
    adicionarAluguelAoCliente,
    adicionarManutencaoAoCliente
} = require("../controllers/clientController");

const { listarCarros, listarMeusCarros } = require("../controllers/carrosController");

const { createCost, listCosts, financeSummary, updateCost, deleteCost } = require("../controllers/costController"); 

const { 
    entrarEmManutencao, 
    finalizarManutencao, 
    addMaintenanceCost 
} = require("../controllers/maintenanceController");

// =========================================================
// ---------- 🔑 ROTAS PÚBLICAS (NÃO EXIGEM AUTENTICAÇÃO) ----------
// ESSAS ROTAS PRECISAM VIR ANTES DO `router.use(auth)`
// =========================================================

// Rotas de Login
router.post("/login/admin", loginAdmin);
router.post("/login/investidor", loginInvestidor);


const { sendResetCode, validateResetCode, resetPassword } = require("../controllers/passwordController");
router.post("/password/send-reset-code", sendResetCode); 

router.post('/password/validate-code', validateResetCode);
router.post('/password/reset', resetPassword);

// =========================================================
// ---------- 🛡️ APLICAÇÃO DO MIDDLEWARE DE AUTENTICAÇÃO ----------
// Todas as rotas abaixo serão protegidas.
// =========================================================
router.use(auth); 


// =========================================================
// ---------- 🔒 ROTAS PROTEGIDAS (EXIGEM AUTENTICAÇÃO) ----------
// =========================================================

// PERFIL DO INVESTIDOR
router.get("/investidor/me", async (req, res) => {
  try {
    // req.user.id é injetado pelo middleware 'auth'
    const investidor = await Investidor.findById(req.user.id).populate("carros");
    if (!investidor) return res.status(404).json({ error: "Investidor não encontrado" });
    res.json(investidor);
  } catch (err) {
    res.status(500).json({ error: "Erro ao carregar perfil" });
  }
});

router.put("/investidor/perfil", atualizarMeuPerfil);

// CLIENTES
router.get("/clientes", listarClientes);
router.get("/cliente/:id", listarClientePorId);
router.post("/clientes", criarCliente);
router.put("/cliente/:id", atualizarCliente);
router.delete("/cliente/:id", excluirCliente);

// INVESTIDORES (ADMIN)
router.get("/investidores", listarInvestidores);
router.get("/investidor/:id", listarPorId);
router.post("/investidores", criarInvestidor);
router.put("/investidor/:id", atualizarInvestidor);
router.delete("/investidor/:id", excluirInvestidor);

// CARROS
router.post("/carro/:investidorId", adicionarCarro);
router.put("/carro/:carroId", atualizarCarro);
router.delete("/carro/:carroId", excluirCarro);
router.get("/carros", listarCarros);
router.get("/carros/meus", listarMeusCarros);

// ALUGUEIS
router.put("/alugueis/:id/finalizar", encerrarAluguel); // Rota que estava no topo
router.post("/alugueis", criarAluguel);
router.get("/alugueis", listarAlugueis);
router.get("/alugueis/carro/:carroId", listarAlugueisPorCarro);
router.put("/alugueis/:id", atualizarAluguel);
router.put("/alugueis/:id/kilometragem", updateKilometragem);

// ---------- CUSTOS (Antigas DESPESAS) ----------
router.post("/costs", createCost);
router.get("/costs", listCosts);
router.get("/financeiro/resumo", financeSummary);
router.put("/costs/:id", updateCost);
router.delete("/costs/:id", deleteCost);

// ---------- MANUTENÇÃO (Rotas Atualizadas) ----------
router.put("/carro/:id/manutencao/entrada", entrarEmManutencao);
router.post("/carro/:id/manutencao/saida", finalizarManutencao);
router.post("/carro/:id/manutencao/gasto", addMaintenanceCost);

// Rota de Pagamento (Com lógica de incremento)
router.put("/cliente/pagamento/:id", async (req, res) => {
  try {
    const { valorPago } = req.body;
    const clienteId = req.params.id;

    if (!valorPago || typeof valorPago !== 'number' || valorPago <= 0) {
      return res.status(400).json({ mensagem: "Valor de pagamento inválido." });
    }

    const clienteAtualizado = await Client.findByIdAndUpdate(
      clienteId,
      { $inc: { pago: valorPago } }, 
      { new: true } 
    );

    if (!clienteAtualizado) {
      return res.status(404).json({ mensagem: "Cliente não encontrado." });
    }

    res.status(200).json({ 
      mensagem: "Pagamento registrado com sucesso!", 
      cliente: clienteAtualizado 
    });

  } catch (error) {
    res.status(500).json({ mensagem: "Erro ao registrar pagamento.", erro: error.message });
  }
});

module.exports = router;