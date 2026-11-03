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
// Player-marked study species are separate from incorrect answers. They
// remain available after a correct answer until the player unmarks them.
const QUIZ_PINNED_KEY = "pokedex:quiz-marcados:v1";
function loadQuizPinned() {
    try {
        const saved = JSON.parse(localStorage.getItem(QUIZ_PINNED_KEY) || "[]");
        const known = new Set(quizCards.map(card => card.number));
        return new Set(Array.isArray(saved) && saved.length <= quizCards.length
            ? saved.filter(id => typeof id === "string" && known.has(id))
            : []);
    } catch { return new Set(); }
}
let quizPinnedNumbers = loadQuizPinned();
function saveQuizPinned() {
    try { localStorage.setItem(QUIZ_PINNED_KEY,
        JSON.stringify([...quizPinnedNumbers].slice(0, quizCards.length))); }
    catch { /* Study markers remain available in this tab. */ }
}
window.addEventListener("storage", event => {
    if (event.key === QUIZ_PINNED_KEY || event.key === null)
        quizPinnedNumbers = loadQuizPinned();
});
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

// Spaced repetition remains local to this browser and never changes captures
// or original quiz records. A mistake returns in one day; successful reviews
// extend the next interval to three and then seven days.
const QUIZ_SPACED_KEY = "pokedex:quiz-revisoes:v1";
const QUIZ_DAY_MS = 86400000;
function loadSpacedReviews() {
    try {
        const raw = JSON.parse(localStorage.getItem(QUIZ_SPACED_KEY) || "[]");
        if (!Array.isArray(raw) || raw.length > quizCards.length) return new Map();
        const known = new Set(quizCards.map(card => card.number));
        const reviews = new Map();
        for (const item of raw) {
            if (!Array.isArray(item) || item.length !== 2 || !known.has(item[0])) continue;
            const entry = item[1];
            if (!entry || !Number.isSafeInteger(entry.step) || entry.step < 0 ||
                entry.step > 2 || !Number.isSafeInteger(entry.dueAt) ||
                entry.dueAt < 1577836800000 ||
                entry.dueAt > Date.now() + 8 * QUIZ_DAY_MS) continue;
            reviews.set(item[0], {step: entry.step, dueAt: entry.dueAt});
        }
        return reviews;
    } catch { return new Map(); }
}
let quizSpacedReviews = loadSpacedReviews();
function saveSpacedReviews() {
    try { localStorage.setItem(QUIZ_SPACED_KEY,
        JSON.stringify([...quizSpacedReviews].slice(0, quizCards.length))); }
    catch { /* Revisões continuam disponíveis durante esta sessão. */ }
}
function dueReviewCards() {
    const now = Date.now();
    // Oldest missed review comes first, independent of Pokédex display order.
    // An invalid persisted timestamp must never outrank genuine overdue work.
    return quizCards.filter(card => {
        const entry = quizSpacedReviews.get(card.number);
        return entry && Number.isSafeInteger(entry.dueAt) &&
            entry.dueAt > 0 && entry.dueAt <= now;
    }).sort((left, right) => {
        const leftDue = quizSpacedReviews.get(left.number).dueAt;
        const rightDue = quizSpacedReviews.get(right.number).dueAt;
        return leftDue - rightDue ||
            String(left.number).localeCompare(String(right.number), "pt-BR",
                {numeric:true});
    });
}
function recordSpacedReview(pokemon, correct) {
    const previous = quizSpacedReviews.get(pokemon.number);
    // First-time mistakes must start a review schedule. Previously the
    // missing previous entry was dereferenced, aborting quiz feedback.
    if (!previous && correct) return;
    const previousStep = previous && Number.isSafeInteger(previous.step)
        && previous.step >= 0 && previous.step <= 2 ? previous.step : 0;
    const step = correct ? Math.min(2, previousStep + 1) : 0;
    const interval = [1, 3, 7][step];
    // Keep the intended local calendar day across daylight-saving changes.
    // A day of study is not always exactly 24 hours in local time.
    const due = new Date();
    due.setDate(due.getDate() + interval);
    quizSpacedReviews.set(pokemon.number, {
        step, dueAt: due.getTime()
    });
    saveSpacedReviews();
    updateDueReviewButton();
}
window.addEventListener("storage", event => {
    if (event.key === QUIZ_SPACED_KEY || event.key === null) {
        quizSpacedReviews = loadSpacedReviews();
        updateDueReviewButton();
    }
});
function recordQuizTypeResult(pokemon, correct) {
    recordSpacedReview(pokemon, correct);
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
const quizDueButton = document.createElement("button");
quizDueButton.type = "button";
quizDueButton.className = "abrir-quiz";
quizButton.insertAdjacentElement("afterend", quizDueButton);
// Focused rescue mode: only reviews overdue by at least seven full days.
// A five-question session reduces the cost of clearing an overdue backlog.
// It uses the same spaced-review scoring and never changes deadlines upfront.
const quizQuickReviewButton = document.createElement("button");
quizQuickReviewButton.type = "button";
quizQuickReviewButton.className = "abrir-quiz";
quizQuickReviewButton.textContent = "Revisão rápida (até 5)";
quizQuickReviewButton.setAttribute("aria-label",
    "Treinar até cinco revisões vencidas, começando pelas mais antigas");
quizDueButton.insertAdjacentElement("afterend", quizQuickReviewButton);
quizQuickReviewButton.addEventListener("click", () =>
    launchQuizRound(false, null, true, 0, false, 5));
const quizBalancedDueButton = document.createElement("button");
quizBalancedDueButton.type = "button";
quizBalancedDueButton.className = "abrir-quiz";
quizBalancedDueButton.textContent = "Revisão equilibrada (até 10)";
quizBalancedDueButton.setAttribute("aria-label",
    "Misturar revisões vencidas com erros anteriores e outras espécies");
quizQuickReviewButton.insertAdjacentElement("afterend", quizBalancedDueButton);
quizBalancedDueButton.addEventListener("click", () =>
    launchQuizRound(false, null, true, 0, false, 10, true));
const quizUrgentReviewButton = document.createElement("button");
quizUrgentReviewButton.type = "button";
quizUrgentReviewButton.className = "abrir-quiz";
quizUrgentReviewButton.textContent = "Revisar atrasos de 7+ dias";
quizDueButton.insertAdjacentElement("afterend", quizUrgentReviewButton);
quizUrgentReviewButton.addEventListener("click", () =>
    launchQuizRound(false, null, true, 7));
// Practice only cards that are both overdue and still in the mistake queue.
// This uses the existing spaced-review engine without changing due dates.
const quizDueMistakesButton = document.createElement("button");
quizDueMistakesButton.type = "button";
quizDueMistakesButton.className = "abrir-quiz";
quizDueMistakesButton.textContent = "Revisar erros vencidos";
quizUrgentReviewButton.insertAdjacentElement("afterend", quizDueMistakesButton);
quizDueMistakesButton.addEventListener("click", () =>
    launchQuizRound(false, null, true, 0, true));
const quizPracticeQueue = document.createElement("button");
quizPracticeQueue.type = "button";
quizPracticeQueue.className = "abrir-quiz";
quizPracticeQueue.textContent = "Exportar fila de treino (CSV)";
quizPracticeQueue.setAttribute("aria-label",
    "Baixar lista priorizada de Pokémon com revisões vencidas e erros anteriores");
quizDueButton.insertAdjacentElement("afterend", quizPracticeQueue);
// Target the most represented type among currently overdue review cards.
const quizDueTypeButton = document.createElement("button");
quizDueTypeButton.type = "button";
quizDueTypeButton.className = "abrir-quiz";
quizDueTypeButton.textContent = "Revisar tipo mais atrasado";
quizDueButton.insertAdjacentElement("afterend", quizDueTypeButton);
quizDueTypeButton.addEventListener("click", () => {
    const counts = new Map();
    for (const card of dueReviewCards()) {
        for (const type of card.types)
            counts.set(type, (counts.get(type) || 0) + 1);
    }
    const chosen = [...counts].sort((a, b) =>
        b[1] - a[1] || a[0].localeCompare(b[0], "pt-BR"))[0];
    if (chosen) launchQuizRound(false, chosen[0], true);
});
// A playable training entry point based on actual historical mistakes.
// Require a meaningful sample so one accidental error cannot dominate.
const quizWeakTypeButton = document.createElement("button");
quizWeakTypeButton.type = "button";
quizWeakTypeButton.className = "abrir-quiz";
quizWeakTypeButton.textContent = "Treinar meu tipo mais difícil";
quizWeakTypeButton.setAttribute("aria-label",
    "Iniciar quiz do tipo com maior taxa de erros em pelo menos três perguntas");
quizDueTypeButton.insertAdjacentElement("afterend", quizWeakTypeButton);
quizWeakTypeButton.addEventListener("click", () => {
    const ranked = [...quizTypeHistory.entries()]
        .filter(([type, stats]) => quizCards.some(card => card.types.includes(type)) &&
            Number.isSafeInteger(stats.asked) && stats.asked >= 3 &&
            Number.isSafeInteger(stats.correct) && stats.correct <= stats.asked)
        .map(([type, stats]) => ({
            type, asked: stats.asked, mistakes: stats.asked - stats.correct,
            missRate: (stats.asked - stats.correct) / stats.asked
        }))
        .filter(item => item.mistakes > 0)
        .sort((a, b) => b.missRate - a.missRate ||
            b.mistakes - a.mistakes || b.asked - a.asked ||
            a.type.localeCompare(b.type, "pt-BR"));
    if (!ranked.length) {
        quizNextReviewStatus.textContent =
            "Responda pelo menos três questões de um tipo antes do treino direcionado.";
        return;
    }
    quizNextReviewStatus.textContent =
        "Treino direcionado: " + ranked[0].type + " (" +
        Math.round(ranked[0].missRate * 100) + "% de erros históricos).";
    launchQuizRound(false, ranked[0].type);
});
const quizNextReviewStatus = document.createElement("p");
quizNextReviewStatus.setAttribute("role", "status");
quizNextReviewStatus.setAttribute("aria-live", "polite");
quizDueButton.insertAdjacentElement("afterend", quizNextReviewStatus);
// Forecast the local study queue without changing review dates or records.
const quizForecastButton = document.createElement("button");
quizForecastButton.type = "button";
quizForecastButton.className = "abrir-quiz";
quizForecastButton.textContent = "Prever revisões dos próximos 7 dias";
quizNextReviewStatus.insertAdjacentElement("afterend", quizForecastButton);
const quizForecastStatus = document.createElement("p");
quizForecastStatus.setAttribute("role", "status");
quizForecastStatus.setAttribute("aria-live", "polite");
quizForecastButton.insertAdjacentElement("afterend", quizForecastStatus);
quizForecastButton.addEventListener("click", () => {
    const now = Date.now();
    const known = new Set(quizCards.map(card => card.number));
    const counts = Array(7).fill(0);
    let overdue = 0, scheduled = 0;
    for (const [number, review] of quizSpacedReviews) {
        if (!known.has(number) || !review ||
            !Number.isSafeInteger(review.dueAt) || review.dueAt <= 0) continue;
        if (review.dueAt <= now) { overdue++; continue; }
        const day = Math.floor((review.dueAt - now - 1) / QUIZ_DAY_MS);
        if (day >= 0 && day < 7) { counts[day]++; scheduled++; }
    }
    const parts = counts.map((count, day) =>
        (day === 0 ? "Próximas 24h" : "Dia " + (day + 1)) + ": " + count);
    quizForecastStatus.textContent = "Vencidas: " + overdue +
        " · Agendadas nos próximos 7 dias: " + scheduled +
        ". " + parts.join(" · ") +
        ". Projeção local, sem alterar prazos.";
});
function updateDueReviewButton() {
    const due = dueReviewCards().length;
    quizDueButton.textContent = "Revisões espaçadas pendentes (" + due + ")";
    quizDueButton.disabled = due === 0;
    quizQuickReviewButton.disabled = due === 0;
    quizBalancedDueButton.disabled = due === 0;
    quizDueTypeButton.disabled = due === 0;
    const urgent = dueReviewCards().filter(card =>
        quizSpacedReviews.get(card.number)?.dueAt <= Date.now() - 7 * QUIZ_DAY_MS).length;
    quizUrgentReviewButton.disabled = urgent === 0;
    const dueMistakes = dueReviewCards().filter(card =>
        quizPracticeNumbers.has(card.number)).length;
    quizDueMistakesButton.disabled = dueMistakes === 0;
    quizDueMistakesButton.textContent =
        "Revisar erros vencidos (" + dueMistakes + ")";
    quizUrgentReviewButton.textContent = "Revisar atrasos de 7+ dias (" + urgent + ")";
    quizDueButton.setAttribute("aria-label", due
        ? "Iniciar revisão de " + due + " Pokémon com prazo vencido"
        : "Nenhuma revisão espaçada pendente");
    const now = Date.now();
    const known = new Set(quizCards.map(card => card.number));
    const upcoming = [...quizSpacedReviews.entries()]
        .filter(([number, review]) => known.has(number) &&
            review && Number.isSafeInteger(review.dueAt) && review.dueAt > now)
        .sort((a, b) => a[1].dueAt - b[1].dueAt);
    if (due) {
        const oldest = dueReviewCards().reduce((min, card) => {
            const deadline = quizSpacedReviews.get(card.number)?.dueAt;
            return Number.isSafeInteger(deadline) ? Math.min(min, deadline) : min;
        }, now);
        const daysLate = Math.max(0, Math.floor((now - oldest) / QUIZ_DAY_MS));
        quizNextReviewStatus.textContent =
            due + " revisão(ões) vencida(s). Mais antiga há " +
            daysLate + " dia(s). O treino prioriza os prazos mais antigos.";
    } else if (upcoming.length) {
        quizNextReviewStatus.textContent = "Próxima revisão: " +
            new Date(upcoming[0][1].dueAt).toLocaleString("pt-BR") +
            " (" + upcoming.length + " agendada(s)).";
    } else {
        quizNextReviewStatus.textContent = "Nenhuma revisão futura agendada.";
    }
}
updateDueReviewButton();
// The review queue can cross a calendar boundary while the tab is inactive.
// Recompute visible counters when the player returns without changing any due date.
window.addEventListener("focus", () => updateDueReviewButton());
document.addEventListener("visibilitychange", () => {
    if (!document.hidden) updateDueReviewButton();
});

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
    ["tipo", "Somente tipo selecionado"], ["erros", "Praticar erros salvos"],
    ["marcados", "Somente marcados para estudar"]]) {
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
quizKeyboardHelp.textContent = "Atalhos: 1 a 6 responder · setas navegar · Home/End primeira ou última · H dica · S pular · N avançar · P pausar · R repetir rodada · M revisar erros (ao concluir).";
const quizHint = document.createElement("button");
quizHint.type = "button";
quizHint.className = "quiz-dica";
quizHint.textContent = "Revelar dica";
quizHint.setAttribute("aria-label", "Revelar dicas progressivas do Pokémon misterioso");
const quizPin = document.createElement("button");
quizPin.type = "button";
quizPin.className = "quiz-dica";
quizPin.textContent = "Marcar para estudar";
quizPin.setAttribute("aria-label", "Marcar esta espécie para uma revisão manual");
quizPin.setAttribute("aria-pressed", "false");
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
// Replays the completed question set as an unranked practice round.
const quizReplay = document.createElement("button");
quizReplay.type = "button";
quizReplay.className = "quiz-revisao";
quizReplay.textContent = "Repetir perguntas desta rodada";
quizReplay.hidden = true;
quizReplay.setAttribute("aria-label",
    "Repetir as mesmas espécies em nova ordem sem alterar recordes");

const quizPause = document.createElement("button");
quizPause.type = "button";
quizPause.className = "quiz-fechar";
quizPause.textContent = "Pausar e continuar depois";
quizPause.setAttribute("aria-label",
    "Pausar a rodada atual e permitir retomá-la sem perder a pontuação");
quizPause.addEventListener("click", () => {
    if (quizDialog.open && quizIndex < quizRoundSize) quizDialog.close();
});
const quizClose = document.createElement("button");
quizClose.type = "button";
quizClose.className = "quiz-fechar";
quizClose.textContent = "Fechar quiz";
const quizExportMistakes = document.createElement("button");
quizExportMistakes.type = "button";
quizExportMistakes.className = "quiz-revisao";
quizExportMistakes.textContent = "Exportar erros desta rodada (CSV)";
quizExportMistakes.hidden = true;
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
const quizTrendStatus = document.createElement("p");
quizTrendStatus.setAttribute("role", "status");
quizTrendStatus.setAttribute("aria-live", "polite");
// Compare question-weighted accuracy, not averages of unequal round sizes.
function updateQuizLearningTrend(sessions) {
    if (sessions.length < 4) {
        quizTrendStatus.textContent =
            "Evolução: conclua quatro rodadas comparáveis para acompanhar a tendência.";
        return;
    }
    const latest = sessions.slice(0, 2);
    const previous = sessions.slice(2, 4);
    const summarize = group => {
        const questions = group.reduce((sum, item) => sum + item.total, 0);
        const correct = group.reduce((sum, item) => sum + item.correct, 0);
        return {questions, accuracy: questions ? Math.round(100 * correct / questions) : 0};
    };
    const now = summarize(latest);
    const before = summarize(previous);
    const change = now.accuracy - before.accuracy;
    const mixedDifficulty = new Set([...latest, ...previous].map(
        item => item.difficulty)).size > 1;
    quizTrendStatus.textContent = "Evolução nas quatro últimas rodadas: " +
        before.accuracy + "% para " + now.accuracy + "% (" +
        (change > 0 ? "+" : "") + change + " ponto(s) percentuais). " +
        "Amostra: " + before.questions + " e " + now.questions +
        " perguntas. " + (mixedDifficulty
            ? "Dificuldades diferentes; não compare como melhora confirmada."
            : "Tendência indicativa, não avaliação definitiva.");
}

quizHistoryStats.setAttribute("aria-live", "polite");
const quizDailyProgress = document.createElement("p");
quizDailyProgress.setAttribute("role", "status");
quizDailyProgress.setAttribute("aria-live", "polite");
// The daily target is a local preference; no cloud account or score changes.
const QUIZ_DAILY_GOAL_KEY = "pokedex:quiz-meta-diaria:v1";
const quizDailyGoal = document.createElement("select");
quizDailyGoal.setAttribute("aria-label", "Meta diária de rodadas");
for (const goal of [1, 3, 5]) {
    const option = document.createElement("option");
    option.value = String(goal);
    option.textContent = "Meta: " + goal + " rodada(s) por dia";
    quizDailyGoal.append(option);
}
try {
    const savedGoal = localStorage.getItem(QUIZ_DAILY_GOAL_KEY);
    if (["1", "3", "5"].includes(savedGoal)) quizDailyGoal.value = savedGoal;
    else quizDailyGoal.value = "3";
} catch { quizDailyGoal.value = "3"; }
quizDailyGoal.addEventListener("change", () => {
    try { localStorage.setItem(QUIZ_DAILY_GOAL_KEY, quizDailyGoal.value); }
    catch { /* Preference stays active for this session. */ }
    renderQuizSessions();
});
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
const quizHistoryRecommendation = document.createElement("p");
quizHistoryRecommendation.setAttribute("aria-live", "polite");
const quizHistoryPractice = document.createElement("button");
quizHistoryPractice.type = "button";
quizHistoryPractice.className = "quiz-revisao";
quizHistoryPractice.textContent = "Treinar dificuldade prioritária";
quizHistoryPractice.disabled = true;
const quizWeakestTypePractice = document.createElement("button");
quizWeakestTypePractice.type = "button";
quizWeakestTypePractice.className = "quiz-revisao";
quizWeakestTypePractice.textContent = "Treinar tipo com mais erros";
quizWeakestTypePractice.setAttribute("aria-label",
    "Iniciar treino direcionado ao tipo com menor precisão no histórico local");
// Five-question sprint prioritizes overdue spaced reviews, then weak types.
// Uses the existing local quiz engine and never uploads player progress.
// Keep an interrupted round in memory when the player closes the dialog.
// Nothing is uploaded or persisted; reloading the page discards the session.
const quizResumeButton = document.createElement("button");
quizResumeButton.type = "button";
quizResumeButton.className = "quiz-revisao";
quizResumeButton.textContent = "Retomar quiz interrompido";
quizResumeButton.hidden = true;
quizResumeButton.setAttribute("aria-label",
    "Retomar a pergunta atual sem reiniciar pontos ou sequência");
quizButton.insertAdjacentElement("afterend", quizResumeButton);
quizResumeButton.addEventListener("click", () => {
    if (!quizQuestions.length || quizIndex >= quizRoundSize || quizDialog.open) return;
    quizDifficulty.disabled = true;
    quizLength.disabled = true;
    quizCollection.disabled = true;
    quizResumeButton.hidden = true;
    quizDialog.showModal();
});

const quizDailySprint = document.createElement("button");
quizDailySprint.type = "button";
quizDailySprint.className = "quiz-revisao";
quizDailySprint.textContent = "Treino rápido adaptativo (5 perguntas)";
quizDailySprint.setAttribute("aria-label",
    "Iniciar cinco perguntas priorizando revisões vencidas e tipos com erros");
const quizHistoryList = document.createElement("ol");
const quizHistoryExport = document.createElement("button");
quizHistoryExport.type = "button";
quizHistoryExport.className = "quiz-revisao";
quizHistoryExport.textContent = "Exportar histórico (CSV)";
quizHistoryExport.setAttribute("aria-label", "Exportar as últimas rodadas de treino para CSV");
const quizDailyExport = document.createElement("button");
quizDailyExport.type = "button";
quizDailyExport.className = "quiz-revisao";
quizDailyExport.textContent = "Exportar atividade dos últimos 7 dias (CSV)";
const quizWeeklyPlan = document.createElement("button");
quizWeeklyPlan.type = "button";
quizWeeklyPlan.className = "quiz-revisao";
quizWeeklyPlan.textContent = "Copiar plano de treino de 7 dias";
quizWeeklyPlan.setAttribute("aria-label",
    "Copiar um plano semanal de treino com metas diárias e tipos prioritários");
// Read-only study queue grouped by type and due date.
const quizReviewTypePlan = document.createElement("button");
quizReviewTypePlan.type = "button";
quizReviewTypePlan.className = "quiz-revisao";
quizReviewTypePlan.textContent = "Copiar prioridades das revisões por tipo";
quizReviewTypePlan.setAttribute("aria-label",
    "Copiar revisões vencidas e próximas por tipo sem alterar o histórico");
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
// Export a local revision calendar without sharing capture or account data.
const quizReviewCalendarExport = document.createElement("button");
quizReviewCalendarExport.type = "button";
quizReviewCalendarExport.className = "quiz-revisao";
quizReviewCalendarExport.textContent = "Exportar agenda de revisões (CSV)";
quizReviewCalendarExport.setAttribute("aria-label",
    "Exportar Pokémon agendados, intervalo e próxima revisão em CSV");
// Calendar export uses only the player's local spaced-repetition schedule.
// No account, capture history or personal identifier is uploaded.
const quizReviewCalendarIcs = document.createElement("button");
quizReviewCalendarIcs.type = "button";
quizReviewCalendarIcs.className = "quiz-revisao";
quizReviewCalendarIcs.textContent = "Adicionar revisões ao calendário (ICS)";
quizReviewCalendarIcs.setAttribute("aria-label",
    "Baixar lembretes de revisão espaçada para calendário local");
// Aggregate the next seven local study days without exposing captures or
// changing the spaced-repetition queue.
const quizReviewWorkload = document.createElement("button");
quizReviewWorkload.type = "button";
quizReviewWorkload.className = "quiz-revisao";
quizReviewWorkload.textContent = "Resumo de revisões da semana (CSV)";
quizReviewWorkload.setAttribute("aria-label",
    "Exportar contagens diárias de revisões pendentes e futuras");
// A local prioritized revision queue, never modifying capture or review state.
// Aggregate-only handoff for seven study days; never includes captures,
// personal identifiers or individual Pokémon records.
const quizWeeklyCopyPlan = document.createElement("button");
quizWeeklyCopyPlan.type = "button";
quizWeeklyCopyPlan.className = "quiz-revisao";
quizWeeklyCopyPlan.textContent = "Copiar plano semanal de estudos";
quizWeeklyCopyPlan.setAttribute("aria-label",
    "Copiar contagens de revisões espaçadas por dia, sem dados pessoais");
// Suggested study allocation never changes actual spaced-review deadlines.
const quizBalancedPlan = document.createElement("button");
quizBalancedPlan.type = "button";
quizBalancedPlan.className = "quiz-revisao";
quizBalancedPlan.textContent = "Copiar plano equilibrado (10 revisões/dia)";
quizBalancedPlan.setAttribute("aria-label",
    "Distribuir revisões previstas em sete dias sem alterar vencimentos");
// Aggregate overdue revision bands without exposing Pokémon identities.
const quizBacklogTriage = document.createElement("button");
quizBacklogTriage.type = "button";
quizBacklogTriage.className = "quiz-revisao";
quizBacklogTriage.textContent = "Copiar diagnóstico de revisões atrasadas";
quizBacklogTriage.setAttribute("aria-label",
    "Copiar contagens de revisões por atraso e intervalo de estudo");

// Start a focused overdue practice round without altering due dates.
const quizDueNowPractice = document.createElement("button");
quizDueNowPractice.type = "button";
quizDueNowPractice.className = "quiz-revisao";
quizDueNowPractice.textContent = "Revisar vencimentos de hoje (sem alterar recordes)";
quizDueNowPractice.setAttribute("aria-label",
    "Iniciar prática de revisões vencidas, preservando recordes do quiz");

const quizDueMistakesPractice = document.createElement("button");
quizDueMistakesPractice.type = "button";
quizDueMistakesPractice.className = "quiz-revisao";
quizDueMistakesPractice.textContent = "Treinar erros com revisão vencida";
quizDueMistakesPractice.setAttribute("aria-label",
    "Praticar apenas erros salvos com revisão vencida, sem alterar recordes");

// Pinned overdue cards get a focused non-competitive practice round.
const quizPinnedDuePractice = document.createElement("button");
quizPinnedDuePractice.type = "button";
quizPinnedDuePractice.className = "quiz-revisao";
quizPinnedDuePractice.textContent = "Treinar Pokémon marcados e vencidos";
quizPinnedDuePractice.setAttribute("aria-label",
    "Praticar somente revisões vencidas marcadas, sem ranking");

const quizOverduePractice = document.createElement("button");
quizOverduePractice.type = "button";
quizOverduePractice.className = "quiz-revisao";
quizOverduePractice.textContent = "Treinar revisões atrasadas 7+ dias";
quizOverduePractice.setAttribute("aria-label",
    "Iniciar treino com revisões vencidas há pelo menos sete dias");

const quizPriorityExport = document.createElement("button");
quizPriorityExport.type = "button";
quizPriorityExport.className = "quiz-revisao";
quizPriorityExport.textContent = "Exportar fila prioritária de revisões (CSV)";
quizPriorityExport.setAttribute("aria-label",
    "Baixar revisões vencidas e próximas ordenadas por prazo");
quizHistoryDetails.append(quizHistorySummary, quizHistoryFilter, quizHistoryMode,
    quizHistoryStats, quizTrendStatus, quizDailyGoal, quizDailyProgress, quizHistoryRecommendation, quizHistoryPractice, quizWeakestTypePractice, quizDailySprint,
    quizHistoryList, quizHistoryExport, quizDailyExport, quizReviewCalendarExport, quizReviewCalendarIcs, quizReviewWorkload, quizWeeklyCopyPlan, quizBalancedPlan, quizPriorityExport, quizBacklogTriage, quizOverduePractice, quizDueNowPractice, quizDueMistakesPractice, quizPinnedDuePractice, quizWeeklyPlan, quizReviewTypePlan, quizHistoryBackup,
    quizHistoryRestore, quizHistoryFile, quizHistoryImportStatus);
quizDialog.append(quizTitle, quizDifficultyLabel, quizLengthLabel, quizCollectionLabel, quizScore, quizTrainingSummary, quizProgress, quizImage, quizKeyboardHelp, quizOptions, quizFeedback, quizHint, quizPin, quizSkip, quizNext, quizReview, quizWeakType, quizExportMistakes, quizReplay, quizHistoryDetails, quizPause, quizClose);
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
// Round-wide variety: prefer new wrong answers before recycling old ones.
let quizRoundDistractors = new Set();
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
let quizUnavailable = 0;
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
// Daily practice progress is local to this browser and independent of
// the eight-round history limit. Keep only seven local calendar days.
const QUIZ_ACTIVITY_KEY = "pokedex:quiz-atividade:v1";
function quizLocalDay(timestamp) {
    const day = new Date(timestamp);
    return day.getFullYear() + "-" +
        String(day.getMonth() + 1).padStart(2, "0") + "-" +
        String(day.getDate()).padStart(2, "0");
}
function recentQuizDays() {
    const days = [];
    for (let index = 0; index < 7; index++) {
        const date = new Date();
        date.setHours(12, 0, 0, 0);
        date.setDate(date.getDate() - index);
        days.push(quizLocalDay(date.getTime()));
    }
    return days;
}
function loadQuizActivity() {
    let raw = {};
    try { raw = JSON.parse(localStorage.getItem(QUIZ_ACTIVITY_KEY) || "{}"); }
    catch { raw = {}; }
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) raw = {};
    const activity = {};
    for (const day of recentQuizDays()) {
        const stored = raw[day];
        const fromHistory = quizSessions.filter(session =>
            quizLocalDay(session.at) === day).length;
        activity[day] = Math.max(
            Number.isSafeInteger(stored) && stored >= 0 && stored <= 1000 ? stored : 0,
            fromHistory
        );
    }
    return activity;
}
let quizActivity = loadQuizActivity();
function recordQuizActivity() {
    const today = quizLocalDay(Date.now());
    const allowed = recentQuizDays();
    quizActivity = Object.fromEntries(allowed.map(day => [
        day, day === today ? Math.min(1000, (quizActivity[day] || 0) + 1) :
            (quizActivity[day] || 0)
    ]));
    try { localStorage.setItem(QUIZ_ACTIVITY_KEY, JSON.stringify(quizActivity)); }
    catch { /* A meta continua disponível durante esta sessão. */ }
}
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
// A weighted comparison avoids treating a five-question round as equal to
// fifteen questions. Review rounds do not bias difficulty recommendations.
function recommendedQuizDifficulty() {
    const totals = new Map();
    for (const session of quizSessions) {
        if (session.mode === "revisão") continue;
        const entry = totals.get(session.difficulty) || { total: 0, correct: 0 };
        entry.total += session.total;
        entry.correct += session.correct;
        totals.set(session.difficulty, entry);
    }
    const ranked = [...totals.entries()].filter(([, item]) => item.total >= 5)
        .sort((a, b) => a[1].correct / a[1].total -
            b[1].correct / b[1].total ||
            b[1].total - a[1].total || a[0].localeCompare(b[0]));
    return ranked.length ? {
        difficulty: ranked[0][0], questions: ranked[0][1].total,
        accuracy: Math.round(100 * ranked[0][1].correct / ranked[0][1].total)
    } : null;
}
function renderQuizSessions() {
    const selected = selectedQuizSessions();
    updateQuizLearningTrend(selected);
    const recentDays = recentQuizDays();
    const todayCount = quizActivity[recentDays[0]] || 0;
    const activeDays = recentDays.filter(day => (quizActivity[day] || 0) > 0).length;
    const weeklyRounds = recentDays.reduce((sum, day) =>
        sum + (quizActivity[day] || 0), 0);
    const dailyGoal = Number(quizDailyGoal.value) || 3;
    let streak = 0;
    // A streak can include yesterday when today's goal is still pending.
    for (const [index, day] of recentDays.entries()) {
        if ((quizActivity[day] || 0) >= dailyGoal) streak++;
        else if (index !== 0 || streak > 0) break;
    }
    quizDailyProgress.textContent = "Meta diária: " +
        Math.min(todayCount, dailyGoal) + "/" + dailyGoal + " rodadas" +
        (todayCount >= dailyGoal ? " · meta concluída" : "") +
        " · Sequência: " + streak + " dia(s) com meta atingida" +
        " · Últimos 7 dias: " + weeklyRounds + " rodada(s) em " +
        activeDays + " dia(s) de prática.";
    quizHistoryList.replaceChildren();
    quizHistorySummary.textContent = "Últimas rodadas (" + selected.length + "/" + quizSessions.length + ")";
    quizHistoryExport.disabled = selected.length === 0;
    quizHistoryBackup.disabled = quizSessions.length === 0;
    const recommendation = recommendedQuizDifficulty();
    quizHistoryPractice.disabled = !recommendation;
    quizHistoryRecommendation.textContent = recommendation
        ? "Treino sugerido: " + recommendation.difficulty +
          " · " + recommendation.accuracy + "% de acertos em " +
          recommendation.questions + " perguntas registradas."
        : "Conclua uma rodada de pelo menos cinco perguntas para receber uma sugestão.";
    const totalQuestions = selected.reduce((sum, session) => sum + session.total, 0);
    const totalCorrect = selected.reduce((sum, session) => sum + session.correct, 0);
    const best = selected.reduce((value, session) =>
        Math.max(value, session.total ? Math.round(100 * session.correct / session.total) : 0), 0);
    const totalPoints = selected.reduce((sum, session) => sum + session.points, 0);
    quizHistoryStats.textContent = totalQuestions
        ? "Precisão nas últimas rodadas: " + Math.round(100 * totalCorrect / totalQuestions) +
          "% · Melhor precisão: " + best + "% · Pontos acumulados: " + totalPoints
        : "Conclua uma rodada para acompanhar sua evolução.";
    // Compare up to three newest rounds with up to three earlier rounds.
    // Weighted accuracy avoids inflating a short round against a longer one.
    if (selected.length >= 4) {
        const newest = selected.slice(0, 3);
        const previous = selected.slice(3, 6);
        const accuracyOf = rounds => {
            const questions = rounds.reduce((sum, item) => sum + item.total, 0);
            const correct = rounds.reduce((sum, item) => sum + item.correct, 0);
            return questions ? Math.round(100 * correct / questions) : 0;
        };
        const change = accuracyOf(newest) - accuracyOf(previous);
        quizHistoryStats.textContent += " · Tendência: " +
            (change > 0 ? "+" : "") + change +
            " p.p. (últimas " + newest.length + " vs. " +
            previous.length + " anteriores)";
    }
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
    const scored = quizRoundSize - quizUnavailable;
    // A broken silhouette is not an attempted identification. Do not
    // persist an empty or artificially low-scoring round in the history.
    if (scored === 0) return;
    quizSessions = [{
        mode: mode.slice(0, 64), difficulty: activeQuizDifficulty,
        total: scored, correct: quizCorrect, points: quizPoints, at: Date.now()
    }, ...quizSessions].slice(0, 8);
    try { localStorage.setItem(QUIZ_SESSIONS_KEY, JSON.stringify(quizSessions)); }
    catch { /* History stays visible in this session. */ }
    recordQuizActivity();
    renderQuizSessions();
}
renderQuizSessions();
quizWeeklyPlan.addEventListener("click", async () => {
    const goal = Number(quizDailyGoal.value) || 3;
    const days = recentQuizDays();
    const weakest = [...quizTypeHistory.entries()]
        .filter(([, stats]) => stats.asked >= 3 && stats.correct < stats.asked)
        .sort((a, b) => a[1].correct / a[1].asked -
            b[1].correct / b[1].asked || b[1].asked - a[1].asked)
        .slice(0, 3).map(([type]) => type);
    const recommendation = recommendedQuizDifficulty();
    const focus = weakest.length ? weakest : ["identificação geral", "revisão de erros"];
    const lines = [
        "Plano semanal de treino Pokémon",
        "Meta: " + goal + " rodada(s) por dia.",
        "Dificuldade sugerida: " + (recommendation?.difficulty || "normal") + ".",
        "Prioridades baseadas no histórico: " + focus.join(", ") + ".",
        "Atividade registrada neste navegador (últimos 7 dias):",
        ...days.slice().reverse().map(day =>
            day + ": " + (quizActivity[day] || 0) + "/" + goal + " rodada(s)."),
        "Próximos 7 dias:"
    ];
    for (let index = 0; index < 7; index++) {
        const date = new Date();
        date.setHours(12, 0, 0, 0);
        date.setDate(date.getDate() + index);
        lines.push(quizLocalDay(date.getTime()) + ": " + goal +
            " rodada(s), foco em " + focus[index % focus.length] +
            "; revisar erros antes de avançar.");
    }
    lines.push("O plano é orientativo e não altera recordes, capturas ou metas.");
    try {
        await navigator.clipboard.writeText(lines.join("\n"));
        quizHistoryImportStatus.textContent = "Plano semanal copiado.";
    } catch {
        quizHistoryImportStatus.textContent =
            "Não foi possível copiar o plano. Verifique a permissão do navegador.";
    }
});
quizReviewTypePlan.addEventListener("click", async () => {
    const now = Date.now();
    const horizon = now + 7 * QUIZ_DAY_MS;
    const byType = new Map();
    for (const card of quizCards) {
        const review = quizSpacedReviews.get(card.number);
        if (!review || !Number.isSafeInteger(review.dueAt) ||
            review.dueAt <= 0 || review.dueAt > horizon) continue;
        for (const type of new Set(card.types)) {
            const row = byType.get(type) || {type, overdue:0, upcoming:0,
                next:Infinity, names:[]};
            if (review.dueAt <= now) row.overdue++;
            else row.upcoming++;
            row.next = Math.min(row.next, review.dueAt);
            if (row.names.length < 5) row.names.push(card.name);
            byType.set(type,row);
        }
    }
    const rows = [...byType.values()].sort((a,b)=>
        b.overdue-a.overdue || a.next-b.next ||
        a.type.localeCompare(b.type,"pt-BR"));
    const lines = ["Revisões Pokémon por tipo (próximos 7 dias)",
        ...rows.map((row,index)=>(index+1)+". "+row.type+
            ": "+row.overdue+" vencida(s), "+row.upcoming+
            " próxima(s). Exemplos: "+row.names.join(", "))];
    if (!rows.length) lines.push("Nenhuma revisão prevista nesse período.");
    lines.push("Plano consultivo: revisões e capturas permanecem inalteradas.");
    try {
        await navigator.clipboard.writeText(lines.join("\n"));
        quizHistoryImportStatus.textContent =
            "Prioridades de revisão por tipo copiadas.";
    } catch {
        quizHistoryImportStatus.textContent =
            "Não foi possível copiar. Verifique a permissão do navegador.";
    }
});
quizHistoryFilter.addEventListener("change", renderQuizSessions);
quizHistoryMode.addEventListener("change", renderQuizSessions);
quizDueNowPractice.addEventListener("click", () => {
    const due = dueReviewCards().length;
    if (!due) {
        quizHistoryImportStatus.textContent = "Não há revisões vencidas agora.";
        return;
    }
    quizLength.value = due <= 5 ? "5" : "10";
    const started = launchQuizRound(true, null, true);
    quizHistoryImportStatus.textContent = started
        ? "Prática iniciada com revisões vencidas. Recordes preservados."
        : "Não foi possível iniciar a revisão agora.";
});

