const Investidor = require("../models/Investor");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

// ----------------------
// CONFIGURAR TRANSPORTER
// ----------------------
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

// ----------------------
// ENVIAR CÓDIGO
// ----------------------
const enviarCodigoAlterarSenha = async (req, res) => {
  try {
    const userId = req.user?.id || req.body.id;
    if (!userId) return res.status(400).json({ error: "ID do usuário não recebido" });

    const usuario = await Investidor.findById(userId);
    if (!usuario) return res.status(404).json({ error: "Investidor não encontrado" });

    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    usuario.codigoRecuperacao = codigo;
    usuario.codigoExpira = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await usuario.save();

    await transporter.sendMail({
      from: `Seu Sistema <${process.env.EMAIL_USER}>`,
      to: usuario.email,
      subject: "Código de recuperação de senha",
      text: `Seu código de recuperação é: ${codigo}`
    });

    res.json({ message: "Código enviado para o email!" });

  } catch (e) {
    console.error("Erro enviar código:", e);
    res.status(500).json({ error: "Erro ao enviar código" });
  }
};

// ----------------------
// VALIDAR CÓDIGO
// ----------------------
const validarCodigoAlterarSenha = async (req, res) => {
  try {
    const { codigo } = req.body;
    const userId = req.user?.id || req.body.id;

    if (!userId) return res.status(400).json({ error: "ID do usuário não recebido" });

    const usuario = await Investidor.findById(userId);
    if (!usuario) return res.status(404).json({ error: "Investidor não encontrado" });

    if (usuario.codigoRecuperacao !== codigo)
      return res.status(400).json({ error: "Código incorreto" });

    if (new Date() > usuario.codigoExpira)
      return res.status(400).json({ error: "Código expirado" });

    res.json({ message: "Código validado!" });

  } catch (e) {
    console.error("Erro validar código:", e);
    res.status(500).json({ error: "Erro ao validar código" });
  }
};

// ----------------------
// ALTERAR SENHA (CORRETO)
// ----------------------
const alterarSenhaInvestidor = async (req, res) => {
  try {
    const { senha } = req.body;
    const userId = req.user?.id || req.body.id;

    if (!userId) return res.status(400).json({ error: "ID do usuário não recebido" });

    const usuario = await Investidor.findById(userId);
    if (!usuario) return res.status(404).json({ error: "Investidor não encontrado" });

    // 🔑 Apenas define a nova senha no objeto. O hook 'pre("save")' do Investor.js
    // fará o hash automaticamente antes de salvar no banco.
    usuario.senha = senha; 
    usuario.codigoRecuperacao = null;
    usuario.codigoExpira = null;

    await usuario.save();

    res.json({ message: "Senha alterada com sucesso!" });

  } catch (e) {
    console.error("Erro alterar senha:", e);
    res.status(500).json({ error: "Erro ao alterar senha" });
  }
};

module.exports = {
  enviarCodigoAlterarSenha,
  validarCodigoAlterarSenha,
  alterarSenhaInvestidor
};
