/* Minijogo offline da Pokédex: adivinhe o Pokémon pela silhueta. */
(function (root, factory) {
    const quiz = factory();
    if (typeof module !== "undefined" && module.exports) module.exports = quiz;
    if (root && root.document) quiz.mount(root.document);
})(typeof window !== "undefined" ? window : globalThis, function () {
    "use strict";

    function embaralhar(items, random) {
        const result = items.slice();
        for (let i = result.length - 1; i > 0; i -= 1) {
            const value = Number(random());
            const safe = Number.isFinite(value) ? Math.min(0.999999999, Math.max(0, value)) : 0;
            const j = Math.floor(safe * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }

    function criarJogo(catalogo, random = Math.random) {
        if (!Array.isArray(catalogo) || catalogo.length < 4) {
            throw new Error("O quiz precisa de pelo menos quatro Pokémon.");
        }
        const nomes = catalogo.map(item => item.nome);
        if (new Set(nomes).size !== nomes.length || catalogo.some(item => !item.nome || !item.imagem)) {
            throw new Error("O catálogo precisa de nomes únicos e imagens válidas.");
        }
        const total = Math.min(10, catalogo.length);
        let ordem, rodada, pontos, sequencia, melhorSequencia, atual, escolhida;
        let dicasRestantes, dicaUsadaNaRodada, ocultadas;

        function criarRodada() {
            const correto = ordem[rodada];
            const incorretos = embaralhar(catalogo.filter(item => item.nome !== correto.nome), random).slice(0, 3);
            atual = { correto, opcoes: embaralhar([correto, ...incorretos], random).map(item => item.nome) };
            escolhida = null;
            dicaUsadaNaRodada = false;
            ocultadas = [];
        }
        function reiniciar() {
            ordem = embaralhar(catalogo, random).slice(0, total);
            rodada = 0;
            pontos = 0;
            sequencia = 0;
            melhorSequencia = 0;
            dicasRestantes = 3;
            criarRodada();
            return estado();
        }
        function estado() {
            const respondida = escolhida !== null;
            return {
                rodada: rodada + 1, total, pontos, sequencia, melhorSequencia,
                imagem: atual.correto.imagem, opcoes: atual.opcoes.slice(),
                ocultadas: ocultadas.slice(), dicasRestantes, dicaUsadaNaRodada,
                respondida, escolha: escolhida,
                acerto: respondida && escolhida === atual.correto.nome,
                resposta: respondida ? atual.correto.nome : null,
                terminou: respondida && rodada === total - 1
            };
        }
        function responder(nome) {
            if (escolhida !== null || !atual.opcoes.includes(nome) || ocultadas.includes(nome)) return false;
            escolhida = nome;
            if (nome === atual.correto.nome) {
                pontos += 1;
                sequencia += 1;
                melhorSequencia = Math.max(melhorSequencia, sequencia);
            } else {
                sequencia = 0;
            }
            return estado();
        }
        function usarDica() {
            if (escolhida !== null || dicaUsadaNaRodada || dicasRestantes === 0) return false;
            ocultadas = embaralhar(atual.opcoes.filter(nome => nome !== atual.correto.nome), random).slice(0, 2);
            dicasRestantes -= 1;
            dicaUsadaNaRodada = true;
            return estado();
        }
        function proxima() {
            if (escolhida === null || rodada >= total - 1) return false;
            rodada += 1;
            criarRodada();
            return estado();
        }
        reiniciar();
        return { estado, responder, usarDica, proxima, reiniciar };
    }

    const CHAVE_RECORDE = "pokedex:quiz-recorde:v1";

    function carregarRecorde(armazenamento, total) {
        try {
            const valor = armazenamento?.getItem(CHAVE_RECORDE);
            if (!/^(0|[1-9]\d*)$/.test(valor || "")) return 0;
            const numero = Number(valor);
            return Number.isSafeInteger(numero) && numero <= total ? numero : 0;
        } catch {
            return 0;
        }
    }
    function salvarRecorde(armazenamento, pontos) {
        try {
            armazenamento?.setItem(CHAVE_RECORDE, String(pontos));
            return Boolean(armazenamento);
        } catch {
            return false;
        }
    }
    function classificacao(pontos, total) {
        if (pontos === total) return "Mestre Pokémon";
        if (pontos / total >= 0.7) return "Explorador Pokémon";
        return "Treinador Pokémon";
    }

    function mount(documento) {
        const cartoes = [...documento.querySelectorAll(".listagem-pokemon > .cartao-pokemon")];
        const catalogo = cartoes.map(cartao => ({
            nome: cartao.querySelector(".informacoes span")?.textContent.trim(),
            imagem: cartao.querySelector("img.gif")?.getAttribute("src")
        })).filter(item => item.nome && item.imagem);
        if (catalogo.length < 4 || !documento.querySelector("header")) return;

        const jogo = criarJogo(catalogo);
        let armazenamento;
        try { armazenamento = documento.defaultView?.localStorage; } catch { armazenamento = null; }
        let recorde = carregarRecorde(armazenamento, jogo.estado().total);
        const elemento = (tag, classe, texto) => {
            const node = documento.createElement(tag);
            if (classe) node.className = classe;
            if (texto) node.textContent = texto;
            return node;
        };
        const abrir = elemento("button", "abrir-quiz", "Jogar: quem é esse Pokémon?");
        abrir.type = "button";
        documento.querySelector("header").append(abrir);
        const dialogo = elemento("dialog", "pokemon-quiz");
        dialogo.setAttribute("aria-label", "Quiz de Pokémon");
        const titulo = elemento("h2", "", "Quem é esse Pokémon?");
        const placar = elemento("p", "quiz-placar");
        const imagem = elemento("img", "quiz-silhueta");
        imagem.alt = "Silhueta do Pokémon a identificar";
        const opcoes = elemento("div", "quiz-opcoes");
        const retorno = elemento("p", "quiz-retorno");
        retorno.setAttribute("role", "status");
        retorno.setAttribute("aria-live", "polite");
        const dica = elemento("button", "quiz-dica", "Dica 50/50");
        dica.type = "button";
        const proximo = elemento("button", "quiz-proximo", "Próxima rodada");
        proximo.type = "button";
        const fechar = elemento("button", "quiz-fechar", "Fechar jogo");
        fechar.type = "button";
        dialogo.append(titulo, placar, imagem, opcoes, retorno, dica, proximo, fechar);
        documento.body.append(dialogo);

        function renderizar() {
            const estado = jogo.estado();
            if (estado.terminou && estado.pontos > recorde) {
                recorde = estado.pontos;
                salvarRecorde(armazenamento, recorde);
            }
            placar.textContent = `Rodada ${estado.rodada}/${estado.total} · Acertos: ${estado.pontos} · Sequência: ${estado.sequencia} · Dicas: ${estado.dicasRestantes} · Recorde: ${recorde}`;
            imagem.src = estado.imagem;
            imagem.classList.toggle("revelada", estado.respondida);
            imagem.alt = estado.respondida ? `Pokémon revelado: ${estado.resposta}` : "Silhueta do Pokémon a identificar";
            opcoes.replaceChildren();
            for (const nome of estado.opcoes) {
                const botao = elemento("button", "quiz-opcao", nome);
                botao.type = "button";
                botao.disabled = estado.respondida;
                botao.hidden = estado.ocultadas.includes(nome);
                if (estado.respondida && nome === estado.resposta) botao.classList.add("correta");
                if (estado.respondida && nome === estado.escolha && !estado.acerto) botao.classList.add("incorreta");
                botao.addEventListener("click", () => {
                    jogo.responder(nome);
                    renderizar();
                    proximo.focus();
                });
                opcoes.append(botao);
            }
            retorno.textContent = !estado.respondida ? (estado.dicaUsadaNaRodada ? "Dica utilizada: duas alternativas eliminadas." : "Escolha uma das quatro opções.") :
                estado.terminou ? `Fim! ${estado.pontos}/${estado.total} acertos. Título: ${classificacao(estado.pontos, estado.total)}. Maior sequência: ${estado.melhorSequencia}.` :
                estado.acerto ? `Correto! Era ${estado.resposta}.` : `Era ${estado.resposta}. Tente a próxima!`;
            dica.disabled = estado.respondida || estado.dicaUsadaNaRodada || estado.dicasRestantes === 0;
            dica.textContent = `Dica 50/50 (${estado.dicasRestantes})`;
            proximo.disabled = !estado.respondida;
            proximo.textContent = estado.terminou ? "Jogar novamente" : "Próxima rodada";
        }
        abrir.addEventListener("click", () => {
            jogo.reiniciar();
            renderizar();
            dialogo.showModal();
            opcoes.querySelector("button")?.focus();
        });
        dica.addEventListener("click", () => {
            if (jogo.usarDica()) renderizar();
        });
        proximo.addEventListener("click", () => {
            if (jogo.estado().terminou) jogo.reiniciar();
            else jogo.proxima();
            renderizar();
            opcoes.querySelector("button")?.focus();
        });
        fechar.addEventListener("click", () => dialogo.close());
        dialogo.addEventListener("close", () => abrir.focus());
    }
    return { criarJogo, mount, carregarRecorde, salvarRecorde, classificacao };
});
