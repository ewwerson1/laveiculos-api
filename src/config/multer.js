// config/multer.js

const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const storage = multer.diskStorage({
  // Ajuste o caminho para salvar na pasta 'public/uploads' na raiz do seu projeto.
  destination: (req, file, cb) => {
    cb(null, path.resolve(__dirname, '..', '..', 'public', 'uploads'));
  },
  
  filename: (req, file, cb) => {
    crypto.randomBytes(16, (err, hash) => {
      if (err) cb(err);

      const fileExtension = path.extname(file.originalname);
      const fileName = `${hash.toString('hex')}${fileExtension}`;
      cb(null, fileName);
    });
  },
});

// Exporta apenas a função middleware Multer configurada
module.exports = multer({ storage });