document.addEventListener("DOMContentLoaded", () => {
    const socket = io();

    const senhaCorreta = "teniscj";
    const loginSection = document.getElementById("login");
    const conteudoSection = document.getElementById("conteudo");
    const senhaInput = document.getElementById("senha");
    const loginButton = document.getElementById("login-button");
    const erroSenha = document.getElementById("erroSenha");

    loginButton.addEventListener("click", verificarSenha);
    senhaInput.addEventListener("keydown", e => {
        if (e.key === "Enter") verificarSenha();
    });

    function verificarSenha() {
        if (senhaInput.value === senhaCorreta) {
            loginSection.style.display = "none";
            conteudoSection.style.display = "block";
            erroSenha.style.display = "none";
            atualizarAdminUI();
        } else {
            erroSenha.style.display = "block";
        }
    }

    const dataInput = document.getElementById("data");
    const horaInput = document.getElementById("hora");
    const localInput = document.getElementById("local");
    const categoriaInput = document.getElementById("categoria");
    const player1Input = document.getElementById("player1");
    const player2Input = document.getElementById("player2");
    const salvarPartidaButton = document.getElementById("salvar-partida");

    const camposAgendamento = [
        dataInput, horaInput, localInput,
        categoriaInput, player1Input, player2Input
    ];

    camposAgendamento.forEach(input =>
        input.addEventListener("input", atualizarEstadoBotoesSalvar)
    );

    function validarCamposAgendamento() {
        const data = dataInput.value;
        const hora = horaInput.value;
        const dataHora = new Date(`${data}T${hora}`);
        const agora = new Date();
        if (!data || !hora || isNaN(dataHora.getTime()) || dataHora <= agora) {
            return false;
        }
        return camposAgendamento.every(input => input.value.trim() !== "");
    }

    function atualizarEstadoBotoesSalvar() {
        salvarPartidaButton.disabled = !validarCamposAgendamento();
    }

    atualizarEstadoBotoesSalvar();
});
