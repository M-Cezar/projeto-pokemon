const botaoAlterarTema = document.getElementById("botao-alterar-tema");
const body = document.querySelector("body");
const imagembBotaoTrocaDeTema = document.querySelector(".imagem-botao")

const CHAVE_TEMA = "pokedex:tema:v1";
function aplicarTema(escuro) {
    body.classList.toggle("modo-escuro", escuro);
    botaoAlterarTema.setAttribute("aria-pressed", String(escuro));
    imagembBotaoTrocaDeTema.setAttribute("src",
        escuro ? "./src/imagens/moon.png" : "./src/imagens/sun.png");
}
try { aplicarTema(localStorage.getItem(CHAVE_TEMA) === "escuro"); }
catch { aplicarTema(body.classList.contains("modo-escuro")); }
botaoAlterarTema.addEventListener("click", () => {
    const escuro = !body.classList.contains("modo-escuro");
    aplicarTema(escuro);
    try { localStorage.setItem(CHAVE_TEMA, escuro ? "escuro" : "claro"); }
    catch { /* O tema continua disponível nesta sessão. */ }
});

const campoBusca = document.getElementById("buscar-pokemon");
const seletorTipo = document.getElementById("filtrar-tipo");
const resultadoBusca = document.getElementById("resultado-busca");
const cartoesPokemon = [...document.querySelectorAll(".listagem-pokemon > .cartao-pokemon")];
const filtroCapturados = document.getElementById("filtrar-capturados") || Object.assign(document.createElement("input"), {type:"checkbox"});
const filtroPendentes = document.getElementById("filtrar-pendentes") || Object.assign(document.createElement("input"), {type:"checkbox"});
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
if (!filtroPendentes.id && filtros) {
    filtroPendentes.id = "filtrar-pendentes";
    const rotuloPendentes = document.createElement("label");
    rotuloPendentes.className = "capturados-filtro";
    rotuloPendentes.htmlFor = filtroPendentes.id;
    rotuloPendentes.append(filtroPendentes, document.createTextNode(" Ainda não capturados"));
    filtros.insertBefore(rotuloPendentes, resultadoBusca);
}
if (!progressoCaptura.id && filtros) {
    progressoCaptura.id = "progresso-captura";
    progressoCaptura.setAttribute("role", "status");
    progressoCaptura.setAttribute("aria-live", "polite");
    filtros.insertBefore(progressoCaptura, resultadoBusca);
}
const CHAVE_CAPTURAS = "pokedex:capturados:v1";
const CHAVE_FAVORITOS = "pokedex:favoritos:v1";
const filtroFavoritos = document.getElementById("filtrar-favoritos") ||
    Object.assign(document.createElement("input"), {type: "checkbox"});
if (!filtroFavoritos.id && filtros) {
    filtroFavoritos.id = "filtrar-favoritos";
    const rotulo = document.createElement("label");
    rotulo.className = "capturados-filtro";
    rotulo.htmlFor = filtroFavoritos.id;
    rotulo.append(filtroFavoritos, document.createTextNode(" Somente favoritos"));
    filtros.insertBefore(rotulo, resultadoBusca);
}
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

function carregarFavoritos() {
    try {
        const salvos = JSON.parse(localStorage.getItem(CHAVE_FAVORITOS) || "[]");
        if (!Array.isArray(salvos)) return new Set();
        return new Set(salvos.filter(numero =>
            typeof numero === "string" && numerosDisponiveis.has(numero)));
    } catch { return new Set(); }
}
const capturados = carregarCapturas();
const favoritos = carregarFavoritos();
const resumoTipos = document.createElement("details");
resumoTipos.className = "resumo-tipos";
if (filtros) filtros.insertBefore(resumoTipos, resultadoBusca);
const medalhasPokedex = document.createElement("details");
medalhasPokedex.className = "resumo-tipos medalhas-pokedex";
if (filtros) filtros.insertBefore(medalhasPokedex, resumoTipos);

