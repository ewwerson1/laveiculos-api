// routes/upload.js

const router = require('express').Router();
const upload = require('../config/multer'); // Importa a configuração do Multer
const Car = require('../models/Car'); // Certifique-se que o caminho está correto
const fs = require('fs'); 
const path = require('path'); 

// Rota POST /api/upload/carro/:carId/foto
// Usa o Multer como middleware para processar o campo 'foto' do formulário
router.post('/api/upload/carro/:carId/foto', upload.single('foto'), async (req, res) => {
  const { carId } = req.params;

  // 1. Verificação inicial do arquivo
  if (!req.file) {
    // Se o Multer falhar (ex: nenhum arquivo anexado), ele retorna antes de salvar
    return res.status(400).json({ error: 'Nenhuma foto fornecida.' });
  }
  
  // O nome do arquivo salvo no disco (com o hash)
  const filename = req.file.filename;

  try {
    // 2. Tenta encontrar o carro no banco de dados
    const car = await Car.findById(carId);

    if (!car) {
      // Se não encontrar, deleta o arquivo recém-salvo no disco e retorna 404
      fs.unlinkSync(req.file.path); 
      return res.status(404).json({ error: 'Carro não encontrado.' });
    }

    // 3. Monta o URL público do arquivo
    const fotoUrl = `https://laveiculos-api-1.onrender.com/uploads/${filename}`; 

    // 4. ATUALIZA O CAMPO 'FOTO' NO MONGODB
    car.foto = fotoUrl;
    
    // 5. SALVA A MUDANÇA NO BANCO DE DADOS
    await car.save(); // <--- Esta linha persiste a alteração!

    return res.json({ 
        message: 'Foto atualizada e salva no banco de dados com sucesso!', 
        fotoUrl: car.foto 
    });

  } catch (err) {
    // 6. Lida com erros (ex: erro de conexão com DB ou erro interno)
    console.error('Erro ao salvar no banco de dados após o upload:', err);
    
    // Deleta o arquivo do disco para evitar lixo, já que o DB falhou
    if (req.file && req.file.path) {
        fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Erro interno do servidor ao processar o upload.' });
  }
});

module.exports = router;