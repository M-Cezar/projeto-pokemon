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
// Collection progress is local-only and independent of the silhouette quiz.
let mostrarFaltantes = false;
const filtroFaltantes = document.createElement("button");
filtroFaltantes.type = "button";
filtroFaltantes.className = "capturar-pokemon";
filtroFaltantes.textContent = "Mostrar não capturados";
filtroFaltantes.setAttribute("aria-pressed", "false");
filtroFaltantes.setAttribute("aria-label", "Mostrar apenas Pokémon ainda não capturados");
const barraColecao = document.createElement("progress");
barraColecao.max = cartoesPokemon.length;
barraColecao.value = 0;
barraColecao.setAttribute("aria-label", "Progresso de captura da coleção");
if (filtros) {
    filtros.insertBefore(filtroFaltantes, resultadoBusca);
    filtros.insertBefore(barraColecao, resultadoBusca);
}
filtroFaltantes.addEventListener("click", () => {
    mostrarFaltantes = !mostrarFaltantes;
    if (mostrarFaltantes) filtroCapturados.checked = false;
    filtroFaltantes.setAttribute("aria-pressed", String(mostrarFaltantes));
    filtroFaltantes.textContent = mostrarFaltantes ? "Exibindo não capturados" : "Mostrar não capturados";
    atualizarFiltros();
});
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

// Local capture backup. Imports only known IDs and never remove existing captures.
const exportarCapturas = document.createElement("button");
exportarCapturas.type = "button";
exportarCapturas.className = "capturar-pokemon";
exportarCapturas.textContent = "Exportar capturas";
const importarCapturas = document.createElement("button");
importarCapturas.type = "button";
importarCapturas.className = "capturar-pokemon";
importarCapturas.textContent = "Importar capturas";
const arquivoCapturas = document.createElement("input");
arquivoCapturas.type = "file";
arquivoCapturas.accept = ".json,application/json";
arquivoCapturas.hidden = true;
const statusCapturas = document.createElement("span");
statusCapturas.setAttribute("role", "status");
statusCapturas.setAttribute("aria-live", "polite");
if (filtros) {
    filtros.insertBefore(exportarCapturas, resultadoBusca);
    filtros.insertBefore(importarCapturas, resultadoBusca);
    filtros.insertBefore(arquivoCapturas, resultadoBusca);
    filtros.insertBefore(statusCapturas, resultadoBusca);
}
exportarCapturas.addEventListener("click", () => {
    const payload = {schema: "pokedex-capturas-v1", capturados: [...capturados].sort()};
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], {type: "application/json"}));
    const link = document.createElement("a");
    link.href = url;
    link.download = "pokedex-capturas.json";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    statusCapturas.textContent = "Arquivo de capturas preparado.";
});
importarCapturas.addEventListener("click", () => arquivoCapturas.click());
arquivoCapturas.addEventListener("change", async () => {
    const file = arquivoCapturas.files?.[0];
    arquivoCapturas.value = "";
    if (!file) return;
    if (file.size > 100_000) {
        statusCapturas.textContent = "Arquivo muito grande para a coleção.";
        return;
    }
    try {
        const data = JSON.parse(await file.text());
        if (data?.schema !== "pokedex-capturas-v1" || !Array.isArray(data.capturados) ||
            data.capturados.length > numerosDisponiveis.size ||
            !data.capturados.every(id => typeof id === "string" && numerosDisponiveis.has(id))) {
            throw new Error("Formato de capturas inválido");
        }
        // Merge with the most recent local save, including other open tabs.
        for (const id of carregarCapturas()) capturados.add(id);
        const before = capturados.size;
        for (const id of data.capturados) capturados.add(id);
        salvarCapturas();
        for (const cartao of cartoesPokemon) {
            const marcado = capturados.has(numeroDoCartao(cartao));
            const botao = cartao.querySelector("button.capturar-pokemon");
            if (botao) {
                botao.setAttribute("aria-pressed", String(marcado));
                botao.textContent = marcado ? "Capturado" : "Marcar como capturado";
            }
            cartao.classList.toggle("capturado", marcado);
        }
        atualizarFiltros();
        statusCapturas.textContent = `${capturados.size - before} novas capturas importadas sem apagar as existentes.`;
    } catch {
        statusCapturas.textContent = "Arquivo inválido. Nenhuma captura foi importada.";
    }
});

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
        const combinaCaptura = (!filtroCapturados.checked || capturados.has(numeroDoCartao(cartao))) &&
            (!mostrarFaltantes || !capturados.has(numeroDoCartao(cartao)));
        cartao.hidden = !(combinaBusca && combinaTipo && combinaCaptura);
        if (!cartao.hidden) visiveis += 1;
    }

    barraColecao.value = capturados.size;
    progressoCaptura.textContent = capturados.size === cartoesPokemon.length
        ? `Coleção completa: ${capturados.size} Pokémon capturados.`
        : `${capturados.size} de ${cartoesPokemon.length} Pokémon capturados. Faltam ${cartoesPokemon.length - capturados.size}.`;
    resultadoBusca.textContent = visiveis === 0
        ? "Nenhum Pokémon encontrado. Ajuste a busca ou o tipo."
        : `${visiveis} de ${cartoesPokemon.length} Pokémon exibidos.`;
}

campoBusca.addEventListener("input", atualizarFiltros);
seletorTipo.addEventListener("change", atualizarFiltros);
filtroCapturados.addEventListener("change", () => {
    if (filtroCapturados.checked && mostrarFaltantes) {
        mostrarFaltantes = false;
        filtroFaltantes.setAttribute("aria-pressed", "false");
        filtroFaltantes.textContent = "Mostrar não capturados";
    }
    atualizarFiltros();
});
atualizarFiltros();

// Captures are local to this browser profile, but can change in another tab.
// Refresh both the collection and the visible cards without restarting a quiz
// or overwriting a more recent save from the other tab.
window.addEventListener("storage", event => {
    if (event.key !== CHAVE_CAPTURAS && event.key !== null) return;
    const atualizadas = carregarCapturas();
    capturados.clear();
    for (const numero of atualizadas) capturados.add(numero);
    for (const cartao of cartoesPokemon) {
        const numero = numeroDoCartao(cartao);
        const capturado = capturados.has(numero);
        const botao = cartao.querySelector(".capturar-pokemon");
        if (!botao) continue;
        botao.setAttribute("aria-pressed", String(capturado));
        botao.textContent = capturado ? "Capturado" : "Marcar como capturado";
        cartao.classList.toggle("capturado", capturado);
    }
    atualizarFiltros();
});


