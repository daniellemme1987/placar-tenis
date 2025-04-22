const jwt = require('jsonwebtoken');
const SECRET = 'placar-tenis-secret-key';

function generateToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '2h' });
}

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });

  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch (err) {
    res.status(403).json({ error: 'Token inválido ou expirado' });
  }
}

module.exports = { generateToken, authMiddleware };
