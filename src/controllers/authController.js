// controllers/authController.js
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Investidor = require("../models/Investor");

// LOGIN ADMIN
exports.loginAdmin = (req, res) => {
    const { email, senha } = req.body;

    if (email !== process.env.ADMIN_USER || senha !== process.env.ADMIN_PASS) {
        return res.status(401).json({ erro: "Usuário ou senha inválidos" });
    }

    const token = jwt.sign(
        { role: "admin" },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );

    return res.json({
        message: "Login admin realizado",
        token,
        role: "admin"
    });
};

// LOGIN INVESTIDOR
// LOGIN INVESTIDOR
exports.loginInvestidor = async (req, res) => {
  try {
    const { email, senha } = req.body;

    const investidor = await Investidor.findOne({ email });
    if (!investidor) {
      return res.status(404).json({ erro: "Investidor não encontrado" });
    }

    const senhaCorreta = await bcrypt.compare(senha, investidor.senha);
    if (!senhaCorreta) {
      return res.status(401).json({ erro: "Senha incorreta" });
    }

    const token = jwt.sign(
      { id: investidor._id, role: "investidor" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Login investidor realizado",
      token,
      role: "investidor",
      investidor
    });

  } catch (err) {
    console.error("Erro login investidor:", err);
    return res.status(500).json({ erro: "Erro ao realizar login" });
  }
};

