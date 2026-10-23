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
    number: numeroDoCartao(cartao),
    name: cartao.querySelector(".informacoes span").textContent.trim(),
    image: cartao.querySelector("img.gif").getAttribute("src"),
    types: [...cartao.querySelectorAll(".tipos .tipo")].map(tipo => tipo.textContent.trim()).filter(Boolean)
}));
let quizRoundSize = Math.min(10, quizCards.length);
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
const quizDifficultyLabel = document.createElement("label");
quizDifficultyLabel.className = "quiz-dificuldade";
quizDifficultyLabel.textContent = "Dificuldade: ";
const quizDifficulty = document.createElement("select");
for (const [value, label] of [["facil", "Iniciante (3 opções)"], ["normal", "Treinador (4 opções)"], ["especialista", "Mestre (até 6 opções)"]]) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    quizDifficulty.append(option);
}
quizDifficulty.value = "normal";
quizDifficultyLabel.append(quizDifficulty);
const quizCollectionLabel = document.createElement("label");
quizCollectionLabel.className = "quiz-colecao";
quizCollectionLabel.textContent = "Perguntas: ";
const quizCollection = document.createElement("select");
for (const [value, label] of [["todos", "Todos os Pokémon"], ["capturados", "Somente capturados"]]) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    quizCollection.append(option);
}
quizCollectionLabel.append(quizCollection);
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
const quizKeyboardHelp = document.createElement("p");
quizKeyboardHelp.className = "quiz-atalhos";
quizKeyboardHelp.textContent = "Atalhos: 1 a 6 para responder · H para dica · N para avançar.";
const quizHint = document.createElement("button");
quizHint.type = "button";
quizHint.className = "quiz-dica";
quizHint.textContent = "Revelar dica";
quizHint.setAttribute("aria-label", "Revelar a primeira letra do Pokémon misterioso");
const quizNext = document.createElement("button");
quizNext.type = "button";
quizNext.className = "quiz-proximo";
quizNext.textContent = "Próxima pergunta";
const quizClose = document.createElement("button");
quizClose.type = "button";
quizClose.className = "quiz-fechar";
quizClose.textContent = "Fechar quiz";
quizDialog.append(quizTitle, quizDifficultyLabel, quizCollectionLabel, quizScore, quizImage, quizKeyboardHelp, quizOptions, quizFeedback, quizHint, quizNext, quizClose);
document.body.append(quizDialog);

const shuffleQuiz = items => {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index--) {
        const other = Math.floor(Math.random() * (index + 1));
        [result[index], result[other]] = [result[other], result[index]];
    }
    return result;
};
function quizRecordKey() {
    const base = quizDifficulty.value === "normal" ? QUIZ_KEY : QUIZ_KEY + ":" + quizDifficulty.value;
    return base + (quizCollection.value === "capturados" ? ":capturados" : "");
}
function quizPointsRecordKey() {
    return QUIZ_KEY + ":pontos:" + quizDifficulty.value +
        (quizCollection.value === "capturados" ? ":capturados" : "");
}
function quizRecord() {
    try {
        const key = quizRecordKey();
        const saved = Number(localStorage.getItem(key));
        return Number.isSafeInteger(saved) && saved >= 0 && saved <= quizRoundSize ? saved : 0;
    } catch {
        return 0;
    }
}
let quizQuestions = [];
let quizIndex = 0;
let quizCorrect = 0;
let quizAnswered = false;
let quizPoints = 0;
let quizStreak = 0;
let quizBestStreak = 0;
let quizHintUsed = false;
let quizHintLevel = 0;
let quizHintsUsed = 0;
function quizPointsRecord() {
    try {
        const saved = Number(localStorage.getItem(quizPointsRecordKey()));
        return Number.isSafeInteger(saved) && saved >= 0 && saved <= quizRoundSize * 2 ? saved : 0;
    } catch { return 0; }
}
function updateQuizScore() {
    quizScore.textContent = "Pergunta " + Math.min(quizIndex + 1, quizRoundSize) + "/" + quizRoundSize +
        " · Acertos: " + quizCorrect + " · Pontos: " + quizPoints +
        " · Sequência: " + quizStreak + " · Recorde: " + quizRecord() +
        " · Recorde de pontos: " + quizPointsRecord();
}