quizDueMistakesPractice.addEventListener("click", () => {
    const due = dueReviewCards().filter(card =>
        quizPracticeNumbers.has(card.number)).length;
    if (!due) {
        quizHistoryImportStatus.textContent =
            "Nenhum erro salvo tem revisão vencida no momento.";
        return;
    }
    quizLength.value = due <= 5 ? "5" : "10";
    const started = launchQuizRound(true, null, true, 0, true);
    quizHistoryImportStatus.textContent = started
        ? "Treino de erros vencidos iniciado. Recordes preservados."
        : "Não foi possível iniciar a revisão dos erros.";
});

quizPinnedDuePractice.addEventListener("click", () => {
    const due = dueReviewCards().filter(card =>
        quizPinnedNumbers.has(card.number)).length;
    if (!due) {
        quizHistoryImportStatus.textContent =
            "Nenhum Pokémon marcado está com revisão vencida.";
        return;
    }
    const started = launchQuizRound(false, null, true, 0, false,
        Math.min(10, due), false, false, false, true);
    quizHistoryImportStatus.textContent = started
        ? "Revisão dos marcados iniciada: até " + Math.min(10, due) +
            " perguntas, sem alterar recordes competitivos."
        : "Não foi possível iniciar o treino dos marcados.";
});

quizOverduePractice.addEventListener("click", () => {
    const cutoff = Date.now() - 7 * QUIZ_DAY_MS;
    const known = new Set(quizCards.map(card => card.number));
    const overdue = [...quizSpacedReviews].filter(([number, review]) =>
        known.has(number) && review &&
        Number.isSafeInteger(review.dueAt) && review.dueAt > 0 &&
        review.dueAt <= cutoff &&
        Number.isSafeInteger(review.step) && review.step >= 0 &&
        review.step <= 2).length;
    if (!overdue) {
        quizHistoryImportStatus.textContent =
            "Nenhuma revisão vencida há sete dias ou mais.";
        return;
    }
    quizLength.value = overdue <= 5 ? "5" : "10";
    const started = launchQuizRound(true, null, true, 7);
    quizHistoryImportStatus.textContent = started
        ? "Treino de revisões atrasadas iniciado. Recordes competitivos preservados."
        : "Não foi possível iniciar as revisões atrasadas.";
});

