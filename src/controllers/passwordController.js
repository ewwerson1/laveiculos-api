// ../controllers/passwordController.js

const Investor = require('../models/Investor');
const crypto = require('crypto');
const { MailerSend, EmailParams, Sender, Recipient } = require('mailersend');

// ---------------------------------------------
// Configuração MailerSend
// ---------------------------------------------
const mailer = new MailerSend({ apiKey: process.env.MAILERSEND_API_KEY });

// ---------------------------------------------
// Função enviar código por e-mail
// ---------------------------------------------
const sendCodeEmail = async (toEmail, code) => {
    try {
        const sender = new Sender("no-reply@test-ywj2lpnxzzqg7oqz.mlsender.net", "Sua Empresa");
        const recipients = [ new Recipient(toEmail) ];

        const params = new EmailParams()
            .setFrom(sender)
            .setTo(recipients)
            .setSubject("Seu Código de Recuperação de Senha")
            .setHtml(`
                <p>Olá,</p>
                <p>Você solicitou a recuperação de senha. Aqui está o seu código:</p>
                <h1 style="background:#f0f0f0; padding:10px; text-align:center;">${code}</h1>
                <p>Este código expira em 1 hora.</p>
                <p>Se não foi você, apenas ignore este e-mail.</p>
            `);

        await mailer.email.send(params);
        console.log("Email enviado para:", toEmail);

    } catch (error) {
        console.error("Erro ao enviar e-mail:", error);
        throw new Error("Falha ao enviar o e-mail de recuperação.");
    }
};

// ---------------------------------------------
// Controller: Enviar código de recuperação
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
        const resetCodeExpiration = Date.now() + 3600000; // 1 hora

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

// ---------------------------------------------
// Controller: Validar código de recuperação
// ---------------------------------------------
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

// ---------------------------------------------
// Controller: Resetar senha
// ---------------------------------------------
exports.resetPassword = async (req, res) => {
    const { email, newPassword } = req.body;

    try {
        const user = await Investor.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "Usuário não encontrado." });
        }

        // Salva nova senha (middleware do model já faz hash)
        user.senha = newPassword;

        // Limpa código e expiração
        user.resetPasswordCode = null;
        user.resetPasswordExpires = null;

        await user.save();

        return res.status(200).json({ message: "Senha alterada com sucesso!" });

    } catch (error) {
        return res.status(500).json({ message: "Erro interno ao redefinir senha." });
    }
};
