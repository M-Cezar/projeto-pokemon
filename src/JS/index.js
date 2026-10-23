const botaoAlterarTema = document.getElementById("botao-alterar-tema");
const body = document.querySelector("body");
const imagembBotaoTrocaDeTema = document.querySelector(".imagem-botao")

botaoAlterarTema.addEventListener("click", () => {
    const modoEscuroEstaAtivo = body.classList.contains("modo-escuro");
    
    body.classList.toggle("modo-escuro");
    botaoAlterarTema.setAttribute("aria-pressed", String(!modoEscuroEstaAtivo));

    if (modoEscuroEstaAtivo) {
        imagembBotaoTrocaDeTema.setAttribute("src", "./src/imagens/sun.png")
    } else {
        imagembBotaoTrocaDeTema.setAttribute("src", "./src/imagens/moon.png")
    }
});

const campoBusca = document.getElementById("buscar-pokemon");
const seletorTipo = document.getElementById("filtrar-tipo");
const resultadoBusca = document.getElementById("resultado-busca");
const cartoesPokemon = [...document.querySelectorAll(".listagem-pokemon > .cartao-pokemon")];
const filtroCapturados = document.getElementById("filtrar-capturados") || Object.assign(document.createElement("input"), {type:"checkbox"});
const progressoCaptura = document.getElementById("progresso-captura") || document.createElement("p");
const filtros = document.querySelector(".filtros-pokemon");
if (!filtroCapturados.id && filtros) {
    filtroCapturados.id = "filtrar-capturados";
    const rotulo = document.createElement("label");
    rotulo.className = "capturados-filtro";
    rotulo.htmlFor = filtroCapturados.id;
    rotulo.append(filtroCapturados, document.createTextNode(" Somente capturados"));
    filtros.insertBefore(rotulo, resultadoBusca);
}
if (!progressoCaptura.id && filtros) {
    progressoCaptura.id = "progresso-captura";
    progressoCaptura.setAttribute("role", "status");
    progressoCaptura.setAttribute("aria-live", "polite");
    filtros.insertBefore(progressoCaptura, resultadoBusca);
}
const CHAVE_CAPTURAS = "pokedex:capturados:v1";
const numeroDoCartao = cartao => cartao.querySelectorAll(".informacoes span")[1].textContent.trim();
const numerosDisponiveis = new Set(cartoesPokemon.map(numeroDoCartao));

function carregarCapturas() {
    try {
        const salvas = JSON.parse(localStorage.getItem(CHAVE_CAPTURAS) || "[]");
        if (!Array.isArray(salvas)) return new Set();
        return new Set(salvas.filter(numero => typeof numero === "string" && numerosDisponiveis.has(numero)));
    } catch {
        return new Set();
    }
}

const capturados = carregarCapturas();
function salvarCapturas() {
    try { localStorage.setItem(CHAVE_CAPTURAS, JSON.stringify([...capturados])); }
    catch { /* Sem armazenamento, a sessão continua jogável. */ }
}
for (const cartao of cartoesPokemon) {
    const numero = numeroDoCartao(cartao);
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "capturar-pokemon";
    function atualizarBotao() {
        const capturado = capturados.has(numero);
        botao.setAttribute("aria-pressed", String(capturado));
        botao.textContent = capturado ? "Capturado" : "Marcar como capturado";
        cartao.classList.toggle("capturado", capturado);
    }
    botao.addEventListener("click", () => {
        if (capturados.has(numero)) capturados.delete(numero);
        else capturados.add(numero);
        salvarCapturas();
        atualizarBotao();
        atualizarFiltros();
    });
    cartao.append(botao);
    atualizarBotao();
}

