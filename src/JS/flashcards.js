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
    const masteredButton = makeButton('Já memorizei');
    const again = makeButton('Revisar este cartão depois');
    const retryMissed = makeButton('Revisar não memorizados');
    const stop = makeButton('Encerrar');
    const shuffleLabel = document.createElement('label');
    const shuffleInput = document.createElement('input');
    shuffleInput.type = 'checkbox';
    shuffleInput.checked = false;
    shuffleLabel.append(shuffleInput, document.createTextNode(' Embaralhar cartões da revisão'));
    const modeLabel = document.createElement('label');
    modeLabel.textContent = ' Modalidade do treino: ';
    const modeSelect = document.createElement('select');
    modeSelect.setAttribute('aria-label', 'Modalidade do treino');
    for (const [value, label] of [
        ['traits', 'Lembrar tipos e características'],
        ['identity', 'Identificar o Pokémon pela descrição']
    ]) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        modeSelect.append(option);
    }
    modeLabel.append(modeSelect);
    panel.append(heading, intro, shuffleLabel, modeLabel, progress, question, answer, controls);
    filters.insertAdjacentElement('afterend', panel);

    let deck = [];
    let position = -1;
    let revealed = false;
    let identifyMode = false;
    let retryTotal = 0;
    const retryCounts = new Map();
    const masteredCards = new Set();
    function reset(message) {
        deck = [];
        position = -1;
        revealed = false;
        retryTotal = 0;
        retryCounts.clear();
        masteredCards.clear();
        progress.textContent = message;
        question.textContent = '';
        answer.textContent = '';
        answer.hidden = true;
        start.hidden = false;
        modeSelect.disabled = false;
        reveal.hidden = true;
        next.hidden = true;
        again.hidden = true;
        masteredButton.hidden = true;
        retryMissed.hidden = true;
        stop.hidden = true;
    }
    function show() {
        const card = deck[position];
        if (!card) {
            const pending = [...new Set(deck)].filter(item => !masteredCards.has(item));
            position = -1;
            progress.textContent = 'Revisão concluída: ' + masteredCards.size +
                ' Pokémon memorizados, ' + pending.length + ' pendentes e ' +
                retryTotal + ' revisões extras realizadas.';
            question.textContent = pending.length
                ? 'Você pode revisar apenas os cartões ainda não memorizados.'
                : 'Todos os cartões desta sessão foram memorizados.';
            answer.textContent = '';
            answer.hidden = true;
            start.hidden = false;
            modeSelect.disabled = false;
            reveal.hidden = true;
            next.hidden = true;
            again.hidden = true;
            masteredButton.hidden = true;
            retryMissed.hidden = pending.length === 0;
            stop.hidden = true;
            return;
        }
        const name = card.querySelector('.informacoes span')?.textContent?.trim() || 'Pokémon';
        const number = card.querySelector('.informacoes span:nth-child(2)')?.textContent?.trim() || '';
        const types = [...card.querySelectorAll('.tipos .tipo')]
            .map(type => type.textContent.trim()).filter(Boolean);
        const description = card.querySelector('.descricao')?.textContent?.trim() || '';
        progress.textContent = 'Cartão ' + (position + 1) + ' de ' + deck.length +
            ' | Memorizados: ' + masteredCards.size + ' | Revisões extras: ' + retryTotal;
        if (identifyMode) {
            question.textContent = 'Qual Pokémon corresponde a estes dados? Tipos: ' +
                (types.join(', ') || 'não informados') + '. ' + description;
            answer.textContent = 'Resposta: ' + name + ' ' + number;
        } else {
            question.textContent = name + ' ' + number + ': quais são seus tipos e características?';
            answer.textContent = 'Tipos: ' + (types.join(', ') || 'não informados') +
                '. ' + description;
        }
        revealed = false;
        answer.hidden = true;
        reveal.hidden = false;
        next.hidden = true;
        again.hidden = true;
        masteredButton.hidden = true;
    }
    start.addEventListener('click', () => {
        retryCounts.clear();
        masteredCards.clear();
        retryTotal = 0;
        identifyMode = modeSelect.value === 'identity';
        modeSelect.disabled = true;
        deck = cards.filter(card => !card.hidden);
        if (shuffleInput.checked) {
            // Fisher-Yates shuffles only the in-memory study order.
            for (let index = deck.length - 1; index > 0; index--) {
                const other = Math.floor(Math.random() * (index + 1));
                [deck[index], deck[other]] = [deck[other], deck[index]];
            }
        }
        if (!deck.length) return reset('Nenhum Pokémon visível. Ajuste os filtros.');
        position = 0;
        start.hidden = true;
        retryMissed.hidden = true;
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
        masteredButton.hidden = masteredCards.has(deck[position]);
        again.hidden = (retryCounts.get(deck[position]) || 0) >= 2;
    });
    masteredButton.addEventListener('click', () => {
        if (!revealed || position < 0) return;
        masteredCards.add(deck[position]);
        position += 1;
        show();
    });
    again.addEventListener('click', () => {
        if (!revealed || position < 0) return;
        const card = deck[position];
        const attempts = retryCounts.get(card) || 0;
        if (attempts >= 2) return;
        retryCounts.set(card, attempts + 1);
        deck.push(card);
        retryTotal += 1;
        position += 1;
        show();
    });
    next.addEventListener('click', () => {
        if (!revealed || position < 0) return;
        position += 1;
        show();
    });
    retryMissed.addEventListener('click', () => {
        if (position >= 0) return;
        const pending = [...new Set(deck)].filter(card => !masteredCards.has(card));
        if (!pending.length) return;
        deck = pending;
        position = 0;
        retryTotal = 0;
        retryCounts.clear();
        masteredCards.clear();
        identifyMode = modeSelect.value === 'identity';
        modeSelect.disabled = true;
        start.hidden = true;
        retryMissed.hidden = true;
        stop.hidden = false;
        show();
        panel.focus();
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
        } else if (event.key === 'ArrowLeft' && revealed && !again.hidden) {
            event.preventDefault();
            again.click();
        } else if (event.key.toLowerCase() === 'm' && revealed &&
                   !masteredButton.hidden) {
            event.preventDefault();
            masteredButton.click();
        } else if (event.key.toLowerCase() === 'r' && revealed &&
                   !again.hidden) {
            event.preventDefault();
            again.click();
        }
    });
    reset('Selecione os filtros e inicie uma revisão dos cartões visíveis.');
})();