const CHAVE_ORDEM = "pokedex:ordenacao:v1";
const modosOrdenacao = new Set(["numero", "nome", "tipo", "capturados", "pendentes", "favoritos"]);
const seletorOrdem = document.createElement("select");
seletorOrdem.id = "ordenar-pokemon";
seletorOrdem.setAttribute("aria-label", "Ordenar a coleção de Pokémon");
for (const [valor, texto] of [
    ["numero", "Número da Pokédex"],
    ["nome", "Nome A–Z"],
    ["tipo", "Tipo primário A–Z"],
    ["capturados", "Capturados primeiro"],
    ["pendentes", "Pendentes primeiro"],
    ["favoritos", "Favoritos primeiro"]
]) {
    const opcao = document.createElement("option");
    opcao.value = valor;
    opcao.textContent = texto;
    seletorOrdem.append(opcao);
}
try {
    const salvo = localStorage.getItem(CHAVE_ORDEM);
    if (modosOrdenacao.has(salvo)) seletorOrdem.value = salvo;
} catch { /* Ordenação padrão disponível sem armazenamento. */ }
if (filtros) {
    const rotuloOrdem = document.createElement("label");
    rotuloOrdem.className = "capturados-filtro";
    rotuloOrdem.append(document.createTextNode("Ordenar: "), seletorOrdem);
    filtros.insertBefore(rotuloOrdem, resultadoBusca);
}
seletorOrdem.addEventListener("change", () => {
    try { localStorage.setItem(CHAVE_ORDEM, seletorOrdem.value); }
    catch { /* A ordenação funciona nesta sessão. */ }
    atualizarFiltros();
});
function ordenarCartoes() {
    const lista = document.querySelector(".listagem-pokemon");
    if (!lista) return;
    const modo = seletorOrdem.value;
    const ordenados = [...cartoesPokemon].sort((a,b) => {
        const numeroA = numeroDoCartao(a), numeroB = numeroDoCartao(b);
        if (modo === "nome") {
            return normalizarBusca(a.querySelector(".informacoes span").textContent)
                .localeCompare(normalizarBusca(b.querySelector(".informacoes span").textContent), "pt");
        }
        if (modo === "tipo") {
            const tipoA = a.querySelector(".tipos .tipo")?.textContent?.trim() || "";
            const tipoB = b.querySelector(".tipos .tipo")?.textContent?.trim() || "";
            const comparacao = normalizarBusca(tipoA).localeCompare(normalizarBusca(tipoB), "pt");
            if (comparacao) return comparacao;
        }
        if (modo === "capturados") {
            const diff = Number(capturados.has(numeroB)) - Number(capturados.has(numeroA));
            if (diff) return diff;
        }
        if (modo === "pendentes") {
            const diff = Number(capturados.has(numeroA)) - Number(capturados.has(numeroB));
            if (diff) return diff;
        }
        if (modo === "favoritos") {
            const diff = Number(favoritos.has(numeroB)) - Number(favoritos.has(numeroA));
            if (diff) return diff;
        }
        return cartoesPokemon.indexOf(a) - cartoesPokemon.indexOf(b);
    });
    lista.append(...ordenados);
}