function normalizarBusca(texto) {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function atualizarFiltros() {
    const termo = normalizarBusca(campoBusca.value);
    const tipo = seletorTipo.value;
    let visiveis = 0;

    for (const cartao of cartoesPokemon) {
        const informacoes = cartao.querySelectorAll(".informacoes span");
        const nome = normalizarBusca(informacoes[0].textContent);
        const numero = normalizarBusca(informacoes[1].textContent).replace("#", "");
        const tipos = [...cartao.querySelectorAll(".tipos .tipo")];
        const combinaBusca = !termo || nome.includes(termo) || numero.includes(termo.replace("#", ""));
        const combinaTipo = !tipo || tipos.some(item => item.classList.contains(tipo));
        const combinaCaptura = !filtroCapturados.checked || capturados.has(numeroDoCartao(cartao));
        cartao.hidden = !(combinaBusca && combinaTipo && combinaCaptura);
        if (!cartao.hidden) visiveis += 1;
    }

    progressoCaptura.textContent = `${capturados.size} de ${cartoesPokemon.length} Pokémon capturados.`;
    resultadoBusca.textContent = visiveis === 0
        ? "Nenhum Pokémon encontrado. Ajuste a busca ou o tipo."
        : `${visiveis} de ${cartoesPokemon.length} Pokémon exibidos.`;
}

campoBusca.addEventListener("input", atualizarFiltros);
seletorTipo.addEventListener("change", atualizarFiltros);
filtroCapturados.addEventListener("change", atualizarFiltros);
atualizarFiltros();


// Quiz local de silhuetas. Usa apenas os Pokémon já presentes no catálogo.
const QUIZ_KEY = "pokedex:quiz-recorde:v1";
const quizCards = cartoesPokemon.map(cartao => ({
    name: cartao.querySelector(".informacoes span").textContent.trim(),
    image: cartao.querySelector("img.gif").getAttribute("src")
}));
const quizSize = Math.min(10, quizCards.length);
const quizButton = document.createElement("button");
quizButton.type = "button";
quizButton.className = "abrir-quiz";
quizButton.textContent = "Jogar quiz de silhuetas";
document.querySelector(".filtros-pokemon")?.append(quizButton);

const quizDialog = document.createElement("dialog");
quizDialog.className = "pokemon-quiz";
quizDialog.setAttribute("aria-labelledby", "quiz-titulo");
const quizTitle = document.createElement("h2");
quizTitle.id = "quiz-titulo";
quizTitle.textContent = "Quem é esse Pokémon?";
const quizScore = document.createElement("p");
quizScore.className = "quiz-placar";
const quizImage = document.createElement("img");
quizImage.className = "quiz-silhueta";
quizImage.alt = "Silhueta de um Pokémon misterioso";
const quizOptions = document.createElement("div");
quizOptions.className = "quiz-opcoes";
const quizFeedback = document.createElement("p");
quizFeedback.className = "quiz-retorno";
quizFeedback.setAttribute("role", "status");
quizFeedback.setAttribute("aria-live", "polite");
const quizNext = document.createElement("button");
quizNext.type = "button";
quizNext.className = "quiz-proximo";
quizNext.textContent = "Próxima pergunta";
const quizClose = document.createElement("button");
quizClose.type = "button";
quizClose.className = "quiz-fechar";
quizClose.textContent = "Fechar quiz";
quizDialog.append(quizTitle, quizScore, quizImage, quizOptions, quizFeedback, quizNext, quizClose);
document.body.append(quizDialog);

const shuffleQuiz = items => {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index--) {
        const other = Math.floor(Math.random() * (index + 1));
        [result[index], result[other]] = [result[other], result[index]];
    }
    return result;
};
function quizRecord() {
    try {
        const saved = Number(localStorage.getItem(QUIZ_KEY));
        return Number.isSafeInteger(saved) && saved >= 0 && saved <= quizSize ? saved : 0;
    } catch {
        return 0;
    }
}
let quizQuestions = [];
let quizIndex = 0;
let quizCorrect = 0;
let quizAnswered = false;

function showQuizQuestion() {
    quizAnswered = false;
    quizFeedback.textContent = "";
    quizNext.hidden = true;
    quizOptions.replaceChildren();
    const current = quizQuestions[quizIndex];
    quizImage.hidden = false;
    quizImage.src = current.image;
    quizImage.classList.remove("revelada");
    quizScore.textContent = "Pergunta " + (quizIndex + 1) + "/" + quizSize + " · Acertos: " + quizCorrect + " · Recorde: " + quizRecord();
    const distractors = shuffleQuiz(quizCards.filter(card => card.name !== current.name)).slice(0, 3);
    for (const choice of shuffleQuiz([current, ...distractors])) {
        const option = document.createElement("button");
        option.type = "button";
        option.className = "quiz-opcao";
        option.textContent = choice.name;
        option.addEventListener("click", () => {
            if (quizAnswered) return;
            quizAnswered = true;
            const correct = choice.name === current.name;
            if (correct) quizCorrect++;
            quizImage.classList.add("revelada");
            for (const button of quizOptions.querySelectorAll("button")) {
                button.disabled = true;
                if (button.textContent === current.name) button.classList.add("correta");
                else if (button === option) button.classList.add("incorreta");
            }
            quizFeedback.textContent = correct
                ? "Acertou! " + current.name + "."
                : "Resposta correta: " + current.name + ".";
            quizScore.textContent = "Pergunta " + (quizIndex + 1) + "/" + quizSize + " · Acertos: " + quizCorrect + " · Recorde: " + quizRecord();
            quizNext.textContent = quizIndex + 1 === quizSize ? "Ver resultado" : "Próxima pergunta";
            quizNext.hidden = false;
            quizNext.focus();
        });
        quizOptions.append(option);
    }
}
function startQuiz() {
    if (quizCards.length < 4) return;
    quizQuestions = shuffleQuiz(quizCards).slice(0, quizSize);
    quizIndex = 0;
    quizCorrect = 0;
    showQuizQuestion();
}
function finishQuiz() {
    const best = Math.max(quizRecord(), quizCorrect);
    try { localStorage.setItem(QUIZ_KEY, String(best)); }
    catch { /* O placar da sessão continua disponível. */ }
    quizIndex = quizSize;
    quizImage.hidden = true;
    quizOptions.replaceChildren();
    quizScore.textContent = "Resultado: " + quizCorrect + "/" + quizSize + " · Recorde: " + best + "/" + quizSize;
    quizFeedback.textContent = quizCorrect === quizSize
        ? "Sequência perfeita! Todos os Pokémon identificados."
        : "Partida concluída. Tente superar seu recorde.";
    quizNext.textContent = "Jogar novamente";
    quizNext.hidden = false;
    quizNext.focus();
}
quizButton.addEventListener("click", () => {
    startQuiz();
    if (quizCards.length >= 4) quizDialog.showModal();
});
quizNext.addEventListener("click", () => {
    if (quizIndex >= quizSize) return startQuiz();
    if (!quizAnswered) return;
    quizIndex++;
    if (quizIndex >= quizSize) finishQuiz();
    else showQuizQuestion();
});
quizClose.addEventListener("click", () => quizDialog.close());
quizDialog.addEventListener("close", () => quizButton.focus());
