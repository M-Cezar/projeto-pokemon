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
    const hintButton = makeButton('Mostrar dica');
    const next = makeButton('Próximo cartão');
    const masteredButton = makeButton('Já memorizei');
    const again = makeButton('Revisar este cartão depois');
    const spacedRetry = makeButton('Rever em alguns cartões');
    const skip = makeButton('Pular e revisar no fim');
    const retryMissed = makeButton('Revisar não memorizados');
    const retryDifficult = makeButton('Revisar cartões difíceis');
    const retrySkipped = makeButton('Revisar apenas os pulados');
    const focusWeakest = makeButton('Preparar treino do tipo mais difícil');
    focusWeakest.hidden = true;
    const pause = makeButton('Pausar revisão');
    const stop = makeButton('Encerrar');
    const copyStudyReport = makeButton('Copiar relatório da revisão');
    copyStudyReport.hidden = true;
    const copyStudyFeedback = document.createElement('p');
    copyStudyFeedback.setAttribute('role', 'status');
    copyStudyFeedback.setAttribute('aria-live', 'polite');
    const shuffleLabel = document.createElement('label');
    const hintText = document.createElement('p');
    hintText.className = 'flashcards-hint';
    hintText.setAttribute('aria-live', 'polite');
    hintText.hidden = true;
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
        ['identity', 'Identificar o Pokémon pela descrição'],
        ['mixed', 'Treino misto: alternar perguntas']
    ]) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        modeSelect.append(option);
    }
    modeLabel.append(modeSelect);
    const sizeLabel = document.createElement('label');
    sizeLabel.textContent = ' Cartões por rodada: ';
    const sizeSelect = document.createElement('select');
    sizeSelect.setAttribute('aria-label', 'Quantidade de cartões por rodada');
    for (const [value, label] of [
        ['all', 'Todos os visíveis'], ['5', '5 cartões'],
        ['10', '10 cartões'], ['20', '20 cartões'],
        ['daily5', 'Desafio diário: 5 Pokémon']
    ]) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        sizeSelect.append(option);
    }
    sizeLabel.append(sizeSelect);
    // Challenge mode disables clues for the whole active round.
    // It changes neither captures nor stored records.
    const noHintsLabel = document.createElement('label');
    const noHintsInput = document.createElement('input');
    noHintsInput.type = 'checkbox';
    noHintsLabel.append(noHintsInput,
        document.createTextNode(' Desafio sem dicas nesta rodada'));
    // Optional type-focused study is derived from the existing Pokédex cards.
    // It never changes the site filters, captures or stored quiz records.
    const typeFocusLabel = document.createElement('label');
    typeFocusLabel.textContent = ' Foco por tipo: ';
    const typeFocusSelect = document.createElement('select');
    typeFocusSelect.setAttribute('aria-label', 'Tipo para revisar');
    const typeNames = new Set();
    for (const card of cards) {
        for (const type of card.querySelectorAll('.tipos .tipo')) {
            const name = type.textContent.trim();
            if (name && name.length <= 40) typeNames.add(name);
        }
    }
    for (const name of ['Todos os tipos', ...[...typeNames].sort((a,b) =>
        a.localeCompare(b, 'pt-BR'))]) {
        const option = document.createElement('option');
        option.value = name === 'Todos os tipos' ? '' : name;
        option.textContent = name;
        typeFocusSelect.append(option);
    }
    typeFocusLabel.append(typeFocusSelect);
    const weaknessSummary = document.createElement('p');
    weaknessSummary.className = 'flashcards-weakness-summary';
    weaknessSummary.setAttribute('aria-live', 'polite');
    const typeCoverage = document.createElement('p');
    typeCoverage.className = 'flashcards-type-coverage';
    typeCoverage.setAttribute('aria-live', 'polite');
    const progressBar = document.createElement('progress');
    progressBar.setAttribute('aria-label', 'Avanço da rodada de flashcards');
    progressBar.max = 1;
    progressBar.value = 0;
    panel.append(heading, intro, shuffleLabel, modeLabel, sizeLabel, noHintsLabel, typeFocusLabel,
        progress, progressBar, typeCoverage, weaknessSummary, question, hintText, answer, controls, copyStudyFeedback);
    filters.insertAdjacentElement('afterend', panel);

    let deck = [];
    let position = -1;
    let revealed = false;
    let identifyMode = false;
    let retryTotal = 0;
    let hintsUsed = 0;
    let currentRecallStreak = 0;
    let bestRecallStreak = 0;
    let pauseSnapshot = null;
    let studyReport = '';
    const retryCounts = new Map();
    const skippedCards = new Set();
    const difficultCards = new Set();
    const masteredCards = new Set();
    // In-session mastery by type is derived from the current deck only.
    // No captures, quiz scores or personal information are persisted.
    function refreshTypeCoverage() {
        const totals = new Map();
        // Requeued cards must not inflate the number of distinct Pokémon.
        for (const card of new Set(deck)) {
            const names = new Set([...card.querySelectorAll('.tipos .tipo')]
                .map(type => type.textContent.trim()).filter(Boolean));
            for (const name of names) {
                const current = totals.get(name) || { total: 0, mastered: 0 };
                current.total += 1;
                if (masteredCards.has(card)) current.mastered += 1;
                totals.set(name, current);
            }
        }
        const ordered = [...totals].sort((a, b) =>
            (b[1].total - b[1].mastered) - (a[1].total - a[1].mastered) ||
            a[0].localeCompare(b[0], 'pt-BR')).slice(0, 4);
        typeCoverage.textContent = ordered.length
            ? 'Domínio por tipo: ' + ordered.map(([name, count]) =>
                name + ' ' + count.mastered + '/' + count.total).join(' | ')
            : '';
    }
    function reset(message) {
        studyReport = '';
        copyStudyReport.hidden = true;
        copyStudyFeedback.textContent = '';
        pauseSnapshot = null;
        pause.hidden = true;
        pause.textContent = 'Pausar revisão';
        deck = [];
        position = -1;
        revealed = false;
        retryTotal = 0;
        hintsUsed = 0;
        currentRecallStreak = 0;
        bestRecallStreak = 0;
        retryCounts.clear();
        skippedCards.clear();
        difficultCards.clear();
        masteredCards.clear();
        progress.textContent = message;
        weaknessSummary.textContent = '';
        typeCoverage.textContent = '';
        question.textContent = '';
        answer.textContent = '';
        answer.hidden = true;
        hintText.hidden = true;
        hintText.textContent = '';
        hintButton.hidden = true;
        skip.hidden = true;
        start.hidden = false;
        modeSelect.disabled = false;
        sizeSelect.disabled = false;
        typeFocusSelect.disabled = false;
        noHintsInput.disabled = false;
        progressBar.max = 1;
        progressBar.value = 0;
        reveal.hidden = true;
        next.hidden = true;
        again.hidden = true;
        spacedRetry.hidden = true;
        masteredButton.hidden = true;
        retryMissed.hidden = true;
        retryDifficult.hidden = true;
        retrySkipped.hidden = true;
        focusWeakest.hidden = true;
        focusWeakest.dataset.type = '';
        stop.hidden = true;
    }
    function show() {
        pauseSnapshot = null;
        pause.textContent = 'Pausar revisão';
        // A mastered card may still have an older spaced retry in the deck.
        // Do not ask the same question again after mastery was confirmed.
        while (position >= 0 && position < deck.length &&
               masteredCards.has(deck[position])) position += 1;
        const card = deck[position];
        pause.hidden = !card;
        progressBar.max = Math.max(1, deck.length);
        progressBar.value = card ? Math.max(0, position) : deck.length;
        refreshTypeCoverage();
        if (!card) {
            const typeCounts = new Map();
            for (const difficult of difficultCards) {
                const names = new Set([...difficult.querySelectorAll('.tipos .tipo')]
                    .map(type => type.textContent.trim()).filter(Boolean));
                for (const name of names) typeCounts.set(name, (typeCounts.get(name) || 0) + 1);
            }
            const ranked = [...typeCounts].sort((a, b) =>
                b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR')).slice(0, 3);
            weaknessSummary.textContent = ranked.length
                ? 'Tipos para reforçar: ' + ranked.map(([name, count]) =>
                    name + ' (' + count + ')').join(', ') + '.'
                : 'Nenhum tipo marcado como difícil nesta rodada.';
            const pending = [...new Set(deck)].filter(item => !masteredCards.has(item));
            position = -1;
            const distinct = new Set(deck).size;
            const weakTypes = ranked.map(([name, count]) => name + ': ' + count).join(', ');
            studyReport = [
                'Pokédex | Relatório de estudo',
                'Cartões distintos: ' + distinct,
                'Memorizados: ' + masteredCards.size,
                'Pendentes: ' + pending.length,
                'Pulados: ' + skippedCards.size,
                'Difíceis: ' + difficultCards.size,
                'Revisões extras: ' + retryTotal,
                'Dicas utilizadas: ' + hintsUsed,
                'Desafio sem dicas: ' + (noHintsInput.checked ? 'sim' : 'não'),
                'Melhor sequência sem ajuda: ' + bestRecallStreak,
                'Tipos para reforçar: ' + (weakTypes || 'nenhum')
            ].join('\n');
            copyStudyReport.hidden = false;
            progress.textContent = 'Revisão concluída: ' + masteredCards.size +
                ' Pokémon memorizados, ' + pending.length + ' pendentes e ' +
                retryTotal + ' revisões extras realizadas; ' +
                difficultCards.size + ' cartões difíceis identificados; melhor sequência sem ajuda: ' +
                bestRecallStreak + '.';
            question.textContent = pending.length
                ? 'Você pode revisar apenas os cartões ainda não memorizados.'
                : 'Todos os cartões desta sessão foram memorizados.';
            answer.textContent = '';
            answer.hidden = true;
            hintText.hidden = true;
            hintButton.hidden = true;
        skip.hidden = true;
            start.hidden = false;
            modeSelect.disabled = false;
            sizeSelect.disabled = false;
        typeFocusSelect.disabled = false;
        noHintsInput.disabled = false;
            reveal.hidden = true;
            next.hidden = true;
            again.hidden = true;
        spacedRetry.hidden = true;
            masteredButton.hidden = true;
            retryMissed.hidden = pending.length === 0;
            retryDifficult.hidden = difficultCards.size === 0;
            retrySkipped.hidden = skippedCards.size === 0;
            focusWeakest.hidden = ranked.length === 0 ||
                ![...typeFocusSelect.options].some(option => option.value === ranked[0][0]);
            focusWeakest.dataset.type = ranked[0]?.[0] || '';
            stop.hidden = true;
            return;
        }
        weaknessSummary.textContent = '';
        // Mixed sessions alternate prompt styles per turn, including retries.
        // The selection never changes captures, records or saved game data.
        if (modeSelect.value === 'mixed')
            identifyMode = position % 2 === 1;
        const name = card.querySelector('.informacoes span')?.textContent?.trim() || 'Pokémon';
        const number = card.querySelector('.informacoes span:nth-child(2)')?.textContent?.trim() || '';
        const types = [...card.querySelectorAll('.tipos .tipo')]
            .map(type => type.textContent.trim()).filter(Boolean);
        const description = card.querySelector('.descricao')?.textContent?.trim() || '';
        const distinctRemaining = new Set(deck.slice(position)
            .filter(item => !masteredCards.has(item))).size;
        progress.textContent = 'Cartão ' + (position + 1) + ' de ' + deck.length +
            ' | Pokémon ainda em estudo: ' + distinctRemaining +
            (modeSelect.value === 'mixed' ? (identifyMode
                ? ' | Identificação' : ' | Características') : '') +
            ' | Memorizados: ' + masteredCards.size + ' | Revisões extras: ' + retryTotal +
            ' | Dicas: ' + hintsUsed + ' | Sequência sem ajuda: ' + currentRecallStreak;
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
        hintText.textContent = '';
        hintText.hidden = true;
        hintButton.hidden = noHintsInput.checked;
        skip.hidden = skippedCards.has(card);
        reveal.hidden = false;
        next.hidden = true;
        again.hidden = true;
        spacedRetry.hidden = true;
        masteredButton.hidden = true;
    }
    // A rotating daily selection is stable across reloads on the same
    // local calendar day. It uses visible Pokédex cards only, with no storage.
    function dailyStudyDeck(visibleCards) {
        const day = new Date();
        const dateKey = [day.getFullYear(), day.getMonth() + 1,
            day.getDate()].join('-');
        let seed = 2166136261;
        for (const char of dateKey) {
            seed ^= char.charCodeAt(0);
            seed = Math.imul(seed, 16777619) >>> 0;
        }
        const ordered = [...visibleCards].sort((a, b) => {
            const nameA = a.querySelector('.informacoes span')?.textContent?.trim() || '';
            const nameB = b.querySelector('.informacoes span')?.textContent?.trim() || '';
            return nameA.localeCompare(nameB, 'pt-BR');
        });
        // Deterministic shuffle without changing the site's card order.
        for (let index = ordered.length - 1; index > 0; index--) {
            seed ^= seed << 13;
            seed ^= seed >>> 17;
            seed ^= seed << 5;
            const other = (seed >>> 0) % (index + 1);
            [ordered[index], ordered[other]] = [ordered[other], ordered[index]];
        }
        return ordered.slice(0, 5);
    }
    start.addEventListener('click', () => {
        retryCounts.clear();
        skippedCards.clear();
        masteredCards.clear();
        retryTotal = 0;
        hintsUsed = 0;
        currentRecallStreak = 0;
        bestRecallStreak = 0;
        identifyMode = modeSelect.value === 'identity';
        modeSelect.disabled = true;
        sizeSelect.disabled = true;
        typeFocusSelect.disabled = true;
        noHintsInput.disabled = true;
        const selectedType = typeFocusSelect.value;
        deck = cards.filter(card => !card.hidden &&
            (!selectedType || [...card.querySelectorAll('.tipos .tipo')]
                .some(type => type.textContent.trim() === selectedType)));
        const dailyChallenge = sizeSelect.value === 'daily5';
        if (dailyChallenge) deck = dailyStudyDeck(deck);
        if (shuffleInput.checked && !dailyChallenge) {
            // Fisher-Yates shuffles only the in-memory study order.
            for (let index = deck.length - 1; index > 0; index--) {
                const other = Math.floor(Math.random() * (index + 1));
                [deck[index], deck[other]] = [deck[other], deck[index]];
            }
        }
        if (!deck.length) return reset('Nenhum Pokémon disponível para o tipo escolhido. Ajuste o foco ou os filtros.');
        const limit = dailyChallenge || sizeSelect.value === 'all' ? deck.length : Number(sizeSelect.value);
        deck = deck.slice(0, Math.min(deck.length, Number.isSafeInteger(limit) && limit > 0 ? limit : deck.length));
        position = 0;
        start.hidden = true;
        retryMissed.hidden = true;
        retryDifficult.hidden = true;
        retrySkipped.hidden = true;
        stop.hidden = false;
        show();
        panel.focus();
    });
    hintButton.addEventListener('click', () => {
        if (position < 0 || revealed || hintButton.hidden || noHintsInput.checked) return;
        const card = deck[position];
        const name = card.querySelector('.informacoes span')?.textContent?.trim() || 'Pokémon';
        const types = [...card.querySelectorAll('.tipos .tipo')]
            .map(type => type.textContent.trim()).filter(Boolean);
        hintText.textContent = identifyMode
            ? 'Dica: começa com ' + name.charAt(0).toUpperCase() +
              ' e tem ' + [...name].length + ' letras.'
            : 'Dica: um dos tipos é ' + (types[0] || 'não informado') + '.';
        hintText.hidden = false;
        hintButton.hidden = true;
        difficultCards.add(card);
        currentRecallStreak = 0;
        skip.hidden = skippedCards.has(card);
        hintsUsed += 1;
        progress.textContent += ' | Dica utilizada';
    });
    skip.addEventListener('click', () => {
        if (position < 0 || revealed || skippedCards.has(deck[position])) return;
        const card = deck[position];
        skippedCards.add(card);
        difficultCards.add(card);
        currentRecallStreak = 0;
        deck.push(card);
        position += 1;
        show();
    });
    reveal.addEventListener('click', () => {
        if (position < 0) return;
        revealed = true;
        answer.hidden = false;
        reveal.hidden = true;
        hintButton.hidden = true;
        skip.hidden = true;
        next.hidden = false;
        masteredButton.hidden = masteredCards.has(deck[position]);
        again.hidden = (retryCounts.get(deck[position]) || 0) >= 2;
        spacedRetry.hidden = again.hidden;
    });
    masteredButton.addEventListener('click', () => {
        if (!revealed || position < 0) return;
        const recalledWithoutHelp = !difficultCards.has(deck[position]);
        currentRecallStreak = recalledWithoutHelp ? currentRecallStreak + 1 : 0;
        bestRecallStreak = Math.max(bestRecallStreak, currentRecallStreak);
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
        difficultCards.add(card);
        currentRecallStreak = 0;
        deck.push(card);
        retryTotal += 1;
        position += 1;
        show();
    });
    // Short-interval active recall, bounded to two requeues per Pokémon.
    // The next appearance is inserted after two other cards when possible,
    // rather than always at the very end of the current study deck.
    spacedRetry.addEventListener('click', () => {
        if (!revealed || position < 0 || spacedRetry.hidden || pauseSnapshot) return;
        const card = deck[position];
        const attempts = retryCounts.get(card) || 0;
        if (attempts >= 2) return;
        retryCounts.set(card, attempts + 1);
        difficultCards.add(card);
        currentRecallStreak = 0;
        const insertion = Math.min(deck.length, position + 3);
        deck.splice(insertion, 0, card);
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
        skippedCards.clear();
        masteredCards.clear();
        identifyMode = modeSelect.value === 'identity';
        modeSelect.disabled = true;
        sizeSelect.disabled = true;
        typeFocusSelect.disabled = true;
        noHintsInput.disabled = true;
        start.hidden = true;
        retryMissed.hidden = true;
        retryDifficult.hidden = true;
        retrySkipped.hidden = true;
        stop.hidden = false;
        show();
        panel.focus();
    });
    retryDifficult.addEventListener('click', () => {
        if (position >= 0 || !difficultCards.size) return;
        // New focused round; captures and quiz records remain unchanged.
        deck = [...difficultCards];
        position = 0;
        retryTotal = 0;
        hintsUsed = 0;
        retryCounts.clear();
        skippedCards.clear();
        difficultCards.clear();
        masteredCards.clear();
        identifyMode = modeSelect.value === 'identity';
        modeSelect.disabled = true;
        sizeSelect.disabled = true;
        typeFocusSelect.disabled = true;
        noHintsInput.disabled = true;
        start.hidden = true;
        retryMissed.hidden = true;
        retryDifficult.hidden = true;
        retrySkipped.hidden = true;
        stop.hidden = false;
        show();
        panel.focus();
    });
    // A focused replay for skipped cards, independent of cards marked hard.
    // The in-memory set is retained until the user explicitly starts this mode.
    // A new focused session is always started explicitly by the player.
    // No filter, capture or quiz record is changed in the background.
    focusWeakest.addEventListener('click', () => {
        if (position >= 0 || focusWeakest.hidden) return;
        const target = focusWeakest.dataset.type;
        if (![...typeFocusSelect.options].some(option => option.value === target))
            return;
        typeFocusSelect.value = target;
        reset('Foco preparado: ' + target +
            '. Inicie uma nova rodada para estudar esse tipo.');
        panel.focus();
    });
    retrySkipped.addEventListener('click', () => {
        if (position >= 0 || !skippedCards.size) return;
        const skipped = [...skippedCards].filter(card => cards.includes(card));
        if (!skipped.length) return;
        deck = skipped;
        position = 0;
        revealed = false;
        retryTotal = 0;
        hintsUsed = 0;
        currentRecallStreak = 0;
        bestRecallStreak = 0;
        retryCounts.clear();
        skippedCards.clear();
        difficultCards.clear();
        masteredCards.clear();
        identifyMode = modeSelect.value === 'identity';
        modeSelect.disabled = true;
        sizeSelect.disabled = true;
        typeFocusSelect.disabled = true;
        noHintsInput.disabled = true;
        start.hidden = true;
        retryMissed.hidden = true;
        retryDifficult.hidden = true;
        retrySkipped.hidden = true;
        stop.hidden = false;
        show();
        panel.focus();
    });
    // Pause hides the current question and answer without advancing the deck.
    // The exact button visibility and text are restored on resume.
    pause.addEventListener('click', () => {
        if (position < 0) return;
        const actions = [reveal, hintButton, skip, next, masteredButton, again, spacedRetry];
        if (pauseSnapshot) {
            question.textContent = pauseSnapshot.question;
            answer.hidden = pauseSnapshot.answerHidden;
            hintText.hidden = pauseSnapshot.hintHidden;
            actions.forEach((button, index) => {
                button.hidden = pauseSnapshot.hidden[index];
            });
            pauseSnapshot = null;
            pause.textContent = 'Pausar revisão';
            panel.focus();
            return;
        }
        pauseSnapshot = {
            question: question.textContent,
            answerHidden: answer.hidden,
            hintHidden: hintText.hidden,
            hidden: actions.map(button => button.hidden)
        };
        question.textContent = 'Revisão pausada. Retome para continuar.';
        answer.hidden = true;
        hintText.hidden = true;
        actions.forEach(button => { button.hidden = true; });
        pause.textContent = 'Retomar revisão';
        panel.focus();
    });
    copyStudyReport.addEventListener('click', async () => {
        if (!studyReport) return;
        if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
            copyStudyFeedback.textContent = 'Cópia indisponível neste navegador.';
            return;
        }
        try {
            await navigator.clipboard.writeText(studyReport);
            copyStudyFeedback.textContent = 'Relatório de estudo copiado.';
        } catch {
            copyStudyFeedback.textContent = 'O navegador não autorizou a cópia.';
        }
    });
    stop.addEventListener('click', () => reset('Revisão encerrada sem alterar seu progresso.'));
    for (const id of ['buscar-pokemon', 'filtrar-tipo']) {
        document.getElementById(id)?.addEventListener('input', () => {
            if (position >= 0) reset('Filtros alterados. Inicie uma nova revisão para usar a lista atual.');
        });
    }
    panel.addEventListener('keydown', event => {
        if (position < 0 || event.target instanceof HTMLInputElement ||
            event.target instanceof HTMLSelectElement) return;
        if (event.key.toLowerCase() === 'p') {
            event.preventDefault();
            pause.click();
            return;
        }
        if (pauseSnapshot) return;
        if (event.key === ' ' && !revealed && event.target === panel) {
            event.preventDefault();
            reveal.click();
        } else if (event.key.toLowerCase() === 's' && !revealed &&
                   !skip.hidden) {
            event.preventDefault();
            skip.click();
        } else if (event.key.toLowerCase() === 'h' && !revealed &&
                   !hintButton.hidden) {
            event.preventDefault();
            hintButton.click();
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
        } else if (event.key.toLowerCase() === 't' && revealed &&
                   !spacedRetry.hidden) {
            event.preventDefault();
            spacedRetry.click();
        } else if (event.key.toLowerCase() === 'r' && revealed &&
                   !again.hidden) {
            event.preventDefault();
            again.click();
        }
    });
    reset('Selecione os filtros e inicie uma revisão dos cartões visíveis.');
})();