// Quiz local de silhuetas. Usa apenas os Pokémon já presentes no catálogo.
const QUIZ_KEY = "pokedex:quiz-recorde:v1";
const quizCards = cartoesPokemon.map(cartao => ({
    number: numeroDoCartao(cartao),
    name: cartao.querySelector(".informacoes span").textContent.trim(),
    image: cartao.querySelector("img.gif").getAttribute("src"),
    types: [...cartao.querySelectorAll(".tipos .tipo")].map(tipo => tipo.textContent.trim()).filter(Boolean)
}));
// Preserve missed silhouettes for later practice, even after closing the
// dialog. Only catalog IDs are accepted; never store remote content.
const QUIZ_MISTAKES_KEY = "pokedex:quiz-erros:v1";
function loadQuizMistakes() {
    try {
        const saved = JSON.parse(localStorage.getItem(QUIZ_MISTAKES_KEY) || "[]");
        const known = new Set(quizCards.map(card => card.number));
        return new Set(Array.isArray(saved)
            ? saved.filter(id => typeof id === "string" && known.has(id)).slice(0, known.size)
            : []);
    } catch { return new Set(); }
}
let quizPracticeNumbers = loadQuizMistakes();
function saveQuizMistakes() {
    try { localStorage.setItem(QUIZ_MISTAKES_KEY, JSON.stringify([...quizPracticeNumbers])); }
    catch { /* Local storage is optional; this session remains playable. */ }
}
window.addEventListener("storage", event => {
    if (event.key === QUIZ_MISTAKES_KEY || event.key === null)
        quizPracticeNumbers = loadQuizMistakes();
});
let quizRoundSize = Math.min(10, quizCards.length);
let quizTypeStats = new Map();
// Track mastery per catalog type across sessions, without remote requests or
// personal data. Invalid/oversized saved values are ignored on restoration.
const QUIZ_TYPE_HISTORY_KEY = "pokedex:quiz-tipos:v1";
function loadQuizTypeHistory() {
    try {
        const raw = JSON.parse(localStorage.getItem(QUIZ_TYPE_HISTORY_KEY) || "[]");
        const known = new Set(quizCards.flatMap(card => card.types));
        const entries = Array.isArray(raw) ? raw.slice(0, 32) : [];
        const history = new Map();
        for (const entry of entries) {
            if (!Array.isArray(entry) || entry.length !== 2 || !known.has(entry[0])) continue;
            const stats = entry[1];
            if (!stats || !Number.isSafeInteger(stats.asked) ||
                !Number.isSafeInteger(stats.correct) || stats.asked < 0 ||
                stats.asked > 9999 || stats.correct < 0 || stats.correct > stats.asked) continue;
            history.set(entry[0], {asked: stats.asked, correct: stats.correct});
        }
        return history;
    } catch { return new Map(); }
}
let quizTypeHistory = loadQuizTypeHistory();
function saveQuizTypeHistory() {
    try { localStorage.setItem(QUIZ_TYPE_HISTORY_KEY,
        JSON.stringify([...quizTypeHistory].slice(0, 32))); }
    catch { /* Persistent mastery is optional. */ }
}
window.addEventListener("storage", event => {
    if (event.key === QUIZ_TYPE_HISTORY_KEY || event.key === null)
        quizTypeHistory = loadQuizTypeHistory();
});
// Portable local quiz progress. Capture backups remain independent.
const quizBackupButton = document.createElement("button");
quizBackupButton.type = "button";
quizBackupButton.className = "capturar-pokemon";
quizBackupButton.textContent = "Exportar treino do quiz";
const quizRestoreButton = document.createElement("button");
quizRestoreButton.type = "button";
quizRestoreButton.className = "capturar-pokemon";
quizRestoreButton.textContent = "Importar treino do quiz";
const quizBackupInput = document.createElement("input");
quizBackupInput.type = "file";
quizBackupInput.accept = ".json,application/json";
quizBackupInput.hidden = true;
const quizBackupStatus = document.createElement("span");
quizBackupStatus.setAttribute("role", "status");
quizBackupStatus.setAttribute("aria-live", "polite");
if (filtros) filtros.append(quizBackupButton, quizRestoreButton, quizBackupInput, quizBackupStatus);
quizBackupButton.addEventListener("click", () => {
    const backup = {
        schema: "pokedex-quiz-treino-v1",
        erros: [...quizPracticeNumbers].sort(),
        tipos: [...quizTypeHistory].map(([tipo, stats]) => [tipo, {...stats}])
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], {type: "application/json"}));
    const link = document.createElement("a");
    link.href = url;
    link.download = "pokedex-treino-quiz.json";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    quizBackupStatus.textContent = "Treino exportado para arquivo local.";
});
quizRestoreButton.addEventListener("click", () => quizBackupInput.click());
quizBackupInput.addEventListener("change", async () => {
    const file = quizBackupInput.files?.[0];
    quizBackupInput.value = "";
    if (!file) return;
    if (file.size > 100_000) {
        quizBackupStatus.textContent = "Arquivo de treino muito grande.";
        return;
    }
    try {
        const backup = JSON.parse(await file.text());
        const knownTypes = new Set(quizCards.flatMap(card => card.types));
        if (backup?.schema !== "pokedex-quiz-treino-v1" ||
            !Array.isArray(backup.erros) || !Array.isArray(backup.tipos) ||
            backup.erros.length > quizCards.length || backup.tipos.length > knownTypes.size ||
            !backup.erros.every(id => typeof id === "string" && numerosDisponiveis.has(id)) ||
            !backup.tipos.every(entry => Array.isArray(entry) && entry.length === 2 &&
                knownTypes.has(entry[0]) && entry[1] &&
                Number.isSafeInteger(entry[1].asked) && Number.isSafeInteger(entry[1].correct) &&
                entry[1].asked >= 0 && entry[1].asked <= 9999 &&
                entry[1].correct >= 0 && entry[1].correct <= entry[1].asked)) {
            throw new Error("Formato de treino inválido");
        }
        for (const id of loadQuizMistakes()) quizPracticeNumbers.add(id);
        for (const id of backup.erros) quizPracticeNumbers.add(id);
        for (const [type, stats] of backup.tipos) {
            const current = quizTypeHistory.get(type);
            if (!current || stats.asked > current.asked) quizTypeHistory.set(type, {
                asked: stats.asked, correct: stats.correct
            });
        }
        saveQuizMistakes();
        saveQuizTypeHistory();
        quizBackupStatus.textContent = "Treino importado sem apagar o progresso existente.";
    } catch {
        quizBackupStatus.textContent = "Arquivo inválido. Nenhum progresso foi importado.";
    }
});

