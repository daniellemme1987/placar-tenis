// --- START OF FILE admin.js ---
document.addEventListener("DOMContentLoaded", function() {
    console.log("[Admin] DOM Carregado. Iniciando admin.js...");

    const socket = io(); // Conecta ao Socket.IO

    // --- Seletores DOM ---
    const getEl = (id) => document.getElementById(id);
    // ... (todos os seletores como antes) ...
    const dataInput = getEl("data"); const horaInput = getEl("hora"); const localInput = getEl("local"); const categoriaInput = getEl("categoria"); const player1Input = getEl("player1"); const player2Input = getEl("player2"); const salvarPartidaButton = getEl("salvar-partida");
    const agendamentoFields = [dataInput, horaInput, localInput, categoriaInput, player1Input, player2Input];
    const maxSetsInput = getEl("maxSets"); const gamesPerSetInput = getEl("gamesPerSet"); const tieBreakPointsInput = getEl("tieBreakPoints"); const adminFieldInput = getEl("adminField"); const salvarJogoButton = getEl("salvar-jogo");
    const configFields = [maxSetsInput, gamesPerSetInput, tieBreakPointsInput, adminFieldInput];
    const startWarmupButton = getEl("start-warmup"); const startMatchButton = getEl("start-match"); const retroativoWarmupTimeInput = getEl("retroativo-warmup-time"); const retroativoMatchTimeInput = getEl("retroativo-match-time"); const serverSelect = getEl("server"); const aquecimentoStatusSpan = getEl("aquecimentoStatus"); const partidaStatusSpan = getEl("partidaStatus"); const desfazerButton = getEl("desfazer");
    const infoTopCategoria = getEl("infoTopCategoria"); const infoTopNomes = getEl("infoTopNomes"); const infoTopDados = getEl("infoTopDados"); const nome1Span = getEl("nome1"); const ponto1Span = getEl("ponto1"); const games1Span = getEl("games1"); const sets1Span = getEl("sets1"); const nome2Span = getEl("nome2"); const ponto2Span = getEl("ponto2"); const games2Span = getEl("games2"); const sets2Span = getEl("sets2"); const cronometroAquecimentoP = getEl("cronometroAquecimento"); const inicioPartidaP = getEl("inicioPartida"); const cronometroP = getEl("cronometro"); const vencedorP = getEl("vencedor"); const pontoJogador1Button = getEl("pontoJogador1"); const pontoJogador2Button = getEl("pontoJogador2");
    const fotoSection = getEl("fotoSection"); const uploadImagemInput = getEl("uploadImagem"); const enviarFotoButton = getEl("enviarFoto"); const fotoExibidaImg = getEl("fotoExibida");
    const liveLinkInput = getEl("liveLinkInput"); const updateLiveButton = getEl("updateLiveButton"); const liveUpdateMessage = getEl("liveUpdateMessage"); const clearChatButton = getEl("clearChatButton"); const chatClearMessage = getEl("chatClearMessage");
    const declararWOButton = getEl("declararWO"); const novaPartidaButton = getEl("novaPartida");


    // --- Estado da Aplicação Admin ---
    let estado = {};
    // Define as flags iniciais como FALSE antes de qualquer coisa
    let agendamentoConcluido = false;
    let configuracoesConcluidas = false;
    let aquecimentoIniciado = false;
    let partidaIniciada = false;
    let partidaFinalizada = false;
    let fotoVisivelAdmin = false;
    let historicoLocalAdmin = [];
    let cronometroAquecimentoInterval = null;
    let tempoAquecimentoSegundos = 0;
    let cronometroInterval = null;
    let tempoSegundos = 0;

    // --- Funções ---

    function inicializarEstado() { /* ... (como antes) ... */ }
    function enviarEstadoJogoAoServidor(origem = "desconhecida") { /* ... (como antes) ... */ }
    function formatarData(dataISO) { /* ... (como antes) ... */ }
    function formatarTempo(s) { /* ... (como antes) ... */ }
    function extrairVideoId(url) { /* ... (como antes) ... */ }
    function permitirApenasNumerosKeyDown(e) { /* ... (como antes) ... */ }
    function limparNaoNumericosInput(e) { /* ... (como antes) ... */ }
    function adicionarHistoricoAdmin(tipo, estadoJogoGuardado, dadosExtras = {}) { /* ... (como antes) ... */ }
    function resetTimers() { /* ... (como antes) ... */ }
    function atualizarPlacarAdmin() { /* ... (como antes) ... */ }
    function updateCronometroAdmin() { /* ... (como antes) ... */ }
    function updateCronometroAquecimentoAdmin() { /* ... (como antes) ... */ }
    function validarCamposAgendamento() { /* ... (como antes) ... */ }
    function validarCamposConfiguracao() { /* ... (como antes) ... */ }

    // Atualiza o estado dos botões Salvar Agendamento e Salvar Configuração
    function atualizarEstadoBotoesSalvar() {
        if (!salvarPartidaButton || !salvarJogoButton) return;
        const agendamentoValido = validarCamposAgendamento();
        // Botão Salvar Agendamento: Desabilitado SE agendamento JÁ concluído OU SE campos inválidos
        salvarPartidaButton.disabled = agendamentoConcluido || !agendamentoValido;

        const configValida = validarCamposConfiguracao();
        // Botão Salvar Config: Desabilitado SE agendamento NÃO concluído OU SE config JÁ concluída OU SE campos inválidos
        salvarJogoButton.disabled = !agendamentoConcluido || configuracoesConcluidas || !configValida;
    }

    // Atualiza toda a interface do admin
    function atualizarAdminUI() {
        console.log("[Admin] Atualizando UI com flags:", { agendamentoConcluido, configuracoesConcluidas, partidaIniciada, partidaFinalizada });
        try {
            // Preenche campos (sempre tenta preencher com estado atual)
            if(dataInput) dataInput.value = estado.data || ''; if(horaInput) horaInput.value = estado.hora || ''; /* ... etc ... */
            if(localInput) localInput.value = estado.local || ''; if(categoriaInput) categoriaInput.value = estado.categoria || ''; if(player1Input) player1Input.value = estado.players?.[0] || ''; if(player2Input) player2Input.value = estado.players?.[1] || ''; if(maxSetsInput) maxSetsInput.value = estado.maxSets || '1'; if(gamesPerSetInput) gamesPerSetInput.value = estado.gamesPerSet || '6'; if(tieBreakPointsInput) tieBreakPointsInput.value = estado.tieMax || '10'; if(adminFieldInput) adminFieldInput.value = estado.admin || '';

            // Atualiza select de saque
            const nome0 = estado.players?.[0] || "Jogador 1"; const nome1 = estado.players?.[1] || "Jogador 2";
            if (serverSelect) { /* ... lógica de atualizar opções ... */ serverSelect.value = (estado.server !== null) ? String(estado.server) : ""; }

            // --- LÓGICA DE HABILITAR/DESABILITAR ---
            // Agendamento: Habilitado APENAS se agendamento NÃO concluído
            agendamentoFields.forEach(field => { if(field) field.disabled = agendamentoConcluido; });

            // Configuração: Habilitado APENAS se agendamento concluído E config NÃO concluída
            configFields.forEach(f => { if(f) f.disabled = !agendamentoConcluido || configuracoesConcluidas; });

            // Atualiza botões Salvar baseado nas flags e validação
            atualizarEstadoBotoesSalvar();

            // Controles da Partida: Habilitados APENAS se config concluída E partida NÃO iniciada/finalizada
            const controlesTempoDesabilitados = !configuracoesConcluidas || partidaIniciada || partidaFinalizada;
            const sacadorValido = serverSelect?.value !== "";
            if(retroativoWarmupTimeInput) retroativoWarmupTimeInput.disabled = controlesTempoDesabilitados || aquecimentoIniciado;
            if(startWarmupButton) startWarmupButton.disabled = controlesTempoDesabilitados || aquecimentoIniciado;
            if(retroativoMatchTimeInput) retroativoMatchTimeInput.disabled = controlesTempoDesabilitados;
            if(startMatchButton) startMatchButton.disabled = controlesTempoDesabilitados || !sacadorValido;
            if(serverSelect) serverSelect.disabled = !configuracoesConcluidas || partidaIniciada || partidaFinalizada;

            // Botões de Ponto: Habilitados APENAS se partida iniciada E NÃO finalizada
            if(pontoJogador1Button) pontoJogador1Button.disabled = !partidaIniciada || partidaFinalizada;
            if(pontoJogador2Button) pontoJogador2Button.disabled = !partidaIniciada || partidaFinalizada;

            // Botão Desfazer: Habilitado se houver histórico
            if(desfazerButton) desfazerButton.disabled = historicoLocalAdmin.length === 0;

            // Botão WO: Habilitado se agendamento concluído E partida NÃO finalizada
            if(declararWOButton) declararWOButton.disabled = !agendamentoConcluido || partidaFinalizada;

            // Botão Nova Partida: Sempre habilitado
            if(novaPartidaButton) novaPartidaButton.disabled = false;

            // Foto: Input habilitado após agendar, Botão Enviar se imagem carregada, Seção visível após agendar
            if(uploadImagemInput) uploadImagemInput.disabled = !agendamentoConcluido;
            if(enviarFotoButton) enviarFotoButton.disabled = !estado.imagem;
            if(fotoSection) fotoSection.style.display = agendamentoConcluido ? 'block' : 'none';
            if(fotoExibidaImg) { fotoExibidaImg.style.display = fotoVisivelAdmin ? 'block' : 'none'; fotoExibidaImg.src = fotoVisivelAdmin ? (estado.imagem || '') : ''; }

            // Placar e Status (atualiza textos e visibilidade)
            atualizarPlacarAdmin();
            /* ... (lógica para infoTop, cronômetros, vencedor como antes) ... */

            // Live/Chat (sempre habilitados por enquanto)
            if(liveLinkInput) liveLinkInput.disabled = false; if(updateLiveButton) updateLiveButton.disabled = false; if(clearChatButton) clearChatButton.disabled = false;

            console.log("[Admin] UI Atualizada.");
        } catch (error) { console.error("[Admin] Erro durante atualizarAdminUI:", error); }
    }

    // Salva os dados do agendamento
    function salvarAgendamento() {
        console.log("[Admin] Botão 'Salvar Agendamento' clicado.");
        if (!validarCamposAgendamento()) { alert("Preencha todos os campos do agendamento."); return; }
        const p1 = player1Input.value.trim(); const p2 = player2Input.value.trim();
        if (p1.toLowerCase() === p2.toLowerCase() && p1 !== "") { alert("Nomes dos jogadores não podem ser iguais."); return; }

        adicionarHistoricoAdmin("agendamento-salvo", estado);
        estado.data = dataInput.value; estado.hora = horaInput.value; estado.local = localInput.value; estado.categoria = categoriaInput.value; estado.players = [p1, p2]; estado.server = null;

        agendamentoConcluido = true; // << Define a flag
        console.log("[Admin] Agendamento salvo. agendamentoConcluido = true");

        atualizarAdminUI(); // << Atualiza a UI para refletir a flag
        enviarEstadoJogoAoServidor("Agendamento Salvo");
    }

    // Salva configuração
     function salvarConfiguracao() {
        if (!validarCamposConfiguracao()) { alert("Preencha todos os campos de configuração corretamente."); return; }
        adicionarHistoricoAdmin("salvar-configuracoes", estado);
        estado.maxSets = parseInt(maxSetsInput.value); estado.gamesPerSet = parseInt(gamesPerSetInput.value); estado.tieMax = parseInt(tieBreakPointsInput.value); estado.admin = adminFieldInput.value.trim(); estado.server = null;
        configuracoesConcluidas = true; // << Define a flag
        console.log("[Admin] Configuração Salva.");
        atualizarAdminUI(); // << Atualiza a UI
        enviarEstadoJogoAoServidor("Config Salva");
    }

    // --- Outras Funções (Colar aqui as versões completas e funcionais da última versão) ---
     function handleFotoUpload(e) { /* ... */ atualizarAdminUI(); /* Não envia aqui */ }
     function enviarFoto() { /* ... */ estado.fotoEnviada = true; fotoVisivelAdmin = true; atualizarAdminUI(); enviarEstadoJogoAoServidor("Foto Enviada"); }
     function iniciarAquecimento() { /* ... */ aquecimentoIniciado=true; /*...*/ atualizarAdminUI(); updateCronometroAquecimentoAdmin(); enviarEstadoJogoAoServidor("Aquecimento Iniciado"); }
     function iniciarPartida() { /* ... */ partidaIniciada=true; /*...*/ atualizarAdminUI(); updateCronometroAdmin(); enviarEstadoJogoAoServidor("Partida Iniciada"); }
     function pontuar(pIdx) { /* ... */ }
     function ganharGame(pIdx) { /* ... */ return partidaGanha; }
     function ganharSet(pIdx) { /* ... */ return partidaGanha; }
     function finalizarPartida(vIdx) { /* ... */ partidaFinalizada=true; /*...*/ atualizarAdminUI(); enviarEstadoJogoAoServidor("Partida Finalizada"); }
     function declararWO() { /* ... */ partidaFinalizada=true; /*...*/ atualizarAdminUI(); enviarEstadoJogoAoServidor("WO Declarado"); }
     function desfazer() { /* ... */ atualizarAdminUI(); enviarEstadoJogoAoServidor("Desfazer"); }
     function resetPartida() { /* ... */ estado = inicializarEstado(); /* reset flags ...*/ atualizarAdminUI(); enviarEstadoJogoAoServidor("Nova Partida"); }
     function atualizarLinkLive() { /* ... */ socket.emit('update_live_link', videoId); /* ... */ }
     function limparChat() { /* ... */ socket.emit('clear_chat'); /* ... */ }
     // ... (Colar as definições completas das funções acima da versão anterior)


    // --- Registro de Eventos ---
    // Adiciona listeners aos elementos (usando ?. para segurança)
    salvarPartidaButton?.addEventListener('click', salvarAgendamento);
    salvarJogoButton?.addEventListener('click', salvarConfiguracao);
    // ... (Restante dos listeners como na versão anterior) ...
    startWarmupButton?.addEventListener('click', iniciarAquecimento);
    startMatchButton?.addEventListener('click', iniciarPartida);
    pontoJogador1Button?.addEventListener('click', () => pontuar(0));
    pontoJogador2Button?.addEventListener('click', () => pontuar(1));
    desfazerButton?.addEventListener('click', desfazer);
    declararWOButton?.addEventListener('click', declararWO);
    novaPartidaButton?.addEventListener('click', resetPartida);
    uploadImagemInput?.addEventListener('change', handleFotoUpload);
    enviarFotoButton?.addEventListener('click', enviarFoto);
    updateLiveButton?.addEventListener('click', atualizarLinkLive);
    clearChatButton?.addEventListener('click', limparChat);
    serverSelect?.addEventListener('change', () => { /* ... lógica de mudança de sacador ... */ });
    // Listeners para habilitar/desabilitar botões Salvar (ESSENCIAL)
    agendamentoFields.forEach(i => i?.addEventListener('input', atualizarEstadoBotoesSalvar));
    agendamentoFields.forEach(i => i?.addEventListener('change', atualizarEstadoBotoesSalvar));
    configFields.forEach(i => i?.addEventListener('input', atualizarEstadoBotoesSalvar));
    configFields.forEach(i => i?.addEventListener('change', atualizarEstadoBotoesSalvar));
    // Listeners para inputs numéricos
    [maxSetsInput, gamesPerSetInput, tieBreakPointsInput].forEach(i => { i?.addEventListener('keydown', permitirApenasNumerosKeyDown); i?.addEventListener('input', limparNaoNumericosInput); });
    // Listener para data/hora
    dataInput?.addEventListener("change", function () { /* ... lógica horario-oculto ... */ atualizarEstadoBotoesSalvar(); });
    horaInput?.addEventListener("change", atualizarEstadoBotoesSalvar);


    // --- Inicialização Direta (Sem Login) ---
    function inicializarAdmin() {
        console.log("[Admin] Inicializando estado e UI...");
        estado = inicializarEstado(); historicoLocalAdmin = [];
        // Define flags iniciais como false ANTES de carregar dados
        agendamentoConcluido = false; configuracoesConcluidas = false; aquecimentoIniciado = false; partidaIniciada = false; partidaFinalizada = false; fotoVisivelAdmin = false;
        resetTimers();
        if(dataInput) dataInput.setAttribute("min", new Date().toISOString().split("T")[0]);

        // ATUALIZA A UI COM ESTADO INICIAL (flags=false) -> Isso habilita agendamento e desabilita o resto
        console.log("[Admin Init] Chamando atualizarAdminUI com flags iniciais.");
        atualizarAdminUI();

        // Busca config da live inicial (não afeta habilitação de campos)
        fetch('/live_config').then(r => r.ok ? r.json() : null).then(config => { if (config?.youtubeLiveID && liveLinkInput) liveLinkInput.value = config.youtubeLiveID; }).catch(err => console.warn("[Admin] Erro config live:", err));

        // Tenta carregar dados salvos do servidor
        fetch('/data').then(r => r.ok ? r.json() : Promise.reject('Erro dados'))
            .then(dadosSalvos => {
                console.log("[Admin Init] Dados salvos recebidos:", dadosSalvos);
                if (dadosSalvos && typeof dadosSalvos === 'object' && dadosSalvos.data) { // Verifica se há dados válidos (ex: data existe)
                    estado = { ...inicializarEstado(), ...dadosSalvos }; // Mescla
                    // Recalcula flags baseado nos dados carregados
                    agendamentoConcluido = !!(estado.data && estado.hora && estado.local && estado.categoria && estado.players?.[0] && estado.players?.[1]);
                    configuracoesConcluidas = agendamentoConcluido && !!(estado.admin && estado.maxSets > 0 && estado.gamesPerSet > 0 && estado.tieMax > 0);
                    aquecimentoIniciado = !!estado.warmupStart;
                    partidaIniciada = !!estado.matchStart;
                    partidaFinalizada = estado.partidaFinalizada === true;
                    fotoVisivelAdmin = estado.fotoEnviada === true && !!estado.imagem;
                    tempoAquecimentoSegundos = estado.tempoAquecimentoSegundos || 0;
                    tempoSegundos = estado.tempoPartidaSegundos || 0;
                    // Reinicia timers se necessário
                    resetTimers();
                    if (partidaIniciada && !partidaFinalizada) { cronometroInterval = setInterval(() => { if(!partidaFinalizada) tempoSegundos++; updateCronometroAdmin(); }, 1000); }
                    else if (aquecimentoIniciado && !partidaIniciada && !partidaFinalizada) { cronometroAquecimentoInterval = setInterval(() => { if(!partidaIniciada) tempoAquecimentoSegundos++; updateCronometroAquecimentoAdmin(); }, 1000); }
                    updateCronometroAdmin(); updateCronometroAquecimentoAdmin();

                    // ATUALIZA A UI *NOVAMENTE* com o estado carregado e flags recalculadas
                    console.log("[Admin Init] Chamando atualizarAdminUI APÓS carregar dados.");
                    atualizarAdminUI();
                    // Dispara a validação inicial de data/hora se já houver data selecionada
                    if (dataInput?.value) dataInput.dispatchEvent(new Event('change'));
                } else {
                     console.log("[Admin Init] Nenhum dado salvo válido encontrado. Mantendo estado inicial.");
                     // A UI já foi atualizada com o estado inicial zerado.
                }
            })
            .catch(err => {
                console.warn("[Admin Init] Falha ao buscar dados salvos:", err);
                // A UI já foi atualizada com o estado inicial zerado.
            });
    }

    inicializarAdmin(); // Chama a inicialização

    console.log("[Admin] admin.js pronto.");
});
// --- END OF FILE admin.js ---