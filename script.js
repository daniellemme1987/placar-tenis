const socket = io();

function atualizarPlacarUI(data) {
    function getEl(id) {
        return document.getElementById(id);
    }
    function setTxt(id, txt, def = '--') {
        const el = getEl(id);
        if (el) el.textContent = txt || def;
    }
    function setVis(id, vis) {
        const el = getEl(id);
        if (el) el.style.display = vis ? 'block' : 'none';
    }
    function fmtDt(iso) {
        if (!iso) return '--';
        try {
            const [, m, d] = iso.split('-');
            return d && m ? `${d}/${m}` : '--';
        } catch {
            return '--';
        }
    }
    function fmtTm(s) {
        if (s === undefined || s === null || s < 0) return '00:00:00';
        const h = String(Math.floor(s / 3600)).padStart(2, '0'),
              m = String(Math.floor((s % 3600) / 60)).padStart(2, '0'),
              sc = String(s % 60).padStart(2, '0');
        return `${h}:${m}:${sc}`;
    }

    setTxt('data', fmtDt(data.data));
    setTxt('hora', data.hora);
    setTxt('local', data.local);
    setTxt('categoria', data.categoria);
    setTxt('admin', data.admin);

    const n1 = data.players?.[0] || 'Jogador 1',
          n2 = data.players?.[1] || 'Jogador 2';

    setTxt('jogador1-nome', n1);
    setTxt('jogador2-nome', n2);
    const showS = data.matchStart && !data.partidaFinalizada;
    setVis('sacador1', showS && data.server === 0);
    setVis('sacador2', showS && data.server === 1);
    setTxt('pontos-jogador1', data.score?.[0], '0');
    setTxt('pontos-jogador2', data.score?.[1], '0');
    setTxt('games-jogador1', data.games?.[0], '0');
    setTxt('games-jogador2', data.games?.[1], '0');
    setTxt('sets-jogador1', data.setsVencidos?.[0], '0');
    setTxt('sets-jogador2', data.setsVencidos?.[1], '0');
    setTxt('status-jogo', data.tieBreakAtivo ? "Tie-Break" : "");
    setVis('status-jogo', data.tieBreakAtivo);

    setTxt('aquecimento-hora', data.warmupStart);
    setTxt('jogo-hora', data.matchStart);
    setTxt('aquecimento-tempo', fmtTm(data.tempoAquecimentoSegundos));
    setTxt('jogo-tempo', fmtTm(data.tempoPartidaSegundos));

    const aqCont = getEl('cronometro-aquecimento-container');
    if (aqCont) aqCont.style.display = data.warmupStart && !data.matchStart ? 'block' : 'none';

    const jogoCont = getEl('cronometro-jogo-container');
    if (jogoCont) jogoCont.style.display = data.matchStart ? 'block' : 'none';

    let msgV = "";
    let showV = false;
    if (data.partidaFinalizada) {
        showV = true;
        if (data.vencedorIndex !== null && data.players?.[data.vencedorIndex])
            msgV = `VENCEDOR: ${data.players[data.vencedorIndex]}`;
        else if (data.woWinnerIndex !== null && data.players?.[data.woWinnerIndex])
            msgV = `VENCEDOR W.O.: ${data.players[data.woWinnerIndex]}`;
        else
            msgV = "Partida Finalizada";
    }
    setTxt('vencedor', msgV);
    setVis('vencedor', showV);
    const fotoSectionEl = getEl('player-photo-section');
    const fotoEl = getEl('player-photo');
    if (fotoSectionEl && fotoEl) {
        const mostrarFoto = data.fotoEnviada && data.imagem;
        if (mostrarFoto) {
            fotoEl.src = data.imagem;
            fotoSectionEl.style.display = 'block';
        } else {
            fotoSectionEl.style.display = 'none';
            fotoEl.src = '';
        }
    } else {
        console.error("Elementos da foto do jogador não encontrados no DOM.");
    }
}

function atualizarLivePlayer(liveConfig) {
    console.log("[LiveUpdate] Recebido:", liveConfig);

    const liveSectionEl = document.getElementById('live-section');
    const playerDiv = document.getElementById('player');
    const playerContainerDiv = document.getElementById('player-container');

    if (!liveSectionEl || !playerDiv || !playerContainerDiv) {
        console.error("[LiveUpdate] ERRO: Elementos da Live não encontrados no DOM!");
        return;
    }

    const youtubeId = liveConfig?.youtubeLiveID;
    const isValidId = youtubeId && typeof youtubeId === 'string' && youtubeId.length === 11;

    if (isValidId) {
        liveSectionEl.style.display = 'block';
        playerContainerDiv.style.display = 'block';
        playerDiv.innerHTML = `<iframe src="https://www.youtube.com/embed/${youtubeId}?autoplay=1" allowfullscreen></iframe>`;
    } else {
        playerDiv.innerHTML = `<p>Live indisponível no momento.</p>`;
        playerContainerDiv.style.display = 'block';
    }
}

socket.on('score_update', atualizarPlacarUI);
socket.on('live_link_update', atualizarLivePlayer);
