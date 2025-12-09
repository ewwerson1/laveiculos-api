const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');

const path = require('path');
const router = require('./router/router');

const uploadProfileCloudinary = require("./routes/uploadProfileCloudnary");
const uploadCarroCloudinary = require("./routes/uploadCarroCloudnary");

const PORT = process.env.PORT || 100000;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: '*',
  methods: '*',
  credentials: true
}));

// PUBLIC folder
app.use(express.static(path.join(__dirname, '..', 'public')));

// Rotas principais
app.use('/api', router);
app.use('/api', uploadProfileCloudinary);
app.use('/api', uploadCarroCloudinary);

require("./jobs/rentalScheduler");

// Inicialização
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
