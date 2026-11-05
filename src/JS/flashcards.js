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
    const masteryMilestone = document.createElement('p');
    masteryMilestone.setAttribute('role', 'status');
    masteryMilestone.setAttribute('aria-live', 'polite');
    masteryMilestone.className = 'flashcards-mastery-milestone';
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
    const previewDeckButton = makeButton('Prévia da próxima rodada');
    const previewDeckSummary = document.createElement('p');
    previewDeckSummary.setAttribute('role', 'status');
    previewDeckSummary.setAttribute('aria-live', 'polite');
    const reveal = makeButton('Revelar resposta');
    const hintButton = makeButton('Mostrar dica');
    const next = makeButton('Próximo cartão');
    const masteredButton = makeButton('Já memorizei');
    const undoMastery = makeButton('Desfazer última memorização');
    undoMastery.hidden = true;
    const again = makeButton('Revisar este cartão depois');
    const spacedRetry = makeButton('Rever em alguns cartões');
    const skip = makeButton('Pular e revisar no fim');
    const flagCurrent = makeButton('Marcar para revisão especial');
    flagCurrent.hidden = true;
    const retryFlagged = makeButton('Revisar cartões marcados');
    retryFlagged.hidden = true;
    const flaggedSummary = document.createElement('p');
    flaggedSummary.setAttribute('aria-live', 'polite');
    const retryMissed = makeButton('Revisar não memorizados');
    const retryDifficult = makeButton('Revisar cartões difíceis');
    const retryTopFive = makeButton('Revisar até 5 cartões mais difíceis');
    const retryRecurring = makeButton('Revisar erros recorrentes (até 8)');
    retryRecurring.hidden = true;
    retryTopFive.hidden = true;
    const retrySkipped = makeButton('Revisar apenas os pulados');
    const focusWeakest = makeButton('Preparar treino do tipo mais difícil');
    focusWeakest.hidden = true;
    const checkTypedAnswer = makeButton('Conferir nome digitado');
    const typedAnswerInput = document.createElement('input');
    typedAnswerInput.type = 'text';
    typedAnswerInput.maxLength = 80;
    typedAnswerInput.autocomplete = 'off';
    typedAnswerInput.setAttribute('aria-label', 'Digite o nome do Pokémon');
    typedAnswerInput.placeholder = 'Nome do Pokémon';
    const typedFeedback = document.createElement('p');
    typedFeedback.setAttribute('role', 'status');
    typedFeedback.setAttribute('aria-live', 'polite');
    checkTypedAnswer.hidden = true;
    typedAnswerInput.hidden = true;
    const pause = makeButton('Pausar revisão');
    const stop = makeButton('Encerrar');
    const restartRound = makeButton('Recomeçar com os filtros atuais');
    restartRound.hidden = true;
    const copyStudyReport = makeButton('Copiar relatório da revisão');
    const copyReviewPlan = makeButton('Copiar plano de reforço');
    copyReviewPlan.hidden = true;
    copyStudyReport.hidden = true;
    const copyStudyFeedback = document.createElement('p');
    copyStudyFeedback.setAttribute('role', 'status');
    copyStudyFeedback.setAttribute('aria-live', 'polite');
    // On-demand keyboard guide is available before and during a session.
    const shortcutGuideButton = makeButton('Mostrar atalhos de teclado');
    shortcutGuideButton.setAttribute('aria-expanded', 'false');
    const shortcutGuide = document.createElement('p');
    shortcutGuide.id = 'flashcards-keyboard-help';
    shortcutGuide.hidden = true;
    shortcutGuide.textContent =
        'P: pausar ou retomar. Espaço: revelar com foco no painel. ' +
        'S: pular. H: dica. Setas: avançar ou revisar. ' +
        'M: memorizei. T: revisão espaçada. R: repetir.';
    shortcutGuideButton.setAttribute('aria-controls', shortcutGuide.id);
    shortcutGuideButton.addEventListener('click', () => {
        shortcutGuide.hidden = !shortcutGuide.hidden;
        shortcutGuideButton.textContent = shortcutGuide.hidden ?
            'Mostrar atalhos de teclado' : 'Ocultar atalhos de teclado';
        shortcutGuideButton.setAttribute('aria-expanded',
            String(!shortcutGuide.hidden));
    });
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
        ['types', 'Digitar os tipos do Pokémon'],
        ['mixed', 'Treino misto: características, nome e tipos digitados']
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
    const goalLabel = document.createElement('label');
    goalLabel.textContent = 'Meta de memorização nesta rodada: ';
    const goalSelect = document.createElement('select');
    for (const [value, label] of [['3', '3 Pokémon'], ['5', '5 Pokémon'],
        ['10', '10 Pokémon'], ['all', 'Todos os cartões']]) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        goalSelect.append(option);
    }
    goalSelect.value = '5';
    goalLabel.append(goalSelect);
    const goalStatus = document.createElement('p');
    goalStatus.setAttribute('role', 'status');
    goalStatus.setAttribute('aria-live', 'polite');
    const challengeScoreStatus = document.createElement('p');
    challengeScoreStatus.className = 'flashcards-challenge-score';
    challengeScoreStatus.setAttribute('role', 'status');
    challengeScoreStatus.setAttribute('aria-live', 'polite');
    const progressBar = document.createElement('progress');
    progressBar.setAttribute('aria-label', 'Avanço da rodada de flashcards');
    progressBar.max = 1;
    progressBar.value = 0;
    panel.append(heading, intro, shuffleLabel, modeLabel, sizeLabel, noHintsLabel, typeFocusLabel,
        progress, progressBar, goalLabel, goalStatus, challengeScoreStatus, masteryMilestone, typeCoverage, weaknessSummary, question,
        typedAnswerInput, typedFeedback, hintText, answer, controls,
        shortcutGuide, copyStudyFeedback, previewDeckSummary, flaggedSummary);
    filters.insertAdjacentElement('afterend', panel);

    let deck = [];
    let position = -1;
    let revealed = false;
    let identifyMode = false;
    let typeInputMode = false;
    let retryTotal = 0;
    let hintsUsed = 0;
    let currentRecallStreak = 0;
    let bestRecallStreak = 0;
    let pauseSnapshot = null;
    let studyReport = '';
    let lastMastery = null;
    let typedAttempts = 0;
    let typedCorrect = 0;
    let typedAttemptsOnCard = 0;
    let typedSolved = false;
    let challengeScore = 0;
    let challengeCombo = 0;
    let bestChallengeCombo = 0;
    const scoredCards = new Set();
    const flaggedCards = new Set();
    function refreshChallengeScore() {
        challengeScoreStatus.textContent = 'Desafio digitado: ' + challengeScore +
            ' ponto(s) | sequência perfeita: ' + challengeCombo +
            ' | recorde nesta rodada: ' + bestChallengeCombo +
            '. Primeira tentativa sem dica vale mais; sem pontuação persistente.';
    }
    const normalizePokemonName = value => value.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR')
        .replace(/[^a-z0-9]/g, '');
    const normalizePokemonTypes = value => value.split(/[,;]+/)
        .map(part => normalizePokemonName(part.trim())).filter(Boolean)
        .sort().join('|');
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
    function refreshStudyGoal() {
        const uniqueTotal = new Set(deck).size;
        const target = goalSelect.value === 'all' ? uniqueTotal :
            Math.min(uniqueTotal, Number(goalSelect.value));
        const mastered = [...masteredCards].filter(card => deck.includes(card)).length;
        goalStatus.textContent = uniqueTotal === 0 ? '' :
            'Meta: ' + mastered + '/' + target + ' Pokémon únicos. ' +
            (mastered >= target ? 'Meta alcançada; continue ou encerre a rodada.' :
                'Faltam ' + (target - mastered) + ' para atingir a meta.');
    }
    goalSelect.addEventListener('change', refreshStudyGoal);
    function reset(message) {
        lastMastery = null;
        undoMastery.hidden = true;
        studyReport = '';
        copyReviewPlan.hidden = true;
        typedAttempts = 0;
        typedCorrect = 0;
        challengeScore = 0;
        challengeCombo = 0;
        bestChallengeCombo = 0;
        scoredCards.clear();
        flaggedCards.clear();
        flaggedSummary.textContent = '';
        flagCurrent.hidden = true;
        retryFlagged.hidden = true;
        refreshChallengeScore();
        typedAttemptsOnCard = 0;
        typedSolved = false;
        typeInputMode = false;
        typedAnswerInput.value = '';
        typedAnswerInput.hidden = true;
        typedFeedback.textContent = '';
        checkTypedAnswer.hidden = true;
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
        masteryMilestone.textContent = '';
        goalStatus.textContent = '';
        question.textContent = '';
        answer.textContent = '';
        answer.hidden = true;
        hintText.hidden = true;
        hintText.textContent = '';
        hintButton.hidden = true;
        skip.hidden = true;
        start.hidden = false;
        previewDeckButton.hidden = false;
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
        retryTopFive.hidden = true;
        retryRecurring.hidden = true;
        retrySkipped.hidden = true;
        focusWeakest.hidden = true;
        focusWeakest.dataset.type = '';
        restartRound.hidden = true;
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
        if (card) copyReviewPlan.hidden = true;
        undoMastery.hidden = !card || !lastMastery;
        flagCurrent.hidden = !card;
        if (card) flagCurrent.textContent = flaggedCards.has(card)
            ? 'Remover marcação especial' : 'Marcar para revisão especial';
        flaggedSummary.textContent = flaggedCards.size
            ? flaggedCards.size+' Pokémon marcados para revisão especial.' : '';
        pause.hidden = !card;
        progressBar.max = Math.max(1, deck.length);
        progressBar.value = card ? Math.max(0, position) : deck.length;
        refreshTypeCoverage();
        refreshStudyGoal();
        refreshChallengeScore();
        // Distinct cards, not spaced retries, determine actual mastery.
        const uniqueTotal = new Set(deck).size;
        const uniqueMastered = [...masteredCards].filter(card =>
            deck.includes(card)).length;
        const nextMilestone = Math.min(uniqueTotal,
            Math.ceil((uniqueMastered + 1) / 5) * 5);
        masteryMilestone.textContent = uniqueTotal
            ? 'Domínio único: ' + uniqueMastered + '/' + uniqueTotal +
              ' Pokémon. ' + (uniqueMastered >= uniqueTotal
                  ? 'Meta concluída.'
                  : 'Próximo marco: ' + nextMilestone + ' memorizados.')
            : '';
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
            const recurring = [...new Set(deck)].filter(item =>
                (retryCounts.get(item) || 0) >= 2);
            retryRecurring.hidden = recurring.length === 0;
            retryFlagged.hidden = flaggedCards.size === 0;
            flagCurrent.hidden = true;
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
                'Marcados manualmente: ' + flaggedCards.size,
                'Revisões extras: ' + retryTotal,
                'Dicas utilizadas: ' + hintsUsed,
                'Tentativas digitadas: ' + typedAttempts,
                'Respostas digitadas corretas: ' + typedCorrect,
                'Pontos do desafio digitado: ' + challengeScore,
                'Maior sequência digitada perfeita: ' + bestChallengeCombo,
                'Desafio sem dicas: ' + (noHintsInput.checked ? 'sim' : 'não'),
                'Melhor sequência sem ajuda: ' + bestRecallStreak,
                'Tipos para reforçar: ' + (weakTypes || 'nenhum')
            ].join('\n');
            typedAnswerInput.hidden = true;
            checkTypedAnswer.hidden = true;
            copyStudyReport.hidden = false;
            copyReviewPlan.hidden = pending.length === 0 && difficultCards.size === 0;
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
            retryTopFive.hidden = difficultCards.size === 0;
            retrySkipped.hidden = skippedCards.size === 0;
            focusWeakest.hidden = ranked.length === 0 ||
                ![...typeFocusSelect.options].some(option => option.value === ranked[0][0]);
            focusWeakest.dataset.type = ranked[0]?.[0] || '';
            stop.hidden = true;
            return;
        }
        weaknessSummary.textContent = '';
        // Mixed sessions cycle through three playable challenges:
        // recall traits, identify by description, then type every Pokémon type.
        // Retries use the same deterministic position cycle, never stored data.
        const mixedStep = position % 3;
        identifyMode = modeSelect.value === 'identity' ||
            (modeSelect.value === 'mixed' && mixedStep === 1);
        typeInputMode = modeSelect.value === 'types' ||
            (modeSelect.value === 'mixed' && mixedStep === 2);
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
                ? ' | Identificação' : typeInputMode
                    ? ' | Tipos digitados' : ' | Características') :
                typeInputMode ? ' | Tipos digitados' : '') +
            ' | Memorizados: ' + masteredCards.size + ' | Revisões extras: ' + retryTotal +
            ' | Dicas: ' + hintsUsed + ' | Sequência sem ajuda: ' + currentRecallStreak;
        if (identifyMode) {
            question.textContent = 'Qual Pokémon corresponde a estes dados? Tipos: ' +
                (types.join(', ') || 'não informados') + '. ' + description;
            answer.textContent = 'Resposta: ' + name + ' ' + number;
        } else if (typeInputMode) {
            question.textContent = name + ' ' + number +
                ': digite todos os tipos separados por vírgula.';
            answer.textContent = 'Tipos corretos: ' + (types.join(', ') || 'não informados') +
                '. ' + description;
        } else {
            question.textContent = name + ' ' + number + ': quais são seus tipos e características?';
            answer.textContent = 'Tipos: ' + (types.join(', ') || 'não informados') +
                '. ' + description;
        }
        revealed = false;
        typedAttemptsOnCard = 0;
        typedSolved = false;
        typedAnswerInput.value = '';
        typedFeedback.textContent = '';
        typedAnswerInput.placeholder = typeInputMode
            ? 'Ex.: fogo, voador' : 'Nome do Pokémon';
        checkTypedAnswer.textContent = typeInputMode
            ? 'Conferir tipos digitados' : 'Conferir nome digitado';
        typedAnswerInput.hidden = !(identifyMode || typeInputMode);
        checkTypedAnswer.hidden = !(identifyMode || typeInputMode);
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
    previewDeckButton.addEventListener('click', () => {
        if (position >= 0) return;
        const selectedType = typeFocusSelect.value;
        let available = cards.filter(card => !card.hidden &&
            (!selectedType || [...card.querySelectorAll('.tipos .tipo')]
                .some(type => type.textContent.trim() === selectedType)));
        const daily = sizeSelect.value === 'daily5';
        if (daily) available = dailyStudyDeck(available);
        const count = daily || sizeSelect.value === 'all'
            ? available.length : Math.min(available.length, Number(sizeSelect.value));
        const planned = available.slice(0, count);
        const byType = new Map();
        for (const card of planned) {
            for (const type of new Set([...card.querySelectorAll('.tipos .tipo')]
                .map(node => node.textContent.trim()).filter(Boolean))) {
                byType.set(type, (byType.get(type) || 0) + 1);
            }
        }
        const topTypes = [...byType].sort((a, b) =>
            b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR')).slice(0, 3);
        previewDeckSummary.textContent = planned.length
            ? 'Próxima rodada: ' + planned.length + ' Pokémon; ' +
              (daily ? 'desafio diário; ' : '') +
              (shuffleInput.checked && !daily ? 'ordem embaralhada ao iniciar; ' : '') +
              'tipos mais presentes: ' +
              (topTypes.map(([type, total]) => type + ' (' + total + ')')
                  .join(', ') || 'não informados') +
              '. Nenhum progresso foi alterado.'
            : 'Nenhum cartão disponível com os filtros atuais.';
    });
    restartRound.addEventListener('click', () => {
        if (restartRound.hidden) return;
        // Rebuild a new in-memory deck using the current filters. No stored
        // achievements, network calls or hidden automatic answers are changed.
        reset('Nova rodada solicitada. Preparando os cartões filtrados.');
        start.click();
    });
    start.addEventListener('click', () => {
        lastMastery = null;
        undoMastery.hidden = true;
        retryCounts.clear();
        skippedCards.clear();
        masteredCards.clear();
        challengeScore = 0;
        challengeCombo = 0;
        bestChallengeCombo = 0;
        scoredCards.clear();
        retryTotal = 0;
        hintsUsed = 0;
        currentRecallStreak = 0;
        bestRecallStreak = 0;
        identifyMode = modeSelect.value === 'identity';
        typeInputMode = modeSelect.value === 'types';
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
        previewDeckButton.hidden = true;
        previewDeckSummary.textContent = '';
        retryMissed.hidden = true;
        retryDifficult.hidden = true;
        retryTopFive.hidden = true;
        retryRecurring.hidden = true;
        retrySkipped.hidden = true;
        restartRound.hidden = false;
        stop.hidden = false;
        show();
        panel.focus();
    });
    checkTypedAnswer.addEventListener('click', () => {
        if (position < 0 || revealed || !(identifyMode || typeInputMode) ||
            pauseSnapshot || typedSolved || typedAttemptsOnCard >= 2) return;
        const raw = typedAnswerInput.value.trim();
        if (!raw) {
            typedFeedback.textContent = 'Digite a resposta antes de conferir.';
            return;
        }
        const card = deck[position];
        const targetName = card.querySelector('.informacoes span')
            ?.textContent?.trim() || '';
        const targetTypes = [...card.querySelectorAll('.tipos .tipo')]
            .map(type => type.textContent.trim()).filter(Boolean);
        const correct = typeInputMode
            ? targetTypes.length > 0 &&
              normalizePokemonTypes(raw) === normalizePokemonTypes(targetTypes.join(','))
            : normalizePokemonName(raw) === normalizePokemonName(targetName);
        typedAttempts++;
        typedAttemptsOnCard++;
        if (correct) {
            // Only a verified typed answer scores. A repeated appearance of
            // the same Pokémon cannot inflate the in-session score.
            const perfect = typedAttemptsOnCard === 1 && hintText.hidden;
            if (!scoredCards.has(card)) {
                scoredCards.add(card);
                challengeCombo = perfect ? challengeCombo + 1 : 0;
                bestChallengeCombo = Math.max(bestChallengeCombo, challengeCombo);
                challengeScore += perfect ? 100 + Math.min(5, challengeCombo - 1) * 20 : 50;
            }
            refreshChallengeScore();
            typedCorrect++;
            typedSolved = true;
            typedFeedback.textContent = 'Resposta correta. Confirme a memorização.';
            reveal.click();
            return;
        }
        difficultCards.add(deck[position]);
        currentRecallStreak = 0;
        challengeCombo = 0;
        refreshChallengeScore();
        typedFeedback.textContent = typedAttemptsOnCard >= 2
            ? 'Duas tentativas utilizadas. Revele a resposta para continuar.'
            : 'Resposta diferente. Você tem mais uma tentativa.';
        if (typedAttemptsOnCard >= 2) {
            // Two incorrect recalls schedule one extra appearance, bounded by
            // the same retry quota as the manual spaced-review controls.
            const card = deck[position];
            const retries = retryCounts.get(card) || 0;
            if (retries < 2 && !deck.slice(position + 1).includes(card)) {
                retryCounts.set(card, retries + 1);
                const insertion = Math.min(deck.length, position + 3);
                deck.splice(insertion, 0, card);
                retryTotal += 1;
                typedFeedback.textContent =
                    'Duas tentativas incorretas. Revisão espaçada programada após dois cartões.';
            }
            checkTypedAnswer.hidden = true;
            typedAnswerInput.hidden = true;
        }
    });
    typedAnswerInput.addEventListener('keydown', event => {
        if (event.key === 'Enter' && !checkTypedAnswer.hidden) {
            event.preventDefault();
            checkTypedAnswer.click();
        }
    });
    hintButton.addEventListener('click', () => {
        if (position < 0 || revealed || hintButton.hidden || noHintsInput.checked) return;
        lastMastery = null;
        undoMastery.hidden = true;
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
        challengeCombo = 0;
        refreshChallengeScore();
        progress.textContent += ' | Dica utilizada';
    });
    skip.addEventListener('click', () => {
        if (position < 0 || revealed || skippedCards.has(deck[position])) return;
        lastMastery = null;
        undoMastery.hidden = true;
        const card = deck[position];
        skippedCards.add(card);
        difficultCards.add(card);
        currentRecallStreak = 0;
        challengeCombo = 0;
        refreshChallengeScore();
        deck.push(card);
        position += 1;
        show();
    });
    flagCurrent.addEventListener('click', () => {
        if (position < 0 || pauseSnapshot || !deck[position]) return;
        const card = deck[position];
        if (flaggedCards.has(card)) flaggedCards.delete(card);
        else flaggedCards.add(card);
        flagCurrent.textContent = flaggedCards.has(card)
            ? 'Remover marcação especial' : 'Marcar para revisão especial';
        flaggedSummary.textContent = flaggedCards.size
            ? flaggedCards.size+' Pokémon marcados para revisão especial.' : '';
    });
    retryFlagged.addEventListener('click', () => {
        if (position >= 0 || !flaggedCards.size) return;
        deck = [...flaggedCards].slice(0,20);
        position = 0;
        retryTotal = 0;
        hintsUsed = 0;
        retryCounts.clear();
        skippedCards.clear();
        difficultCards.clear();
        masteredCards.clear();
        flaggedCards.clear();
        lastMastery = null;
        modeSelect.disabled = true;
        sizeSelect.disabled = true;
        typeFocusSelect.disabled = true;
        noHintsInput.disabled = true;
        start.hidden = true;
        retryFlagged.hidden = true;
        stop.hidden = false;
        show();
        panel.focus();
    });
    reveal.addEventListener('click', () => {
        if (position < 0) return;
        lastMastery = null;
        undoMastery.hidden = true;
        revealed = true;
        typedAnswerInput.hidden = true;
        checkTypedAnswer.hidden = true;
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
        if (!revealed || position < 0 || pauseSnapshot) return;
        const card = deck[position];
        lastMastery = {card, streak:currentRecallStreak, best:bestRecallStreak};
        const recalledWithoutHelp = !difficultCards.has(card);
        currentRecallStreak = recalledWithoutHelp ? currentRecallStreak + 1 : 0;
        bestRecallStreak = Math.max(bestRecallStreak, currentRecallStreak);
        masteredCards.add(card);
        position += 1;
        show();
    });
    // Undo is in-session only and affects neither captures nor stored scores.
    // Reinsert the card immediately without creating a duplicate mastery.
    undoMastery.addEventListener('click', () => {
        if (!lastMastery || position < 0 || pauseSnapshot) return;
        const {card,streak,best} = lastMastery;
        lastMastery = null;
        masteredCards.delete(card);
        currentRecallStreak = streak;
        bestRecallStreak = best;
        deck.splice(position, 0, card);
        show();
        panel.focus();
    });
    again.addEventListener('click', () => {
        if (!revealed || position < 0) return;
        lastMastery = null;
        undoMastery.hidden = true;
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
        lastMastery = null;
        undoMastery.hidden = true;
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
        lastMastery = null;
        undoMastery.hidden = true;
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
        typeInputMode = modeSelect.value === 'types';
        modeSelect.disabled = true;
        sizeSelect.disabled = true;
        typeFocusSelect.disabled = true;
        noHintsInput.disabled = true;
        start.hidden = true;
        retryMissed.hidden = true;
        retryDifficult.hidden = true;
        retryTopFive.hidden = true;
        retryRecurring.hidden = true;
        retrySkipped.hidden = true;
        stop.hidden = false;
        show();
        panel.focus();
    });
    // Bounded replay of the five most repeatedly missed Pokémon.
    // All selections and scores remain in memory for this session only.
    retryTopFive.addEventListener('click', () => {
        if (position >= 0 || retryTopFive.hidden || !difficultCards.size) return;
        const selected = [...difficultCards]
            .sort((a, b) => (retryCounts.get(b) || 0) - (retryCounts.get(a) || 0) ||
                (a.querySelector('.informacoes span')?.textContent || '')
                    .localeCompare(b.querySelector('.informacoes span')?.textContent || '', 'pt-BR'))
            .slice(0, 5);
        if (!selected.length) return;
        deck = selected;
        position = 0;
        retryTotal = 0;
        hintsUsed = 0;
        currentRecallStreak = 0;
        bestRecallStreak = 0;
        retryCounts.clear();
        skippedCards.clear();
        difficultCards.clear();
        masteredCards.clear();
        lastMastery = null;
        identifyMode = modeSelect.value === 'identity';
        typeInputMode = modeSelect.value === 'types';
        modeSelect.disabled = true;
        sizeSelect.disabled = true;
        typeFocusSelect.disabled = true;
        noHintsInput.disabled = true;
        start.hidden = true;
        retryMissed.hidden = true;
        retryDifficult.hidden = true;
        retryTopFive.hidden = true;
        retryRecurring.hidden = true;
        retrySkipped.hidden = true;
        stop.hidden = false;
        show();
        panel.focus();
    });
    // A bounded manual replay of repeated mistakes, separate from all hard cards.
    retryRecurring.addEventListener('click', () => {
        if (position >= 0 || retryRecurring.hidden) return;
        const recurring = [...new Set(deck)]
            .filter(card => (retryCounts.get(card) || 0) >= 2)
            .sort((a,b) => (retryCounts.get(b) || 0) -
                (retryCounts.get(a) || 0))
            .slice(0,8);
        if (!recurring.length) return;
        deck = recurring;
        position = 0;
        retryTotal = 0;
        hintsUsed = 0;
        currentRecallStreak = 0;
        bestRecallStreak = 0;
        retryCounts.clear();
        skippedCards.clear();
        difficultCards.clear();
        masteredCards.clear();
        lastMastery = null;
        identifyMode = modeSelect.value === 'identity';
        typeInputMode = modeSelect.value === 'types';
        modeSelect.disabled = true;
        sizeSelect.disabled = true;
        typeFocusSelect.disabled = true;
        noHintsInput.disabled = true;
        start.hidden = true;
        retryMissed.hidden = true;
        retryDifficult.hidden = true;
        retryTopFive.hidden = true;
        retryRecurring.hidden = true;
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
        typeInputMode = modeSelect.value === 'types';
        modeSelect.disabled = true;
        sizeSelect.disabled = true;
        typeFocusSelect.disabled = true;
        noHintsInput.disabled = true;
        start.hidden = true;
        retryMissed.hidden = true;
        retryDifficult.hidden = true;
        retryTopFive.hidden = true;
        retryRecurring.hidden = true;
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
        typeInputMode = modeSelect.value === 'types';
        modeSelect.disabled = true;
        sizeSelect.disabled = true;
        typeFocusSelect.disabled = true;
        noHintsInput.disabled = true;
        start.hidden = true;
        retryMissed.hidden = true;
        retryDifficult.hidden = true;
        retryTopFive.hidden = true;
        retryRecurring.hidden = true;
        retrySkipped.hidden = true;
        stop.hidden = false;
        show();
        panel.focus();
    });
    // Pause hides the current question and answer without advancing the deck.
    // The exact button visibility and text are restored on resume.
    pause.addEventListener('click', () => {
        if (position < 0) return;
        const actions = [reveal, hintButton, skip, next, masteredButton, undoMastery, again, spacedRetry, checkTypedAnswer];
        if (pauseSnapshot) {
            question.textContent = pauseSnapshot.question;
            typedAnswerInput.hidden = pauseSnapshot.typedInputHidden;
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
            typedInputHidden: typedAnswerInput.hidden,
            answerHidden: answer.hidden,
            hintHidden: hintText.hidden,
            hidden: actions.map(button => button.hidden)
        };
        question.textContent = 'Revisão pausada. Retome para continuar.';
        typedAnswerInput.hidden = true;
        answer.hidden = true;
        hintText.hidden = true;
        actions.forEach(button => { button.hidden = true; });
        pause.textContent = 'Retomar revisão';
        panel.focus();
    });
    copyReviewPlan.addEventListener('click', async () => {
        if (position >= 0 || copyReviewPlan.hidden) return;
        const pending = [...new Set(deck)].filter(card => !masteredCards.has(card));
        const priority = [...new Set([...difficultCards, ...skippedCards, ...pending])];
        const lines = ['Pokédex | Plano de reforço manual',
            'Cartões prioritários: ' + priority.length,
            'Difíceis: ' + difficultCards.size + ' | Pulados: ' + skippedCards.size];
        for (const card of priority) {
            const name = card.querySelector('.informacoes span')?.textContent?.trim() || 'Pokémon';
            const types = [...card.querySelectorAll('.tipos .tipo')]
                .map(node => node.textContent.trim()).filter(Boolean).join(', ');
            const reason = difficultCards.has(card) ? 'difícil' :
                skippedCards.has(card) ? 'pulado' : 'pendente';
            lines.push('- ' + name + ' | ' + (types || 'sem tipo') + ' | ' + reason);
        }
        if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
            copyStudyFeedback.textContent = 'Cópia indisponível neste navegador.';
            return;
        }
        try {
            await navigator.clipboard.writeText(lines.join('\n'));
            copyStudyFeedback.textContent = 'Plano de reforço copiado, sem alterar o progresso.';
        } catch {
            copyStudyFeedback.textContent = 'O navegador não autorizou a cópia.';
        }
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
            event.target instanceof HTMLSelectElement ||
            event.target instanceof HTMLButtonElement) return;
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
