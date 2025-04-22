// --- START OF FILE server.js ---
const express = require('express');
const fs = require('fs');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');
const LIVE_DATA_FILE = path.join(__dirname, 'live_data.json');

// --- Middleware ---
app.use(express.static(__dirname)); // Serve arquivos estáticos (html, css, js, jpg)

// --- Estado em Memória ---
let espectadores = new Map();
let historicoMensagens = [];
let currentGameState = {}; // Carregado por loadInitialState
let currentLiveConfig = { youtubeLiveID: null }; // Carregado por loadInitialState

// --- Funções Auxiliares de Estado ---
function loadInitialState() {
    // Carrega estado do jogo (currentGameState)
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            currentGameState = JSON.parse(data);
            console.log("[Server] Estado do jogo carregado de", DATA_FILE);
        } else {
            console.log("[Server]", DATA_FILE, "não encontrado, iniciando estado vazio.");
            currentGameState = { data: null, hora: null, local: null, categoria: null, players: ["", ""], admin: "", maxSets: 1, gamesPerSet: 6, tieMax: 10, server: null, score: ["0", "0"], games: [0, 0], setsVencidos: [0, 0], tieBreakAtivo: false, warmupStart: null, matchStart: null, tempoAquecimentoSegundos: 0, tempoPartidaSegundos: 0, vencedorIndex: null, woWinnerIndex: null, partidaFinalizada: false, imagem: null, fotoEnviada: false };
            saveStateToFile();
        }
    } catch (err) {
        console.error("[Server] Erro CRÍTICO ao carregar estado do jogo:", err);
        currentGameState = { data: null, hora: null, local: null, categoria: null, players: ["", ""], admin: "", maxSets: 1, gamesPerSet: 6, tieMax: 10, server: null, score: ["0", "0"], games: [0, 0], setsVencidos: [0, 0], tieBreakAtivo: false, warmupStart: null, matchStart: null, tempoAquecimentoSegundos: 0, tempoPartidaSegundos: 0, vencedorIndex: null, woWinnerIndex: null, partidaFinalizada: false, imagem: null, fotoEnviada: false };
    }
    // Carrega configuração da live (currentLiveConfig)
    try {
        if (fs.existsSync(LIVE_DATA_FILE)) {
            const data = fs.readFileSync(LIVE_DATA_FILE, 'utf8');
            currentLiveConfig = JSON.parse(data);
            console.log("[Server] Configuração da live carregada de", LIVE_DATA_FILE);
        } else {
            console.log("[Server]", LIVE_DATA_FILE, "não encontrado, iniciando config vazia.");
            currentLiveConfig = { youtubeLiveID: null };
            saveLiveConfigToFile();
        }
    } catch (err) {
        console.error("[Server] Erro CRÍTICO ao carregar configuração da live:", err);
        currentLiveConfig = { youtubeLiveID: null };
    }
}

function saveStateToFile() {
    fs.writeFile(DATA_FILE, JSON.stringify(currentGameState, null, 2), (err) => {
        if (err) console.error("[Server] Erro ao salvar estado do jogo:", err);
    });
}

function saveLiveConfigToFile() {
    fs.writeFile(LIVE_DATA_FILE, JSON.stringify(currentLiveConfig, null, 2), (err) => {
        if (err) console.error("[Server] Erro ao salvar config da live:", err);
    });
}

// --- Carrega Estado Inicial ---
loadInitialState();

// --- Rotas HTTP ---
app.get('/admin', (req, res) => { res.sendFile(path.join(__dirname, 'admin.html')); });
app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'index.html')); });
// Servir imagem de fundo especificamente
app.get('/quadra.jpg', (req, res) => {
    const imgPath = path.join(__dirname, 'quadra.jpg');
    if (fs.existsSync(imgPath)) {
        res.sendFile(imgPath);
    } else {
        res.status(404).send('Imagem quadra.jpg não encontrada');
    }
});
app.get('/data', (req, res) => { res.json(currentGameState); }); // Envia estado atual do jogo/foto
app.get('/live_config', (req, res) => { res.json(currentLiveConfig); }); // Envia config da live atual

