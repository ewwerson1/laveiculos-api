const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// ---------------- CONTROLLERS ----------------
const { loginAdmin } = require("../controllers/authController");
const { loginInvestidor } = require("../controllers/authController");
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

const { listarClientes, listarClientePorId, criarCliente, atualizarCliente, excluirCliente } = require("../controllers/clientController");
const { listarCarros, listarMeusCarros } = require("../controllers/carrosController");
const { criarAluguel, listarAlugueis, listarAlugueisPorCarro, atualizarAluguel, updateKilometragem } = require("../controllers/rentController");

// 🛑 ALTERAÇÃO: REMOVIDO expenseController e ADICIONADO costController
// const { criarDespesa, listarDespesas, resumoFinanceiro } = require("../controllers/expenseController"); 
const { createCost, listCosts, financeSummary } = require("../controllers/costController"); 

const { updateMaintenanceStatus, addMaintenanceCost } = require("../controllers/maintenanceController");
const { enviarCodigoAlterarSenha, validarCodigoAlterarSenha, alterarSenhaInvestidor } = require("../controllers/investidorSenha");

// ---------------- MIDDLEWARE ----------------
const auth = require("../middleware/authMiddleware");

// ---------------- MODELS ----------------
const Investidor = require("../models/Investor");

// ---------- ROTAS PÚBLICAS ----------
router.post("/login/admin", loginAdmin);
router.post("/login/investidor", loginInvestidor);

router.post("/investidor/enviar-codigo", auth, enviarCodigoAlterarSenha);
router.post("/investidor/validar-codigo", auth, validarCodigoAlterarSenha);
router.post("/investidor/alterar-senha", auth, alterarSenhaInvestidor);

// ---------- ROTAS PROTEGIDAS (após auth) ----------
router.use(auth);

// PERFIL DO INVESTIDOR
router.get("/investidor/me", async (req, res) => {
  try {
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
router.post("/alugueis", criarAluguel);
router.get("/alugueis", listarAlugueis);
router.get("/alugueis/carro/:carroId", listarAlugueisPorCarro);
router.put("/alugueis/:id", atualizarAluguel);
router.put("/alugueis/:id/kilometragem", updateKilometragem);

// ---------- CUSTOS (Antigas DESPESAS) ----------
// 🛑 ALTERAÇÃO: Rotas /despesas trocadas para /costs e usando as novas funções do costController
router.post("/costs", createCost);
router.get("/costs", listCosts);
router.get("/financeiro/resumo", financeSummary);

// MANUTENÇÃO
router.put("/carro/:id/manutencao/status", updateMaintenanceStatus);
router.post("/carro/:id/manutencao/gasto", addMaintenanceCost);

module.exports = router;