const renderizarCapturas = [];
const renderizarFavoritos = [];
// One-step local undo; another tab's write invalidates the snapshot.
let ultimaAlteracao = null;
let botaoDesfazer = null;
// Keep separate browser tabs in sync without replacing the current page.
window.addEventListener("storage", event => {
    if ([CHAVE_CAPTURAS, CHAVE_FAVORITOS, null].includes(event.key)) {
        ultimaAlteracao = null;
        if (botaoDesfazer) botaoDesfazer.disabled = true;
    }
    if (event.key === CHAVE_ORDEM || event.key === null) {
        let modo = "numero";
        try { modo = localStorage.getItem(CHAVE_ORDEM) || "numero"; } catch {}
        seletorOrdem.value = modosOrdenacao.has(modo) ? modo : "numero";
        atualizarFiltros();
    }
    if (event.key === CHAVE_TEMA) {
        aplicarTema(event.newValue === "escuro");
    }
    if (event.key === CHAVE_CAPTURAS || event.key === null) {
        const atualizados = carregarCapturas();
        capturados.clear();
        for (const numero of atualizados) capturados.add(numero);
        renderizarCapturas.forEach(render => render());
        atualizarFiltros();
    }
    if (event.key === CHAVE_FAVORITOS || event.key === null) {
        const atualizados = carregarFavoritos();
        favoritos.clear();
        for (const numero of atualizados) favoritos.add(numero);
        renderizarFavoritos.forEach(render => render());
        atualizarFiltros();
    }
});
function salvarCapturas() {
    try { localStorage.setItem(CHAVE_CAPTURAS, JSON.stringify([...capturados])); }
    catch { /* Sem armazenamento, a sessão continua jogável. */ }
}
function salvarFavoritos() {
    try { localStorage.setItem(CHAVE_FAVORITOS, JSON.stringify([...favoritos])); }
    catch { /* Favoritos continuam disponíveis durante a sessão. */ }
}
function registrarDesfazer() {
    ultimaAlteracao = {capturas: new Set(capturados), favoritos: new Set(favoritos)};
    if (botaoDesfazer) botaoDesfazer.disabled = false;
}
function desfazerAlteracao() {
    if (!ultimaAlteracao) return;
    const anterior = ultimaAlteracao;
    ultimaAlteracao = null;
    capturados.clear();
    favoritos.clear();
    for (const numero of anterior.capturas) capturados.add(numero);
    for (const numero of anterior.favoritos) favoritos.add(numero);
    salvarCapturas();
    salvarFavoritos();
    renderizarCapturas.forEach(render => render());
    renderizarFavoritos.forEach(render => render());
    if (botaoDesfazer) botaoDesfazer.disabled = true;
    atualizarFiltros();
}
// A deliberate, single-step capture action using the currently visible order.
// Never alters hidden Pokémon; the existing undo snapshot restores the change.
const capturarProximoVisivel = document.createElement("button");
capturarProximoVisivel.type = "button";
capturarProximoVisivel.id = "capturar-proximo-visivel";
capturarProximoVisivel.textContent = "Capturar próximo pendente visível";
capturarProximoVisivel.setAttribute("aria-label", "Marcar o próximo Pokémon pendente da lista filtrada");
const capturaRapidaStatus = document.createElement("span");
capturaRapidaStatus.setAttribute("role", "status");
capturaRapidaStatus.setAttribute("aria-live", "polite");
if (filtros) filtros.insertBefore(capturarProximoVisivel, resultadoBusca);
if (filtros) filtros.insertBefore(capturaRapidaStatus, resultadoBusca);
capturarProximoVisivel.addEventListener("click", () => {
    const proximo = [...document.querySelectorAll(".listagem-pokemon > .cartao-pokemon")]
        .find(cartao => !cartao.hidden && !capturados.has(numeroDoCartao(cartao)));
    if (!proximo) {
        capturaRapidaStatus.textContent = "Nenhum Pokémon pendente nos filtros atuais.";
        return;
    }
    const numero = numeroDoCartao(proximo);
    registrarDesfazer();
    capturados.add(numero);
    salvarCapturas();
    renderizarCapturas.forEach(render => render());
    atualizarFiltros();
    const nome = proximo.querySelector(".informacoes span")?.textContent?.trim() || numero;
    capturaRapidaStatus.textContent = nome + " capturado. A ação pode ser desfeita.";
});

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
    renderizarCapturas.push(atualizarBotao);
    botao.addEventListener("click", () => {
        registrarDesfazer();
        if (capturados.has(numero)) capturados.delete(numero);
        else capturados.add(numero);
        salvarCapturas();
        atualizarBotao();
        atualizarFiltros();
    });
    const botaoFavorito = document.createElement("button");
    botaoFavorito.type = "button";
    botaoFavorito.className = "favoritar-pokemon";
    function atualizarFavorito() {
        const favorito = favoritos.has(numero);
        botaoFavorito.setAttribute("aria-pressed", String(favorito));
        botaoFavorito.setAttribute("aria-label",
            (favorito ? "Remover dos favoritos: " : "Adicionar aos favoritos: ") +
            cartao.querySelector(".informacoes span").textContent.trim());
        botaoFavorito.textContent = favorito ? "★ Favorito" : "☆ Favoritar";
        cartao.classList.toggle("favorito", favorito);
    }
    renderizarFavoritos.push(atualizarFavorito);
    botaoFavorito.addEventListener("click", () => {
        registrarDesfazer();
        if (favoritos.has(numero)) favoritos.delete(numero);
        else favoritos.add(numero);
        salvarFavoritos();
        atualizarFavorito();
        atualizarFiltros();
    });
    cartao.append(botao, botaoFavorito);
    atualizarBotao();
    atualizarFavorito();
}