function recordQuizTypeResult(pokemon, correct) {
    if (correct) quizPracticeNumbers.delete(pokemon.number);
    else quizPracticeNumbers.add(pokemon.number);
    saveQuizMistakes();
    for (const type of new Set(pokemon.types)) {
        const current = quizTypeStats.get(type) || {asked: 0, correct: 0};
        current.asked++;
        if (correct) current.correct++;
        quizTypeStats.set(type, current);
        const history = quizTypeHistory.get(type) || {asked: 0, correct: 0};
        // Saturate rather than storing unbounded counters indefinitely.
        if (history.asked < 9999) {
            history.asked++;
            if (correct) history.correct++;
        }
        quizTypeHistory.set(type, history);
    }
    saveQuizTypeHistory();
}
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
const quizLengthLabel = document.createElement("label");
quizLengthLabel.className = "quiz-rodadas";
quizLengthLabel.textContent = "Rodada: ";
const quizLength = document.createElement("select");
for (const count of [5, 10, 15]) {
    const option = document.createElement("option");
    option.value = String(count);
    option.textContent = count + " perguntas";
    quizLength.append(option);
}
quizLength.value = "10";
quizLengthLabel.append(quizLength);
const quizCollectionLabel = document.createElement("label");
quizCollectionLabel.className = "quiz-colecao";
quizCollectionLabel.textContent = "Perguntas: ";
const quizCollection = document.createElement("select");
for (const [value, label] of [["todos", "Todos os Pokémon"], ["capturados", "Somente capturados"],
    ["pendentes", "Somente ainda não capturados"],
    ["tipo", "Somente tipo selecionado"], ["erros", "Praticar erros salvos"]]) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    quizCollection.append(option);
}
quizCollectionLabel.append(quizCollection);
const quizScore = document.createElement("p");
quizScore.className = "quiz-placar";
const quizTrainingSummary = document.createElement("p");
quizTrainingSummary.className = "quiz-treino-resumo";
quizTrainingSummary.setAttribute("aria-live", "polite");
const quizProgress = document.createElement("progress");
quizProgress.className = "quiz-progresso";
quizProgress.setAttribute("aria-label", "Perguntas concluídas no quiz");
quizProgress.max = quizRoundSize;
quizProgress.value = 0;
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
quizKeyboardHelp.textContent = "Atalhos: 1 a 6 responder · setas navegar · Home/End primeira ou última · H dica · S pular · N avançar.";
const quizHint = document.createElement("button");
quizHint.type = "button";
quizHint.className = "quiz-dica";
quizHint.textContent = "Revelar dica";
quizHint.setAttribute("aria-label", "Revelar dicas progressivas do Pokémon misterioso");
const quizSkip = document.createElement("button");
quizSkip.type = "button";
quizSkip.className = "quiz-pular";
quizSkip.textContent = "Pular e revisar depois";
quizSkip.setAttribute("aria-label", "Pular pergunta e incluir na revisão de erros");
const quizNext = document.createElement("button");
quizNext.type = "button";
quizNext.className = "quiz-proximo";
quizNext.textContent = "Próxima pergunta";
const quizReview = document.createElement("button");
quizReview.type = "button";
quizReview.className = "quiz-revisao";
quizReview.textContent = "Revisar erros";
quizReview.hidden = true;
const quizClose = document.createElement("button");
quizClose.type = "button";
quizClose.className = "quiz-fechar";
quizClose.textContent = "Fechar quiz";
const quizWeakType = document.createElement("button");
quizWeakType.type = "button";
quizWeakType.className = "quiz-revisao";
quizWeakType.textContent = "Treinar tipo mais difícil";
quizWeakType.hidden = true;
// Local round history is limited and never sent to a remote service.
const quizHistoryDetails = document.createElement("details");
quizHistoryDetails.className = "quiz-historico";
const quizHistorySummary = document.createElement("summary");
quizHistorySummary.textContent = "Últimas rodadas";
const quizHistoryStats = document.createElement("p");
quizHistoryStats.setAttribute("aria-live", "polite");
const quizHistoryFilter = document.createElement("select");
quizHistoryFilter.setAttribute("aria-label", "Filtrar histórico pela dificuldade");
for (const [value, label] of [
    ["todos", "Todas as dificuldades"], ["facil", "Fácil"],
    ["normal", "Normal"], ["especialista", "Especialista"]
]) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    quizHistoryFilter.append(option);
}
const quizHistoryMode = document.createElement("select");
quizHistoryMode.setAttribute("aria-label", "Filtrar histórico pela modalidade");
for (const [value, label] of [
    ["todos", "Todas as modalidades"], ["revisão", "Revisão de erros"],
    ["tipo", "Treino por tipo"], ["capturados", "Capturados"],
    ["pendentes", "Ainda não capturados"], ["erros", "Erros salvos"],
    ["geral", "Catálogo completo"]
]) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    quizHistoryMode.append(option);
}
const quizHistoryList = document.createElement("ol");
const quizHistoryExport = document.createElement("button");
quizHistoryExport.type = "button";
quizHistoryExport.className = "quiz-revisao";
quizHistoryExport.textContent = "Exportar histórico (CSV)";
quizHistoryExport.setAttribute("aria-label", "Exportar as últimas rodadas de treino para CSV");
const quizHistoryBackup = document.createElement("button");
quizHistoryBackup.type = "button";
quizHistoryBackup.className = "quiz-revisao";
quizHistoryBackup.textContent = "Salvar histórico (JSON)";
const quizHistoryRestore = document.createElement("button");
quizHistoryRestore.type = "button";
quizHistoryRestore.className = "quiz-revisao";
quizHistoryRestore.textContent = "Importar histórico (JSON)";
const quizHistoryFile = document.createElement("input");
quizHistoryFile.type = "file";
quizHistoryFile.accept = ".json,application/json";
quizHistoryFile.hidden = true;
const quizHistoryImportStatus = document.createElement("p");
quizHistoryImportStatus.setAttribute("role", "status");
quizHistoryImportStatus.setAttribute("aria-live", "polite");
quizHistoryDetails.append(quizHistorySummary, quizHistoryFilter, quizHistoryMode,
    quizHistoryStats, quizHistoryList, quizHistoryExport, quizHistoryBackup,
    quizHistoryRestore, quizHistoryFile, quizHistoryImportStatus);
quizDialog.append(quizTitle, quizDifficultyLabel, quizLengthLabel, quizCollectionLabel, quizScore, quizTrainingSummary, quizProgress, quizImage, quizKeyboardHelp, quizOptions, quizFeedback, quizHint, quizSkip, quizNext, quizReview, quizWeakType, quizHistoryDetails, quizClose);
document.body.append(quizDialog);

