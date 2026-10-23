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
const renderizarCapturas = [];
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
    renderizarCapturas.push(atualizarBotao);
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
        const capturado = capturados.has(numeroDoCartao(cartao));
        const combinaCaptura = (!filtroCapturados.checked || capturado) &&
            (!filtroPendentes.checked || !capturado);
        cartao.hidden = !(combinaBusca && combinaTipo && combinaCaptura);
        if (!cartao.hidden) visiveis += 1;
    }

    const percentual = cartoesPokemon.length ? Math.round(capturados.size / cartoesPokemon.length * 100) : 0;
    progressoCaptura.textContent = `${capturados.size} capturados · ${cartoesPokemon.length - capturados.size} pendentes · ${percentual}% da coleção.`;
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
atualizarFiltros();