quizDailySprint.addEventListener("click", () => {
    if (quizCards.length < 4) {
        quizHistoryImportStatus.textContent = "São necessários quatro Pokémon para treinar.";
        return;
    }
    quizLength.value = "5";
    const recommendation = recommendedQuizDifficulty();
    if (recommendation) quizDifficulty.value = recommendation.difficulty;
    const overdue = dueReviewCards().length;
    const weakType = overdue ? null : weakestQuizTrainingType();
    launchQuizRound(false, weakType, overdue > 0);
    quizHistoryImportStatus.textContent = overdue
        ? "Treino rápido: revisões vencidas priorizadas."
        : weakType
            ? "Treino rápido focado no tipo " + weakType + "."
            : "Treino rápido de identificação geral iniciado.";
});
quizWeakestTypePractice.addEventListener("click", () => {
    const type = weakestQuizTrainingType();
    if (!type) {
        quizHistoryImportStatus.textContent =
            "Jogue pelo menos três perguntas de um tipo para identificar a prioridade.";
        return;
    }
    launchQuizRound(false, type);
    quizHistoryImportStatus.textContent =
        "Treino direcionado iniciado: " + type + ".";
});
quizHistoryPractice.addEventListener("click", () => {
    const recommendation = recommendedQuizDifficulty();
    if (!recommendation) return;
    quizDifficulty.value = recommendation.difficulty;
    launchQuizRound();
    quizHistoryImportStatus.textContent =
        "Treino iniciado na dificuldade " + recommendation.difficulty + ".";
});
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
// Aggregate only local training activity, without account identifiers.
// The daily target is a training goal, not a claimed reward.
quizDailyExport.addEventListener("click", () => {
    const rows = [["Dia", "Rodadas registradas", "Perguntas", "Acertos",
        "Precisão (%)", "Meta diária (3)", "Meta atingida"]];
    for (const day of recentQuizDays().reverse()) {
        const sessions = quizSessions.filter(session => quizLocalDay(session.at) === day);
        const total = sessions.reduce((sum, session) => sum + session.total, 0);
        const correct = sessions.reduce((sum, session) => sum + session.correct, 0);
        const count = Math.max(quizActivity[day] || 0, sessions.length);
        rows.push([day, count, total, correct,
            total ? Math.round(100 * correct / total) : "",
            3, count >= 3 ? "Sim" : "Não"]);
    }
    const cell = value => {
        let safe = String(value ?? "").replace(/[\r\n\u2028\u2029]/g, " ").slice(0, 128);
        if (/^\s*[=+@-]/.test(safe)) safe = "'" + safe;
        return '"' + safe.replace(/"/g, '""') + '"';
    };
    const csv = "\ufeff" + rows.map(row => row.map(cell).join(";")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], {type: "text/csv;charset=utf-8"}));
    const link = document.createElement("a");
    link.href = url;
    link.download = "atividade-semanal-quiz-pokemon.csv";
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
    const scored = Math.max(0, answered - quizUnavailable);
    const accuracy = scored ? Math.round(100 * quizCorrect / scored) : 0;
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
        " Marcados para estudar: " + quizPinnedNumbers.size + "." +
        (weak.length ? " Tipos prioritários: " + weak.map(item =>
            item.type + " (" + item.accuracy + "% de acertos em " +
            item.attempts + " perguntas)").join(", ") + "." :
            " Continue jogando para formar seu histórico por tipo.");
}