// --- Lógica do Socket.IO ---
io.on('connection', (socket) => {
    console.log(`[Server] Cliente conectado: ${socket.id}`);

    // Envia dados iniciais ao novo cliente
    socket.emit('score_update', currentGameState); // Inclui dados da foto
    socket.emit('live_link_update', currentLiveConfig);
    socket.emit('usuarios_online', Array.from(espectadores.values()));
    historicoMensagens.forEach(msg => socket.emit('mensagem_chat', msg));

    // --- Handlers de eventos do cliente ---
    socket.on('novo_usuario', (nome) => {
        const nomeLimpo = nome ? String(nome).trim().slice(0, 20) : 'Anônimo';
        espectadores.set(socket.id, nomeLimpo);
        console.log(`[Server] Usuário: ${nomeLimpo} (${socket.id})`);
        io.emit('usuarios_online', Array.from(espectadores.values()));
    });

    socket.on('mensagem_chat', (msg) => {
        const remetente = espectadores.get(socket.id) || 'Anônimo';
        const textoLimpo = msg?.texto ? String(msg.texto).trim().slice(0, 200) : '';
        if (!textoLimpo) return;
        const mensagem = { nome: remetente, texto: textoLimpo, timestamp: Date.now() };
        historicoMensagens.push(mensagem);
        if (historicoMensagens.length > 100) historicoMensagens.shift();
        io.emit('mensagem_chat', mensagem);
    });

    socket.on('clear_chat', () => {
        console.log(`[Server] Recebido clear_chat de ${socket.id}`);
        historicoMensagens = [];
        io.emit('chat_cleared');
        console.log('[Server] Chat limpo.');
    });

    // Recebe atualização completa do admin
    socket.on('admin_update', (newState) => {
        console.log(`[Server] Recebido admin_update de ${socket.id}`);
        if (typeof newState === 'object' && newState !== null) {
            // Validação básica para garantir que campos essenciais existam
            if (newState.hasOwnProperty('players') && newState.hasOwnProperty('score')) {
                 currentGameState = newState;
                 saveStateToFile();
                 // Emite o NOVO estado completo para TODOS os clientes
                 io.emit('score_update', currentGameState);
                 console.log('[Server] Estado do jogo atualizado e transmitido via score_update.');
            } else {
                 console.warn(`[Server] admin_update recebido com estrutura inválida de ${socket.id}`);
            }
        } else {
             console.warn(`[Server] admin_update inválido recebido de ${socket.id}`);
        }
    });

    // Recebe atualização do link da live
    socket.on('update_live_link', (newId) => {
        console.log(`[Server] Recebido update_live_link de ${socket.id}. ID: ${newId}`);
        const finalId = (newId && typeof newId === 'string' && newId.trim().length === 11) ? newId.trim() : null;
        if (currentLiveConfig.youtubeLiveID !== finalId) {
            currentLiveConfig.youtubeLiveID = finalId;
            saveLiveConfigToFile();
            // Emite a NOVA config da live para TODOS os clientes
            io.emit('live_link_update', currentLiveConfig);
            console.log('[Server] Config da live atualizada e transmitida via live_link_update.');
        } else {
             console.log('[Server] ID da live inalterado.');
        }
    });

    socket.on('disconnect', () => {
        const nome = espectadores.get(socket.id);
        espectadores.delete(socket.id);
        io.emit('usuarios_online', Array.from(espectadores.values()));
        console.log(`[Server] Cliente desconectado: ${nome || socket.id}`);
    });
});

// --- Inicia o Servidor ---
server.listen(PORT, () => {
    console.log(`[Server] Rodando em http://localhost:${PORT}`);
    console.log(`[Server] Admin: http://localhost:${PORT}/admin`);
    console.log(`[Server] Espectador: http://localhost:${PORT}/`);
});
// --- END OF FILE server.js ---