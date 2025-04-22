// --- START OF FILE script.js ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("[Spectator] DOM Carregado. Iniciando script.");

    // --- Conexão Socket.IO ---
    const socket = io({ reconnectionAttempts: 5, reconnectionDelay: 1000 });

    // --- Elementos Globais ---
    const toggleThemeButton = document.getElementById('toggle-theme');
    const chatForm = document.getElementById('chat-form');
    const chatMensagemInput = document.getElementById('chat-mensagem');
    const chatHistorico = document.getElementById('chat-historico');
    const usuariosOnlineUl = document.getElementById('usuarios-online');
    const totalEspectadoresSpan = document.getElementById('total-espectadores');

    // --- Lógica do Tema ---
    if (toggleThemeButton) {
        const currentTheme = localStorage.getItem('theme') || 'light';
        document.body.classList.toggle('dark-mode', currentTheme === 'dark');
        toggleThemeButton.textContent = currentTheme === 'dark' ? 'Modo Claro' : 'Modo Escuro';
        toggleThemeButton.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            let theme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
            localStorage.setItem('theme', theme);
            toggleThemeButton.textContent = theme === 'dark' ? 'Modo Claro' : 'Modo Escuro';
        });
    } else { console.warn("[Spectator] Botão de tema não encontrado."); }

    // --- Lógica do Chat ---
    let nomeUsuario = localStorage.getItem('nomeUsuario');
    if (!nomeUsuario) {
        nomeUsuario = prompt("Qual seu nome para o chat?") || 'Anônimo';
        nomeUsuario = nomeUsuario.trim().replace(/\s+/g, ' ').slice(0, 20);
        if (!nomeUsuario) nomeUsuario = 'Anônimo';
        localStorage.setItem('nomeUsuario', nomeUsuario);
    }

    function formatarMensagem(str) { // Função de sanitização
        if (typeof str !== 'string') str = String(str ?? '');
        return str.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"').replace(/'/g, ''');
    }

    if (chatForm && chatMensagemInput) {
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const texto = chatMensagemInput.value.trim();
            if (texto) {
                socket.emit('mensagem_chat', { texto: texto });
                chatMensagemInput.value = '';
            }
        });
    } else { console.warn("[Spectator] Elementos do chat não encontrados."); }

    function adicionarMensagemAoChat(nome, texto) {
        if (!chatHistorico) return;
        const item = document.createElement('p');
        item.innerHTML = `<strong>${formatarMensagem(nome)}:</strong> ${formatarMensagem(texto)}`;
        chatHistorico.appendChild(item);
        const isScrolledToBottom = chatHistorico.scrollHeight - chatHistorico.clientHeight <= chatHistorico.scrollTop + 1;
        if (isScrolledToBottom) chatHistorico.scrollTop = chatHistorico.scrollHeight;
    }

    // --- Funções Auxiliares de UI ---
    function getElement(id) { return document.getElementById(id); }
    function setElementText(el, text, defaultText = '--') { if (el) el.textContent = text ?? defaultText; }
    function setElementDisplay(el, show) { if (el) el.style.display = show ? 'block' : 'none'; }
    function setElementSrc(el, src) { if (el) { if (src) el.src = src; else el.removeAttribute('src'); } }

    // --- Atualização da FOTO ---
    function atualizarFotoUI(data) {
        console.log("[Spectator Foto] Atualizando. fotoEnviada:", data?.fotoEnviada, "imagem:", !!data?.imagem);
        const section = getElement('player-photo-section');
        const img = getElement('player-photo');
        if (!section || !img) { console.error("[Spectator Foto] Elementos não encontrados."); return; }

        try {
            const mostrar = data?.fotoEnviada === true && !!data?.imagem;
            console.log(`[Spectator Foto] Decisão: Mostrar foto = ${mostrar}`);
            setElementDisplay(section, mostrar);
            setElementSrc(img, mostrar ? data.imagem : null);
        } catch (error) { console.error("[Spectator Foto] Erro:", error); setElementDisplay(section, false); }
    }

    // --- Atualização da LIVE ---
    function atualizarLiveUI(liveConfig) {
        console.log("[Spectator Live] Atualizando. Config:", liveConfig);
        const section = getElement('live-section');
        const playerDiv = getElement('player');
        const playerContainer = getElement('player-container');
        if (!section || !playerDiv || !playerContainer) { console.error("[Spectator Live] Elementos não encontrados."); return; }

        try {
            const youtubeId = liveConfig?.youtubeLiveID;
            const isValidId = youtubeId && typeof youtubeId === 'string' && youtubeId.trim().length === 11;
            console.log(`[Spectator Live] ID: ${youtubeId}, Válido: ${isValidId}`);

            if (isValidId) {
                const cleanId = youtubeId.trim();
                const embedUrl = `https://www.youtube.com/embed/${cleanId}?autoplay=1&mute=1&modestbranding=1&rel=0`;
                let currentIframe = playerDiv.querySelector('iframe');
                const needsUpdate = !currentIframe || !currentIframe.src || !currentIframe.src.includes(cleanId);

                if (needsUpdate) {
                    console.log("[Spectator Live] Criando/Atualizando iframe.");
                    playerDiv.innerHTML = ''; // Limpa
                    const iframe = document.createElement('iframe');
                    iframe.src = embedUrl; iframe.width = '100%'; iframe.height = '100%'; iframe.frameBorder = '0';
                    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
                    iframe.allowFullscreen = true; iframe.title = 'YouTube video player';
                    playerDiv.appendChild(iframe);
                } else { console.log("[Spectator Live] Iframe OK."); }
                setElementDisplay(section, true);
                playerContainer.style.backgroundColor = 'transparent';
            } else {
                console.log("[Spectator Live] Ocultando seção.");
                setElementDisplay(section, false);
                playerDiv.innerHTML = '<p>Nenhuma live configurada.</p>';
                playerContainer.style.backgroundColor = '#333';
            }
        } catch (error) { console.error("[Spectator Live] Erro:", error); setElementDisplay(section, false); }
    }

    // --- Atualização do PLACAR (e outras infos) ---
    function atualizarPlacarCoreUI(data) {
         console.log("[Spectator Placar] Atualizando.");
         if (typeof data !== 'object' || data === null) return;

         try {
            const el = { // Busca elementos uma vez
                data: getElement('data'), hora: getElement('hora'), local: getElement('local'), cat: getElement('categoria'), admin: getElement('admin'),
                n1: getElement('jogador1-nome'), n2: getElement('jogador2-nome'), s1: getElement('sacador1'), s2: getElement('sacador2'),
                p1: getElement('pontos-jogador1'), p2: getElement('pontos-jogador2'), g1: getElement('games-jogador1'), g2: getElement('games-jogador2'), set1: getElement('sets-jogador1'), set2: getElement('sets-jogador2'),
                status: getElement('status-jogo'), aqCont: getElement('cronometro-aquecimento-container'), aqTempo: getElement('aquecimento-tempo'), aqHora: getElement('aquecimento-hora'),
                jgCont: getElement('cronometro-jogo-container'), jgTempo: getElement('jogo-tempo'), jgHora: getElement('jogo-hora'), vencedor: getElement('vencedor')
            };
             const fmtDt = (iso) => { if (!iso) return '--'; try { const [, m, d] = iso.split('-'); return d && m ? `${d}/${m}` : '--'; } catch { return '--'; } };
             const fmtTm = (s) => { if (s === undefined || s === null || s < 0) return '00:00:00'; const h = String(Math.floor(s / 3600)).padStart(2, '0'), m = String(Math.floor((s % 3600) / 60)).padStart(2, '0'), sc = String(s % 60).padStart(2, '0'); return `${h}:${m}:${sc}`; };

             // Atualiza textos e visibilidade
             setElementText(el.data, fmtDt(data.data)); setElementText(el.hora, data.hora); setElementText(el.local, data.local); setElementText(el.cat, data.categoria); setElementText(el.admin, data.admin);
             const nome1 = data.players?.[0] || 'Jogador 1'; const nome2 = data.players?.[1] || 'Jogador 2'; setElementText(el.n1, nome1); setElementText(el.n2, nome2);
             const showS = data.matchStart && !data.partidaFinalizada;
             if(el.s1) el.s1.style.display = showS && data.server === 0 ? 'inline' : 'none'; if(el.s2) el.s2.style.display = showS && data.server === 1 ? 'inline' : 'none';
             setElementText(el.p1, data.score?.[0], '0'); setElementText(el.p2, data.score?.[1], '0'); setElementText(el.g1, data.games?.[0], '0'); setElementText(el.g2, data.games?.[1], '0'); setElementText(el.set1, data.setsVencidos?.[0], '0'); setElementText(el.set2, data.setsVencidos?.[1], '0');
             const isTb = data.tieBreakAtivo === true; setElementDisplay(el.status, isTb); if(isTb) setElementText(el.status, "Tie-Break");
             setElementDisplay(el.aqCont, data.warmupStart && !data.matchStart); setElementText(el.aqTempo, fmtTm(data.tempoAquecimentoSegundos)); setElementText(el.aqHora, data.warmupStart);
             setElementDisplay(el.jgCont, data.matchStart); setElementText(el.jgTempo, fmtTm(data.tempoPartidaSegundos)); setElementText(el.jgHora, data.matchStart);
             let vMsg = ""; let vShow = data.partidaFinalizada === true; if(vShow) { if (data.vencedorIndex !== null && data.players?.[data.vencedorIndex]) vMsg = `VENCEDOR: ${formatarMensagem(data.players[data.vencedorIndex])}`; else if (data.woWinnerIndex !== null && data.players?.[data.woWinnerIndex]) vMsg = `VENCEDOR W.O.: ${formatarMensagem(data.players[data.woWinnerIndex])}`; else vMsg = "Partida Finalizada"; } setElementDisplay(el.vencedor, vShow); if(vShow) setElementText(el.vencedor, vMsg);

         } catch(error) { console.error("[Spectator Placar] Erro:", error); }
    }

    // --- Socket IO Listeners ---
    socket.on('connect', () => { console.log('[Spectator] Conectado.', socket.id); if (nomeUsuario) socket.emit('novo_usuario', nomeUsuario); });
    socket.on('score_update', (data) => { console.log(">>> [Spectator] Evento 'score_update' recebido."); atualizarPlacarCoreUI(data); atualizarFotoUI(data); });
    socket.on('live_link_update', (liveConfig) => { console.log(">>> [Spectator] Evento 'live_link_update' recebido."); atualizarLiveUI(liveConfig); });
    socket.on('mensagem_chat', (msg) => { if (msg?.nome && msg?.texto) adicionarMensagemAoChat(msg.nome, msg.texto); });
    socket.on('chat_cleared', () => { if (chatHistorico) chatHistorico.innerHTML = '<p><i>--- Chat limpo ---</i></p>'; });
    socket.on('usuarios_online', (usuarios) => { if (usuariosOnlineUl && totalEspectadoresSpan && Array.isArray(usuarios)) { usuariosOnlineUl.innerHTML = ''; totalEspectadoresSpan.textContent = usuarios.length; usuarios.forEach(nome => { const li = document.createElement('li'); li.textContent = formatarMensagem(nome); usuariosOnlineUl.appendChild(li); }); } });
    socket.on('disconnect', (reason) => console.warn('[Spectator] Desconectado:', reason));
    socket.on('connect_error', (err) => console.error('[Spectator] Erro Conexão:', err.message));
    socket.on('reconnect_attempt', (attempt) => console.log(`[Spectator] Reconectando #${attempt}...`));
    socket.on('reconnect_failed', () => console.error('[Spectator] Falha ao reconectar.'));
    socket.on('reconnect', (attempt) => console.log(`[Spectator] Reconectado #${attempt}!`));

    // --- Busca Dados Iniciais ---
    function fetchInitialData() {
        console.log("[Spectator] Buscando dados iniciais...");
        Promise.all([
            fetch('/data').then(r => r.ok ? r.json() : Promise.reject(`Erro ${r.status} /data`)),
            fetch('/live_config').then(r => r.ok ? r.json() : Promise.reject(`Erro ${r.status} /live_config`))
        ])
        .then(([placarData, liveData]) => {
            console.log("[Spectator] Dados iniciais recebidos.");
            atualizarPlacarCoreUI(placarData); // Atualiza placar inicial
            atualizarFotoUI(placarData);       // Atualiza foto inicial
            atualizarLiveUI(liveData);         // Atualiza live inicial
        })
        .catch(err => {
            console.error("[Spectator] Falha ao buscar dados iniciais:", err);
            const container = document.querySelector('.container');
            if (container && !container.querySelector('#initial-load-error')) {
                 const errorMsg = document.createElement('p'); errorMsg.id = 'initial-load-error'; errorMsg.textContent = 'Erro ao carregar. Tente recarregar (F5).'; errorMsg.style.color = 'red'; errorMsg.style.fontWeight = 'bold'; errorMsg.style.textAlign = 'center'; errorMsg.style.border = '1px solid red'; errorMsg.style.padding = '10px'; errorMsg.style.marginTop = '15px'; container.prepend(errorMsg);
             }
        });
    }

    fetchInitialData(); // Chama a busca inicial

}); // Fim do DOMContentLoaded
// --- END OF FILE script.js ---