function showQuizQuestion() {
    quizPause.hidden = false;
    quizAnswered = false;
    quizHintUsed = false;
    quizHintLevel = 0;
    quizHint.textContent = "Revelar primeira letra";
    quizHint.setAttribute("aria-label", "Revelar primeira letra do Pokémon");
    quizFeedback.textContent = "";
    quizHint.disabled = false;
    quizHint.hidden = false;
    quizPin.hidden = false;
    quizPin.disabled = false;
    const marked = quizPinnedNumbers.has(quizQuestions[quizIndex].number);
    quizPin.setAttribute("aria-pressed", String(marked));
    quizPin.textContent = marked ? "Remover marcação de estudo" : "Marcar para estudar";
    quizNext.hidden = true;
    quizSkip.hidden = false;
    quizSkip.disabled = false;
    quizSkip.textContent = "Pular pergunta";
    quizOptions.replaceChildren();
    const current = quizQuestions[quizIndex];
    quizImage.hidden = false;
    quizImage.dataset.failed = "false";
    quizImage.src = current.image;
    quizImage.alt = "Silhueta de um Pokémon misterioso";
    quizImage.classList.remove("revelada");
    updateQuizScore();
    const choices = quizDifficulty.value === "facil" ? 2 : quizDifficulty.value === "especialista" ? 5 : 3;
    // Filtered collections may have only four species. Keep the selected
    // question pool focused, but use the full Pokédex for missing distractors
    // so expert rounds can still present six distinct answer labels.
    // Forms sharing a display name are never presented as different answers.
    const currentName = normalizarBusca(current.name);
    const usedNames = new Set([currentName]);
    const candidateDistractors = [];
    const appendDistinct = cards => {
        for (const card of cards) {
            if (card.number === current.number) continue;
            const name = normalizarBusca(card.name);
            if (!name || usedNames.has(name)) continue;
            usedNames.add(name);
            candidateDistractors.push(card);
        }
    };
    appendDistinct(shuffleQuiz(quizChoicePool));
    if (candidateDistractors.length < choices)
        appendDistinct(shuffleQuiz(quizCards));
    const availableChoices = Math.min(choices, candidateDistractors.length);
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
    // Avoid repeating distractors across the entire round when enough
    // distinct species exist. Reuse earlier ones only when the question
    // pool is too small; the immediately previous set is the last fallback.
    const fresh = rankDistractors(candidateDistractors.filter(card =>
        !quizRoundDistractors.has(card.number) &&
        !quizPreviousDistractors.has(card.number)));
    const seen = rankDistractors(candidateDistractors.filter(card =>
        quizRoundDistractors.has(card.number) &&
        !quizPreviousDistractors.has(card.number)));
    const repeats = rankDistractors(candidateDistractors.filter(card =>
        quizPreviousDistractors.has(card.number)));
    const distractors = [...fresh, ...seen, ...repeats].slice(0, availableChoices);
    quizPreviousDistractors = new Set(distractors.map(card => card.number));
    for (const card of distractors) quizRoundDistractors.add(card.number);
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
            quizPin.disabled = true;
            const correct = choice.number === current.number;
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
// An unavailable silhouette must never be scored as an identification error.
quizImage.addEventListener("error", () => {
    if (!quizDialog.open || quizAnswered || quizIndex >= quizQuestions.length)
        return;
    quizImage.dataset.failed = "true";
    quizImage.hidden = true;
    quizFeedback.textContent =
        "A imagem não carregou. Use Pular para continuar sem penalidade.";
    quizSkip.textContent = "Pular imagem indisponível";
});

quizSkip.addEventListener("click", () => {
    if (quizAnswered || quizIndex >= quizQuestions.length) return;
    quizAnswered = true;
    quizSkipped++;
    const imageUnavailable = quizImage.dataset.failed === "true";
    if (imageUnavailable) quizUnavailable++;
    const current = quizQuestions[quizIndex];
    // A broken image is a media failure, not a wrong answer by the player.
    // Keep streak and spaced-review history intact in this case.
    if (!imageUnavailable) {
        quizStreak = 0;
        quizMissed.push(current);
        recordQuizTypeResult(current, false);
    }
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
    quizFeedback.textContent = imageUnavailable
        ? "Imagem indisponível. Pergunta descartada sem penalidade, sem alterar a revisão ou a sequência."
        : "Pergunta pulada. Resposta: " + current.name +
            (current.types.length ? ". Tipo: " + current.types.join(" e ") : "") +
            ". Incluída na revisão.";
    updateQuizScore();
    quizNext.textContent = quizIndex + 1 === quizRoundSize ? "Ver resultado" : "Próxima pergunta";
    quizNext.hidden = false;
    quizNext.focus();
});
quizPin.addEventListener("click", () => {
    if (quizAnswered || quizIndex >= quizQuestions.length) return;
    const current = quizQuestions[quizIndex];
    if (!current) return;
    if (quizPinnedNumbers.has(current.number))
        quizPinnedNumbers.delete(current.number);
    else quizPinnedNumbers.add(current.number);
    saveQuizPinned();
    const marked = quizPinnedNumbers.has(current.number);
    quizPin.setAttribute("aria-pressed", String(marked));
    quizPin.textContent = marked ? "Remover marcação de estudo" : "Marcar para estudar";
    quizFeedback.textContent = marked
        ? "Espécie marcada para estudo. Pontuação preservada."
        : "Marcação removida. Pontuação preservada.";
    updateQuizTrainingSummary();
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

// In balanced overdue practice, avoid a single Pokémon type monopolizing
// the round. Preserve oldest-first order within each type and never duplicate.
function interleaveBalancedReviewTypes(selected,oldestFirst){
    const buckets=new Map();
    for(const card of [...selected].sort(oldestFirst)){
        const type=card.types?.[0]||"desconhecido";
        if(!buckets.has(type))buckets.set(type,[]);
        buckets.get(type).push(card);
    }
    const result=[],served=new Map();
    while(result.length<selected.length){
        const options=[...buckets].filter(([,cards])=>cards.length);
        if(!options.length)break;
        options.sort((a,b)=>
            (served.get(a[0])||0)-(served.get(b[0])||0)||
            oldestFirst(a[1][0],b[1][0])||
            a[0].localeCompare(b[0],"pt-BR"));
        const [type,cards]=options[0];
        result.push(cards.shift());
        served.set(type,(served.get(type)||0)+1);
    }
    return result;
}

function startQuiz(review = false, focusType = null, dueOnly = false, minOverdueDays = 0, dueMistakesOnly = false, questionLimit = null, balancedDue = false, replayAll = false, avoidRecent = false, pinnedDueOnly = false, priorityDue = false, focusTypes = null, captureStatus = 'all', practiceOnly = false) {
    if (quizCards.length < 4) return;
    quizResumeButton.hidden = true;
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
    const pinnedOption = quizCollection.querySelector('option[value="marcados"]');
    pinnedOption.disabled = quizPinnedNumbers.size === 0;
    pinnedOption.textContent = "Marcados para estudar (" + quizPinnedNumbers.size + ")";
    if (pinnedOption.disabled && quizCollection.value === "marcados")
        quizCollection.value = "todos";
    const mistakesOption = quizCollection.querySelector('option[value="erros"]');
    mistakesOption.disabled = mistakesPool.length === 0;
    mistakesOption.textContent = "Praticar erros salvos (" + mistakesPool.length + ")";
    if (mistakesOption.disabled && quizCollection.value === "erros") quizCollection.value = "todos";
    const focusedPool = focusType
        ? quizCards.filter(card => card.types.includes(focusType)) : [];
    const useFocus = focusedPool.length >= 4;
    activeQuizCollection = dueOnly ? "revisoes" : useFocus ? "tipo" : quizCollection.value;
    activeQuizType = useFocus ? focusType : selectedType;
    const overduePool = dueOnly ? dueReviewCards().filter(card =>
        (quizSpacedReviews.get(card.number)?.dueAt ?? Infinity) <=
        Date.now() - Math.max(0, minOverdueDays) * QUIZ_DAY_MS &&
        (!dueMistakesOnly || quizPracticeNumbers.has(card.number)) &&
        (!pinnedDueOnly || quizPinnedNumbers.has(card.number)) &&
        (captureStatus === 'all' ||
            (captureStatus === 'captured' && capturados.has(card.number)) ||
            (captureStatus === 'missing' && !capturados.has(card.number)))) : [];
    const focusedReviewTypes = dueOnly && Array.isArray(focusTypes) &&
        (focusTypes.length === 2 || focusTypes.length === 3) &&
        focusTypes.every(type => typeof type === "string" && type.length > 0) &&
        new Set(focusTypes).size === focusTypes.length ? focusTypes : null;
    const pool = dueOnly ? (focusedReviewTypes ? overduePool.filter(card =>
        card.types.some(type => focusedReviewTypes.includes(type))) :
        focusType ? overduePool.filter(card =>
        card.types.includes(focusType)) : overduePool) : useFocus ? focusedPool : quizCollection.value === "capturados"
        ? quizCards.filter(card => capturados.has(card.number))
        : quizCollection.value === "pendentes"
            ? quizCards.filter(card => !capturados.has(card.number))
        : quizCollection.value === "tipo" ? typePool
        : quizCollection.value === "erros" ? mistakesPool
        : quizCollection.value === "marcados"
            ? quizCards.filter(card => quizPinnedNumbers.has(card.number)) : quizCards;
    const reviewPool = review ? (replayAll ? [...quizQuestions] : [...quizMissed]) : [];
    quizIsReview = dueOnly || activeQuizCollection === "marcados" ||
        activeQuizCollection === "erros" ||
        (review && reviewPool.length > 0) || practiceOnly;
    quizChoicePool = quizIsReview || activeQuizCollection === "erros" || dueOnly
        ? [...quizCards] : [...pool];
    quizPreviousDistractors.clear();
    quizRoundDistractors.clear();
    const chosenLength = Number(quizLength.value) || 10;
    const requested = Number.isSafeInteger(questionLimit) && questionLimit > 0
        ? Math.min(20, questionLimit) : chosenLength;
    // General practice revisits a few saved mistakes without turning the
    // entire session into review mode. Correct answers remove them from the
    // persisted practice set, so future sessions adapt automatically.
    const selectedQuestions = (() => {
        if (review && quizIsReview && !dueOnly) return reviewPool;
        // Variety mode starts with species outside the last recorded round.
        // When the collection is small, it safely fills from recent species
        // rather than leaving the player with an empty quiz.
        if (avoidRecent && !dueOnly) {
            const fresh = shuffleQuiz(pool.filter(card =>
                !recentQuizNumbers.has(card.number)));
            const recent = shuffleQuiz(pool.filter(card =>
                recentQuizNumbers.has(card.number)));
            return [...fresh, ...recent].slice(0, requested);
        }
        // Due-only sessions review the oldest deadlines first, not a random
        // sample that could repeatedly postpone the most overdue cards.
        if (dueOnly) {
            const oldestFirst = (a, b) =>
                (quizSpacedReviews.get(a.number)?.dueAt ?? Infinity) -
                (quizSpacedReviews.get(b.number)?.dueAt ?? Infinity) ||
                a.number.localeCompare(b.number);
            const ordered = [...pool].sort((a,b)=>{
                if(avoidRecent){
                    const da=quizSpacedReviews.get(a.number)?.dueAt ?? Infinity;
                    const db=quizSpacedReviews.get(b.number)?.dueAt ?? Infinity;
                    const dayA=Math.floor(da/QUIZ_DAY_MS);
                    const dayB=Math.floor(db/QUIZ_DAY_MS);
                    if(dayA!==dayB)return dayA-dayB;
                    const recency=Number(recentQuizNumbers.has(a.number))-
                        Number(recentQuizNumbers.has(b.number));
                    if(recency)return recency;
                }
                return oldestFirst(a,b);
            });
            // Alternate two or three player-selected weak types without asking a
            // dual-type Pokémon twice. Oldest deadlines lead within each type.
            if (focusedReviewTypes) {
                const queues = focusedReviewTypes.map(type => ordered.filter(card =>
                    card.types.includes(type)));
                const selected = [], used = new Set();
                while (selected.length < requested &&
                       queues.some(queue => queue.length > 0)) {
                    for (const queue of queues) {
                        let card = queue.shift();
                        while (card && used.has(card.number)) card = queue.shift();
                        if (!card) continue;
                        selected.push(card);
                        used.add(card.number);
                        if (selected.length >= requested) break;
                    }
                }
                selected.push(...ordered.filter(card => !used.has(card.number))
                    .slice(0, requested - selected.length));
                return selected;
            }
            // Explicit priority sprint: pinned overdue cards first, then
            // saved mistakes, then the oldest remaining deadlines. No record
            // or capture status is changed by this review-mode selection.
            if (priorityDue) {
                return ordered.sort((a, b) =>
                    Number(quizPinnedNumbers.has(b.number)) -
                        Number(quizPinnedNumbers.has(a.number)) ||
                    Number(quizPracticeNumbers.has(b.number)) -
                        Number(quizPracticeNumbers.has(a.number)) ||
                    oldestFirst(a, b)).slice(0, requested);
            }
            if (!balancedDue) return ordered.slice(0, requested);
            // Reserve at most half the sprint for saved mistakes, then add
            // the oldest other cards. Fill any spare places without repeats.
            const mistakes = ordered.filter(card => quizPracticeNumbers.has(card.number));
            const other = ordered.filter(card => !quizPracticeNumbers.has(card.number));
            const selected = [...mistakes.slice(0, Math.ceil(requested / 2)),
                ...other.slice(0, Math.floor(requested / 2))];
            const seen = new Set(selected.map(card => card.number));
            selected.push(...ordered.filter(card => !seen.has(card.number))
                .slice(0, Math.max(0, requested - selected.length)));
            return interleaveBalancedReviewTypes(selected,oldestFirst);
        }
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
    // Preserve due-date order for overdue sessions. Other modes still
    // interleave types to avoid repetitive silhouettes.
    if (!selectedQuestions.length) {
        // A focused overdue/mistake queue can legitimately become empty.
        // Never render an undefined question or record an empty round.
        quizQuestions = [];
        quizRoundSize = 0;
        quizDifficulty.disabled = false;
        quizLength.disabled = false;
        quizCollection.disabled = false;
        quizFeedback.textContent = "Nenhuma pergunta disponível neste filtro.";
        quizHistoryImportStatus.textContent =
            "Fila vazia. Altere o tipo ou aguarde novas revisões.";
        return;
    }
    quizQuestions = dueOnly ? selectedQuestions : spaceQuizQuestions(selectedQuestions);
    quizRoundSize = quizQuestions.length;
    quizMissed = [];
    quizTypeStats = new Map();
    quizReview.hidden = true;
    quizReplay.hidden = true;
    quizWeakType.hidden = true;
    quizExportMistakes.hidden = true;
    quizStudyPlan.hidden = true;
    quizDebriefCopy.hidden = true;
    quizIndex = 0;
    quizCorrect = 0;
    quizPoints = 0;
    quizStreak = 0;
    quizBestStreak = 0;
    quizHintsUsed = 0;
    quizSkipped = 0;
    quizUnavailable = 0;
    updateQuizTrainingSummary();
    showQuizQuestion();
}
// Dashboard shortcuts must actually open the playable round. Starting a
// question queue without showing the dialog left the controls inaccessible.
function launchQuizRound(...args) {
    if (quizCards.length < 4) return false;
    startQuiz(...args);
    if (!quizQuestions.length) return false;
    if (!quizDialog.open) quizDialog.showModal();
    return true;
}
function finishQuiz() {
    quizPause.hidden = true;
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
    quizPin.hidden = true;
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
    const scoredQuestions = quizRoundSize - quizUnavailable;
    const accuracy = scoredQuestions ? Math.round(100 * quizCorrect / scoredQuestions) : 0;
    quizFeedback.textContent += " Precisão: " + accuracy + "% em " +
        scoredQuestions + " pergunta(s) válida(s).";
    if (quizUnavailable) quizFeedback.textContent +=
        " Imagens indisponíveis descartadas: " + quizUnavailable + ".";
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
    quizReplay.hidden = quizRoundSize === 0;
    quizExportMistakes.hidden = quizMissed.length === 0;
    quizStudyPlan.hidden = false;
    quizDebriefCopy.hidden = false;
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
quizDueButton.addEventListener("click", () => {
    if (!dueReviewCards().length || quizCards.length < 4) return;
    startQuiz(false, null, true);
    quizDialog.showModal();
});
// A separate player-triggered variety round. No score or collection changes
// occur until the player answers the normal quiz questions.
const quizVarietyButton = document.createElement("button");
quizVarietyButton.type = "button";
quizVarietyButton.className = quizDueButton.className;
quizVarietyButton.textContent = "Treinar espécies pouco recentes";
quizVarietyButton.setAttribute("aria-label",
    "Iniciar treino priorizando Pokémon ausentes da última rodada");
quizDueButton.insertAdjacentElement("afterend", quizVarietyButton);
quizVarietyButton.addEventListener("click", () => {
    if (quizCards.length < 4) return;
    startQuiz(false, null, false, 0, false, null, false, false, true);
    quizDialog.showModal();
});

// Short player-triggered sprint on the weakest measured type.
// Saved mistakes receive priority through the existing focused selector;
// scores and spaced-review dates change only when answers are submitted.
const quizWeaknessSprint = document.createElement("button");
quizWeaknessSprint.type = "button";
quizWeaknessSprint.className = quizDueButton.className;
quizWeaknessSprint.textContent = "Treino rápido do tipo mais difícil (5)";
quizWeaknessSprint.setAttribute("aria-label",
    "Jogar até cinco perguntas do tipo com menor desempenho histórico");
quizVarietyButton.insertAdjacentElement("afterend", quizWeaknessSprint);
quizWeaknessSprint.addEventListener("click", () => {
    const weakest = weakestQuizTrainingType();
    if (!weakest) {
        quizHistoryImportStatus.textContent =
            "Responda algumas rodadas para identificar um tipo prioritário.";
        return;
    }
    const available = quizCards.filter(card => card.types.includes(weakest));
    if (available.length < 4) {
        quizHistoryImportStatus.textContent =
            "Não há espécies suficientes desse tipo para iniciar o treino.";
        return;
    }
    if (launchQuizRound(false, weakest, false, 0, false, 5)) {
        quizHistoryImportStatus.textContent =
            "Treino focado em " + weakest + " iniciado. Até cinco perguntas.";
    }
});

// Start a focused overdue session for the type with the largest pending
// workload. Existing deadlines and progress remain unchanged until answers.
const quizDueTypeFocus = document.createElement("button");
quizDueTypeFocus.type = "button";
quizDueTypeFocus.className = quizDueButton.className;
quizDueTypeFocus.textContent = "Revisar tipo com mais atrasos";
quizDueTypeFocus.setAttribute("aria-label",
    "Treinar revisões vencidas do tipo Pokémon com maior fila");
quizDueButton.insertAdjacentElement("afterend", quizDueTypeFocus);
quizDueTypeFocus.addEventListener("click", () => {
    if (quizCards.length < 4) return;
    const due = dueReviewCards();
    if (!due.length) {
        quizHistoryImportStatus.textContent = "Nenhuma revisão vencida para treinar.";
        return;
    }
    const counts = new Map();
    for (const card of due) {
        for (const type of new Set(card.types)) {
            const row = counts.get(type) || {type,count:0,oldest:Infinity};
            row.count++;
            row.oldest = Math.min(row.oldest,
                quizSpacedReviews.get(card.number)?.dueAt ?? Infinity);
            counts.set(type,row);
        }
    }
    const target = [...counts.values()].sort((a,b) =>
        b.count-a.count || a.oldest-b.oldest ||
        a.type.localeCompare(b.type,"pt-BR"))[0];
    if (!target) return;
    startQuiz(false,target.type,true);
    if (quizQuestions.length) {
        quizDialog.showModal();
        quizHistoryImportStatus.textContent =
            "Revisão direcionada ao tipo " + target.type +
            " (" + target.count + " vencida(s)).";
    }
});
// A short playable session of bookmarked species whose spaced review is due.
// The original competitive records remain unchanged by review-mode sessions.
const quizPinnedDueButton=document.createElement("button");
quizPinnedDueButton.type="button";
quizPinnedDueButton.className=quizDueButton.className;
quizPinnedDueButton.textContent="Revisar marcados vencidos";
quizPinnedDueButton.setAttribute("aria-label",
    "Iniciar treino de até cinco espécies marcadas com revisão vencida");
quizDueTypeFocus.insertAdjacentElement("afterend",quizPinnedDueButton);
quizPinnedDueButton.addEventListener("click",()=>{
    const now=Date.now();
    const pending=dueReviewCards().filter(card=>
        quizPinnedNumbers.has(card.number) &&
        (quizSpacedReviews.get(card.number)?.dueAt ?? Infinity)<=now);
    if(!pending.length){
        quizHistoryImportStatus.textContent=
            "Nenhuma espécie marcada possui revisão vencida.";
        return;
    }
    if(launchQuizRound(false,null,true,0,false,5,false,false,false,true)){
        quizHistoryImportStatus.textContent=
            "Treino de marcados vencidos iniciado ("+Math.min(5,pending.length)+
            " pergunta(s)). Recordes competitivos preservados.";
    }else{
        quizHistoryImportStatus.textContent=
            "Não foi possível iniciar a revisão dos marcados.";
    }
});

// Short playable review that gives precedence to marked species and saved
// mistakes without delaying ordinary overdue work beyond the five-card sprint.
const quizPriorityDueButton=document.createElement("button");
quizPriorityDueButton.type="button";
quizPriorityDueButton.className=quizDueButton.className;
quizPriorityDueButton.textContent="Treino prioritário (marcados e erros)";
quizPriorityDueButton.setAttribute("aria-label",
    "Treinar até cinco revisões vencidas priorizando marcados e erros salvos");
quizPinnedDueButton.insertAdjacentElement("afterend",quizPriorityDueButton);
quizPriorityDueButton.addEventListener("click",()=>{
    const due=dueReviewCards();
    if(!due.length){
        quizHistoryImportStatus.textContent="Nenhuma revisão vencida disponível.";
        return;
    }
    if(launchQuizRound(false,null,true,0,false,5,false,false,false,false,true)){
        quizHistoryImportStatus.textContent=
            "Treino prioritário iniciado. Marcados e erros salvos primeiro; "+
            "recordes competitivos preservados.";
    }else{
        quizHistoryImportStatus.textContent=
            "Não foi possível abrir o treino prioritário.";
    }
});

// Local study backlog: counts only, no captured identities or remote requests.
const quizBacklogSummaryButton = document.createElement("button");
quizBacklogSummaryButton.type = "button";
quizBacklogSummaryButton.className = quizDueButton.className;
quizBacklogSummaryButton.textContent = "Copiar resumo das revisões por tipo";
quizBacklogSummaryButton.setAttribute("aria-label",
    "Copiar totais de revisões vencidas e erros por tipo Pokémon");
quizDueTypeFocus.insertAdjacentElement("afterend", quizBacklogSummaryButton);
quizBacklogSummaryButton.addEventListener("click", async () => {
    const now = Date.now();
    const groups = new Map();
    let totalDue = 0, totalMistakes = 0;
    for (const card of quizCards) {
        const review = quizSpacedReviews.get(card.number);
        const due = Number.isSafeInteger(review?.dueAt) &&
            review.dueAt > 0 && review.dueAt <= now;
        const mistake = quizPracticeNumbers.has(card.number);
        if (!due && !mistake) continue;
        if (due) totalDue++;
        if (mistake) totalMistakes++;
        for (const type of new Set(card.types)) {
            const entry = groups.get(type) || {due: 0, mistakes: 0};
            if (due) entry.due++;
            if (mistake) entry.mistakes++;
            groups.set(type, entry);
        }
    }
    const lines = [
        "Fila local de revisões Pokémon",
        "Revisões vencidas: " + totalDue,
        "Erros salvos: " + totalMistakes,
        "Um Pokémon de dois tipos pode aparecer em ambos os grupos.",
        ...[...groups].sort((a, b) =>
            (b[1].due + b[1].mistakes) - (a[1].due + a[1].mistakes) ||
            a[0].localeCompare(b[0], "pt-BR")).map(([type, value]) =>
            type + ": " + value.due + " vencida(s), " +
            value.mistakes + " erro(s)")
    ];
    try {
        await navigator.clipboard.writeText(lines.join("\n"));
        quizHistoryImportStatus.textContent = "Resumo de revisões copiado.";
    } catch {
        quizHistoryImportStatus.textContent =
            "Não foi possível copiar o resumo das revisões.";
    }
});

quizPracticeQueue.addEventListener("click", () => {
    const now = Date.now();
    const rows = quizCards.map(card => {
        const review = quizSpacedReviews.get(card.number);
        const dueAt = Number.isSafeInteger(review?.dueAt) && review.dueAt > 0
            ? review.dueAt : null;
        const overdue = dueAt !== null && dueAt <= now;
        const missed = quizPracticeNumbers.has(card.number);
        const weakness = quizTypeWeakness(card);
        const priority = overdue ? 0 : missed ? 1 : dueAt !== null ? 2 : 3;
        return {card, dueAt, overdue, missed, weakness, priority};
    }).filter(item => item.priority < 3)
        .sort((a, b) => a.priority - b.priority ||
            b.weakness - a.weakness ||
            (a.dueAt ?? Number.MAX_SAFE_INTEGER) -
            (b.dueAt ?? Number.MAX_SAFE_INTEGER) ||
            a.card.number.localeCompare(b.card.number)).slice(0, 100);
    if (!rows.length) {
        quizHistoryImportStatus.textContent = "Nenhum Pokémon na fila de treino.";
        return;
    }
    const cell = value => {
        let safe = String(value ?? "").replace(/[\r\n\u2028\u2029]/g, " ").slice(0, 160);
        if (/^\s*[=+@-]/.test(safe)) safe = "'" + safe;
        return '"' + safe.replace(/"/g, '""') + '"';
    };
    const data = [["Pokémon", "Tipos", "Prioridade", "Erro anterior",
        "Revisão vencida", "Próxima revisão"], ...rows.map(item => [
        item.card.name, item.card.types.join(", "),
        item.priority === 0 ? "Vencida" : item.priority === 1 ? "Erro" : "Agendada",
        item.missed ? "Sim" : "Não", item.overdue ? "Sim" : "Não",
        item.dueAt === null ? "" : new Date(item.dueAt).toISOString()
    ])];
    const csv = "\ufeff" + data.map(row => row.map(cell).join(";")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], {type:"text/csv;charset=utf-8"}));
    const link = document.createElement("a");
    link.href = url;
    link.download = "pokemon-fila-treino.csv";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    quizHistoryImportStatus.textContent = rows.length +
        " Pokémon exportados para revisão, sem alterar o progresso.";
});
quizReview.addEventListener("click", () => startQuiz(true));
quizReplay.addEventListener("click", () => {
    if (quizIndex !== quizRoundSize || !quizQuestions.length) return;
    startQuiz(true, null, false, 0, false, null, false, true);
});
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
// A single dialog keyboard handler below owns shortcuts and focus movement.
// Duplicated document handlers previously moved arrow-key focus twice.
// Records can improve in another tab while this quiz is open. Refresh the
// visible best score without altering the active question or session points.
window.addEventListener("storage", event => {
    if (!quizDialog.open || quizIndex >= quizRoundSize) return;
    if (event.key === null || (event.key && event.key.startsWith(QUIZ_KEY))) {
        updateQuizScore();
    }
});
// The exported practice list is local and contains only missed species.
// Exporting does not change scores, capture status or the saved error pool.
// Download a study plan from the completed round. It is a local snapshot,
// not a change to captures, scores, achievements or the persistent error pool.
const quizStudyPlan = document.createElement("button");
quizStudyPlan.type = "button";
quizStudyPlan.className = quizExportMistakes.className;
quizStudyPlan.textContent = "Plano de estudo (JSON)";
quizStudyPlan.hidden = true;
quizExportMistakes.insertAdjacentElement("afterend", quizStudyPlan);
quizStudyPlan.addEventListener("click", () => {
    if (quizIndex < quizRoundSize || quizRoundSize === 0) return;
    const accuracy = Math.round(100 * quizCorrect / quizRoundSize);
    const weakestTypes = [...quizTypeStats.entries()]
        .filter(([, stats]) => stats.asked > stats.correct)
        .sort((a, b) => (b[1].asked - b[1].correct) -
            (a[1].asked - a[1].correct) || a[0].localeCompare(b[0], "pt-BR"))
        .slice(0, 5)
        .map(([type, stats]) => ({
            type, questions: stats.asked, correct: stats.correct,
            remaining: stats.asked - stats.correct
        }));
    const missed = [...new Map(quizMissed
        .filter(card => card && typeof card.number === "string")
        .map(card => [card.number, { number: card.number, name: card.name,
            types: [...card.types] }])).values()];
    const plan = {
        schema: "pokemon-study-plan-v1",
        createdAt: new Date().toISOString(),
        round: { difficulty: activeQuizDifficulty, collection: activeQuizCollection,
            review: quizIsReview, questions: quizRoundSize, correct: quizCorrect,
            points: quizPoints, accuracyPercent: accuracy, hints: quizHintsUsed,
            skipped: quizSkipped },
        recommendedFocus: missed.length ? "Revisar espécies não identificadas" :
            accuracy >= 90 ? "Avançar para uma dificuldade maior" :
            "Consolidar os tipos estudados",
        weakestTypes, missed
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(plan, null, 2)],
        { type: "application/json;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "pokemon-plano-estudo.json";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
});
// Share a completed round's learning summary without changing captures,
// records, saved reviews or any remote service.
const quizDebriefCopy = document.createElement("button");
quizDebriefCopy.type = "button";
quizDebriefCopy.className = quizExportMistakes.className;
quizDebriefCopy.textContent = "Copiar resumo de aprendizado";
quizDebriefCopy.hidden = true;
quizStudyPlan.insertAdjacentElement("afterend", quizDebriefCopy);
quizDebriefCopy.addEventListener("click", async () => {
    if (quizIndex < quizRoundSize || quizRoundSize === 0) return;
    const weakest = [...quizTypeStats.entries()]
        .filter(([, stats]) => stats.asked > stats.correct)
        .sort((a, b) => (b[1].asked - b[1].correct) -
            (a[1].asked - a[1].correct) || a[0].localeCompare(b[0], "pt-BR"))
        .slice(0, 5);
    const errors = [...new Map(quizMissed.filter(card => card && card.number)
        .map(card => [card.number, card.name])).values()].slice(0, 15);
    const lines = [
        "Resumo de aprendizado Pokémon",
        "Modalidade: " + (quizIsReview ? "revisão" : activeQuizCollection),
        "Dificuldade: " + activeQuizDifficulty,
        "Acertos: " + quizCorrect + "/" + quizRoundSize,
        "Precisão: " + Math.round(100 * quizCorrect / quizRoundSize) + "%",
        "Pontos: " + quizPoints,
        "Maior sequência: " + quizBestStreak,
        "Dicas: " + quizHintsUsed + " | Puladas: " + quizSkipped,
        "Tipos para reforçar: " + (weakest.length ? weakest.map(([type, stats]) =>
            type + " (" + (stats.asked - stats.correct) + " erro(s))").join(", ") :
            "nenhum nesta rodada"),
        "Espécies para revisar: " + (errors.join(", ") || "nenhuma"),
        "Resumo local; recordes e capturas preservados."
    ];
    try {
        await navigator.clipboard.writeText(lines.join("\n"));
        quizHistoryImportStatus.textContent = "Resumo de aprendizado copiado.";
    } catch {
        quizHistoryImportStatus.textContent = "Não foi possível copiar o resumo.";
    }
});
quizExportMistakes.addEventListener("click", () => {
    if (!quizMissed.length || quizIndex < quizQuestions.length) return;
    const unique = new Map();
    for (const card of quizMissed) {
        if (card && typeof card.number === "string" && !unique.has(card.number))
            unique.set(card.number, card);
    }
    const cell = value => {
        let safe = String(value ?? "").replace(/[\r\n\u2028\u2029]/g, " ").slice(0, 128);
        if (/^\s*[=+@-]/.test(safe)) safe = "'" + safe;
        return '"' + safe.replace(/"/g, '""') + '"';
    };
    const rows = [["Número", "Pokémon", "Dificuldade", "Modalidade"],
        ...[...unique.values()].map(card => [
            card.number, card.name, activeQuizDifficulty,
            quizIsReview ? "revisão" : activeQuizCollection
        ])];
    const csv = "\ufeff" + rows.map(row => row.map(cell).join(";")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "pokemon-revisar-erros.csv";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
});
quizReviewCalendarExport.addEventListener("click", () => {
    const byNumber = new Map(quizCards.map(card => [card.number, card]));
    const now = Date.now();
    const rows = [["Número", "Pokémon", "Tipos", "Próxima revisão",
        "Intervalo (dias)", "Estado"]];
    for (const [number, review] of [...quizSpacedReviews].sort((a, b) =>
        a[1].dueAt - b[1].dueAt || a[0].localeCompare(b[0]))) {
        const card = byNumber.get(number);
        if (!card || !Number.isSafeInteger(review.dueAt) ||
            review.step < 0 || review.step > 2) continue;
        rows.push([number, card.name, card.types.join(", "),
            new Date(review.dueAt).toISOString(),
            [1, 3, 7][review.step],
            review.dueAt <= now ? "Pendente" : "Agendada"]);
    }
    const cell = value => {
        let safe = String(value ?? "").replace(/[\r\n\u2028\u2029]/g, " ").slice(0, 128);
        if (/^\s*[=+@-]/.test(safe)) safe = "'" + safe;
        return '"' + safe.replace(/"/g, '""') + '"';
    };
    const csv = "\ufeff" + rows.map(row => row.map(cell).join(";")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], {type:"text/csv;charset=utf-8"}));
    const link = document.createElement("a");
    link.href = url;
    link.download = "pokemon-agenda-revisoes.csv";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
});
quizPriorityExport.addEventListener("click", () => {
    const now = Date.now();
    const cards = new Map(quizCards.map(card => [card.number, card]));
    const horizon = now + 7 * QUIZ_DAY_MS;
    const queue = [...quizSpacedReviews].flatMap(([number, review]) => {
        const card = cards.get(number);
        if (!card || !review || !Number.isSafeInteger(review.dueAt) ||
            review.dueAt <= 0 || review.dueAt > horizon ||
            !Number.isSafeInteger(review.step) || review.step < 0 ||
            review.step > 2) return [];
        return [{number, name:card.name, types:card.types.join(", "),
            dueAt:review.dueAt, overdue:review.dueAt <= now,
            interval:[1,3,7][review.step]}];
    }).sort((a,b)=>a.dueAt-b.dueAt||a.number-b.number);
    const cell = value => {
        let safe = String(value ?? "").replace(/[\r\n\u2028\u2029]/g, " ").slice(0,128);
        if (/^\s*[=+@-]/.test(safe)) safe = "'" + safe;
        return '"' + safe.replace(/"/g,'""') + '"';
    };
    const rows = [["Prioridade","Pokémon","Tipos","Próxima revisão",
        "Situação","Intervalo (dias)"],
        ...queue.map((item,index)=>[index+1,item.name,item.types,
            new Date(item.dueAt).toLocaleString("pt-BR"),
            item.overdue?"Vencida":"Agendada",item.interval])];
    const csv = "\ufeff" + rows.map(row=>row.map(cell).join(";")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv],
        {type:"text/csv;charset=utf-8"}));
    const link = document.createElement("a");
    link.href = url;
    link.download = "pokemon-fila-prioritaria.csv";
    document.body.append(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    quizHistoryImportStatus.textContent =
        queue.length + " revisão(ões) exportada(s) por prioridade.";
});
quizReviewWorkload.addEventListener("click", () => {
    const cards = new Map(quizCards.map(card => [card.number, card]));
    const now = Date.now();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const days = Array.from({length: 7}, (_, index) => {
        const day = new Date(start);
        day.setDate(day.getDate() + index);
        return {date: day.toLocaleDateString("pt-BR"),
            start: day.getTime(), end: new Date(day).setDate(day.getDate() + 1),
            scheduled: 0, overdue: 0, byType: new Map()};
    });
    for (const [number, review] of quizSpacedReviews) {
        const card = cards.get(number);
        if (!card || !review || !Number.isSafeInteger(review.dueAt) ||
            review.dueAt <= 0 || !Number.isSafeInteger(review.step) ||
            review.step < 0 || review.step > 2) continue;
        const day = days.find(item =>
            review.dueAt >= item.start && review.dueAt < item.end) ||
            (review.dueAt < days[0].start ? days[0] : null);
        if (!day) continue;
        if (review.dueAt < now) day.overdue++;
        else day.scheduled++;
        for (const type of card.types)
            day.byType.set(type, (day.byType.get(type) || 0) + 1);
    }
    const rows = [["Dia", "Agendadas", "Vencidas", "Total", "Tipos prioritários"],
        ...days.map(day => [day.date, day.scheduled, day.overdue,
            day.scheduled + day.overdue,
            [...day.byType].sort((a, b) => b[1] - a[1] ||
                a[0].localeCompare(b[0], "pt-BR"))
                .slice(0, 3).map(([type, count]) => type + ": " + count).join(" / ")])];
    const cell = value => {
        let safe = String(value ?? "").replace(/[\r\n\u2028\u2029]/g, " ").slice(0, 128);
        if (/^\s*[=+@-]/.test(safe)) safe = "'" + safe;
        return '"' + safe.replace(/"/g, '""') + '"';
    };
    const csv = "\ufeff" + rows.map(row => row.map(cell).join(";")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv],
        {type: "text/csv;charset=utf-8"}));
    const link = document.createElement("a");
    link.href = url;
    link.download = "pokemon-revisoes-semana.csv";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    quizHistoryImportStatus.textContent =
        "Resumo semanal exportado sem modificar as revisões.";
});
quizReviewCalendarIcs.addEventListener("click", () => {
    const cards = new Map(quizCards.map(card => [card.number, card]));
    const now = Date.now();
    const stamp = time => new Date(time).toISOString()
        .replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
    const escape = text => String(text).replace(/\\/g, "\\\\")
        .replace(/\r?\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
    const entries = [...quizSpacedReviews]
        .filter(([number, review]) => cards.has(number) &&
            review && Number.isSafeInteger(review.dueAt) &&
            review.dueAt > 0 && review.step >= 0 && review.step <= 2)
        .sort((a, b) => a[1].dueAt - b[1].dueAt ||
            a[0].localeCompare(b[0])).slice(0, 200);
    if (!entries.length) {
        quizHistoryImportStatus.textContent = "Nenhuma revisão agendada.";
        return;
    }
    // Overdue cards share the same original deadline. Assign separate
    // fifteen-minute slots so calendar imports do not overlap all reminders.
    let nextSlot = Math.ceil(now / (15 * 60_000)) * 15 * 60_000;
    const events = entries.map(([number, review]) => {
        const card = cards.get(number);
        const start = Math.max(nextSlot, review.dueAt);
        nextSlot = start + 15 * 60_000;
        return [
            "BEGIN:VEVENT",
            "UID:pokemon-review-" + number + "-" + review.dueAt + "@local",
            "DTSTAMP:" + stamp(now),
            "DTSTART:" + stamp(start),
            "DTEND:" + stamp(start + 15 * 60_000),
            "SUMMARY:" + escape("Revisar Pokémon: " + card.name),
            "DESCRIPTION:" + escape("Revisão espaçada de " + card.name +
                ". Tipos: " + card.types.join(", ") +
                ". Intervalo: " + [1, 3, 7][review.step] + " dia(s)." +
                (review.dueAt < now ? " Revisão originalmente vencida em " +
                    new Date(review.dueAt).toLocaleString("pt-BR") + "." : "")),
            "END:VEVENT"
        ].join("\r\n");
    });
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0",
        "PRODID:-//Pokemon Quiz//Revisoes locais//PT",
        "CALSCALE:GREGORIAN", ...events, "END:VCALENDAR", ""].join("\r\n");
    const url = URL.createObjectURL(new Blob([ics],
        {type:"text/calendar;charset=utf-8"}));
    const link = document.createElement("a");
    link.href = url;
    link.download = "pokemon-revisoes.ics";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    quizHistoryImportStatus.textContent =
        events.length + " lembrete(s) exportado(s) para calendário.";
});
// Keyboard-accessible play. Expert difficulty exposes six answers.
// Arrow/Home/End move focus only among active answers; they never submit.
quizDialog.setAttribute("aria-keyshortcuts", "1 2 3 4 5 6 ArrowUp ArrowDown ArrowLeft ArrowRight Home End H S N P R M");
quizDialog.addEventListener("keydown", event => {
    if (!quizDialog.open || event.repeat || event.ctrlKey ||
        event.metaKey || event.altKey || event.isComposing) return;
    const target = event.target;
    if (target instanceof HTMLElement &&
        (target.isContentEditable || target.closest("input,select,textarea"))) return;
    const key = event.key.toLowerCase();
    const numberedOptions = [...quizOptions.querySelectorAll("button")];
    const options = numberedOptions.filter(
        button => !button.disabled && !button.hidden);
    // Pause without resetting the active round, points, hint state or queue.
    // The existing resume button becomes available on dialog close.
    if (quizIndex === quizRoundSize && key === "r" && !quizReplay.hidden &&
        !quizReplay.disabled) {
        event.preventDefault();
        quizReplay.click();
        return;
    }
    if (quizIndex === quizRoundSize && key === "m" && !quizReview.hidden &&
        !quizReview.disabled) {
        event.preventDefault();
        quizReview.click();
        return;
    }
    if (key === "p" && quizIndex < quizRoundSize) {
        event.preventDefault();
        quizDialog.close();
        return;
    }
    if (/^[1-6]$/.test(key) && !quizAnswered) {
        // Keep the original visible answer number after a hint hides one.
        const choice = numberedOptions[Number(key) - 1];
        if (choice && !choice.disabled && !choice.hidden) {
            event.preventDefault();
            choice.click();
        }
    } else if (!quizAnswered && options.length &&
        ["arrowup", "arrowdown", "arrowleft", "arrowright", "home", "end"].includes(key)) {
        event.preventDefault();
        const current = options.indexOf(document.activeElement);
        const next = key === "home" ? 0 : key === "end" ? options.length - 1 :
            current < 0 ? 0 : (current + (key === "arrowup" || key === "arrowleft" ? -1 : 1) +
                options.length) % options.length;
        options[next].focus();
    } else if (key === "h" && !quizAnswered && !quizHint.disabled &&
        !quizHint.hidden) {
        event.preventDefault();
        quizHint.click();
    } else if (key === "s" && !quizAnswered && !quizSkip.disabled &&
        !quizSkip.hidden) {
        event.preventDefault();
        quizSkip.click();
    } else if (key === "n" && quizAnswered && !quizNext.hidden &&
        !quizNext.disabled) {
        event.preventDefault();
        quizNext.click();
    }
});
quizBalancedPlan.addEventListener("click", async () => {
    const now = Date.now();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const known = new Set(quizCards.map(card => card.number));
    const calendarDay = value => {
        const day = new Date(value);
        return Date.UTC(day.getFullYear(), day.getMonth(), day.getDate());
    };
    const todayKey = calendarDay(start.getTime());
    const queue = [...quizSpacedReviews].filter(([number, review]) =>
        known.has(number) && review &&
        Number.isSafeInteger(review.dueAt) && review.dueAt > 0 &&
        Number.isSafeInteger(review.step) && review.step >= 0 &&
        review.step <= 2).sort((a, b) =>
        a[1].dueAt - b[1].dueAt || a[0].localeCompare(b[0]));
    const days = Array.from({length:7}, (_, index) => ({
        index, count:0, overdue:0, upcoming:0
    }));
    let outsideWindow = 0, overflow = 0;
    for (const [, review] of queue) {
        const dueDay = Math.floor((calendarDay(review.dueAt) - todayKey) /
            QUIZ_DAY_MS);
        if (dueDay >= 7) {outsideWindow++;continue;}
        const first = Math.max(0, dueDay);
        const slot = days.find(day => day.index >= first && day.count < 10);
        if (!slot) {overflow++;continue;}
        slot.count++;
        if (review.dueAt <= now) slot.overdue++;
        else slot.upcoming++;
    }
    const lines = [
        "Plano sugerido de revisões Pokémon (até 10 por dia)",
        ...days.map(day => {
            const date = new Date(start);
            date.setDate(date.getDate() + day.index);
            return date.toLocaleDateString("pt-BR") + ": " +
                day.count + " revisão(ões), " + day.overdue +
                " já vencida(s), " + day.upcoming + " agendada(s)";
        }),
        "Sem vaga na semana: " + overflow,
        "Vencimento além da semana: " + outsideWindow,
        "Plano consultivo. Os prazos reais permanecem inalterados."
    ];
    try {
        await navigator.clipboard.writeText(lines.join("\n"));
        quizHistoryImportStatus.textContent = "Plano equilibrado copiado.";
    } catch {
        quizHistoryImportStatus.textContent =
            "Não foi possível copiar o plano equilibrado.";
    }
});

quizBacklogTriage.addEventListener("click", async () => {
    const now = Date.now();
    const bands = {today:0,days1to6:0,days7to29:0,days30plus:0,
        upcoming7:0,later:0,invalid:0};
    const intervals = {day1:0,day3:0,day7:0};
    const known = new Set(quizCards.map(card => card.number));
    for (const [number, review] of quizSpacedReviews) {
        if (!known.has(number) || !review ||
            !Number.isSafeInteger(review.dueAt) ||
            review.dueAt <= 0 || !Number.isSafeInteger(review.step) ||
            review.step < 0 || review.step > 2) {
            bands.invalid++;
            continue;
        }
        intervals[["day1","day3","day7"][review.step]]++;
        const delta = now - review.dueAt;
        if (delta >= 30 * QUIZ_DAY_MS) bands.days30plus++;
        else if (delta >= 7 * QUIZ_DAY_MS) bands.days7to29++;
        else if (delta >= QUIZ_DAY_MS) bands.days1to6++;
        else if (delta >= 0) bands.today++;
        else if (-delta <= 7 * QUIZ_DAY_MS) bands.upcoming7++;
        else bands.later++;
    }
    const lines = [
        "Diagnóstico local de revisões Pokémon",
        "Atrasadas 30+ dias: " + bands.days30plus,
        "Atrasadas 7 a 29 dias: " + bands.days7to29,
        "Atrasadas 1 a 6 dias: " + bands.days1to6,
        "Vencidas há menos de 24 horas: " + bands.today,
        "Próximos 7 dias: " + bands.upcoming7,
        "Posteriores: " + bands.later,
        "Registros ignorados por inconsistência: " + bands.invalid,
        "Intervalo de 1 dia: " + intervals.day1,
        "Intervalo de 3 dias: " + intervals.day3,
        "Intervalo de 7 dias: " + intervals.day7,
        "Resumo consultivo; nenhum vencimento ou resultado foi alterado."
    ];
    try {
        await navigator.clipboard.writeText(lines.join("\n"));
        quizHistoryImportStatus.textContent =
            "Diagnóstico de revisões copiado.";
    } catch {
        quizHistoryImportStatus.textContent =
            "Não foi possível copiar o diagnóstico.";
    }
});

quizWeeklyCopyPlan.addEventListener("click", async () => {
    const now = Date.now();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const buckets = Array.from({length: 7}, (_, day) => ({
        day, count: 0
    }));
    let overdue = 0;
    for (const entry of quizSpacedReviews.values()) {
        if (!entry || !Number.isFinite(entry.dueAt)) continue;
        if (entry.dueAt <= now) {
            // Overdue work has its own total; it is not a future review
            // scheduled for today and must not be counted twice.
            overdue++;
        } else {
            const dueDate = new Date(entry.dueAt);
            dueDate.setHours(0, 0, 0, 0);
            // Calendar-day difference remains correct across DST transitions.
            const day = Math.round((Date.UTC(dueDate.getFullYear(),
                dueDate.getMonth(), dueDate.getDate()) -
                Date.UTC(startOfToday.getFullYear(),
                startOfToday.getMonth(), startOfToday.getDate())) / QUIZ_DAY_MS);
            if (day >= 0 && day < 7) buckets[day].count++;
        }
    }
    const lines = [
        "Plano de revisões Pokémon (próximos 7 dias)",
        "Revisões já vencidas (fora da agenda futura): " + overdue,
        ...buckets.map(item => {
            const date = new Date(startOfToday);
            date.setDate(date.getDate() + item.day);
            return date.toLocaleDateString("pt-BR") + ": " +
                item.count + " revisão(ões) prevista(s)";
        }),
        "Previsão local; a agenda muda conforme os resultados dos treinos."
    ];
    try {
        await navigator.clipboard.writeText(lines.join("\n"));
        quizHistoryImportStatus.textContent = "Plano semanal copiado.";
    } catch {
        quizHistoryImportStatus.textContent =
            "Não foi possível copiar o plano semanal.";
    }
});
// Read-only workload by Pokémon type. Dual-type species count in both
// categories, which is stated in the report instead of hiding overlap.
const quizTypeWorkloadCopy = document.createElement("button");
quizTypeWorkloadCopy.type = "button";
quizTypeWorkloadCopy.className = quizWeeklyCopyPlan.className;
quizTypeWorkloadCopy.textContent = "Copiar prioridades de revisão por tipo";
quizTypeWorkloadCopy.setAttribute("aria-label",
    "Copiar contagens de revisões vencidas, futuras e erros por tipo Pokémon");
quizWeeklyCopyPlan.insertAdjacentElement("afterend", quizTypeWorkloadCopy);
quizTypeWorkloadCopy.addEventListener("click", async () => {
    const now = Date.now();
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const grouped = new Map();
    for (const card of quizCards) {
        const review = quizSpacedReviews.get(card.number);
        const valid = review && Number.isFinite(review.dueAt) &&
            review.dueAt >= 0;
        const overdue = valid && review.dueAt <= now;
        const upcoming = valid && review.dueAt > now &&
            review.dueAt <= nextWeek.getTime();
        const mistake = quizPracticeNumbers.has(card.number);
        const pinned = quizPinnedNumbers.has(card.number);
        if (!overdue && !upcoming && !mistake && !pinned) continue;
        for (const type of new Set(card.types)) {
            const item = grouped.get(type) ||
                {type, overdue: 0, upcoming: 0, mistakes: 0, pinned: 0};
            if (overdue) item.overdue++;
            if (upcoming) item.upcoming++;
            if (mistake) item.mistakes++;
            if (pinned) item.pinned++;
            grouped.set(type, item);
        }
    }
    const ordered = [...grouped.values()].sort((a, b) =>
        b.overdue - a.overdue || b.mistakes - a.mistakes ||
        b.pinned - a.pinned || a.type.localeCompare(b.type, "pt-BR"));
    const lines = [
        "Prioridades locais de revisão por tipo Pokémon",
        "Gerado: " + new Date(now).toLocaleString("pt-BR"),
        "Tipos com estudo pendente: " + ordered.length,
        ...ordered.map(item => item.type + ": " +
            item.overdue + " vencida(s), " + item.upcoming +
            " nos próximos 7 dias, " + item.mistakes +
            " erro(s), " + item.pinned + " marcada(s)"),
        "Pokémon de dois tipos aparecem em ambos os grupos.",
        "Relatório consultivo; recordes e vencimentos não foram alterados."
    ];
    try {
        await navigator.clipboard.writeText(lines.join("\n"));
        quizHistoryImportStatus.textContent =
            "Prioridades por tipo copiadas.";
    } catch {
        quizHistoryImportStatus.textContent =
            "Não foi possível copiar as prioridades por tipo.";
    }
});
// Play the most urgent type-specific review round without changing records.
const quizMostOverdueTypeSprint=document.createElement("button");
quizMostOverdueTypeSprint.type="button";
quizMostOverdueTypeSprint.className=quizTypeWorkloadCopy.className;
quizMostOverdueTypeSprint.textContent="Treinar tipo com mais revisões vencidas";
quizMostOverdueTypeSprint.setAttribute("aria-label",
    "Iniciar até dez revisões do tipo com maior atraso, preservando recordes");
quizTypeWorkloadCopy.insertAdjacentElement("afterend",quizMostOverdueTypeSprint);
quizMostOverdueTypeSprint.addEventListener("click",()=>{
    const now=Date.now(),counts=new Map();
    for(const card of quizCards){
        const due=quizSpacedReviews.get(card.number)?.dueAt;
        if(!Number.isFinite(due)||due<0||due>now)continue;
        for(const type of new Set(card.types))
            counts.set(type,(counts.get(type)||0)+1);
    }
    const ranked=[...counts].filter(([,count])=>count>=4)
        .sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],"pt-BR"));
    if(!ranked.length){
        quizHistoryImportStatus.textContent=
            "Não há quatro revisões vencidas do mesmo tipo para iniciar.";
        return;
    }
    const [type,count]=ranked[0];
    if(launchQuizRound(true,type,true,0,false,10,false,false,false,false,true))
        quizHistoryImportStatus.textContent=
            "Treino de "+type+" iniciado com "+Math.min(10,count)+
            " revisão(ões) prioritárias.";
    else quizHistoryImportStatus.textContent=
        "Não foi possível iniciar o treino deste tipo.";
});
// A playable catch-up sprint for reviews overdue by at least seven days.
// Saved mistakes take priority when enough are available; otherwise the
// oldest overdue cards fill the round. Review scores never update records.
const quizSevenDayRecovery=document.createElement("button");
quizSevenDayRecovery.type="button";
quizSevenDayRecovery.className=quizMostOverdueTypeSprint.className;
quizSevenDayRecovery.textContent="Recuperar revisões atrasadas há 7 dias";
quizSevenDayRecovery.setAttribute("aria-label",
    "Treinar até dez revisões com sete dias de atraso sem alterar recordes");
quizMostOverdueTypeSprint.insertAdjacentElement("afterend",quizSevenDayRecovery);
quizSevenDayRecovery.addEventListener("click",()=>{
    const threshold=Date.now()-7*QUIZ_DAY_MS;
    const overdue=dueReviewCards().filter(card=>{
        const due=quizSpacedReviews.get(card.number)?.dueAt;
        return Number.isFinite(due)&&due>=0&&due<=threshold;
    });
    if(overdue.length<4){
        quizHistoryImportStatus.textContent=
            "São necessárias ao menos quatro revisões atrasadas há 7 dias.";
        return;
    }
    const mistakes=overdue.filter(card=>
        quizPracticeNumbers.has(card.number));
    const focusMistakes=mistakes.length>=4;
    const launched=launchQuizRound(true,null,true,7,focusMistakes,10,
        false,false,false,false,!focusMistakes);
    quizHistoryImportStatus.textContent=launched?
        "Recuperação iniciada: "+Math.min(10,
            focusMistakes?mistakes.length:overdue.length)+
            " pergunta(s), "+(focusMistakes?
            "priorizando erros salvos.":"priorizando prazos mais antigos."):
        "Não foi possível iniciar a recuperação das revisões.";
});
// Mixed playable recovery: half the slots favor saved mistakes while the
// remainder covers oldest overdue cards, interleaving Pokémon types.
// This remains review mode and never updates competitive records.
const quizBalancedCatchup=document.createElement("button");
quizBalancedCatchup.type="button";
quizBalancedCatchup.className=quizSevenDayRecovery.className;
quizBalancedCatchup.textContent="Treino misto de revisões vencidas";
quizBalancedCatchup.setAttribute("aria-label",
    "Treinar até dez revisões vencidas com equilíbrio entre erros e tipos");
quizSevenDayRecovery.insertAdjacentElement("afterend",quizBalancedCatchup);
quizBalancedCatchup.addEventListener("click",()=>{
    const due=dueReviewCards().filter(card=>{
        const entry=quizSpacedReviews.get(card.number);
        return Number.isFinite(entry?.dueAt)&&entry.dueAt>=0;
    });
    if(due.length<4){
        quizHistoryImportStatus.textContent=
            "São necessárias ao menos quatro revisões vencidas para este treino.";
        return;
    }
    const errors=due.filter(card=>quizPracticeNumbers.has(card.number)).length;
    const started=launchQuizRound(true,null,true,0,false,10,
        true,false,false,false,false);
    quizHistoryImportStatus.textContent=started?
        "Treino misto iniciado: "+Math.min(10,due.length)+
        " revisão(ões), "+errors+" erro(s) salvo(s) na fila. "+
        "Tipos alternados e recordes preservados.":
        "Não foi possível iniciar o treino misto.";
});
// Target the overdue type with the largest combination of pending cards,
// saved mistakes and historical error rate. The player starts the round
// explicitly and review mode never updates competitive records.
const quizWeakTypeRecovery=document.createElement("button");
quizWeakTypeRecovery.type="button";
quizWeakTypeRecovery.className=quizBalancedCatchup.className;
quizWeakTypeRecovery.textContent="Revisar tipo com maior dificuldade";
quizWeakTypeRecovery.setAttribute("aria-label",
    "Iniciar revisão vencida do tipo Pokémon com maior necessidade de treino");
quizBalancedCatchup.insertAdjacentElement("afterend",quizWeakTypeRecovery);
quizWeakTypeRecovery.addEventListener("click",()=>{
    const groups=new Map();
    for(const card of dueReviewCards()){
        const due=quizSpacedReviews.get(card.number)?.dueAt;
        if(!Number.isFinite(due)||due<0)continue;
        for(const type of new Set(card.types)){
            const group=groups.get(type)||{type,cards:0,mistakes:0};
            group.cards++;
            if(quizPracticeNumbers.has(card.number))group.mistakes++;
            groups.set(type,group);
        }
    }
    const ranked=[...groups.values()].filter(group=>group.cards>=4)
        .map(group=>{
            const history=quizTypeHistory.get(group.type);
            const errorRate=history?.asked>0?
                (history.asked-history.correct)/history.asked:0;
            return {...group,errorRate,
                priority:group.cards*2+group.mistakes*3+
                    Math.round(errorRate*10)};
        }).sort((a,b)=>b.priority-a.priority||
            b.cards-a.cards||a.type.localeCompare(b.type,"pt-BR"));
    const focus=ranked[0];
    if(!focus){
        quizHistoryImportStatus.textContent=
            "Nenhum tipo possui quatro revisões vencidas para este treino.";
        return;
    }
    const started=launchQuizRound(true,focus.type,true,0,false,10,
        false,false,false,false,true);
    quizHistoryImportStatus.textContent=started?
        "Revisão do tipo "+focus.type+" iniciada: "+
        focus.cards+" pendência(s), "+focus.mistakes+
        " erro(s) salvo(s). Recordes competitivos preservados.":
        "Não foi possível iniciar a revisão do tipo "+focus.type+".";
});

// Two-type review duel: alternate overdue cards from the two highest-risk
// types. A dual-type species is asked once and review scores never become
// competitive records. The player explicitly starts each round.
const quizTwoTypeDuel=document.createElement("button");
quizTwoTypeDuel.type="button";
quizTwoTypeDuel.className=quizWeakTypeRecovery.className;
quizTwoTypeDuel.textContent="Duelo de revisão: dois tipos prioritários";
quizTwoTypeDuel.setAttribute("aria-label",
    "Treinar alternadamente revisões vencidas dos dois tipos mais difíceis");
quizWeakTypeRecovery.insertAdjacentElement("afterend",quizTwoTypeDuel);
quizTwoTypeDuel.addEventListener("click",()=>{
    const groups=new Map();
    for(const card of dueReviewCards()){
        const due=quizSpacedReviews.get(card.number)?.dueAt;
        if(!Number.isFinite(due)||due<0||due>Date.now())continue;
        for(const type of new Set(card.types)){
            const item=groups.get(type)||{type,count:0,mistakes:0};
            item.count++;
            if(quizPracticeNumbers.has(card.number))item.mistakes++;
            groups.set(type,item);
        }
    }
    const ranked=[...groups.values()].filter(item=>item.count>=2)
        .map(item=>{
            const history=quizTypeHistory.get(item.type);
            const errorRate=history?.asked>0?
                Math.max(0,(history.asked-history.correct)/history.asked):0;
            return {...item,priority:item.count*2+item.mistakes*3+
                Math.round(errorRate*10)};
        }).sort((a,b)=>b.priority-a.priority||b.count-a.count||
            a.type.localeCompare(b.type,"pt-BR"));
    const pair=ranked.slice(0,2);
    if(pair.length!==2){
        quizHistoryImportStatus.textContent=
            "São necessários dois tipos com ao menos duas revisões vencidas.";
        return;
    }
    const selectedTypes=pair.map(item=>item.type);
    const unique=dueReviewCards().filter(card=>
        card.types.some(type=>selectedTypes.includes(type)));
    if(unique.length<4){
        quizHistoryImportStatus.textContent=
            "Os dois tipos ainda não somam quatro espécies distintas vencidas.";
        return;
    }
    const started=launchQuizRound(true,null,true,0,false,10,
        false,false,false,false,false,selectedTypes);
    quizHistoryImportStatus.textContent=started?
        "Duelo iniciado: "+selectedTypes.join(" × ")+
        ". Revisões alternadas, sem alterar recordes competitivos.":
        "Não foi possível iniciar o duelo de revisão.";
});

// Three-type recovery tournament. Each due species appears only once even
// when it has two selected types; the existing review round is unranked.
const quizThreeTypeTournament=document.createElement("button");
quizThreeTypeTournament.type="button";
quizThreeTypeTournament.className=quizTwoTypeDuel.className;
quizThreeTypeTournament.textContent="Torneio de revisão: três tipos";
quizThreeTypeTournament.setAttribute("aria-label",
    "Treinar revisões vencidas alternando três tipos prioritários");
quizTwoTypeDuel.insertAdjacentElement("afterend",quizThreeTypeTournament);
quizThreeTypeTournament.addEventListener("click",()=>{
    const now=Date.now();
    const due=dueReviewCards().filter(card=>{
        const time=quizSpacedReviews.get(card.number)?.dueAt;
        return Number.isFinite(time)&&time>=0&&time<=now;
    });
    const groups=new Map();
    for(const card of due){
        for(const type of new Set(card.types)){
            const group=groups.get(type)||{type,count:0,mistakes:0,oldest:now};
            group.count++;
            if(quizPracticeNumbers.has(card.number))group.mistakes++;
            group.oldest=Math.min(group.oldest,
                quizSpacedReviews.get(card.number).dueAt);
            groups.set(type,group);
        }
    }
    const ranked=[...groups.values()].filter(group=>group.count>=2)
        .map(group=>{
            const history=quizTypeHistory.get(group.type);
            const errorRate=history?.asked>0?
                Math.max(0,(history.asked-history.correct)/history.asked):0;
            return {...group,priority:group.count*2+
                group.mistakes*3+Math.round(errorRate*10)};
        }).sort((a,b)=>b.priority-a.priority||
            a.oldest-b.oldest||a.type.localeCompare(b.type,"pt-BR"));
    const selected=ranked.slice(0,3).map(group=>group.type);
    const unique=due.filter(card=>
        card.types.some(type=>selected.includes(type)));
    if(selected.length!==3||unique.length<6){
        quizHistoryImportStatus.textContent=
            "São necessários três tipos e seis espécies distintas com revisão vencida.";
        return;
    }
    const started=launchQuizRound(true,null,true,0,false,10,
        false,false,false,false,false,selected);
    quizHistoryImportStatus.textContent=started?
        "Torneio iniciado: "+selected.join(" × ")+
        ". Revisões alternadas; recordes competitivos preservados.":
        "Não foi possível iniciar o torneio de revisão.";
});

// A short overdue queue should still be playable. One to three due cards
// are enough for an unranked micro-session; distractors come from the full
// catalog and the spaced-review result remains local to the player's device.
const quizMicroReview=document.createElement("button");
quizMicroReview.type="button";
quizMicroReview.className=quizThreeTypeTournament.className;
quizMicroReview.textContent="Microtreino de 1 a 3 revisões vencidas";
quizMicroReview.setAttribute("aria-label",
    "Praticar uma fila curta de revisões vencidas sem alterar recordes");
quizThreeTypeTournament.insertAdjacentElement("afterend",quizMicroReview);
quizMicroReview.addEventListener("click",()=>{
    const due=dueReviewCards().filter(card=>{
        const deadline=quizSpacedReviews.get(card.number)?.dueAt;
        return Number.isFinite(deadline)&&deadline>=0;
    });
    if(due.length===0){
        quizHistoryImportStatus.textContent=
            "Nenhuma revisão vencida. Aguarde o próximo prazo de estudo.";
        return;
    }
    if(due.length>3){
        quizHistoryImportStatus.textContent=
            "Há mais de três revisões vencidas. Use o treino misto para a fila maior.";
        return;
    }
    const started=launchQuizRound(true,null,true,0,false,3,
        false,false,false,false,true);
    quizHistoryImportStatus.textContent=started?
        "Microtreino iniciado: "+due.length+
        " revisão(ões) por prazo, sem alterar recordes competitivos.":
        "Não foi possível abrir o microtreino.";
});

// A compact, read-only study calendar. Future deadlines are not pulled
// forward and the player keeps control of when a review session starts.
const quizUpcomingCalendarButton=document.createElement("button");
quizUpcomingCalendarButton.type="button";
quizUpcomingCalendarButton.className=quizMicroReview.className;
quizUpcomingCalendarButton.textContent="Próximas revisões (7 dias)";
quizUpcomingCalendarButton.setAttribute("aria-label",
    "Consultar as revisões programadas para os próximos sete dias");
quizMicroReview.insertAdjacentElement("afterend",quizUpcomingCalendarButton);
quizUpcomingCalendarButton.addEventListener("click",()=>{
    const now=Date.now();
    const today=new Date(now);
    today.setHours(0,0,0,0);
    const end=new Date(today);
    end.setDate(end.getDate()+8);
    const days=new Map();
    let overdue=0;
    for(const card of quizCards){
        const dueAt=quizSpacedReviews.get(card.number)?.dueAt;
        if(!Number.isFinite(dueAt)||dueAt<0)continue;
        if(dueAt<=now){overdue++;continue;}
        if(dueAt>=end.getTime())continue;
        const date=new Date(dueAt);
        const key=date.toLocaleDateString("pt-BR");
        days.set(key,(days.get(key)||0)+1);
    }
    const upcoming=[...days].map(([day,count])=>day+": "+count)
        .join(" | ");
    quizHistoryImportStatus.textContent=
        "Revisões vencidas: "+overdue+". Próximos 7 dias: "+
        (upcoming||"nenhuma agendada")+
        ". Consulta local; nenhum prazo ou recorde foi alterado.";
});

// Long-form unranked review: up to fifteen overdue species in one playable
// round. Questions still use the normal spaced-review feedback and never
// award competitive records for this training collection.
const quizDueMarathon=document.createElement("button");
quizDueMarathon.type="button";
quizDueMarathon.className=quizUpcomingCalendarButton.className;
quizDueMarathon.textContent="Maratona de 15 revisões vencidas";
quizDueMarathon.setAttribute("aria-label",
    "Treinar até quinze Pokémon vencidos em uma rodada sem ranking");
quizUpcomingCalendarButton.insertAdjacentElement("afterend",quizDueMarathon);
quizDueMarathon.addEventListener("click",()=>{
    const due=dueReviewCards();
    if(!due.length){
        quizHistoryImportStatus.textContent=
            "Nenhuma revisão vencida disponível para a maratona.";
        return;
    }
    const started=launchQuizRound(false,null,true,0,false,15,true);
    quizHistoryImportStatus.textContent=started?
        "Maratona iniciada: até "+Math.min(15,due.length)+
        " revisões, equilibradas por tipo. Recordes competitivos preservados.":
        "Não foi possível iniciar a maratona de revisões.";
});

// Two playable, unranked spaced-review queues separated by capture status.
// Captures are never changed by studying; correct/incorrect answers continue
// to update only the existing spaced-review history.
const quizCaptureDueButtons=[
    {status:"captured",label:"Revisar capturados vencidos",
        empty:"Nenhum Pokémon capturado tem revisão vencida."},
    {status:"missing",label:"Revisar não capturados vencidos",
        empty:"Nenhum Pokémon não capturado tem revisão vencida."}
];
let previousCaptureReviewButton=quizDueMarathon;
for(const mode of quizCaptureDueButtons){
    const button=document.createElement("button");
    button.type="button";
    button.className=quizDueMarathon.className;
    button.textContent=mode.label;
    button.setAttribute("aria-label",mode.label+
        " em treino sem ranking e sem alterar a coleção");
    previousCaptureReviewButton.insertAdjacentElement("afterend",button);
    previousCaptureReviewButton=button;
    button.addEventListener("click",()=>{
        const eligible=dueReviewCards().filter(card=>
            mode.status==="captured"?
                capturados.has(card.number):!capturados.has(card.number));
        if(!eligible.length){
            quizHistoryImportStatus.textContent=mode.empty;
            return;
        }
        const started=launchQuizRound(false,null,true,0,false,10,true,
            false,false,false,false,null,mode.status);
        quizHistoryImportStatus.textContent=started?
            "Treino iniciado: até "+Math.min(10,eligible.length)+
            " revisões "+(mode.status==="captured"?
                "de capturados.":"de não capturados.")+
            " Capturas e recordes competitivos preservados.":
            "Não foi possível iniciar a revisão selecionada.";
    });
}

// Focused, playable recovery of overdue mistakes. This mode updates spaced
// review learning only; it does not overwrite competitive high scores.
const quizOverdueMistakesButton=document.createElement("button");
quizOverdueMistakesButton.type="button";
quizOverdueMistakesButton.className=quizDueMarathon.className;
quizOverdueMistakesButton.textContent="Revisar erros vencidos (até 10)";
quizOverdueMistakesButton.setAttribute("aria-label",
    "Iniciar treino sem ranking com erros salvos e revisão vencida");
previousCaptureReviewButton.insertAdjacentElement("afterend",
    quizOverdueMistakesButton);
quizOverdueMistakesButton.addEventListener("click",()=>{
    const eligible=dueReviewCards().filter(card=>
        quizPracticeNumbers.has(card.number));
    if(!eligible.length){
        quizHistoryImportStatus.textContent=
            "Nenhum erro salvo com revisão vencida.";
        return;
    }
    const started=launchQuizRound(false,null,true,0,true,10,true);
    quizHistoryImportStatus.textContent=started?
        "Treino de recuperação iniciado com até "+
        Math.min(10,eligible.length)+
        " erros vencidos. Recordes competitivos preservados.":
        "Não foi possível iniciar o treino de recuperação.";
});

// Playable adaptive training for the player's statistically weakest type.
// At least three historical attempts are required by weakestQuizTrainingType.
// Practice updates learning history but never overwrites competitive records.
const quizWeakestTypePracticeButton=document.createElement("button");
quizWeakestTypePracticeButton.type="button";
quizWeakestTypePracticeButton.className=quizOverdueMistakesButton.className;
quizWeakestTypePracticeButton.textContent="Treinar meu tipo mais difícil";
quizWeakestTypePracticeButton.setAttribute("aria-label",
    "Iniciar até dez perguntas do tipo com maior taxa de erros, sem ranking");
quizOverdueMistakesButton.insertAdjacentElement("afterend",
    quizWeakestTypePracticeButton);
quizWeakestTypePracticeButton.addEventListener("click",()=>{
    const type=weakestQuizTrainingType();
    if(!type){
        quizHistoryImportStatus.textContent=
            "Ainda não há histórico suficiente de erros por tipo. "+
            "Responda pelo menos três perguntas de um tipo para liberar o treino.";
        return;
    }
    const eligible=quizCards.filter(card=>card.types.includes(type));
    if(eligible.length<4){
        quizHistoryImportStatus.textContent=
            "O tipo selecionado não tem quatro espécies disponíveis.";
        return;
    }
    const started=launchQuizRound(false,type,false,0,false,10,false,
        false,false,false,false,null,"all",true);
    quizHistoryImportStatus.textContent=started?
        "Treino adaptativo de "+type+" iniciado com até "+
        Math.min(10,eligible.length)+
        " espécies. Recordes competitivos preservados.":
        "Não foi possível iniciar o treino adaptativo.";
});

// Playable catch-up for the overdue type with the weakest local history.
// Uses the existing due-only, practice-only path and never changes rankings.
const quizWeakDuePracticeButton=document.createElement("button");
quizWeakDuePracticeButton.type="button";
quizWeakDuePracticeButton.className=quizWeakestTypePracticeButton.className;
quizWeakDuePracticeButton.textContent="Revisar meu tipo vencido mais difícil";
quizWeakDuePracticeButton.setAttribute("aria-label",
    "Treinar até oito revisões vencidas do tipo com mais erros, sem ranking");
quizWeakestTypePracticeButton.insertAdjacentElement("afterend",
    quizWeakDuePracticeButton);
quizWeakDuePracticeButton.addEventListener("click",()=>{
    const due=dueReviewCards();
    const groups=new Map();
    for(const card of due){
        for(const type of card.types){
            if(!groups.has(type))groups.set(type,[]);
            groups.get(type).push(card);
        }
    }
    const ranked=[...groups].map(([type,cards])=>{
        const stats=quizTypeHistory.get(type);
        const errorRate=stats&&stats.asked>=3
            ?(stats.asked-stats.correct)/stats.asked:0;
        const earliest=Math.min(...cards.map(card=>
            quizSpacedReviews.get(card.number)?.dueAt??Infinity));
        return {type,count:cards.length,errorRate,earliest};
    }).sort((a,b)=>b.errorRate-a.errorRate||
        b.count-a.count||a.earliest-b.earliest||
        a.type.localeCompare(b.type,"pt-BR"));
    if(!ranked.length){
        quizHistoryImportStatus.textContent=
            "Nenhuma revisão vencida disponível no momento.";
        return;
    }
    const selected=ranked[0];
    const started=launchQuizRound(false,selected.type,true,0,false,8,
        false,false,false,false,false,null,"all",true);
    quizHistoryImportStatus.textContent=started
        ?"Treino vencido de "+selected.type+" iniciado com até "+
            Math.min(8,selected.count)+" perguntas. Sem ranking."
        :"Não foi possível abrir a revisão vencida.";
});

// Short playable review for overdue mistakes already in the collection.
// The due-only practice path preserves ranked records and capture progress.
const quizCapturedMistakesDueButton=document.createElement("button");
quizCapturedMistakesDueButton.type="button";
quizCapturedMistakesDueButton.className=quizWeakDuePracticeButton.className;
quizCapturedMistakesDueButton.textContent="Revisar erros vencidos dos capturados";
quizCapturedMistakesDueButton.setAttribute("aria-label",
    "Treinar até dez erros vencidos dos Pokémon capturados, sem ranking");
quizWeakDuePracticeButton.insertAdjacentElement("afterend",
    quizCapturedMistakesDueButton);
quizCapturedMistakesDueButton.addEventListener("click",()=>{
    const available=dueReviewCards().filter(card=>
        capturados.has(card.number)&&quizPracticeNumbers.has(card.number));
    if(!available.length){
        quizHistoryImportStatus.textContent=
            "Nenhum erro vencido de Pokémon capturado precisa de revisão.";
        return;
    }
    const started=launchQuizRound(false,null,true,0,true,10,
        false,false,false,false,false,null,"captured",true);
    quizHistoryImportStatus.textContent=started
        ?"Revisão iniciada: até "+Math.min(10,available.length)+
            " erros vencidos dos capturados. Recordes preservados."
        :"Não foi possível iniciar esta revisão.";
});

// Practice overdue errors for species still missing from the collection.
// The counter is computed from local revision data, never a network request.
const quizMissingMistakesDueButton=document.createElement("button");
quizMissingMistakesDueButton.type="button";
quizMissingMistakesDueButton.className=quizCapturedMistakesDueButton.className;
quizMissingMistakesDueButton.setAttribute("aria-label",
    "Treinar erros vencidos de Pokémon não capturados sem alterar recordes");
quizCapturedMistakesDueButton.insertAdjacentElement("afterend",
    quizMissingMistakesDueButton);
function refreshMissingMistakesDueLabel(){
    const count=dueReviewCards().filter(card=>
        !capturados.has(card.number)&&quizPracticeNumbers.has(card.number)).length;
    quizMissingMistakesDueButton.disabled=count===0;
    quizMissingMistakesDueButton.textContent=
        "Revisar erros vencidos não capturados ("+count+")";
    quizMissingMistakesDueButton.title=count
        ?count+" revisão(ões) vencida(s) aguardando treino"
        :"Nenhum erro vencido pendente neste grupo";
}
refreshMissingMistakesDueLabel();
quizMissingMistakesDueButton.addEventListener("click",()=>{
    const available=dueReviewCards().filter(card=>
        !capturados.has(card.number)&&quizPracticeNumbers.has(card.number));
    refreshMissingMistakesDueLabel();
    if(!available.length){
        quizHistoryImportStatus.textContent=
            "Nenhum erro vencido de Pokémon não capturado precisa de revisão.";
        return;
    }
    const started=launchQuizRound(false,null,true,0,true,10,
        false,false,false,false,false,null,"missing",true);
    quizHistoryImportStatus.textContent=started
        ?"Treino iniciado com até "+Math.min(10,available.length)+
            " erros vencidos não capturados. Sem ranking."
        :"Não foi possível iniciar o treino de revisões.";
});

 
// Urgent mistake-only sprint: due for at least seven full days.
// Uses the existing review-only scoring path and oldest-deadline ordering.
const quizUrgentMistakesButton=document.createElement("button");
quizUrgentMistakesButton.type="button";
quizUrgentMistakesButton.className=quizMissingMistakesDueButton.className;
quizUrgentMistakesButton.setAttribute("aria-label",
    "Treinar erros de Pokémon vencidos há pelo menos sete dias, sem ranking");
quizMissingMistakesDueButton.insertAdjacentElement("afterend",
    quizUrgentMistakesButton);
function refreshUrgentMistakesLabel(){
    const cutoff=Date.now()-7*QUIZ_DAY_MS;
    const count=dueReviewCards().filter(card=>
        quizPracticeNumbers.has(card.number)&&
        quizSpacedReviews.get(card.number)?.dueAt<=cutoff).length;
    quizUrgentMistakesButton.textContent=
        "Treino urgente de erros (7+ dias): "+count;
    quizUrgentMistakesButton.disabled=count===0;
}
refreshUrgentMistakesLabel();
quizUrgentMistakesButton.addEventListener("click",()=>{
    const count=dueReviewCards().filter(card=>
        quizPracticeNumbers.has(card.number)&&
        quizSpacedReviews.get(card.number)?.dueAt<=
            Date.now()-7*QUIZ_DAY_MS).length;
    refreshUrgentMistakesLabel();
    if(!count){
        quizHistoryImportStatus.textContent=
            "Não há erros vencidos há sete dias para revisar.";
        return;
    }
    const started=launchQuizRound(false,null,true,7,true,10,
        false,false,false,false,false,null,"all",true);
    quizHistoryImportStatus.textContent=started
        ?"Treino urgente iniciado: até "+Math.min(10,count)+
            " erros antigos, sem alterar recordes."
        :"Não foi possível iniciar o treino urgente.";
});
// Intersection sprint: a marked species with a saved mistake and an overdue
// spaced-review date. It is practice-only and never updates competitive records.
const quizPinnedMistakeReviewButton=document.createElement("button");
quizPinnedMistakeReviewButton.type="button";
quizPinnedMistakeReviewButton.className=quizUrgentMistakesButton.className;
quizPinnedMistakeReviewButton.setAttribute("aria-label",
    "Revisar Pokémon marcados com erros vencidos, sem ranking");
quizUrgentMistakesButton.insertAdjacentElement("afterend",
    quizPinnedMistakeReviewButton);
function refreshPinnedMistakeReviewLabel(){
    const pool=dueReviewCards().filter(card=>
        quizPinnedNumbers.has(card.number)&&
        quizPracticeNumbers.has(card.number));
    const captured=pool.filter(card=>capturados.has(card.number)).length;
    const missing=pool.length-captured;
    quizPinnedMistakeReviewButton.textContent=
        "Erros marcados vencidos ("+pool.length+")";
    quizPinnedMistakeReviewButton.title=
        captured+" capturados, "+missing+" ainda não capturados";
    quizPinnedMistakeReviewButton.disabled=pool.length===0;
}
refreshPinnedMistakeReviewLabel();
quizPinnedMistakeReviewButton.addEventListener("click",()=>{
    const count=dueReviewCards().filter(card=>
        quizPinnedNumbers.has(card.number)&&
        quizPracticeNumbers.has(card.number)).length;
    refreshPinnedMistakeReviewLabel();
    if(!count){
        quizHistoryImportStatus.textContent=
            "Não há erros marcados com revisão vencida.";
        return;
    }
    const started=launchQuizRound(false,null,true,0,true,5,
        false,false,false,true,false,null,"all",true);
    quizHistoryImportStatus.textContent=started
        ?"Treino de erros marcados iniciado: até "+
            Math.min(5,count)+" questões, sem ranking."
        :"Não foi possível iniciar o treino de erros marcados.";
});
// Three-question, oldest-first micro-practice for overdue saved mistakes.
// It uses review scoring, so competitive records remain unchanged.
const quizMistakeMicroSprintButton=document.createElement("button");
quizMistakeMicroSprintButton.type="button";
quizMistakeMicroSprintButton.className=quizPinnedMistakeReviewButton.className;
quizMistakeMicroSprintButton.setAttribute("aria-label",
    "Treinar até três erros vencidos em revisão rápida sem ranking");
quizPinnedMistakeReviewButton.insertAdjacentElement("afterend",
    quizMistakeMicroSprintButton);
function refreshMistakeMicroSprintLabel(){
    const count=dueReviewCards().filter(card=>
        quizPracticeNumbers.has(card.number)).length;
    quizMistakeMicroSprintButton.textContent=
        "Microtreino de erros vencidos (até 3 de "+count+")";
    quizMistakeMicroSprintButton.disabled=count===0;
}
refreshMistakeMicroSprintLabel();
quizMistakeMicroSprintButton.addEventListener("click",()=>{
    const count=dueReviewCards().filter(card=>
        quizPracticeNumbers.has(card.number)).length;
    refreshMistakeMicroSprintLabel();
    if(!count){
        quizHistoryImportStatus.textContent=
            "Nenhum erro vencido disponível para o microtreino.";
        return;
    }
    const started=launchQuizRound(false,null,true,0,true,3,
        false,false,false,false,false,null,"all",true);
    quizHistoryImportStatus.textContent=started
        ?"Microtreino iniciado: "+Math.min(3,count)+
            " questões mais antigas, sem ranking."
        :"Não foi possível iniciar o microtreino.";
});
quizDialog.addEventListener("close",refreshMistakeMicroSprintLabel);

quizDialog.addEventListener("close",refreshPinnedMistakeReviewLabel);

quizDialog.addEventListener("close",refreshUrgentMistakesLabel);
quizDialog.addEventListener("close",refreshMissingMistakesDueLabel);


// Cross-type recovery challenge for overdue saved mistakes. It is a practice
// round, never a ranked quiz, and a dual-type species is selected only once.
const quizDualTypeRecoveryButton=document.createElement("button");
quizDualTypeRecoveryButton.type="button";
quizDualTypeRecoveryButton.className=quizMistakeMicroSprintButton.className;
quizDualTypeRecoveryButton.setAttribute("aria-label",
    "Treinar erros vencidos de dois tipos mais frequentes sem ranking");
quizMistakeMicroSprintButton.insertAdjacentElement("afterend",
    quizDualTypeRecoveryButton);
function overdueMistakeTypeLeaders(limit=2){
    const frequency=new Map();
    for(const card of dueReviewCards()){
        if(!quizPracticeNumbers.has(card.number))continue;
        for(const type of new Set(card.types))
            frequency.set(type,(frequency.get(type)||0)+1);
    }
    return [...frequency].sort((a,b)=>b[1]-a[1]||
        a[0].localeCompare(b[0],"pt-BR")).slice(0,
            Number.isSafeInteger(limit)&&limit>=2&&limit<=3?limit:2);
}
function refreshDualTypeRecoveryLabel(){
    const leaders=overdueMistakeTypeLeaders();
    quizDualTypeRecoveryButton.disabled=leaders.length<2;
    quizDualTypeRecoveryButton.textContent=leaders.length<2
        ?"Desafio de dois tipos (aguardando erros)"
        :"Desafio de erros: "+leaders.map(row=>row[0]).join(" + ");
    quizDualTypeRecoveryButton.title=leaders.length<2
        ?"Necessários erros vencidos em pelo menos dois tipos."
        :"Até oito revisões vencidas dos tipos prioritários, sem ranking.";
}
refreshDualTypeRecoveryLabel();
quizDualTypeRecoveryButton.addEventListener("click",()=>{
    const leaders=overdueMistakeTypeLeaders();
    if(leaders.length<2){
        quizHistoryImportStatus.textContent=
            "Ainda não há dois tipos com erros vencidos.";
        refreshDualTypeRecoveryLabel();
        return;
    }
    const focusTypes=leaders.map(row=>row[0]);
    const started=launchQuizRound(false,null,true,0,true,8,
        true,false,false,false,false,focusTypes,"all",true);
    quizHistoryImportStatus.textContent=started
        ?"Desafio de dois tipos iniciado, até oito questões sem ranking."
        :"Não foi possível iniciar o desafio de dois tipos.";
});
quizDialog.addEventListener("close",refreshDualTypeRecoveryLabel);

// Three-type practice challenge: alternate the player's weakest overdue
// categories without counting a dual-type species twice or touching rankings.
const quizTripleTypeRecoveryButton=document.createElement("button");
quizTripleTypeRecoveryButton.type="button";
quizTripleTypeRecoveryButton.className=quizDualTypeRecoveryButton.className;
quizTripleTypeRecoveryButton.setAttribute("aria-label",
    "Treinar até dez erros vencidos dos três tipos mais frequentes sem ranking");
quizDualTypeRecoveryButton.insertAdjacentElement("afterend",
    quizTripleTypeRecoveryButton);
function refreshTripleTypeRecoveryLabel(){
    const leaders=overdueMistakeTypeLeaders(3);
    quizTripleTypeRecoveryButton.disabled=leaders.length<3;
    quizTripleTypeRecoveryButton.textContent=leaders.length<3
        ?"Desafio de três tipos (aguardando erros)"
        :"Desafio de três tipos: "+leaders.map(row=>row[0]).join(" + ");
    quizTripleTypeRecoveryButton.title=leaders.length<3
        ?"Necessários erros vencidos em três tipos diferentes."
        :"Até dez revisões vencidas, alternadas entre três tipos, sem ranking.";
}
refreshTripleTypeRecoveryLabel();
quizTripleTypeRecoveryButton.addEventListener("click",()=>{
    const leaders=overdueMistakeTypeLeaders(3);
    if(leaders.length<3){
        quizHistoryImportStatus.textContent=
            "Ainda não há três tipos com erros vencidos.";
        refreshTripleTypeRecoveryLabel();
        return;
    }
    const started=launchQuizRound(false,null,true,0,true,10,
        true,false,false,false,false,leaders.map(row=>row[0]),"all",true);
    quizHistoryImportStatus.textContent=started
        ?"Desafio de três tipos iniciado, até dez questões sem ranking."
        :"Não foi possível iniciar o desafio de três tipos.";
});
quizDialog.addEventListener("close",refreshTripleTypeRecoveryLabel);


// Playable recovery that avoids immediately repeating a recent mistake when
// another overdue mistake has the same calendar-day priority. Ranked records
// remain unchanged because this round is explicitly practice-only.
const quizFreshDueMistakesButton=document.createElement("button");
quizFreshDueMistakesButton.type="button";
quizFreshDueMistakesButton.className=quizTripleTypeRecoveryButton.className;
quizFreshDueMistakesButton.setAttribute("aria-label",
    "Treinar até oito erros vencidos priorizando espécies não vistas recentemente");
quizTripleTypeRecoveryButton.insertAdjacentElement("afterend",
    quizFreshDueMistakesButton);
function refreshFreshDueMistakesLabel(){
    const eligible=dueReviewCards().filter(card=>
        quizPracticeNumbers.has(card.number));
    const fresh=eligible.filter(card=>!recentQuizNumbers.has(card.number));
    quizFreshDueMistakesButton.disabled=eligible.length===0;
    quizFreshDueMistakesButton.textContent=eligible.length
        ?"Erros vencidos sem repetição: "+fresh.length+" novos / "+
            eligible.length+" pendentes"
        :"Erros vencidos sem repetição (fila vazia)";
}
refreshFreshDueMistakesLabel();
quizFreshDueMistakesButton.addEventListener("click",()=>{
    const eligible=dueReviewCards().filter(card=>
        quizPracticeNumbers.has(card.number));
    if(!eligible.length){
        quizHistoryImportStatus.textContent=
            "Não há erros vencidos para revisão neste momento.";
        refreshFreshDueMistakesLabel();
        return;
    }
    const started=launchQuizRound(false,null,true,0,true,8,
        false,false,true,false,false,null,"all",true);
    quizHistoryImportStatus.textContent=started
        ?"Treino iniciado com até "+Math.min(8,eligible.length)+
            " erros vencidos. Espécies recentes ficam atrás das demais "+
            "dentro do mesmo dia de vencimento. Sem ranking."
        :"Não foi possível iniciar o treino sem repetições.";
});
quizDialog.addEventListener("close",refreshFreshDueMistakesLabel);

// Focused playable review: choose the overdue mistake type with the weakest
// historical accuracy, not merely the type with the most pending cards.
const quizWeakMasteryDueButton=document.createElement("button");
quizWeakMasteryDueButton.type="button";
quizWeakMasteryDueButton.className=quizFreshDueMistakesButton.className;
quizWeakMasteryDueButton.setAttribute("aria-label",
    "Treinar revisões vencidas do tipo com menor domínio histórico");
quizFreshDueMistakesButton.insertAdjacentElement("afterend",
    quizWeakMasteryDueButton);
function weakestOverdueMistakeType(){
    const counts=new Map();
    for(const card of dueReviewCards()){
        if(!quizPracticeNumbers.has(card.number))continue;
        for(const type of new Set(card.types))
            counts.set(type,(counts.get(type)||0)+1);
    }
    const candidates=[...counts].map(([type,pending])=>{
        const history=quizTypeHistory.get(type);
        const asked=history?.asked||0;
        const correct=history?.correct||0;
        return {type,pending,asked,
            accuracy:asked>=3?correct/asked:1,
            needsBaseline:asked<3};
    });
    candidates.sort((a,b)=>a.accuracy-b.accuracy||
        Number(a.needsBaseline)-Number(b.needsBaseline)||
        b.pending-a.pending||a.type.localeCompare(b.type,"pt-BR"));
    return candidates[0]||null;
}
function refreshWeakMasteryDueLabel(){
    const choice=weakestOverdueMistakeType();
    quizWeakMasteryDueButton.disabled=!choice;
    quizWeakMasteryDueButton.textContent=choice
        ?"Reforçar tipo "+choice.type+" ("+choice.pending+" vencidos)"
        :"Reforçar tipo com menor domínio (fila vazia)";
}
refreshWeakMasteryDueLabel();
quizWeakMasteryDueButton.addEventListener("click",()=>{
    const choice=weakestOverdueMistakeType();
    if(!choice){
        quizHistoryImportStatus.textContent="Nenhum erro vencido disponível.";
        refreshWeakMasteryDueLabel();
        return;
    }
    const started=launchQuizRound(false,choice.type,true,0,true,8,
        false,false,false,false,false,null,"all",true);
    quizHistoryImportStatus.textContent=started
        ?"Revisão de "+choice.type+" iniciada. Até oito questões sem ranking."
        :"Não foi possível iniciar a revisão por domínio.";
});
quizDialog.addEventListener("close",refreshWeakMasteryDueLabel);


// Playable practice for overdue mistakes from the least-practiced type.
// This complements low-accuracy review without changing ranked records.
const quizUndertrainedTypeButton=document.createElement("button");
quizUndertrainedTypeButton.type="button";
quizUndertrainedTypeButton.className=quizWeakMasteryDueButton.className;
quizUndertrainedTypeButton.setAttribute("aria-label",
    "Treinar erros vencidos do tipo com menos questões já praticadas");
quizWeakMasteryDueButton.insertAdjacentElement("afterend",
    quizUndertrainedTypeButton);
function leastPracticedOverdueType(){
    const counts=new Map();
    for(const card of dueReviewCards()){
        if(!quizPracticeNumbers.has(card.number))continue;
        for(const type of new Set(card.types))
            counts.set(type,(counts.get(type)||0)+1);
    }
    const candidates=[...counts].map(([type,pending])=>({
        type,pending,asked:quizTypeHistory.get(type)?.asked||0
    }));
    candidates.sort((a,b)=>a.asked-b.asked||b.pending-a.pending||
        a.type.localeCompare(b.type,"pt-BR"));
    return candidates[0]||null;
}
function refreshUndertrainedTypeButton(){
    const choice=leastPracticedOverdueType();
    quizUndertrainedTypeButton.disabled=!choice;
    quizUndertrainedTypeButton.textContent=choice
        ?"Treinar tipo menos praticado: "+choice.type+
            " ("+choice.pending+" vencidos)"
        :"Treinar tipo menos praticado (fila vazia)";
}
refreshUndertrainedTypeButton();
quizUndertrainedTypeButton.addEventListener("click",()=>{
    const choice=leastPracticedOverdueType();
    if(!choice){
        quizHistoryImportStatus.textContent=
            "Nenhum erro vencido disponível para este treino.";
        refreshUndertrainedTypeButton();
        return;
    }
    const started=launchQuizRound(false,choice.type,true,0,true,8,
        false,false,false,false,false,null,"all",true);
    quizHistoryImportStatus.textContent=started
        ?"Treino do tipo "+choice.type+" iniciado, até oito questões sem ranking."
        :"Não foi possível iniciar o treino por prática.";
});
quizDialog.addEventListener("close",refreshUndertrainedTypeButton);

// Short playable review prioritizes pinned, overdue mistakes without ranking.
// All question selection still passes through the canonical quiz engine.
const quizPriorityMistakeSprintButton=document.createElement("button");
quizPriorityMistakeSprintButton.type="button";
quizPriorityMistakeSprintButton.className=quizUndertrainedTypeButton.className;
quizPriorityMistakeSprintButton.setAttribute("aria-label",
    "Iniciar cinco questões prioritárias de erros vencidos, sem ranking");
quizUndertrainedTypeButton.insertAdjacentElement("afterend",
    quizPriorityMistakeSprintButton);
function refreshPriorityMistakeSprint(){
    const pending=dueReviewCards().filter(card=>
        quizPracticeNumbers.has(card.number)).length;
    quizPriorityMistakeSprintButton.disabled=pending===0;
    quizPriorityMistakeSprintButton.textContent=pending
        ?"Revisão rápida: "+Math.min(5,pending)+
            " de "+pending+" erro(s) vencido(s)"
        :"Revisão rápida: sem erros vencidos";
}
refreshPriorityMistakeSprint();
quizPriorityMistakeSprintButton.addEventListener("click",()=>{
    const pending=dueReviewCards().filter(card=>
        quizPracticeNumbers.has(card.number)).length;
    if(!pending){
        quizHistoryImportStatus.textContent="Não há erros vencidos para revisar.";
        refreshPriorityMistakeSprint();
        return;
    }
    const started=launchQuizRound(false,null,true,0,true,5,true,
        false,true,false,true,null,"all",true);
    quizHistoryImportStatus.textContent=started
        ?"Revisão prioritária iniciada, até cinco questões sem ranking."
        :"A revisão prioritária não pôde ser iniciada.";
});
quizDialog.addEventListener("close",refreshPriorityMistakeSprint);
// A completed review can clear its own pending error. Recalculate every
// visible shortcut instead of leaving yesterday's counts on the screen.
quizDialog.addEventListener("close",()=>{
    refreshMissingMistakesDueLabel();
    refreshUrgentMistakesLabel();
    refreshWeakMasteryDueLabel();
    refreshUndertrainedTypeButton();
    refreshPriorityMistakeSprint();
    updateDueReviewButton();
});

quizClose.addEventListener("click", () => quizDialog.close());
quizDialog.addEventListener("close", () => {
    quizDifficulty.disabled = false;
    quizLength.disabled = false;
    quizCollection.disabled = false;
    quizResumeButton.hidden = !(quizQuestions.length > 0 && quizIndex < quizRoundSize);
    quizButton.focus();
});
