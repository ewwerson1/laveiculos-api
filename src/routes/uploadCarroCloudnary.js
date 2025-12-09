const express = require("express");
const router = express.Router();
const multer = require("multer");
const auth = require("../middleware/authMiddleware");
const Carro = require("../models/Car");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ dest: "tmp/" });

// 🚘 Upload foto do carro
router.post("/upload/carro/:carId/foto", auth, upload.single("foto"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhuma imagem enviada" });
    }

    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      folder: "la-veiculos-carros",
    });

    const carro = await Carro.findById(req.params.carId);
    if (!carro) return res.status(404).json({ error: "Carro não encontrado" });

    carro.foto = uploadResult.secure_url;
    await carro.save();

    res.json({
      message: "Foto enviada com sucesso!",
      url: uploadResult.secure_url,
    });

  } catch (error) {
    console.error("Erro no upload:", error);
    res.status(500).json({ error: "Erro ao enviar imagem" });
  }
});

module.exports = router;
