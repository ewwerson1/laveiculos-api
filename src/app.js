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
  origin: '*', // seu domínio do frontend
  methods: '*', // métodos permitidos
  credentials: true // se quiser enviar cookies ou tokens de sessão
}));

// Tornar a pasta public acessível (IMPORTANTE!)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Rotas principais
app.use('/api', router);

// Rota nova para upload de foto do perfil
const uploadProfile = require("./routes/uploadProfile");
app.use("/api", uploadProfile);

// Suas outras rotas de upload (não remover)
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
