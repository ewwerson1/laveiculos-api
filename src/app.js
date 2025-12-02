// app.js (Corrigido e Completo)

const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');

// IMPORTS
const path = require('path');
const uploadRoutes = require('./routes/upload'); 
const PORT = process.env.PORT || 100000;
const router = require('./router/router');

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração CORS
app.use(cors({
  origin: '*',
  methods: '*',
  credentials: true
}));

// ✅ SERVIR A PASTA PUBLIC CORRETAMENTE (ESSENCIAL!)
app.use(express.static(path.join(__dirname, 'public')));

// ✅ SERVIR A PASTA UPLOADS (GARANTIDO!)
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Rotas principais
app.use('/api', router);

// Rota nova para upload de foto do perfil
const uploadProfile = require("./routes/uploadProfile");
app.use("/api", uploadProfile);

// Suas outras rotas de upload
app.use(uploadRoutes);

require("./jobs/rentalScheduler");

// Conexão e Inicialização
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB conectado com sucesso!');
    app.listen(PORT, () => {
      console.log('Servidor iniciado na porta:', PORT);
    });
  })
  .catch((err) => {
    console.error('Erro ao conectar no MongoDB:', err);
  });
