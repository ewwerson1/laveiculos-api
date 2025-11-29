// ../controllers/passwordController.js

const Investor = require('../models/Investor');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// ---------------------------------------------
// Nodemailer (Gmail)
// ---------------------------------------------
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

// ---------------------------------------------
// Função enviar código por e-mail
// ---------------------------------------------
const sendCodeEmail = async (toEmail, code) => {
    try {
        await transporter.sendMail({
            from: `"Sua Empresa" <${process.env.MAIL_USER}>`,
            to: toEmail,
            subject: "Seu Código de Recuperação de Senha",
            html: `
                <p>Olá,</p>
                <p>Você solicitou a recuperação de senha. Aqui está o seu código:</p>
                <h1 style="background:#f0f0f0; padding:10px; text-align:center;">${code}</h1>
                <p>Este código expira em 1 hora.</p>
                <p>Se não foi você, apenas ignore este e-mail.</p>
            `
        });

        console.log("Email enviado via Gmail para:", toEmail);

    } catch (error) {
        console.error("Erro ao enviar e-mail:", error);
        throw new Error("Falha ao enviar o e-mail de recuperação.");
    }
};

// ---------------------------------------------
// Controller (Enviar código)
// ---------------------------------------------
exports.sendResetCode = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await Investor.findOne({ email });

        if (!user) {
            return res.status(200).json({
                mensagem: "Se o email estiver correto, o código será enviado."
            });
        }

        const resetCode = crypto.randomBytes(3).toString("hex").toUpperCase();
        const resetCodeExpiration = Date.now() + 3600000;

        user.resetPasswordCode = resetCode;
        user.resetPasswordExpires = resetCodeExpiration;

        await user.save();
        await sendCodeEmail(user.email, resetCode);

        return res.status(200).json({
            mensagem: "Código de recuperação enviado com sucesso!"
        });

    } catch (error) {
        console.error("Erro no sendResetCode:", error);
        return res.status(500).json({
            erro: error.message || "Erro interno ao enviar o código."
        });
    }
};

exports.validateResetCode = async (req, res) => {
    const { email, code } = req.body;

    try {
        const user = await Investor.findOne({ email });

        if (!user || user.resetPasswordCode !== code) {
            return res.status(400).json({ message: "Código inválido." });
        }

        if (Date.now() > user.resetPasswordExpires) {
            return res.status(400).json({ message: "Código expirado." });
        }

        return res.status(200).json({ ok: true });

    } catch (err) {
        return res.status(500).json({ message: "Erro interno no servidor." });
    }
};

exports.resetPassword = async (req, res) => {
    const { email, newPassword } = req.body;

    try {
        const user = await Investor.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "Usuário não encontrado." });
        }

        // salva nova senha (middleware do model já faz hash)
        user.senha = newPassword;

        // limpa o código
        user.resetPasswordCode = null;
        user.resetPasswordExpires = null;

        await user.save();

        return res.status(200).json({ message: "Senha alterada com sucesso!" });

    } catch (error) {
        return res.status(500).json({ message: "Erro interno ao redefinir senha." });
    }
};
