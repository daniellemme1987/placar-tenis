const io = require('socket.io-client');
const http = require('http');
const express = require('express');
const socketServer = require('../socketHandlers');
const { saveGameState } = require('../fileManager');

let server, clientSocket;
let ioServer;

beforeAll((done) => {
  const app = express();
  server = http.createServer(app);
  ioServer = require('socket.io')(server);

  socketServer.configureSockets(ioServer); // conecta os handlers
  server.listen(() => {
    const port = server.address().port;
    clientSocket = io.connect(`http://localhost:${port}`, {
      transports: ['websocket'],
      forceNew: true,
    });
    clientSocket.on('connect', done);
  });
});

afterAll((done) => {
  if (clientSocket.connected) clientSocket.disconnect();
  server.close(done);
});

describe('Socket.IO Integração', () => {
  test('recebe score_update após admin_update', (done) => {
    const newState = {
      admin: 'test',
      players: ['Jogador 1', 'Jogador 2'],
      score: ['15', '30'],
    };

    clientSocket.on('score_update', (data) => {
      expect(data.score).toEqual(['15', '30']);
      done();
    });

    clientSocket.emit('admin_update', newState);
  });

  test('envia e recebe mensagem do chat', (done) => {
    clientSocket.emit('novo_usuario', 'TesteBot');
    clientSocket.once('mensagem_chat', (msg) => {
      expect(msg.nome).toBe('TesteBot');
      expect(msg.texto).toBe('Olá mundo');
      done();
    });
    clientSocket.emit('mensagem_chat', { texto: 'Olá mundo' });
  });
});
