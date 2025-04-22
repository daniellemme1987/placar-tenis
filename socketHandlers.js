const { saveGameState, saveLiveConfig } = require('./fileManager');

function configureSockets(io) {
  let espectadores = new Map();
  let historicoMensagens = [];

  io.on('connection', (socket) => {
    console.log('Conectado:', socket.id);
    socket.emit('usuarios_online', Array.from(espectadores.values()));

    socket.on('admin_update', (newState) => {
      saveGameState(newState);
      io.emit('score_update', newState);
    });

    socket.on('update_live_link', (newId) => {
      const valid = typeof newId === 'string' && newId.length === 11;
      const config = { youtubeLiveID: valid ? newId : null };
      saveLiveConfig(config);
      io.emit('live_link_update', config);
    });

    socket.on('novo_usuario', nome => {
      if (nome?.trim()) {
        espectadores.set(socket.id, nome.trim());
        io.emit('usuarios_online', Array.from(espectadores.values()));
      }
    });

    socket.on('mensagem_chat', msg => {
      const nome = espectadores.get(socket.id) || 'Anônimo';
      const texto = msg?.texto?.trim();
      if (texto) {
        const mensagem = { nome, texto };
        historicoMensagens.push(mensagem);
        if (historicoMensagens.length > 200) historicoMensagens.shift();
        io.emit('mensagem_chat', mensagem);
      }
    });

    socket.on('clear_chat', () => {
      historicoMensagens = [];
      io.emit('chat_cleared');
    });

    socket.on('disconnect', () => {
      espectadores.delete(socket.id);
      io.emit('usuarios_online', Array.from(espectadores.values()));
    });
  });
}

module.exports = { configureSockets };