// Bulk actions apply only to currently visible cards, preserving other
// captures and using the same persistence as individual capture buttons.
if (filtros) {
    const acoes = document.createElement("div");
    acoes.className = "acoes-captura";
    const capturarVisiveis = document.createElement("button");
    capturarVisiveis.type = "button";
    capturarVisiveis.textContent = "Capturar visíveis";
    const limparVisiveis = document.createElement("button");
    limparVisiveis.type = "button";
    limparVisiveis.textContent = "Desmarcar visíveis";
    function aplicarEmVisiveis(capturar) {
        let alterados = 0;
        for (const cartao of cartoesPokemon) {
            if (cartao.hidden) continue;
            const numero = numeroDoCartao(cartao);
            if (capturados.has(numero) === capturar) continue;
            if (!alterados) registrarDesfazer();
            if (capturar) capturados.add(numero);
            else capturados.delete(numero);
            alterados++;
        }
        if (alterados) {
            salvarCapturas();
            renderizarCapturas.forEach(render => render());
        }
        atualizarFiltros();
    }
    capturarVisiveis.addEventListener("click", () => aplicarEmVisiveis(true));
    limparVisiveis.addEventListener("click", () => {
        if (window.confirm("Desmarcar os Pokémon atualmente visíveis?")) aplicarEmVisiveis(false);
    });
    const descobrirPendente = document.createElement("button");
    descobrirPendente.type = "button";
    descobrirPendente.textContent = "Descobrir um pendente";
    descobrirPendente.setAttribute("aria-label", "Encontrar um Pokémon ainda não capturado");
    descobrirPendente.addEventListener("click", () => {
        const pendentes = cartoesPokemon.filter(cartao => !capturados.has(numeroDoCartao(cartao)));
        if (!pendentes.length) {
            resultadoBusca.textContent = "Coleção completa: todos os Pokémon foram capturados.";
            return;
        }
        // Clear only display filters; never alter captured species or favorites.
        campoBusca.value = "";
        seletorTipo.value = "";
        filtroCapturados.checked = false;
        filtroPendentes.checked = false;
        filtroFavoritos.checked = false;
        atualizarFiltros();
        const escolhido = pendentes[Math.floor(Math.random() * pendentes.length)];
        escolhido.setAttribute("tabindex", "-1");
        escolhido.scrollIntoView({behavior: "smooth", block: "center"});
        escolhido.focus({preventScroll: true});
        const nome = escolhido.querySelector(".informacoes span")?.textContent?.trim() || "Pokémon";
        resultadoBusca.textContent = "Pendente sugerido: " + nome + ".";
    });
    // Find the closest unfinished type collection, using only catalogue cards.
    // Filtering never changes saved captures, favorites or their ordering.
    const concluirTipo = document.createElement("button");
    concluirTipo.type = "button";
    concluirTipo.textContent = "Concluir tipo mais próximo";
    concluirTipo.setAttribute("aria-label", "Mostrar Pokémon pendentes do tipo mais próximo da conclusão");
    concluirTipo.addEventListener("click", () => {
        const opcoes = [...seletorTipo.options].filter(opcao => opcao.value);
        const metas = opcoes.map(opcao => {
            const especies = cartoesPokemon.filter(cartao =>
                [...cartao.querySelectorAll(".tipos .tipo")].some(tipo =>
                    tipo.classList.contains(opcao.value)));
            const pendentes = especies.filter(cartao =>
                !capturados.has(numeroDoCartao(cartao)));
            return {id: opcao.value, nome: opcao.textContent.trim(),
                total: especies.length, pendentes: pendentes.length};
        }).filter(meta => meta.total > 0 && meta.pendentes > 0)
            .sort((a, b) => a.pendentes - b.pendentes ||
                (b.total - b.pendentes) - (a.total - a.pendentes) ||
                a.nome.localeCompare(b.nome, "pt-BR"));
        if (!metas.length) {
            resultadoBusca.textContent = "Todos os tipos disponíveis já foram completados.";
            return;
        }
        const meta = metas[0];
        campoBusca.value = "";
        seletorTipo.value = meta.id;
        filtroCapturados.checked = false;
        filtroPendentes.checked = true;
        filtroFavoritos.checked = false;
        atualizarFiltros();
        resultadoBusca.textContent = "Meta sugerida: " + meta.nome + " · faltam " +
            meta.pendentes + " de " + meta.total + " Pokémon deste tipo.";
        seletorTipo.focus();
    });
    botaoDesfazer = document.createElement("button");
    botaoDesfazer.type = "button";
    botaoDesfazer.textContent = "Desfazer última alteração";
    botaoDesfazer.setAttribute("aria-label", "Desfazer última alteração local de capturas ou favoritos");
    botaoDesfazer.disabled = !ultimaAlteracao;
    botaoDesfazer.addEventListener("click", desfazerAlteracao);
    const favoritosPendentes = document.createElement("button");
    favoritosPendentes.type = "button";
    favoritosPendentes.textContent = "Favoritos ainda não capturados";
    favoritosPendentes.setAttribute("aria-label", "Mostrar somente favoritos pendentes de captura");
    favoritosPendentes.addEventListener("click", () => {
        const total = [...favoritos].filter(numero => !capturados.has(numero)).length;
        campoBusca.value = "";
        seletorTipo.value = "";
        filtroCapturados.checked = false;
        filtroPendentes.checked = true;
        filtroFavoritos.checked = true;
        atualizarFiltros();
        resultadoBusca.textContent = total
            ? total + " favoritos ainda aguardam captura."
            : "Nenhum favorito pendente de captura.";
        filtroFavoritos.focus();
    });
    acoes.append(capturarVisiveis, limparVisiveis, descobrirPendente, concluirTipo, favoritosPendentes, botaoDesfazer);
    filtros.insertBefore(acoes, resultadoBusca);
}

