const express = require('express');
const multer = require('multer');
const path = require('path');
const { generateToken, authMiddleware } = require('./auth');
const { getGameState, saveGameState, getLiveConfig, saveLiveConfig } = require('./fileManager');

const router = express.Router();
const upload = multer({ dest: path.join(__dirname, 'uploads/') });

// Login - retorna um token JWT se a senha estiver correta
router.post('/login', (req, res) => {
  const { senha } = req.body;
  if (senha === 'teniscj') {
    const token = generateToken({ user: 'admin' });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Senha incorreta' });
  }
});

// Estado do jogo atual
router.get('/data', (req, res) => res.json(getGameState()));

// Configuração atual da live
router.get('/live_config', (req, res) => res.json(getLiveConfig()));

// Upload de imagem (autenticado)
router.post('/upload', authMiddleware, upload.single('imagem'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Arquivo não enviado' });

  const imagePath = `/uploads/${req.file.filename}`;
  res.json({ url: imagePath });
});

module.exports = router;