function showQuizQuestion() {
    quizAnswered = false;
    quizHintUsed = false;
    quizHintLevel = 0;
    quizHint.textContent = "Revelar primeira letra";
    quizHint.setAttribute("aria-label", "Revelar primeira letra do Pokémon");
    quizFeedback.textContent = "";
    quizHint.disabled = false;
    quizHint.hidden = false;
    quizNext.hidden = true;
    quizOptions.replaceChildren();
    const current = quizQuestions[quizIndex];
    quizImage.hidden = false;
    quizImage.src = current.image;
    quizImage.classList.remove("revelada");
    updateQuizScore();
    const choices = quizDifficulty.value === "facil" ? 2 : quizDifficulty.value === "especialista" ? 5 : 3;
    const distractors = shuffleQuiz(quizCards.filter(card => card.name !== current.name)).slice(0, choices);
    for (const [index, choice] of shuffleQuiz([current, ...distractors]).entries()) {
        const option = document.createElement("button");
        option.type = "button";
        option.className = "quiz-opcao";
        option.textContent = choice.name;
        option.setAttribute("aria-label", "Opção " + (index + 1) + ": " + choice.name);
        option.addEventListener("click", () => {
            if (quizAnswered) return;
            quizAnswered = true;
            quizHint.disabled = true;
            quizHint.hidden = true;
            const correct = choice.name === current.name;
            if (correct) {
                quizCorrect++;
                quizStreak++;
                quizBestStreak = Math.max(quizBestStreak, quizStreak);
                quizPoints += Math.max(0, 2 - quizHintLevel);
            } else quizStreak = 0;
            quizImage.classList.add("revelada");
            for (const button of quizOptions.querySelectorAll("button")) {
                button.disabled = true;
                if (button.textContent === current.name) button.classList.add("correta");
                else if (button === option) button.classList.add("incorreta");
            }
            quizFeedback.textContent = correct
                ? "Acertou! " + current.name + "."
                : "Resposta correta: " + current.name + ".";
            updateQuizScore();
            quizNext.textContent = quizIndex + 1 === quizRoundSize ? "Ver resultado" : "Próxima pergunta";
            quizNext.hidden = false;
            quizNext.focus();
        });
        quizOptions.append(option);
    }
}
quizHint.addEventListener("click", () => {
    if (quizAnswered || quizIndex >= quizQuestions.length || quizHint.disabled) return;
    const current = quizQuestions[quizIndex];
    if (quizHintLevel === 0) {
        quizFeedback.textContent = "Dica 1: o nome começa com " + current.name.charAt(0).toUpperCase() + ".";
        quizHint.textContent = "Revelar tipo ou tamanho";
        quizHint.setAttribute("aria-label", "Revelar uma segunda dica sobre o Pokémon");
    } else {
        const typeText = current.types.length ? current.types.join(" e ") : current.name.length + " letras";
        quizFeedback.textContent += " Dica 2: " + (current.types.length ? "tipo " : "nome com ") + typeText + ".";
        quizHint.disabled = true;
    }
    quizHintLevel++;
    quizHintUsed = true;
    quizHintsUsed++;
});
function startQuiz() {
    if (quizCards.length < 4) return;
    const capturedCount = quizCards.filter(card => capturados.has(card.number)).length;
    const capturedOption = quizCollection.querySelector('option[value="capturados"]');
    capturedOption.disabled = capturedCount < 4;
    capturedOption.textContent = "Somente capturados (" + capturedCount + ")";
    if (capturedCount < 4 && quizCollection.value === "capturados") quizCollection.value = "todos";
    const pool = quizCollection.value === "capturados"
        ? quizCards.filter(card => capturados.has(card.number)) : quizCards;
    quizRoundSize = Math.min(10, pool.length);
    quizQuestions = shuffleQuiz(pool).slice(0, quizRoundSize);
    quizIndex = 0;
    quizCorrect = 0;
    quizPoints = 0;
    quizStreak = 0;
    quizBestStreak = 0;
    quizHintsUsed = 0;
    showQuizQuestion();
}
function finishQuiz() {
    const best = Math.max(quizRecord(), quizCorrect);
    try {
        localStorage.setItem(quizRecordKey(), String(best));
    }
    catch { /* O placar da sessão continua disponível. */ }
    const pointRecord = Math.max(quizPointsRecord(), quizPoints);
    try { localStorage.setItem(quizPointsRecordKey(), String(pointRecord)); }
    catch { /* O resultado ainda aparece sem armazenamento. */ }
    quizIndex = quizRoundSize;
    quizImage.hidden = true;
    quizHint.hidden = true;
    quizOptions.replaceChildren();
    quizScore.textContent = "Resultado: " + quizCorrect + "/" + quizRoundSize + " · Pontos: " + quizPoints + "/" + (quizRoundSize * 2) + " · Recorde: " + best + "/" + quizRoundSize + " · Recorde de pontos: " + pointRecord;
    quizFeedback.textContent = quizCorrect === quizRoundSize
        ? "Sequência perfeita! Todos os Pokémon identificados."
        : "Partida concluída. Tente superar seu recorde.";
    quizFeedback.textContent += " Maior sequência: " + quizBestStreak + ". Dicas utilizadas: " + quizHintsUsed + ".";
    quizNext.textContent = "Jogar novamente";
    quizNext.hidden = false;
    quizNext.focus();
}
quizDifficulty.addEventListener("change", () => {
    if (quizDialog.open) startQuiz();
});
quizCollection.addEventListener("change", () => {
    if (quizDialog.open) startQuiz();
});
quizButton.addEventListener("click", () => {
    startQuiz();
    if (quizCards.length >= 4) quizDialog.showModal();
});
quizNext.addEventListener("click", () => {
    if (quizIndex >= quizRoundSize) return startQuiz();
    if (!quizAnswered) return;
    quizIndex++;
    if (quizIndex >= quizRoundSize) finishQuiz();
    else showQuizQuestion();
});
document.addEventListener("keydown", event => {
    if (!quizDialog.open || event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLSelectElement ||
        target instanceof HTMLTextAreaElement) return;
    const key = event.key.toLowerCase();
    if (/^[1-6]$/.test(key) && !quizAnswered) {
        const option = quizOptions.querySelectorAll("button:not(:disabled)")[Number(key) - 1];
        if (!option) return;
        event.preventDefault();
        option.click();
    } else if (key === "h" && !quizHint.disabled && !quizHint.hidden) {
        event.preventDefault();
        quizHint.click();
    } else if (key === "n" && !quizNext.hidden && !quizNext.disabled) {
        event.preventDefault();
        quizNext.click();
    }
});
quizClose.addEventListener("click", () => quizDialog.close());
quizDialog.addEventListener("close", () => quizButton.focus());