// Local, versioned export/import. An import only adds valid species in the
// current catalogue; no existing captured Pokémon is silently deleted.
if (filtros) {
    const transferir = document.createElement("div");
    transferir.className = "acoes-backup";
    const exportar = document.createElement("button");
    exportar.type = "button";
    exportar.textContent = "Exportar capturas";
    const importar = document.createElement("button");
    importar.type = "button";
    importar.textContent = "Mesclar backup";
    const arquivo = document.createElement("input");
    arquivo.type = "file";
    arquivo.accept = ".json,application/json";
    arquivo.hidden = true;
    const status = document.createElement("p");
    status.className = "capturas-transferencia-status";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");

    exportar.addEventListener("click", () => {
        const conteudo = JSON.stringify({
            versao: 2,
            exportadoEm: new Date().toISOString(),
            capturados: [...capturados].sort(),
            favoritos: [...favoritos].sort()
        }, null, 2);
        const url = URL.createObjectURL(new Blob([conteudo], {type: "application/json;charset=utf-8"}));
        const link = document.createElement("a");
        link.href = url;
        link.download = "pokedex-capturas.json";
        document.body.append(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1200);
        status.textContent = capturados.size + " capturas exportadas para arquivo local.";
    });
    importar.addEventListener("click", () => arquivo.click());
    arquivo.addEventListener("change", async () => {
        const selecionado = arquivo.files?.[0];
        if (!selecionado) return;
        try {
            if (selecionado.size > 128 * 1024) {
                throw new Error("Arquivo muito grande para um backup de capturas.");
            }
            const dados = JSON.parse(await selecionado.text());
            if (!dados || ![1, 2].includes(dados.versao) || !Array.isArray(dados.capturados) ||
                dados.capturados.length > 2000 ||
                !dados.capturados.every(numero => typeof numero === "string" && numero.length <= 12) ||
                (dados.versao === 2 && (!Array.isArray(dados.favoritos) ||
                    dados.favoritos.length > 2000 ||
                    !dados.favoritos.every(numero => typeof numero === "string" && numero.length <= 12)))) {
                throw new Error("O arquivo não é um backup de capturas válido.");
            }
            const anteriorBackup = {capturas: new Set(capturados), favoritos: new Set(favoritos)};
            let novas = 0;
            for (const numero of dados.capturados) {
                if (!numerosDisponiveis.has(numero) || capturados.has(numero)) continue;
                capturados.add(numero);
                novas++;
            }
            if (novas) salvarCapturas();
            let novosFavoritos = 0;
            for (const numero of dados.versao === 2 ? dados.favoritos : []) {
                if (!numerosDisponiveis.has(numero) || favoritos.has(numero)) continue;
                favoritos.add(numero);
                novosFavoritos++;
            }
            if (novosFavoritos) salvarFavoritos();
            if (novas || novosFavoritos) {
                ultimaAlteracao = anteriorBackup;
                if (botaoDesfazer) botaoDesfazer.disabled = false;
            }
            renderizarCapturas.forEach(render => render());
            renderizarFavoritos.forEach(render => render());
            atualizarFiltros();
            status.textContent = novas + " novas capturas e " + novosFavoritos +
                " favoritos mesclados. Os dados anteriores foram preservados.";
        } catch (erro) {
            status.textContent = erro instanceof Error ? erro.message : "Não foi possível ler o backup.";
        } finally {
            arquivo.value = "";
        }
    });
    transferir.append(exportar, importar, arquivo, status);
    filtros.insertBefore(transferir, resultadoBusca);
}

