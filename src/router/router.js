const express = require("express");
const router = express.Router();
const cors = require("cors");

// ---------------- CONTROLLERS ----------------
const { loginAdmin } = require("../controllers/authController");
const { loginInvestidor } = require("../controllers/investidorController");
// ... demais imports

// ---------------- MIDDLEWARE ----------------
const auth = require("../middleware/authMiddleware");

// ---------------- MODELS ----------------
const Investidor = require("../models/Investor");

// Configuração CORS apenas para o frontend
const corsOptions = {
  origin: 'https://lalocacaodeveiculos.com.br', // seu frontend
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  credentials: true
};

// ---------- ROTAS PÚBLICAS (com CORS) ----------
router.post("/login/admin", cors(corsOptions), loginAdmin);
router.post("/login/investidor", cors(corsOptions), loginInvestidor);

router.post("/investidor/enviar-codigo", cors(corsOptions), auth, enviarCodigoAlterarSenha);
router.post("/investidor/validar-codigo", cors(corsOptions), auth, validarCodigoAlterarSenha);
router.post("/investidor/alterar-senha", cors(corsOptions), auth, alterarSenhaInvestidor);

// ---------- ROTAS PROTEGIDAS (após auth) ----------
// Se quiser, pode aplicar cors global aqui também
router.use(auth);

// PERFIL DO INVESTIDOR
router.get("/investidor/me", cors(corsOptions), async (req, res) => {
  try {
    const investidor = await Investidor.findById(req.user.id).populate("carros");
    if (!investidor) return res.status(404).json({ error: "Investidor não encontrado" });
    res.json(investidor);
  } catch (err) {
    res.status(500).json({ error: "Erro ao carregar perfil" });
  }
});
router.put("/investidor/perfil", cors(corsOptions), atualizarMeuPerfil);

// CLIENTES
router.get("/clientes", cors(corsOptions), listarClientes);
router.get("/cliente/:id", cors(corsOptions), listarClientePorId);
router.post("/clientes", cors(corsOptions), criarCliente);
router.put("/cliente/:id", cors(corsOptions), atualizarCliente);
router.delete("/cliente/:id", cors(corsOptions), excluirCliente);

// INVESTIDORES (ADMIN)
router.get("/investidores", cors(corsOptions), listarInvestidores);
router.get("/investidor/:id", cors(corsOptions), listarPorId);
router.post("/investidores", cors(corsOptions), criarInvestidor);
router.put("/investidor/:id", cors(corsOptions), atualizarInvestidor);
router.delete("/investidor/:id", cors(corsOptions), excluirInvestidor);

// CARROS
router.post("/carro/:investidorId", cors(corsOptions), adicionarCarro);
router.put("/carro/:carroId", cors(corsOptions), atualizarCarro);
router.delete("/carro/:carroId", cors(corsOptions), excluirCarro);
router.get("/carros", cors(corsOptions), listarCarros);
router.get("/carros/meus", cors(corsOptions), listarMeusCarros);

// ALUGUEIS
router.post("/alugueis", cors(corsOptions), criarAluguel);
router.get("/alugueis", cors(corsOptions), listarAlugueis);
router.get("/alugueis/carro/:carroId", cors(corsOptions), listarAlugueisPorCarro);
router.put("/alugueis/:id", cors(corsOptions), atualizarAluguel);
router.put("/alugueis/:id/kilometragem", cors(corsOptions), updateKilometragem);

// DESPESAS
router.post("/despesas", cors(corsOptions), criarDespesa);
router.get("/despesas", cors(corsOptions), listarDespesas);
router.get("/financeiro/resumo", cors(corsOptions), resumoFinanceiro);

// MANUTENÇÃO
router.put("/carro/:id/manutencao/status", cors(corsOptions), updateMaintenanceStatus);
router.post("/carro/:id/manutencao/gasto", cors(corsOptions), addMaintenanceCost);

module.exports = router;
