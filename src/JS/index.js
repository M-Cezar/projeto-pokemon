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
        cartao.hidden = !(combinaBusca && combinaTipo);
        if (!cartao.hidden) visiveis += 1;
    }

    resultadoBusca.textContent = visiveis === 0
        ? "Nenhum Pokémon encontrado. Ajuste a busca ou o tipo."
        : `${visiveis} de ${cartoesPokemon.length} Pokémon exibidos.`;
}

campoBusca.addEventListener("input", atualizarFiltros);
seletorTipo.addEventListener("change", atualizarFiltros);
atualizarFiltros();