function normalizarBusca(texto) {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

// Species with two types contribute to both categories; no save data changes.
function capturasPorTipo() {
    const tipos = new Map();
    for (const cartao of cartoesPokemon) {
        const capturado = capturados.has(numeroDoCartao(cartao));
        for (const elemento of cartao.querySelectorAll(".tipos .tipo")) {
            const nome = elemento.textContent.trim();
            if (!nome) continue;
            const linha = tipos.get(nome) || {total: 0, capturados: 0};
            linha.total += 1;
            if (capturado) linha.capturados += 1;
            tipos.set(nome, linha);
        }
    }
    return tipos;
}

function atualizarResumoTipos() {
    if (!filtros) return;
    const tipos = capturasPorTipo();
    const titulo = document.createElement("summary");
    titulo.textContent = "Progresso de captura por tipo (" + tipos.size + ")";
    const lista = document.createElement("ul");
    for (const [nome, dados] of [...tipos].sort((a, b) => a[0].localeCompare(b[0], "pt-BR"))) {
        const item = document.createElement("li");
        const rotulo = document.createElement("span");
        rotulo.textContent = nome + ": " + dados.capturados + "/" + dados.total;
        const barra = document.createElement("progress");
        barra.max = dados.total;
        barra.value = dados.capturados;
        barra.setAttribute("aria-label", "Capturas do tipo " + nome);
        item.append(rotulo, barra);
        lista.append(item);
    }
    resumoTipos.replaceChildren(titulo, lista);
}

// Local collection achievements derive from saved captures and favorites.
// No paid currency, external service or separate mutable badge state exists.
function atualizarMedalhasPokedex() {
    if (!filtros || !cartoesPokemon.length) return;
    const tipos = capturasPorTipo();
    const tiposCompletos = [...tipos.values()].filter(tipo =>
        tipo.total > 0 && tipo.capturados === tipo.total).length;
    const total = cartoesPokemon.length;
    const metas = [
        {nome: "Primeira captura", atual: capturados.size, alvo: 1},
        {nome: "Equipe de seis", atual: capturados.size, alvo: Math.min(6, total)},
        {nome: "Explorador da região", atual: capturados.size, alvo: Math.min(12, total)},
        {nome: "Colecionador dedicado", atual: capturados.size, alvo: Math.min(24, total)},
        {nome: "Pokédex completa", atual: capturados.size, alvo: total},
        {nome: "Trio de favoritos", atual: favoritos.size, alvo: Math.min(3, total)},
        {nome: "Mestre dos tipos", atual: tiposCompletos, alvo: tipos.size}
    ].filter(meta => meta.alvo > 0);
    const conquistadas = metas.filter(meta => meta.atual >= meta.alvo).length;
    const titulo = document.createElement("summary");
    titulo.textContent = "Medalhas da Pokédex (" + conquistadas + "/" + metas.length + ")";
    const lista = document.createElement("ul");
    for (const meta of metas) {
        const item = document.createElement("li");
        const concluida = meta.atual >= meta.alvo;
        const rotulo = document.createElement("span");
        rotulo.textContent = (concluida ? "Conquistada: " : "Em andamento: ") +
            meta.nome + " · " + Math.min(meta.atual, meta.alvo) + "/" + meta.alvo;
        const barra = document.createElement("progress");
        barra.max = meta.alvo;
        barra.value = Math.min(meta.atual, meta.alvo);
        barra.setAttribute("aria-label", "Progresso da medalha " + meta.nome);
        item.append(rotulo, barra);
        lista.append(item);
    }
    medalhasPokedex.replaceChildren(titulo, lista);
}

function atualizarFiltros() {
    ordenarCartoes();
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
        const capturado = capturados.has(numeroDoCartao(cartao));
        const combinaCaptura = (!filtroCapturados.checked || capturado) &&
            (!filtroPendentes.checked || !capturado);
        const combinaFavorito = !filtroFavoritos.checked || favoritos.has(numeroDoCartao(cartao));
        cartao.hidden = !(combinaBusca && combinaTipo && combinaCaptura && combinaFavorito);
        if (!cartao.hidden) visiveis += 1;
    }

    const percentual = cartoesPokemon.length ? Math.round(capturados.size / cartoesPokemon.length * 100) : 0;
    atualizarResumoTipos();
    atualizarMedalhasPokedex();
    progressoCaptura.textContent = `${capturados.size} capturados · ${cartoesPokemon.length - capturados.size} pendentes · ${percentual}% da coleção · ${favoritos.size} favoritos.`;
    resultadoBusca.textContent = visiveis === 0
        ? "Nenhum Pokémon encontrado. Ajuste a busca ou o tipo."
        : `${visiveis} de ${cartoesPokemon.length} Pokémon exibidos.`;
}

