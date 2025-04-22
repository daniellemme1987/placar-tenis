const { generateToken } = require('../auth');
const jwt = require('jsonwebtoken');

describe('Auth Module', () => {
  it('gera um token JWT com payload correto', () => {
    const token = generateToken({ user: 'admin' });
    const decoded = jwt.decode(token);
    expect(decoded.user).toBe('admin');
    expect(decoded.exp).toBeGreaterThan(decoded.iat);
  });
});
