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
const CHAVE_ORDEM = "pokedex:ordenacao:v1";
const modosOrdenacao = new Set(["numero", "nome", "pendentes", "favoritos"]);
const seletorOrdem = document.createElement("select");
seletorOrdem.id = "ordenar-pokemon";
seletorOrdem.setAttribute("aria-label", "Ordenar a coleção de Pokémon");
for (const [valor, texto] of [
    ["numero", "Número da Pokédex"],
    ["nome", "Nome A–Z"],
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
// Keep separate browser tabs in sync without replacing the current page.
window.addEventListener("storage", event => {
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
    acoes.append(capturarVisiveis, limparVisiveis);
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
atualizarFiltros();