const shuffleQuiz = items => {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index--) {
        const other = Math.floor(Math.random() * (index + 1));
        [result[index], result[other]] = [result[other], result[index]];
    }
    return result;
};
// Separate records by selected training type; never mix electric and grass
// specialist rounds with full-collection or captured-only records.
// A type filter outside the dialog can change while a round is open.
// Snapshot the collection so results cannot be stored under another type.
let activeQuizCollection = "todos";
let activeQuizDifficulty = "normal";
let activeQuizType = "";
function quizCollectionRecordSuffix() {
    if (activeQuizCollection === "capturados") return ":capturados";
    if (activeQuizCollection === "pendentes") return ":pendentes";
    if (activeQuizCollection === "tipo") return ":tipo:" + activeQuizType;
    if (activeQuizCollection === "erros") return ":erros";
    return "";
}
function quizRecordKey() {
    const base = activeQuizDifficulty === "normal" ? QUIZ_KEY : QUIZ_KEY + ":" + activeQuizDifficulty;
    return base + quizCollectionRecordSuffix() +
        (quizRoundSize === 10 ? "" : ":rodadas:" + quizRoundSize);
}
function quizPointsRecordKey() {
    return QUIZ_KEY + ":pontos:" + activeQuizDifficulty +
        quizCollectionRecordSuffix() +
        (quizRoundSize === 10 ? "" : ":rodadas:" + quizRoundSize);
}
function quizStreakRecordKey() {
    return QUIZ_KEY + ":sequencia:" + activeQuizDifficulty +
        quizCollectionRecordSuffix() +
        (quizRoundSize === 10 ? "" : ":rodadas:" + quizRoundSize);
}
function quizStreakRecord() {
    try {
        const saved = Number(localStorage.getItem(quizStreakRecordKey()));
        return Number.isSafeInteger(saved) && saved >= 0 && saved <= quizRoundSize ? saved : 0;
    } catch { return 0; }
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
// Keep the selected collection stable throughout an active quiz. Capture
// changes from other tabs apply to the next game, not mid-question choices.
let quizChoicePool = [];
// Keep consecutive questions from recycling the same wrong answers.
// The question pool and correct answer remain unchanged.
let quizPreviousDistractors = new Set();
let quizIndex = 0;
let quizCorrect = 0;
let quizAnswered = false;
let quizPoints = 0;
let quizStreak = 0;
let quizBestStreak = 0;
let quizHintUsed = false;
let quizHintLevel = 0;
let quizHintsUsed = 0;
let quizMissed = [];
let quizSkipped = 0;
let quizIsReview = false;
// Keep the previous round's species out of fresh practice when alternatives
// exist. Missed Pokémon still take priority in adaptive review.
const QUIZ_RECENT_KEY = "pokedex:quiz-ultimas-perguntas:v1";
function loadRecentQuizNumbers() {
    try {
        const data = JSON.parse(localStorage.getItem(QUIZ_RECENT_KEY) || "[]");
        const known = new Set(quizCards.map(card => card.number));
        return new Set(Array.isArray(data)
            ? data.slice(0, 15).filter(id => typeof id === "string" && known.has(id))
            : []);
    } catch { return new Set(); }
}
let recentQuizNumbers = loadRecentQuizNumbers();
const QUIZ_SESSIONS_KEY = "pokedex:quiz-rodadas:v1";
function validQuizSession(item) {
    return item && typeof item === "object" && !Array.isArray(item) &&
        typeof item.mode === "string" && item.mode.length > 0 && item.mode.length <= 64 &&
        !/[\\x00-\\x1f\\x7f]/.test(item.mode) &&
        ["facil", "normal", "especialista"].includes(item.difficulty) &&
        Number.isSafeInteger(item.total) && item.total >= 1 && item.total <= 15 &&
        Number.isSafeInteger(item.correct) && item.correct >= 0 && item.correct <= item.total &&
        Number.isSafeInteger(item.points) && item.points >= 0 && item.points <= item.total * 2 &&
        Number.isSafeInteger(item.at) && item.at >= 1577836800000 &&
        item.at <= Date.now() + 86400000;
}
function loadQuizSessions() {
    try {
        const data = JSON.parse(localStorage.getItem(QUIZ_SESSIONS_KEY) || "[]");
        if (!Array.isArray(data)) return [];
        return data.slice(0, 8).filter(validQuizSession);
    } catch { return []; }
}
let quizSessions = loadQuizSessions();
function selectedQuizSessions() {
    return quizSessions.filter(session => {
        if (quizHistoryFilter.value !== "todos" &&
            session.difficulty !== quizHistoryFilter.value) return false;
        const mode = quizHistoryMode.value;
        if (mode === "todos") return true;
        if (mode === "tipo") return session.mode.startsWith("tipo ");
        if (mode === "geral") return session.mode === "todos";
        return session.mode === mode;
    });
}
function renderQuizSessions() {
    const selected = selectedQuizSessions();
    quizHistoryList.replaceChildren();
    quizHistorySummary.textContent = "Últimas rodadas (" + selected.length + "/" + quizSessions.length + ")";
    quizHistoryExport.disabled = selected.length === 0;
    quizHistoryBackup.disabled = quizSessions.length === 0;
    const totalQuestions = selected.reduce((sum, session) => sum + session.total, 0);
    const totalCorrect = selected.reduce((sum, session) => sum + session.correct, 0);
    const best = selected.reduce((value, session) =>
        Math.max(value, session.total ? Math.round(100 * session.correct / session.total) : 0), 0);
    const totalPoints = selected.reduce((sum, session) => sum + session.points, 0);
    quizHistoryStats.textContent = totalQuestions
        ? "Precisão nas últimas rodadas: " + Math.round(100 * totalCorrect / totalQuestions) +
          "% · Melhor precisão: " + best + "% · Pontos acumulados: " + totalPoints
        : "Conclua uma rodada para acompanhar sua evolução.";
    for (const session of selected) {
        const item = document.createElement("li");
        item.textContent = new Date(session.at).toLocaleString("pt-BR") +
            " · " + session.mode + " · " + session.difficulty +
            " · " + session.correct + "/" + session.total +
            " acertos · " + session.points + " pontos";
        quizHistoryList.append(item);
    }
    if (!selected.length) {
        const item = document.createElement("li");
        item.textContent = "Nenhuma rodada concluída neste navegador.";
        quizHistoryList.append(item);
    }
}
function recordQuizSession() {
    const mode = quizIsReview ? "revisão" :
        activeQuizCollection === "tipo" ? "tipo " + activeQuizType : activeQuizCollection;
    quizSessions = [{
        mode: mode.slice(0, 64), difficulty: activeQuizDifficulty,
        total: quizRoundSize, correct: quizCorrect, points: quizPoints, at: Date.now()
    }, ...quizSessions].slice(0, 8);
    try { localStorage.setItem(QUIZ_SESSIONS_KEY, JSON.stringify(quizSessions)); }
    catch { /* History stays visible in this session. */ }
    renderQuizSessions();
}
renderQuizSessions();
quizHistoryFilter.addEventListener("change", renderQuizSessions);
quizHistoryMode.addEventListener("change", renderQuizSessions);
quizHistoryExport.addEventListener("click", () => {
    const selected = selectedQuizSessions();
    if (!selected.length) return;
    const cell = value => {
        let safe = String(value ?? "").replace(/[\r\n\u2028\u2029]/g, " ").slice(0, 128);
        if (/^\s*[=+@-]/.test(safe)) safe = "'" + safe;
        return '"' + safe.replace(/"/g, '""') + '"';
    };
    const rows = [
        ["Data", "Modalidade", "Dificuldade", "Perguntas", "Acertos", "Precisão (%)", "Pontos"],
        ...selected.map(session => [
            new Date(session.at).toISOString(), session.mode, session.difficulty,
            session.total, session.correct, Math.round(100 * session.correct / session.total),
            session.points
        ])
    ];
    const csv = "\ufeff" + rows.map(row => row.map(cell).join(";")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "historico-quiz-pokemon.csv";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
});
// Portable local-only backup. Import merges valid rounds without erasing the
// current history or changing quiz records and captured Pokémon.
quizHistoryBackup.addEventListener("click", () => {
    if (!quizSessions.length) return;
    const payload = JSON.stringify({
        schema: "pokedex-quiz-sessions-v1", exportedAt: new Date().toISOString(),
        sessions: quizSessions
    }, null, 2);
    const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "historico-quiz-pokemon.json";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
});
quizHistoryRestore.addEventListener("click", () => quizHistoryFile.click());
quizHistoryFile.addEventListener("change", async () => {
    const file = quizHistoryFile.files?.[0];
    if (!file) return;
    try {
        if (file.size > 32768) throw new Error("Arquivo acima de 32 KB.");
        const data = JSON.parse(await file.text());
        if (!data || data.schema !== "pokedex-quiz-sessions-v1" ||
            !Array.isArray(data.sessions) || data.sessions.length > 8 ||
            !data.sessions.every(validQuizSession)) {
            throw new Error("Formato ou registros inválidos.");
        }
        const unique = new Map();
        for (const session of [...quizSessions, ...data.sessions]) {
            const key = [session.at, session.mode, session.difficulty,
                session.total, session.correct, session.points].join("|");
            unique.set(key, session);
        }
        const merged = [...unique.values()].sort((a, b) => b.at - a.at).slice(0, 8);
        localStorage.setItem(QUIZ_SESSIONS_KEY, JSON.stringify(merged));
        quizSessions = merged;
        renderQuizSessions();
        quizHistoryImportStatus.textContent = "Histórico importado sem substituir as rodadas existentes.";
    } catch (error) {
        quizHistoryImportStatus.textContent =
            "Importação recusada: " + (error instanceof Error ? error.message : "erro de leitura.");
    } finally {
        quizHistoryFile.value = "";
    }
});
window.addEventListener("storage", event => {
    if (event.key === QUIZ_SESSIONS_KEY || event.key === null) {
        quizSessions = loadQuizSessions();
        renderQuizSessions();
    }
});
function quizPointsRecord() {
    try {
        const saved = Number(localStorage.getItem(quizPointsRecordKey()));
        return Number.isSafeInteger(saved) && saved >= 0 && saved <= quizRoundSize * 2 ? saved : 0;
    } catch { return 0; }
}
function updateQuizScore() {
    quizProgress.max = quizRoundSize;
    quizProgress.value = Math.min(quizRoundSize, quizIndex + (quizAnswered ? 1 : 0));
    const answered = Math.min(quizRoundSize, quizIndex + (quizAnswered ? 1 : 0));
    const accuracy = answered ? Math.round(100 * quizCorrect / answered) : 0;
    quizScore.textContent = "Pergunta " + Math.min(quizIndex + 1, quizRoundSize) + "/" + quizRoundSize +
        " · Acertos: " + quizCorrect + " · Pontos: " + quizPoints +
        " · Sequência: " + quizStreak + " · Precisão: " + accuracy + "%" +
        (quizIsReview ? " · Revisão de erros" :
            " · Recorde: " + quizRecord() + " · Recorde de pontos: " + quizPointsRecord() +
            " · Melhor sequência: " + quizStreakRecord());
}

// Explain why the adaptive trainer is choosing these questions. The
// dashboard uses local aggregate statistics, never remote player tracking.
function updateQuizTrainingSummary() {
    const unresolved = quizCards.filter(card => quizPracticeNumbers.has(card.number));
    const historical = [...quizTypeHistory.entries()]
        .filter(([, stats]) => stats.asked >= 3)
        .map(([type, stats]) => ({
            type, attempts: stats.asked,
            accuracy: Math.round(100 * stats.correct / stats.asked),
            mistakes: stats.asked - stats.correct
        }))
        .sort((a, b) => a.accuracy - b.accuracy ||
            b.attempts - a.attempts || a.type.localeCompare(b.type, "pt-BR"));
    const weak = historical.slice(0, 3);
    const practiced = quizCards.length - unresolved.length;
    quizTrainingSummary.textContent =
        "Treino adaptativo: " + unresolved.length + " Pokémon para revisar" +
        " · " + practiced + "/" + quizCards.length + " fora da lista de erros." +
        (weak.length ? " Tipos prioritários: " + weak.map(item =>
            item.type + " (" + item.accuracy + "% de acertos em " +
            item.attempts + " perguntas)").join(", ") + "." :
            " Continue jogando para formar seu histórico por tipo.");
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
    quizSkip.hidden = false;
    quizSkip.disabled = false;
    quizOptions.replaceChildren();
    const current = quizQuestions[quizIndex];
    quizImage.hidden = false;
    quizImage.src = current.image;
    quizImage.alt = "Silhueta de um Pokémon misterioso";
    quizImage.classList.remove("revelada");
    updateQuizScore();
    const choices = quizDifficulty.value === "facil" ? 2 : quizDifficulty.value === "especialista" ? 5 : 3;
    const candidateDistractors = quizChoicePool.filter(card => card.number !== current.number);
    // Specialist rounds choose convincing alternatives, favoring shared types
    // and similar names. Shuffle first to avoid always choosing the same
    // Pokémon on equal scores; normal and easy rounds remain randomized.
    const targetName = normalizarBusca(current.name);
    const difficultyScore = card => {
        const name = normalizarBusca(card.name);
        const sharedTypes = card.types.filter(type => current.types.includes(type)).length;
        // In specialist rounds, previously missed species become useful
        // distractors. Their appearance does not count as another mistake.
        return sharedTypes * 10 +
            (quizPracticeNumbers.has(card.number) ? 3 : 0) +
            Math.round(quizTypeWeakness(card) * 3) +
            (name.charAt(0) === targetName.charAt(0) ? 2 : 0) +
            (Math.abs(name.length - targetName.length) <= 2 ? 1 : 0);
    };
    const rankDistractors = cards => {
        const shuffled = shuffleQuiz(cards);
        return quizDifficulty.value === "especialista"
            ? shuffled.sort((a, b) => difficultyScore(b) - difficultyScore(a))
            : shuffled;
    };
    const fresh = rankDistractors(candidateDistractors.filter(card => !quizPreviousDistractors.has(card.number)));
    const repeats = rankDistractors(candidateDistractors.filter(card => quizPreviousDistractors.has(card.number)));
    const distractors = [...fresh, ...repeats].slice(0, choices);
    quizPreviousDistractors = new Set(distractors.map(card => card.number));
    for (const [index, choice] of shuffleQuiz([current, ...distractors]).entries()) {
        const option = document.createElement("button");
        option.type = "button";
        option.className = "quiz-opcao";
        option.textContent = choice.name;
        option.setAttribute("aria-label", "Opção " + (index + 1) + ": " + choice.name);
        option.setAttribute("aria-keyshortcuts", String(index + 1));
        option.addEventListener("click", () => {
            if (quizAnswered) return;
            quizAnswered = true;
            quizSkip.hidden = true;
            quizSkip.disabled = true;
            quizHint.disabled = true;
            quizHint.hidden = true;
            const correct = choice.name === current.name;
            recordQuizTypeResult(current, correct);
            if (correct) {
                quizCorrect++;
                quizStreak++;
                quizBestStreak = Math.max(quizBestStreak, quizStreak);
                quizPoints += Math.max(0, 2 - quizHintLevel);
            } else {
                quizStreak = 0;
                quizMissed.push(current);
            }
            quizImage.classList.add("revelada");
            quizImage.alt = "Pokémon revelado: " + current.name;
            for (const button of quizOptions.querySelectorAll("button")) {
                button.disabled = true;
                if (button.textContent === current.name) button.classList.add("correta");
                else if (button === option) button.classList.add("incorreta");
            }
            const learningDetail = current.types.length
                ? " Tipo: " + current.types.join(" e ") + "." : "";
            // Explain the selected distractor instead of only revealing the
            // answer. Type overlap helps the player learn close silhouettes.
            const chosenTypes = Array.isArray(choice.types) ? choice.types : [];
            const sharedTypes = chosenTypes.filter(type => current.types.includes(type));
            const comparison = correct ? "" :
                " Você escolheu " + choice.name +
                (chosenTypes.length ? " (" + chosenTypes.join(" e ") + ")." : ".") +
                (sharedTypes.length
                    ? " Tipo em comum: " + sharedTypes.join(" e ") + "."
                    : current.types.length && chosenTypes.length
                        ? " Os tipos dos dois Pokémon são diferentes." : "");
            quizFeedback.textContent = (correct
                ? "Acertou! " + current.name + "."
                : "Resposta correta: " + current.name + ".") + learningDetail + comparison;
            updateQuizScore();
            quizNext.textContent = quizIndex + 1 === quizRoundSize ? "Ver resultado" : "Próxima pergunta";
            quizNext.hidden = false;
            quizNext.focus();
        });
        quizOptions.append(option);
    }
}
quizSkip.addEventListener("click", () => {
    if (quizAnswered || quizIndex >= quizQuestions.length) return;
    quizAnswered = true;
    quizSkipped++;
    quizStreak = 0;
    const current = quizQuestions[quizIndex];
    quizMissed.push(current);
    recordQuizTypeResult(current, false);
    quizImage.classList.add("revelada");
    quizImage.alt = "Pokémon revelado: " + current.name;
    quizHint.disabled = true;
    quizHint.hidden = true;
    quizSkip.hidden = true;
    quizSkip.disabled = true;
    for (const button of quizOptions.querySelectorAll("button")) {
        button.disabled = true;
        if (button.textContent === current.name) button.classList.add("correta");
    }
    quizFeedback.textContent = "Pergunta pulada. Resposta: " + current.name +
        (current.types.length ? ". Tipo: " + current.types.join(" e ") : "") +
        ". Incluída na revisão.";
    updateQuizScore();
    quizNext.textContent = quizIndex + 1 === quizRoundSize ? "Ver resultado" : "Próxima pergunta";
    quizNext.hidden = false;
    quizNext.focus();
});
quizHint.addEventListener("click", () => {
    if (quizAnswered || quizIndex >= quizQuestions.length || quizHint.disabled) return;
    const current = quizQuestions[quizIndex];
    if (quizHintLevel === 0) {
        quizFeedback.textContent = "Dica 1: o nome começa com " + current.name.charAt(0).toUpperCase() + ".";
        quizHint.textContent = "Revelar tipo ou tamanho";
        quizHint.setAttribute("aria-label", "Revelar uma segunda dica sobre o Pokémon");
    } else if (quizHintLevel === 1) {
        const typeText = current.types.length ? current.types.join(" e ") : current.name.length + " letras";
        quizFeedback.textContent += " Dica 2: " + (current.types.length ? "tipo " : "nome com ") + typeText + ".";
        quizHint.textContent = "Eliminar uma alternativa errada";
        quizHint.setAttribute("aria-label", "Eliminar uma opção incorreta da pergunta");
    } else {
        const wrong = [...quizOptions.querySelectorAll("button")]
            .filter(button => !button.disabled && button.textContent !== current.name);
        if (wrong.length) {
            const eliminated = wrong[Math.floor(Math.random() * wrong.length)];
            eliminated.disabled = true;
            eliminated.hidden = true;
            quizFeedback.textContent += " Dica 3: uma alternativa incorreta foi eliminada.";
        }
        quizHint.disabled = true;
    }
    quizHintLevel++;
    quizHintUsed = true;
    quizHintsUsed++;
});
// Interleave training questions by type whenever the selected collection
// permits it. This prevents a review of saved mistakes from presenting a
// long uninterrupted series of near-identical type silhouettes.
function spaceQuizQuestions(cards) {
    const remaining = shuffleQuiz(cards);
    const arranged = [];
    while (remaining.length) {
        const previous = arranged[arranged.length - 1];
        const previousTypes = new Set(Array.isArray(previous?.types) ? previous.types : []);
        const alternative = previousTypes.size
            ? remaining.findIndex(card => Array.isArray(card.types) &&
                card.types.every(type => !previousTypes.has(type))) : -1;
        const index = alternative >= 0 ? alternative : 0;
        arranged.push(remaining.splice(index, 1)[0]);
    }
    return arranged;
}
// Use historical error rates to select targeted practice questions. Only
// types with at least three attempts influence the ranking; untrained types
// remain eligible and shuffled ties preserve variety between sessions.
function quizTypeWeakness(card) {
    return card.types.reduce((highest, type) => {
        const stats = quizTypeHistory.get(type);
        if (!stats || stats.asked < 3) return highest;
        return Math.max(highest, (stats.asked - stats.correct) / stats.asked);
    }, 0);
}
function weakestQuizTrainingType() {
    return [...quizTypeHistory.entries()]
        .filter(([type, stats]) => stats.asked >= 3 && stats.correct < stats.asked &&
            quizCards.filter(card => card.types.includes(type)).length >= 4)
        .sort((a, b) => (b[1].asked - b[1].correct) / b[1].asked -
            (a[1].asked - a[1].correct) / a[1].asked ||
            b[1].asked - a[1].asked || a[0].localeCompare(b[0], "pt-BR"))[0]?.[0] ?? null;
}
// Within a filtered collection, revisit some known mistakes and balance
// the rest toward types with weaker local history. Explicit review mode
// remains unchanged and no remote tracking is introduced.
function selectFocusedQuizQuestions(pool, requested) {
    const mixed = shuffleQuiz(pool);
    const errors = mixed.filter(card => quizPracticeNumbers.has(card.number));
    const fresh = mixed.filter(card => !quizPracticeNumbers.has(card.number))
        .sort((a, b) =>
            Number(recentQuizNumbers.has(a.number)) - Number(recentQuizNumbers.has(b.number)) ||
            quizTypeWeakness(b) - quizTypeWeakness(a));
    const limit = Math.min(pool.length, requested);
    const correctionSlots = Math.min(errors.length, Math.ceil(limit / 2));
    const selected = [...errors.slice(0, correctionSlots),
        ...fresh.slice(0, limit - correctionSlots)];
    if (selected.length < limit) {
        const seen = new Set(selected.map(card => card.number));
        selected.push(...errors.filter(card => !seen.has(card.number))
            .slice(0, limit - selected.length));
    }
    return shuffleQuiz(selected);
}

function startQuiz(review = false, focusType = null) {
    if (quizCards.length < 4) return;
    activeQuizDifficulty = quizDifficulty.value;
    quizDifficulty.disabled = true;
    quizLength.disabled = true;
    quizCollection.disabled = true;
    const capturedCount = quizCards.filter(card => capturados.has(card.number)).length;
    const capturedOption = quizCollection.querySelector('option[value="capturados"]');
    capturedOption.disabled = capturedCount < 4;
    capturedOption.textContent = "Somente capturados (" + capturedCount + ")";
    if (capturedCount < 4 && quizCollection.value === "capturados") quizCollection.value = "todos";
    const pendingCount = quizCards.length - capturedCount;
    const pendingOption = quizCollection.querySelector('option[value="pendentes"]');
    pendingOption.disabled = pendingCount < 4;
    pendingOption.textContent = "Ainda não capturados (" + pendingCount + ")";
    if (pendingOption.disabled && quizCollection.value === "pendentes") quizCollection.value = "todos";
    const selectedType = normalizarBusca(seletorTipo.value);
    const typePool = selectedType ? quizCards.filter(card =>
        card.types.some(type => normalizarBusca(type) === selectedType)) : [];
    const typeOption = quizCollection.querySelector('option[value="tipo"]');
    typeOption.disabled = typePool.length < 4;
    typeOption.textContent = selectedType
        ? "Somente tipo " + seletorTipo.options[seletorTipo.selectedIndex].text +
            " (" + typePool.length + ")"
        : "Somente tipo selecionado (escolha um filtro)";
    if (typeOption.disabled && quizCollection.value === "tipo") quizCollection.value = "todos";
    const mistakesPool = quizCards.filter(card => quizPracticeNumbers.has(card.number));
    const mistakesOption = quizCollection.querySelector('option[value="erros"]');
    mistakesOption.disabled = mistakesPool.length === 0;
    mistakesOption.textContent = "Praticar erros salvos (" + mistakesPool.length + ")";
    if (mistakesOption.disabled && quizCollection.value === "erros") quizCollection.value = "todos";
    const focusedPool = focusType
        ? quizCards.filter(card => card.types.includes(focusType)) : [];
    const useFocus = focusedPool.length >= 4;
    activeQuizCollection = useFocus ? "tipo" : quizCollection.value;
    activeQuizType = useFocus ? focusType : selectedType;
    const pool = useFocus ? focusedPool : quizCollection.value === "capturados"
        ? quizCards.filter(card => capturados.has(card.number))
        : quizCollection.value === "pendentes"
            ? quizCards.filter(card => !capturados.has(card.number))
        : quizCollection.value === "tipo" ? typePool
        : quizCollection.value === "erros" ? mistakesPool : quizCards;
    const reviewPool = review ? [...quizMissed] : [];
    quizIsReview = review && reviewPool.length > 0;
    quizChoicePool = quizIsReview || activeQuizCollection === "erros" ? [...quizCards] : [...pool];
    quizPreviousDistractors.clear();
    const requested = Number(quizLength.value) || 10;
    // General practice revisits a few saved mistakes without turning the
    // entire session into review mode. Correct answers remove them from the
    // persisted practice set, so future sessions adapt automatically.
    const selectedQuestions = (() => {
        if (quizIsReview) return reviewPool;
        if (activeQuizCollection !== "todos") return selectFocusedQuizQuestions(pool, requested);
        const mistakes = shuffleQuiz(pool.filter(card => quizPracticeNumbers.has(card.number)));
        const fresh = shuffleQuiz(pool.filter(card => !quizPracticeNumbers.has(card.number)))
            .sort((a, b) =>
                Number(recentQuizNumbers.has(a.number)) - Number(recentQuizNumbers.has(b.number)) ||
                quizTypeWeakness(b) - quizTypeWeakness(a));
        const practiceSlots = Math.min(mistakes.length, Math.ceil(requested / 2));
        const selected = [...mistakes.slice(0, practiceSlots),
            ...fresh.slice(0, requested - practiceSlots)];
        if (selected.length < requested) {
            const chosen = new Set(selected.map(card => card.number));
            selected.push(...mistakes.filter(card => !chosen.has(card.number))
                .slice(0, requested - selected.length));
        }
        return shuffleQuiz(selected);
    })();
    quizQuestions = spaceQuizQuestions(selectedQuestions);
    quizRoundSize = quizQuestions.length;
    quizMissed = [];
    quizTypeStats = new Map();
    quizReview.hidden = true;
    quizWeakType.hidden = true;
    quizIndex = 0;
    quizCorrect = 0;
    quizPoints = 0;
    quizStreak = 0;
    quizBestStreak = 0;
    quizHintsUsed = 0;
    quizSkipped = 0;
    updateQuizTrainingSummary();
    showQuizQuestion();
}
function finishQuiz() {
    quizDifficulty.disabled = false;
    quizLength.disabled = false;
    quizCollection.disabled = false;
    const best = quizIsReview ? null : Math.max(quizRecord(), quizCorrect);
    const pointRecord = quizIsReview ? null : Math.max(quizPointsRecord(), quizPoints);
    const streakRecord = quizIsReview ? null : Math.max(quizStreakRecord(), quizBestStreak);
    if (!quizIsReview) {
        try { localStorage.setItem(quizRecordKey(), String(best)); }
        catch { /* O placar da sessão continua disponível. */ }
        try { localStorage.setItem(quizPointsRecordKey(), String(pointRecord)); }
        catch { /* O resultado ainda aparece sem armazenamento. */ }
        try { localStorage.setItem(quizStreakRecordKey(), String(streakRecord)); }
        catch { /* A sequência da sessão continua visível. */ }
    }
    recordQuizSession();
    if (!quizIsReview) {
        recentQuizNumbers = new Set(quizQuestions.map(card => card.number).slice(0, 15));
        try { localStorage.setItem(QUIZ_RECENT_KEY, JSON.stringify([...recentQuizNumbers])); }
        catch { /* The current round remains playable without persistence. */ }
    }
    quizIndex = quizRoundSize;
    quizProgress.max = quizRoundSize;
    quizProgress.value = quizRoundSize;
    quizImage.hidden = true;
    quizHint.hidden = true;
    quizSkip.hidden = true;
    quizOptions.replaceChildren();
    quizScore.textContent = (quizIsReview ? "Revisão: " : "Resultado: ") + quizCorrect + "/" + quizRoundSize +
        " · Pontos: " + quizPoints + "/" + (quizRoundSize * 2) +
        (quizIsReview ? " · Recordes originais preservados" :
            " · Recorde: " + best + "/" + quizRoundSize + " · Recorde de pontos: " + pointRecord);
    quizFeedback.textContent = quizCorrect === quizRoundSize
        ? "Sequência perfeita! Todos os Pokémon identificados."
        : "Partida concluída. Tente superar seu recorde.";
    quizFeedback.textContent += " Maior sequência: " + quizBestStreak +
        (quizIsReview ? "" : " (recorde: " + streakRecord + ")") +
        ". Dicas utilizadas: " + quizHintsUsed + ".";
    const accuracy = quizRoundSize ? Math.round(100 * quizCorrect / quizRoundSize) : 0;
    quizFeedback.textContent += " Precisão: " + accuracy + "%.";
    quizFeedback.textContent += " Perguntas puladas: " + quizSkipped + ".";
    // Name the missed silhouettes for targeted practice without storing a
    // separate history or changing the original session's score.
    const reviewNames = [...new Set(quizMissed.map(card => card.name))];
    if (reviewNames.length) {
        quizFeedback.textContent += " Para revisar: " +
            reviewNames.slice(0, 5).join(", ") +
            (reviewNames.length > 5 ? " e mais " + (reviewNames.length - 5) : "") + ".";
    }
    // A type with several missed questions deserves targeted practice.
    // These statistics belong to this round only, not persistent records.
    const weakestTypes = [...quizTypeStats.entries()]
        .filter(([, stats]) => stats.correct < stats.asked)
        .sort((a, b) => (b[1].asked - b[1].correct) -
            (a[1].asked - a[1].correct) || a[0].localeCompare(b[0], "pt-BR"))
        .slice(0, 3);
    if (weakestTypes.length) {
        quizFeedback.textContent += " Tipos para praticar: " +
            weakestTypes.map(([type, stats]) =>
                type + " (" + stats.correct + "/" + stats.asked + " acertos)").join(", ") + ".";
    } else if (quizTypeStats.size) {
        quizFeedback.textContent += " Todos os tipos desta rodada foram identificados corretamente.";
    }
    const historicalPractice = [...quizTypeHistory.entries()]
        .filter(([, stats]) => stats.asked >= 3 && stats.correct < stats.asked)
        .sort((a, b) => (b[1].asked - b[1].correct) -
            (a[1].asked - a[1].correct) || a[0].localeCompare(b[0], "pt-BR"))
        .slice(0, 3);
    if (historicalPractice.length) {
        quizFeedback.textContent += " Histórico de treino: " +
            historicalPractice.map(([type, stats]) =>
                type + " (" + stats.correct + "/" + stats.asked + ")").join(", ") + ".";
    }
    updateQuizTrainingSummary();
    quizReview.hidden = quizMissed.length === 0;
    quizReview.textContent = "Revisar erros (" + quizMissed.length + ")";
    const weakest = weakestQuizTrainingType();
    quizWeakType.hidden = weakest === null;
    quizWeakType.textContent = weakest
        ? "Treinar tipo " + weakest + " (prioridade)" : "Treinar tipo mais difícil";
    quizNext.textContent = "Jogar novamente";
    quizNext.hidden = false;
    quizNext.focus();
}
quizLength.addEventListener("change", () => {
    if (quizDialog.open) startQuiz();
});
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
quizReview.addEventListener("click", () => startQuiz(true));
quizWeakType.addEventListener("click", () => {
    const type = weakestQuizTrainingType();
    if (type) startQuiz(false, type);
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
        target instanceof HTMLTextAreaElement || target?.isContentEditable) return;
    const key = event.key.toLowerCase();
    if (/^[1-6]$/.test(key) && !quizAnswered) {
        // Preserve the visible option number even after a hint removes a
        // wrong answer. Filtering disabled buttons shifted shortcut indices.
        const option = quizOptions.querySelectorAll("button")[Number(key) - 1];
        if (!option || option.disabled || option.hidden) return;
        event.preventDefault();
        option.click();
    } else if ((key === "arrowleft" || key === "arrowright") && !quizAnswered) {
        const options = [...quizOptions.querySelectorAll("button")]
            .filter(button => !button.disabled && !button.hidden);
        if (!options.length) return;
        const current = options.indexOf(document.activeElement);
        const direction = key === "arrowright" ? 1 : -1;
        const next = current < 0 ? 0 : (current + direction + options.length) % options.length;
        event.preventDefault();
        options[next].focus();
    } else if ((key === "home" || key === "end") && !quizAnswered) {
        const options = [...quizOptions.querySelectorAll("button")]
            .filter(button => !button.disabled && !button.hidden);
        if (!options.length) return;
        event.preventDefault();
        options[key === "home" ? 0 : options.length - 1].focus();
    } else if (key === "h" && !quizHint.disabled && !quizHint.hidden) {
        event.preventDefault();
        quizHint.click();
    } else if (key === "s" && !quizSkip.hidden && !quizSkip.disabled) {
        event.preventDefault();
        quizSkip.click();
    } else if (key === "n" && !quizNext.hidden && !quizNext.disabled) {
        event.preventDefault();
        quizNext.click();
    }
});
// Records can improve in another tab while this quiz is open. Refresh the
// visible best score without altering the active question or session points.
window.addEventListener("storage", event => {
    if (!quizDialog.open || quizIndex >= quizRoundSize) return;
    if (event.key === null || (event.key && event.key.startsWith(QUIZ_KEY))) {
        updateQuizScore();
    }
});
quizClose.addEventListener("click", () => quizDialog.close());
quizDialog.addEventListener("close", () => {
    quizDifficulty.disabled = false;
    quizLength.disabled = false;
    quizCollection.disabled = false;
    quizButton.focus();
});
