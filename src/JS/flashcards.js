(() => {
    'use strict';
    const filters = document.querySelector('.filtros-pokemon');
    const cards = [...document.querySelectorAll('.listagem-pokemon > .cartao-pokemon')];
    if (!filters || !cards.length) return;

    const panel = document.createElement('section');
    panel.className = 'flashcards';
    panel.setAttribute('aria-label', 'Treino de memória da Pokédex');
    panel.tabIndex = -1;
    const heading = document.createElement('h2');
    heading.textContent = 'Treino de memória';
    const intro = document.createElement('p');
    intro.textContent = 'Revise tipos e características dos Pokémon visíveis nos filtros, sem alterar capturas ou recordes.';
    const progress = document.createElement('p');
    progress.setAttribute('role', 'status');
    progress.setAttribute('aria-live', 'polite');
    const question = document.createElement('p');
    question.className = 'flashcards-question';
    const answer = document.createElement('p');
    answer.className = 'flashcards-answer';
    answer.hidden = true;
    const controls = document.createElement('div');
    controls.className = 'flashcards-controls';
    const makeButton = label => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = label;
        controls.append(button);
        return button;
    };
    const start = makeButton('Iniciar revisão');
    const reveal = makeButton('Revelar resposta');
    const next = makeButton('Próximo cartão');
    const stop = makeButton('Encerrar');
    panel.append(heading, intro, progress, question, answer, controls);
    filters.insertAdjacentElement('afterend', panel);

    let deck = [];
    let position = -1;
    let revealed = false;
    function reset(message) {
        deck = [];
        position = -1;
        revealed = false;
        progress.textContent = message;
        question.textContent = '';
        answer.textContent = '';
        answer.hidden = true;
        start.hidden = false;
        reveal.hidden = true;
        next.hidden = true;
        stop.hidden = true;
    }
    function show() {
        const card = deck[position];
        if (!card) return reset('Revisão concluída. Você pode iniciar outra rodada.');
        const name = card.querySelector('.informacoes span')?.textContent?.trim() || 'Pokémon';
        const number = card.querySelector('.informacoes span:nth-child(2)')?.textContent?.trim() || '';
        const types = [...card.querySelectorAll('.tipos .tipo')]
            .map(type => type.textContent.trim()).filter(Boolean);
        const description = card.querySelector('.descricao')?.textContent?.trim() || '';
        progress.textContent = 'Cartão ' + (position + 1) + ' de ' + deck.length;
        question.textContent = name + ' ' + number + ': quais são seus tipos e características?';
        answer.textContent = 'Tipos: ' + (types.join(', ') || 'não informados') +
            '. ' + description;
        revealed = false;
        answer.hidden = true;
        reveal.hidden = false;
        next.hidden = true;
    }
    start.addEventListener('click', () => {
        deck = cards.filter(card => !card.hidden);
        if (!deck.length) return reset('Nenhum Pokémon visível. Ajuste os filtros.');
        position = 0;
        start.hidden = true;
        stop.hidden = false;
        show();
        panel.focus();
    });
    reveal.addEventListener('click', () => {
        if (position < 0) return;
        revealed = true;
        answer.hidden = false;
        reveal.hidden = true;
        next.hidden = false;
    });
    next.addEventListener('click', () => {
        if (!revealed || position < 0) return;
        position += 1;
        show();
    });
    stop.addEventListener('click', () => reset('Revisão encerrada sem alterar seu progresso.'));
    for (const id of ['buscar-pokemon', 'filtrar-tipo']) {
        document.getElementById(id)?.addEventListener('input', () => {
            if (position >= 0) reset('Filtros alterados. Inicie uma nova revisão para usar a lista atual.');
        });
    }
    panel.addEventListener('keydown', event => {
        if (position < 0 || event.target instanceof HTMLInputElement) return;
        if (event.key === ' ' && !revealed && event.target === panel) {
            event.preventDefault();
            reveal.click();
        } else if (event.key === 'ArrowRight' && revealed) {
            event.preventDefault();
            next.click();
        }
    });
    reset('Selecione os filtros e inicie uma revisão dos cartões visíveis.');
})();
