const request = require('supertest');
const fs = require('fs');
const path = require('path');
const express = require('express');
const routes = require('../routes'); // <- Caminho corrigido

const app = express();
app.use(express.json());
app.use(routes);

let token = "";

beforeAll(async () => {
  const res = await request(app)
    .post('/login')
    .send({ senha: 'teniscj' });
  token = res.body.token;
});

describe('Upload de Imagem', () => {
  it('faz upload de imagem com token válido', async () => {
    const filePath = path.join(__dirname, '../../teste.jpg');
    const res = await request(app)
      .post('/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('imagem', filePath);

    expect(res.status).toBe(200);
    expect(res.body.url).toMatch(/^\/uploads\//); // regex corrigido
  });

  it('recusa upload sem token', async () => {
    const filePath = path.join(__dirname, '../../teste.jpg');
    const res = await request(app)
      .post('/upload')
      .attach('imagem', filePath);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Token não fornecido');
  });
});
