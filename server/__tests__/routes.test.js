const request = require('supertest');
const express = require('express');
const routes = require('../routes');

const app = express();
app.use(express.json());
app.use(routes);

describe('API Rotas', () => {
  it('retorna erro com senha errada no login', async () => {
    const res = await request(app)
      .post('/login')
      .send({ senha: 'errada' });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Senha incorreta/);
  });

  it('retorna token com senha correta', async () => {
    const res = await request(app)
      .post('/login')
      .send({ senha: 'teniscj' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('GET /data retorna estado atual', async () => {
    const res = await request(app).get('/data');
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
  });
});
