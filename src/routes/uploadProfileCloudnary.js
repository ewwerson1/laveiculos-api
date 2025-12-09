const express = require("express");
const router = express.Router();
const multer = require("multer");
const auth = require("../middleware/authMiddleware");
const Investor = require("../models/Investor");
const cloudinary = require("cloudinary").v2;

// 🔧 CONFIG CLOUDINARY
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 📁 MULTER – salvar local TEMPORARIAMENTE (obrigatório)
const upload = multer({ dest: "tmp/" });

// 🚘 ROTA DE UPLOAD DE FOTO
router.post("/api/upload/carro/:carId/foto", auth, upload.single("foto"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhuma imagem enviada" });
    }

    // 📤 Enviar para o Cloudinary manualmente
    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      folder: "la-veiculos",
    });

    // ⬆ uploadResult.secure_url = URL pública final
    const investidor = await Investor.findById(req.params._id);
    if (!carro) return res.status(404).json({ error: "Carro não encontrado" });

    investidor.foto = uploadResult.secure_url;
    await investidor.save();

    res.json({
      message: "Foto enviada com sucesso!",
      url: uploadResult.secure_url,
    });

  } catch (error) {
    console.error("Erro no upload:", error);
    return res.status(500).json({ error: "Erro ao enviar imagem" });
  }
});

module.exports = router;
