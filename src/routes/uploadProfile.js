const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const auth = require("../middleware/authMiddleware");
const Investidor = require("../models/Investor");

const uploadPath = path.join(process.cwd(), "public", "uploads");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = Date.now() + "-" + Math.round(Math.random() * 9999) + ext;
    cb(null, name);
  }
});

const upload = multer({ storage });

router.post("/upload/foto-perfil", auth, upload.single("foto"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhuma foto enviada" });
    }

    const fileName = req.file.filename;
    const filePublicPath = `/uploads/${fileName}`;
    const fileDiskPath = path.join(uploadPath, fileName);

    const investidor = await Investidor.findById(req.user.id);
    investidor.foto = filePublicPath;
    await investidor.save();

    res.json({
      message: "Foto salva com sucesso",
      foto: filePublicPath,
      caminhoFisico: fileDiskPath,
      nomeArquivo: fileName
    });

  } catch (err) {
    console.error("ERRO AO SALVAR FOTO:", err);
    res.status(500).json({ error: "Erro ao enviar foto" });
  }
});

module.exports = router;