campoBusca.addEventListener("input", atualizarFiltros);
seletorTipo.addEventListener("change", atualizarFiltros);
filtroCapturados.addEventListener("change", () => {
    if (filtroCapturados.checked) filtroPendentes.checked = false;
    atualizarFiltros();
});
filtroPendentes.addEventListener("change", () => {
    if (filtroPendentes.checked) filtroCapturados.checked = false;
    atualizarFiltros();
});
filtroFavoritos.addEventListener("change", atualizarFiltros);
// Reset view filters without touching captures, favorites or saved ordering.
if (filtros) {
    const limparFiltros = document.createElement("button");
    limparFiltros.type = "button";
    limparFiltros.className = "limpar-filtros";
    limparFiltros.textContent = "Limpar filtros";
    limparFiltros.setAttribute("aria-label", "Limpar busca e filtros sem apagar capturas");
    limparFiltros.addEventListener("click", () => {
        campoBusca.value = "";
        seletorTipo.value = "";
        filtroCapturados.checked = false;
        filtroPendentes.checked = false;
        filtroFavoritos.checked = false;
        atualizarFiltros();
        campoBusca.focus();
    });
    filtros.insertBefore(limparFiltros, resultadoBusca);
}
// Slash focuses search; Escape clears the active search.
document.addEventListener("keydown", event => {
    const target = event.target;
    const typing = target instanceof HTMLElement &&
        (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable);
    if (event.key === "/" && !typing && !event.altKey && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        campoBusca.focus();
    } else if (event.key === "Escape" && document.activeElement === campoBusca && campoBusca.value) {
        event.preventDefault();
        campoBusca.value = "";
        atualizarFiltros();
    }
});
atualizarFiltros();
