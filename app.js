// Quiz Antincendio - Progressive Web App v1.3.3 FIXED
// Versione completa corretta con tutti i metodi implementati

let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
});

class QuizApp {
    constructor() {
        this.root = document.getElementById('app');
        this.quizData = [];
        this.selectedQuestions = [];
        this.currentQuestionIndex = 0;
        this.selectedAnswer = null;
        this.incorrectCount = 0;
        this.answeredQuestions = [];
        this.showFeedback = false;
        this.quizState = 'loading';
        this.mode = null;
        this.startTime = null;
        this.endTime = null;
        this.timerInterval = null;
        this.timeRemaining = 0;
        this.questionStartTime = null;
        this.history = [];
        this.stats = { totalAttempts: 0, totalCorrect: 0, totalTime: 0, totalQuestions: 350 };
        this.highScores60s = [];
        this.badges = {};
        this.dailyGoal = {
            target: 50,
            completedToday: 0,
            lastGoalDate: new Date().toLocaleDateString('it-IT')
        };
        this.settings = {
            darkMode: false,
            theme: 'red',
            unlockedThemes: ['red']
        };

        this.loadPersistentData();
        this.checkDailyGoal();
        this.applySettings();
        this.loadData();
    }

    // ============================================
    // CARICAMENTO DATI
    // ============================================
    async loadData() {
        try {
            const response = await fetch('quiz_antincendio_ocr_improved.json');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const data = await response.json();
            this.quizData = data.map((q, index) => ({ ...q, qnum: index + 1 }));
            this.stats.totalQuestions = this.quizData.length;
            this.quizState = 'start';
            this.quizData.sort(() => Math.random() - 0.5);
        } catch (error) {
            console.error("Errore caricamento dati:", error);
            this.quizState = 'error';
        } finally {
            this.hideInitialLoadingScreen();
            this.render();
            this.handleA2HS();
        }
    }

    hideInitialLoadingScreen() {
        const loading = document.getElementById('loading');
        if (loading) loading.style.display = 'none';
    }

    // ============================================
    // PERSISTENZA DATI
    // ============================================
    loadPersistentData() {
        try {
            const savedHistory = localStorage.getItem('quizHistory');
            const savedStats = localStorage.getItem('quizStats');
            const savedScores = localStorage.getItem('highScores60s');
            const savedBadges = localStorage.getItem('quizBadges');
            const savedDailyGoal = localStorage.getItem('dailyGoal');
            const savedSettings = localStorage.getItem('quizSettings');

            if (savedHistory) this.history = JSON.parse(savedHistory);
            if (savedStats) this.stats = { ...this.stats, ...JSON.parse(savedStats) };
            if (savedScores) this.highScores60s = JSON.parse(savedScores);
            if (savedBadges) this.badges = JSON.parse(savedBadges);
            if (savedDailyGoal) this.dailyGoal = { ...this.dailyGoal, ...JSON.parse(savedDailyGoal) };
            if (savedSettings) {
                const loadedSettings = JSON.parse(savedSettings);
                this.settings = { ...this.settings, ...loadedSettings };
                if (!this.settings.unlockedThemes || !this.settings.unlockedThemes.includes('red')) {
                    this.settings.unlockedThemes = this.settings.unlockedThemes || [];
                    if (!this.settings.unlockedThemes.includes('red')) {
                        this.settings.unlockedThemes.push('red');
                    }
                }
            }
        } catch (error) {
            console.error("Errore caricamento localStorage:", error);
        }
    }

    savePersistentData() {
        try {
            localStorage.setItem('quizHistory', JSON.stringify(this.history));
            localStorage.setItem('quizStats', JSON.stringify(this.stats));
            localStorage.setItem('highScores60s', JSON.stringify(this.highScores60s));
            localStorage.setItem('quizBadges', JSON.stringify(this.badges));
            localStorage.setItem('dailyGoal', JSON.stringify(this.dailyGoal));
            localStorage.setItem('quizSettings', JSON.stringify(this.settings));
        } catch (error) {
            console.error("Errore salvataggio localStorage:", error);
        }
    }

    // ============================================
    // IMPOSTAZIONI
    // ============================================
    applySettings() {
        const rootElement = document.documentElement;
        if (this.settings.darkMode) {
            rootElement.classList.add('dark');
        } else {
            rootElement.classList.remove('dark');
        }
        const themeColor = this.getThemeColor(this.settings.theme);
        document.documentElement.style.setProperty('--theme-color', themeColor);
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) metaTheme.setAttribute('content', themeColor);
    }

    getThemeColor(themeName) {
        switch (themeName) {
            case 'forest': return '#16a34a';
            case 'water': return '#0284c7';
            case 'gold': return '#ca8a04';
            case 'red':
            default: return '#dc2626';
        }
    }

    toggleDarkMode() {
        this.settings.darkMode = !this.settings.darkMode;
        this.applySettings();
        this.savePersistentData();
        this.render();
    }

    changeTheme(newTheme) {
        if (this.settings.unlockedThemes.includes(newTheme)) {
            this.settings.theme = newTheme;
            this.applySettings();
            this.savePersistentData();
            this.render();
        }
    }

    // ============================================
    // LOGICA QUIZ
    // ============================================
    selectMode(mode) {
        if (this.quizData.length === 0) {
            alert("I dati non sono ancora stati caricati.");
            return;
        }

        this.mode = mode;
        this.incorrectCount = 0;
        this.answeredQuestions = [];
        this.startTime = Date.now();
        this.questionStartTime = Date.now();

        switch (mode) {
            case 'training':
                this.selectedQuestions = [...this.quizData];
                this.selectedQuestions.sort(() => Math.random() - 0.5);
                this.quizState = 'quiz';
                break;
            case 'exam':
                this.selectedQuestions = this.getExamQuestions();
                this.timeRemaining = 30 * 60;
                this.startTimer(1000, () => this.checkExamTime());
                this.quizState = 'quiz';
                break;
            case 'errorsOnly':
                this.selectedQuestions = this.getReviewQuestions(0.7);
                if (this.selectedQuestions.length === 0) {
                    alert("Non hai errori da rivedere!");
                    this.quizState = 'start';
                } else {
                    this.selectedQuestions.sort(() => Math.random() - 0.5);
                    this.quizState = 'quiz';
                }
                break;
            case 'smartReview':
                this.selectedQuestions = this.getSmartReviewQuestions();
                if (this.selectedQuestions.length === 0) {
                    alert("Non ci sono domande da rivedere!");
                    this.quizState = 'start';
                } else {
                    this.selectedQuestions.sort(() => Math.random() - 0.5);
                    this.quizState = 'quiz';
                }
                break;
            case 'timeChallenge':
                this.selectedQuestions = [...this.quizData];
                this.selectedQuestions.sort(() => Math.random() - 0.5);
                this.timeRemaining = 60;
                this.startTimer(1000, () => this.checkTimeChallengeTime());
                this.quizState = 'quiz';
                break;
            default:
                this.quizState = 'start';
        }

        this.currentQuestionIndex = 0;
        this.selectedAnswer = null;
        this.showFeedback = (mode === 'training');
        this.render();
    }

    getExamQuestions() {
        const shuffled = [...this.quizData].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 15);
    }

    getReviewQuestions(minErrorRate) {
        const questionStats = this.getQuestionStats();
        return this.quizData.filter(q => {
            const stats = questionStats[q.qnum] || { total: 0, incorrect: 0 };
            if (stats.total === 0) return false;
            const errorRate = stats.incorrect / stats.total;
            return errorRate >= minErrorRate;
        });
    }

    getSmartReviewQuestions() {
        const questionStats = this.getQuestionStats();
        const now = Date.now();

        return this.quizData
            .map(q => {
                const qHistories = this.history.filter(h => h.qnum === q.qnum && h.mode !== 'review');
                const lastHistory = qHistories.length > 0 ? qHistories[qHistories.length - 1] : null;
                const stats = questionStats[q.qnum] || { total: 0, incorrect: 0 };
                const errorRate = stats.total > 0 ? stats.incorrect / stats.total : 1;

                let priority = 0;

                if (lastHistory) {
                    const timeSinceLastReview = (now - lastHistory.timestamp) / (1000 * 60 * 60 * 24);
                    if (!lastHistory.isCorrect) {
                        priority = 1000;
                    } else {
                        const difficultyFactor = (1 - errorRate) * 10;
                        const reviewInterval = 1 + difficultyFactor;
                        if (timeSinceLastReview >= reviewInterval) {
                            priority = timeSinceLastReview * (errorRate + 1);
                        }
                    }
                } else {
                    priority = 50;
                }

                return { question: q, priority: priority };
            })
            .filter(item => item.priority > 0)
            .sort((a, b) => b.priority - a.priority)
            .map(item => item.question)
            .slice(0, 50);
    }

    getQuestionStats() {
        return this.history.reduce((acc, item) => {
            const qnum = item.qnum;
            if (!acc[qnum]) {
                acc[qnum] = { total: 0, incorrect: 0 };
            }
            acc[qnum].total++;
            if (!item.isCorrect) {
                acc[qnum].incorrect++;
            }
            return acc;
        }, {});
    }

    checkAnswer(qnum, selectedLabel) {
        if (this.mode === 'results') return; 

        // NUOVA LOGICA: Aggiorna SEMPRE this.selectedAnswer per evidenziare la scelta. 
        // L'uscita precoce 'this.selectedAnswer !== null' viene rimossa per permettere la re-selezione.
        this.selectedAnswer = selectedLabel; 

        const currentQ = this.selectedQuestions[this.currentQuestionIndex];
        const isCorrect = (currentQ.correct_label === selectedLabel);

        // La logica di feedback e salvataggio immediato è SOLO in modalità 'training' e 'timeChallenge'.
        if (this.mode === 'training' || this.mode === 'timeChallenge') {

            const timeSpent = (Date.now() - this.questionStartTime) / 1000;

            this.history.push({
                qnum: currentQ.qnum,
                isCorrect: isCorrect,
                timestamp: Date.now(),
                mode: this.mode,
                timeSpent: timeSpent,
            });

            this.stats.totalAttempts++;
            if (isCorrect) {
                this.stats.totalCorrect++;
            }
            this.stats.totalTime += timeSpent;

            this.dailyGoal.completedToday += 1;
            this.savePersistentData();
            this.checkBadges();

            if (this.mode === 'timeChallenge') {
                if (isCorrect) {
                    this.nextQuestion();
                    return;
                } else {
                    this.endQuiz();
                    return;
                }
            }
            // In modalità 'training', l'esecuzione continua con il render per mostrare il feedback.
        } 
        
        // Per 'exam', 'errorsOnly', 'smartReview', il salvataggio avviene solo in nextQuestion().

        this.render();
    }

    nextQuestion() {
        if (this.quizState !== 'quiz') return;

        // Se non siamo in modalità 'training' o 'review' e l'utente non ha selezionato nulla, blocca.
        if (this.mode !== 'training' && this.mode !== 'review' && this.selectedAnswer === null) return;
        
        // ********************** LOGICA DI SALVATAGGIO FINALE **********************
        // Salva solo per le modalità che non lo fanno in checkAnswer()
        const finalModes = ['exam', 'errorsOnly', 'smartReview'];
        if (finalModes.includes(this.mode) && this.selectedAnswer !== null) {
            const currentQ = this.selectedQuestions[this.currentQuestionIndex];
            const isCorrect = (currentQ.correct_label === this.selectedAnswer);
            const timeSpent = (Date.now() - this.questionStartTime) / 1000;

            // 1. Salva la storia
            this.history.push({
                qnum: currentQ.qnum,
                isCorrect: isCorrect,
                timestamp: Date.now(),
                mode: this.mode,
                timeSpent: timeSpent,
            });
            
            // 2. Salva le risposte date (per la revisione post-quiz)
            this.answeredQuestions.push({ question: currentQ, isCorrect, selectedLabel: this.selectedAnswer, timeSpent });

            // 3. Aggiorna le statistiche
            if (!isCorrect) {
                this.incorrectCount++;
            }
            this.stats.totalAttempts++;
            if (isCorrect) {
                this.stats.totalCorrect++;
            }
            this.stats.totalTime += timeSpent;
            this.dailyGoal.completedToday += 1;
            this.savePersistentData();
            this.checkBadges();
        }
        // **************************************************************************

        this.currentQuestionIndex++;
        this.selectedAnswer = null;
        this.questionStartTime = Date.now();

        if (this.currentQuestionIndex >= this.selectedQuestions.length) {
            this.endQuiz();
        } else {
            // Logica per il caricamento della risposta in modalità 'review' (FIX PRECEDENTE)
            if (this.mode === 'review') {
                const currentAnswered = this.answeredQuestions[this.currentQuestionIndex];
                if (currentAnswered) {
                    this.selectedAnswer = currentAnswered.selectedLabel;
                }
            }
            this.render();
        }
    }

    endQuiz() {
        clearInterval(this.timerInterval);
        this.endTime = Date.now();

        if (this.mode === 'timeChallenge') {
            this.checkHighScore60s();
        } else if (this.mode === 'exam') {
            if (this.incorrectCount <= 5) {
                this.unlockBadge('fireMaster');
            }
        }

        this.quizState = 'results';
        this.reviewQuestionIndex = 0;
        this.savePersistentData();
        this.render();
    }

    reviewAnswers() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.quizState = 'quiz';
        this.mode = 'review';
        this.selectedQuestions = this.answeredQuestions.map(a => a.question);
        this.currentQuestionIndex = 0;
        this.showFeedback = true;
        
        // FIX: Carica la risposta data per la prima domanda in revisione
        if (this.answeredQuestions.length > 0) {
            this.selectedAnswer = this.answeredQuestions[0].selectedLabel;
        } else {
            this.selectedAnswer = null;
        }
        
        this.render();
    }

    // ============================================
    // TIMER
    // ============================================
    startTimer(interval, callback) {
        this.timerInterval = setInterval(() => {
            this.timeRemaining--;
            callback();
            this.render();
        }, interval);
    }

    checkExamTime() {
        if (this.timeRemaining <= 0) {
            this.endQuiz();
        }
    }

    checkTimeChallengeTime() {
        if (this.timeRemaining <= 0) {
            this.endQuiz();
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // ============================================
    // BADGE E OBIETTIVI
    // ============================================
    checkDailyGoal() {
        const today = new Date().toLocaleDateString('it-IT');
        if (this.dailyGoal.lastGoalDate !== today) {
            this.dailyGoal.completedToday = 0;
            this.dailyGoal.lastGoalDate = today;
            this.savePersistentData();
        }
    }

    checkBadges() {
        const examPassed = this.history.filter(h => h.mode === 'exam' && h.isCorrect).length;
        const totalAnswered = this.history.length;

        if (examPassed >= 10 && !this.badges.fireMaster) {
            this.unlockBadge('fireMaster');
        }

        if (totalAnswered >= 1000 && !this.badges.studentPro) {
            this.unlockBadge('studentPro');
        }

        if (this.dailyGoal.completedToday >= this.dailyGoal.target && !this.badges.dailyGoalReached) {
            this.unlockBadge('dailyGoalReached');
        }
    }

    unlockBadge(badgeName) {
        this.badges[badgeName] = true;

        if (badgeName === 'fireMaster' && !this.settings.unlockedThemes.includes('forest')) {
            this.settings.unlockedThemes.push('forest');
            alert('🎉 Badge Sbloccato: Maestro del Fuoco! Tema Foresta disponibile!');
        } else if (badgeName === 'studentPro' && !this.settings.unlockedThemes.includes('water')) {
            this.settings.unlockedThemes.push('water');
            alert('🎉 Badge Sbloccato: Studente Pro! Tema Acqua disponibile!');
        } else if (badgeName === 'king60s' && !this.settings.unlockedThemes.includes('gold')) {
            this.settings.unlockedThemes.push('gold');
            alert('🎉 Badge Sbloccato: Re del 60s! Tema Oro disponibile!');
        }

        this.savePersistentData();
    }

    checkHighScore60s() {
        const score = this.currentQuestionIndex;
        this.highScores60s.push({ score, timestamp: Date.now() });
        this.highScores60s.sort((a, b) => b.score - a.score);
        this.highScores60s = this.highScores60s.slice(0, 5);

        if (score >= 20 && !this.badges.king60s) {
            this.unlockBadge('king60s');
        }

        this.savePersistentData();
    }

    resetStats() {
        if (confirm('Vuoi davvero azzerare tutte le statistiche?')) {
            this.history = [];
            this.stats = { totalAttempts: 0, totalCorrect: 0, totalTime: 0, totalQuestions: this.quizData.length };
            this.highScores60s = [];
            this.badges = {};
            this.dailyGoal.completedToday = 0;
            this.savePersistentData();
            this.render();
        }
    }

    // ============================================
    // RENDERING
    // ============================================
    render() {
        const themeColorHex = this.getThemeColor(this.settings.theme);
        document.documentElement.style.setProperty('--theme-color', themeColorHex);

        let htmlContent = '';

        switch (this.quizState) {
            case 'loading':
                htmlContent = '';
                break;
            case 'error':
                htmlContent = this.renderError();
                break;
            case 'start':
                htmlContent = this.renderStartMenu();
                break;
            case 'quiz':
                htmlContent = this.renderQuiz();
                break;
            case 'results':
                htmlContent = this.renderResults();
                break;
            case 'stats':
                htmlContent = this.renderStats();
                break;
            case 'settings':
                htmlContent = this.renderSettings();
                break;
        }

        this.root.innerHTML = htmlContent;
    }

    renderError() {
        return `
            <div class="text-center p-8 mt-10 rounded-xl shadow-2xl bg-white dark:bg-gray-700 border-t-8 border-red-600">
                <h2 class="text-3xl font-extrabold text-red-700 dark:text-red-300 mb-4">🚨 Errore di Caricamento</h2>
                <p class="text-gray-700 dark:text-gray-200 mb-6">
                    Impossibile caricare il file delle domande (quiz_antincendio_ocr_improved.json).
                </p>
                <p class="text-sm text-red-500 dark:text-red-400 mb-6">
                    Soluzione: Assicurati di aver aggiornato sw.js con un nuovo CACHE_NAME, poi ricarica con Ctrl+Shift+R
                </p>
                <button onclick="window.location.reload()" class="bg-red-600 text-white px-6 py-3 rounded-full font-bold hover:bg-red-700 transition">
                    Ricarica Applicazione
                </button>
            </div>
        `;
    }

    renderStartMenu() {
        const goalProgress = this.dailyGoal.completedToday >= this.dailyGoal.target ? 'Completato ✓' : 'In Corso';
        const goalColor = this.dailyGoal.completedToday >= this.dailyGoal.target ? 'text-green-500' : 'text-yellow-500';

        return `
            <h1 class="text-4xl font-extrabold text-center mb-6 text-[var(--theme-color)]">🔥 Quiz Antincendio</h1>
            <p class="text-center text-sm mb-8 dark:text-gray-300">
                ${this.stats.totalQuestions} domande | Obiettivo: ${this.dailyGoal.completedToday}/${this.dailyGoal.target}
                <span class="${goalColor}"> (${goalProgress})</span>
            </p>

            <div class="space-y-4 mb-20">
                <button onclick="window.quizApp.selectMode('training')" class="w-full bg-[var(--theme-color)] text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:scale-105 transition">
                    <span class="text-lg">🏋️ Allenamento Libero</span>
                    <p class="text-xs opacity-80 mt-1">Nessun limite, feedback immediato</p>
                </button>

                <button onclick="window.quizApp.selectMode('exam')" class="w-full bg-yellow-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:scale-105 transition">
                    <span class="text-lg">⏱️ Simulazione Esame</span>
                    <p class="text-xs opacity-80 mt-1">15 domande, 30 minuti, max 5 errori</p>
                </button>

                <button onclick="window.quizApp.selectMode('smartReview')" class="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:scale-105 transition">
                    <span class="text-lg">🧠 Revisione Intelligente</span>
                    <p class="text-xs opacity-80 mt-1">Ripetizione spaziata, domande difficili</p>
                </button>

                <button onclick="window.quizApp.selectMode('errorsOnly')" class="w-full bg-red-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:scale-105 transition">
                    <span class="text-lg">❌ Solo Errori</span>
                    <p class="text-xs opacity-80 mt-1">Riprova le domande sbagliate</p>
                </button>

                <button onclick="window.quizApp.selectMode('timeChallenge')" class="w-full bg-purple-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:scale-105 transition">
                    <span class="text-lg">⚡ Sfida 60 Secondi</span>
                    <p class="text-xs opacity-80 mt-1">Un minuto, massimo punteggio</p>
                </button>
            </div>

            ${this.renderBottomNav()}
        `;
    }

    renderQuiz() {
        if (!this.selectedQuestions || this.currentQuestionIndex >= this.selectedQuestions.length) {
            return '<div class="text-center p-8">Caricamento...</div>';
        }

        const currentQ = this.selectedQuestions[this.currentQuestionIndex];
        const progress = ((this.currentQuestionIndex + 1) / this.selectedQuestions.length) * 100;

        let timerHTML = '';
        if (this.mode === 'exam' || this.mode === 'timeChallenge') {
            timerHTML = `
                <div class="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 px-4 py-2 rounded-lg font-bold text-center mb-4">
                    ⏱️ Tempo: ${this.formatTime(this.timeRemaining)}
                </div>
            `;
        }

        return `
            ${timerHTML}
            <div class="mb-4">
                <div class="flex justify-between text-sm mb-2 dark:text-gray-300">
                    <span>Domanda ${this.currentQuestionIndex + 1} di ${this.selectedQuestions.length}</span>
                    <span>${Math.round(progress)}%</span>
                </div>
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div class="bg-[var(--theme-color)] h-2 rounded-full transition-all" style="width: ${progress}%"></div>
                </div>
            </div>

            <div class="bg-white dark:bg-gray-700 rounded-xl p-6 shadow-lg mb-6">
                <h2 class="text-xl font-bold mb-4 dark:text-white">${currentQ.instruction}</h2>
                
                <div class="space-y-3">
                    ${Object.entries(currentQ.options).map(([label, text]) => {
                        // *** MODIFICHE INIZIANO QUI ***
                        // In modalità 'review' la risposta data è salvata nel record answeredQuestions
                        const isReviewMode = this.mode === 'review';
                        let userSelectedLabel = this.selectedAnswer; 
                        
                        // Se siamo in revisione e non è la prima domanda (già caricata in reviewAnswers), 
                        // recuperiamo la risposta corretta per la domanda corrente
                        if (isReviewMode) {
                            const currentAnswered = this.answeredQuestions[this.currentQuestionIndex];
                            if (currentAnswered) {
                                userSelectedLabel = currentAnswered.selectedLabel;
                            }
                        }

                        const isSelected = userSelectedLabel === label; // Usa la risposta data, non solo this.selectedAnswer
                        const isCorrect = currentQ.correct_label === label;
                        let buttonClass = 'bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500';
                        
                        // La variabile 'shouldShowFeedback' è sempre true in 'reviewAnswers', quindi usiamo selectedAnswer per il check
                        if (userSelectedLabel && this.showFeedback) { 
                            if (isCorrect) {
                                buttonClass = 'bg-green-500 text-white';
                            } else if (isSelected && !isCorrect) {
                                buttonClass = 'bg-red-500 text-white';
                            }
                        } else if (isSelected) {
                            // Questo blocco evidenzia la selezione PRIMA del feedback (solo training o pre-answer)
                            buttonClass = 'bg-blue-500 text-white'; 
                        }

                        // Determina se il pulsante deve essere disabilitato
                        const isDisabled = isReviewMode || (this.selectedAnswer && this.mode !== 'training');

                        return `
                            <button 
                                onclick="window.quizApp.checkAnswer(${currentQ.qnum}, '${label}')"
                                class="w-full text-left p-4 rounded-lg font-medium transition ${buttonClass} ${isDisabled ? 'cursor-not-allowed' : ''}"
                                ${isDisabled ? 'disabled' : ''}> 
                                <span class="font-bold">${label}.</span> ${text}
                            </button>
                        `;
                    }).join('')}
                </div>

                ${this.selectedAnswer && this.showFeedback ? `
                    <div class="mt-4 p-4 rounded-lg ${this.selectedAnswer === currentQ.correct_label ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}">
                        <p class="font-bold ${this.selectedAnswer === currentQ.correct_label ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}">
                            ${this.selectedAnswer === currentQ.correct_label ? '✅ Corretto!' : '❌ Sbagliato'}
                        </p>
                        <p class="mt-2 dark:text-gray-200">
                            <strong>Risposta corretta:</strong> ${currentQ.correct_label}. ${currentQ.correct_text}
                        </p>
                    </div>
                ` : ''}
            </div>

    const isDisabled = isReviewMode || (this.mode === 'training' && this.selectedAnswer !== null);
                        
                        return `
                            <button 
                                onclick="window.quizApp.checkAnswer(${currentQ.qnum}, '${label}')"
                                class="w-full text-left p-4 rounded-lg font-medium transition ${buttonClass} ${isDisabled ? 'cursor-not-allowed' : ''}"
                                ${isDisabled ? 'disabled' : ''}> 
                                <span class="font-bold">${label}.</span> ${text}
                            </button>
                        `;

    renderResults() {
        const totalTime = ((this.endTime - this.startTime) / 1000).toFixed(0);
        const correctCount = this.selectedQuestions.length - this.incorrectCount;
        const percentage = ((correctCount / this.selectedQuestions.length) * 100).toFixed(1);
        const passed = this.mode === 'exam' ? this.incorrectCount <= 5 : true;

        return `
            <div class="bg-white dark:bg-gray-700 rounded-xl p-8 shadow-lg text-center mb-20">
                <h2 class="text-3xl font-extrabold mb-6 ${passed ? 'text-green-600' : 'text-red-600'}">
                    ${passed ? '✅ Complimenti!' : '❌ Non Superato'}
                </h2>

                <div class="grid grid-cols-2 gap-4 mb-6">
                    <div class="bg-gray-100 dark:bg-gray-600 p-4 rounded-lg">
                        <p class="text-3xl font-bold text-blue-600">${percentage}%</p>
                        <p class="text-sm dark:text-gray-300">Accuratezza</p>
                    </div>
                    <div class="bg-gray-100 dark:bg-gray-600 p-4 rounded-lg">
                        <p class="text-3xl font-bold text-purple-600">${totalTime}s</p>
                        <p class="text-sm dark:text-gray-300">Tempo Totale</p>
                    </div>
                </div>

                ${this.mode === 'timeChallenge' ? `
                    <div class="bg-purple-100 dark:bg-purple-900 p-4 rounded-lg mb-4">
                        <p class="text-2xl font-bold text-purple-800 dark:text-purple-200">
                            🏆 Punteggio: ${this.currentQuestionIndex}
                        </p>
                    </div>
                ` : ''}

                <div class="space-y-3">
                    ${this.mode !== 'training' ? `
                        <button onclick="window.quizApp.reviewAnswers()" class="w-full bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg hover:scale-105 transition">
                            📝 Rivedi Risposte
                        </button>
                    ` : ''}
                    <button onclick="window.quizApp.quizState = 'start'; window.quizApp.render();" class="w-full bg-[var(--theme-color)] text-white font-bold py-3 rounded-xl shadow-lg hover:scale-105 transition">
                        🏠 Torna al Menu
                    </button>
                </div>
            </div>
        `;
    }

    renderStats() {
        const avgAccuracy = this.stats.totalAttempts > 0 ? 
            ((this.stats.totalCorrect / this.stats.totalAttempts) * 100).toFixed(1) : 0;
        const avgTime = this.stats.totalAttempts > 0 ? 
            (this.stats.totalTime / this.stats.totalAttempts).toFixed(1) : 0;

        const questionStats = this.getQuestionStats();
        const topErrors = Object.entries(questionStats)
            .filter(([qnum, stats]) => stats.total > 0)
            .map(([qnum, stats]) => ({
                qnum: parseInt(qnum),
                errorRate: (stats.incorrect / stats.total * 100).toFixed(1),
                total: stats.total,
                incorrect: stats.incorrect
            }))
            .sort((a, b) => parseFloat(b.errorRate) - parseFloat(a.errorRate))
            .slice(0, 5);

        return `
            <div class="mb-20">
                <h1 class="text-3xl font-extrabold text-center mb-6 text-[var(--theme-color)]">📊 Statistiche</h1>

                <div class="bg-white dark:bg-gray-700 rounded-xl p-6 shadow-lg mb-6">
                    <h3 class="text-xl font-bold mb-4 dark:text-white">Riepilogo Generale</h3>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="text-center p-4 bg-gray-100 dark:bg-gray-600 rounded-lg">
                            <p class="text-3xl font-bold text-blue-600">${this.stats.totalAttempts}</p>
                            <p class="text-sm dark:text-gray-300">Domande Totali</p>
                        </div>
                        <div class="text-center p-4 bg-gray-100 dark:bg-gray-600 rounded-lg">
                            <p class="text-3xl font-bold text-green-600">${avgAccuracy}%</p>
                            <p class="text-sm dark:text-gray-300">Accuratezza Media</p>
                        </div>
                        <div class="text-center p-4 bg-gray-100 dark:bg-gray-600 rounded-lg">
                            <p class="text-3xl font-bold text-purple-600">${avgTime}s</p>
                            <p class="text-sm dark:text-gray-300">Tempo Medio</p>
                        </div>
                        <div class="text-center p-4 bg-gray-100 dark:bg-gray-600 rounded-lg">
                            <p class="text-3xl font-bold text-orange-600">${this.dailyGoal.completedToday}</p>
                            <p class="text-sm dark:text-gray-300">Oggi</p>
                        </div>
                    </div>
                </div>

                ${this.highScores60s.length > 0 ? `
                    <div class="bg-white dark:bg-gray-700 rounded-xl p-6 shadow-lg mb-6">
                        <h3 class="text-xl font-bold mb-4 dark:text-white">🏆 Top 5 Sfida 60s</h3>
                        <div class="space-y-2">
                            ${this.highScores60s.map((score, index) => `
                                <div class="flex justify-between items-center p-3 bg-gray-100 dark:bg-gray-600 rounded-lg">
                                    <span class="font-bold dark:text-white">#${index + 1}</span>
                                    <span class="text-lg font-bold text-purple-600">${score.score} punti</span>
                                    <span class="text-sm text-gray-500 dark:text-gray-400">${new Date(score.timestamp).toLocaleDateString('it-IT')}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                ${topErrors.length > 0 ? `
                    <div class="bg-white dark:bg-gray-700 rounded-xl p-6 shadow-lg mb-6">
                        <h3 class="text-xl font-bold mb-4 dark:text-white">⚠️ Top 5 Domande Difficili</h3>
                        <div class="space-y-2">
                            ${topErrors.map(err => `
                                <div class="p-3 bg-red-50 dark:bg-red-900 rounded-lg">
                                    <div class="flex justify-between items-center">
                                        <span class="font-bold text-red-800 dark:text-red-200">Domanda #${err.qnum}</span>
                                        <span class="text-sm text-red-600 dark:text-red-300">${err.errorRate}% errori</span>
                                    </div>
                                    <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">${err.incorrect}/${err.total} sbagliate</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <div class="bg-white dark:bg-gray-700 rounded-xl p-6 shadow-lg mb-6">
                    <h3 class="text-xl font-bold mb-4 dark:text-white">🏅 Badge Sbloccati</h3>
                    <div class="grid grid-cols-2 gap-4">
                        ${this.renderBadge('fireMaster', '🔥 Maestro del Fuoco', '10 esami superati')}
                        ${this.renderBadge('studentPro', '📚 Studente Pro', '1000 domande')}
                        ${this.renderBadge('king60s', '👑 Re del 60s', '20+ punti')}
                        ${this.renderBadge('dailyGoalReached', '🎯 Obiettivo', 'Meta giornaliera')}
                    </div>
                </div>

                <button onclick="window.quizApp.resetStats()" class="w-full bg-red-600 text-white font-bold py-3 rounded-xl shadow-lg hover:scale-105 transition">
                    🗑️ Azzera Statistiche
                </button>
            </div>

            ${this.renderBottomNav()}
        `;
    }

    renderBadge(badgeId, title, description) {
        const unlocked = this.badges[badgeId];
        return `
            <div class="p-4 rounded-lg text-center ${unlocked ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-600 opacity-50'}">
                <p class="text-2xl mb-2">${title.split(' ')[0]}</p>
                <p class="font-bold text-sm dark:text-white">${title}</p>
                <p class="text-xs text-gray-600 dark:text-gray-400">${description}</p>
                ${unlocked ? '<p class="text-green-600 font-bold mt-1">✓ Sbloccato</p>' : '<p class="text-gray-500 mt-1">🔒 Bloccato</p>'}
            </div>
        `;
    }

    renderSettings() {
        return `
            <div class="mb-20">
                <h1 class="text-3xl font-extrabold text-center mb-6 text-[var(--theme-color)]">⚙️ Impostazioni</h1>

                <div class="bg-white dark:bg-gray-700 rounded-xl p-6 shadow-lg mb-6">
                    <h3 class="text-xl font-bold mb-4 dark:text-white">🎨 Aspetto</h3>
                    
                    <div class="flex justify-between items-center mb-4 p-4 bg-gray-100 dark:bg-gray-600 rounded-lg">
                        <span class="font-bold dark:text-white">🌙 Modalità Scura</span>
                        <button onclick="window.quizApp.toggleDarkMode()" 
                            class="px-6 py-2 rounded-lg font-bold transition ${this.settings.darkMode ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-white'}">
                            ${this.settings.darkMode ? 'ON' : 'OFF'}
                        </button>
                    </div>

                    <div class="mb-4">
                        <p class="font-bold mb-3 dark:text-white">Tema Colore</p>
                        <div class="grid grid-cols-2 gap-3">
                            ${this.renderThemeButton('red', '🔴 Rosso', '#dc2626')}
                            ${this.renderThemeButton('forest', '🌲 Foresta', '#16a34a')}
                            ${this.renderThemeButton('water', '💧 Acqua', '#0284c7')}
                            ${this.renderThemeButton('gold', '👑 Oro', '#ca8a04')}
                        </div>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-700 rounded-xl p-6 shadow-lg mb-6">
                    <h3 class="text-xl font-bold mb-4 dark:text-white">🎯 Obiettivi</h3>
                    <div class="p-4 bg-gray-100 dark:bg-gray-600 rounded-lg">
                        <label class="block font-bold mb-2 dark:text-white">Obiettivo Giornaliero</label>
                        <input 
                            type="number" 
                            value="${this.dailyGoal.target}" 
                            onchange="window.quizApp.dailyGoal.target = parseInt(this.value); window.quizApp.savePersistentData(); window.quizApp.render();"
                            class="w-full p-2 rounded border border-gray-300 dark:bg-gray-700 dark:text-white dark:border-gray-500"
                            min="1" max="350">
                        <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            Progresso oggi: ${this.dailyGoal.completedToday}/${this.dailyGoal.target}
                        </p>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-700 rounded-xl p-6 shadow-lg">
                    <h3 class="text-xl font-bold mb-4 dark:text-white">ℹ️ Informazioni</h3>
                    <div class="space-y-2 text-sm dark:text-gray-300">
                        <p><strong>Versione:</strong> 1.3.3 Fixed</p>
                        <p><strong>Domande:</strong> ${this.stats.totalQuestions}</p>
                        <p><strong>Tipo:</strong> Quiz Antincendio Livello 3</p>
                        <p><strong>PWA:</strong> Supporto Offline Completo</p>
                    </div>
                </div>
            </div>

            ${this.renderBottomNav()}
        `;
    }

    renderThemeButton(themeId, label, color) {
        const isUnlocked = this.settings.unlockedThemes.includes(themeId);
        const isCurrent = this.settings.theme === themeId;

        return `
            <button 
                onclick="${isUnlocked ? `window.quizApp.changeTheme('${themeId}')` : ''}"
                class="p-4 rounded-lg font-bold text-center transition ${isCurrent ? 'ring-4 ring-blue-500' : ''} ${isUnlocked ? 'hover:scale-105' : 'opacity-50 cursor-not-allowed'}"
                style="background-color: ${color}; color: white;"
                ${!isUnlocked ? 'disabled' : ''}>
                ${label}
                ${!isUnlocked ? '<br><span class="text-xs">🔒 Bloccato</span>' : ''}
                ${isCurrent ? '<br><span class="text-xs">✓ Attivo</span>' : ''}
            </button>
        `;
    }

    renderBottomNav() {
        const isStart = this.quizState === 'start';
        const isStats = this.quizState === 'stats';
        const isSettings = this.quizState === 'settings';

        return `
            <div class="fixed bottom-0 left-0 right-0 max-w-xl mx-auto bg-white dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 shadow-2xl z-40">
                <div class="flex justify-around items-center h-16">
                    <button onclick="window.quizApp.quizState = 'start'; window.quizApp.render();" 
                        class="flex flex-col items-center justify-center transition ${isStart ? 'text-[var(--theme-color)]' : 'text-gray-500 dark:text-gray-300 hover:text-[var(--theme-color)]'}">
                        <span class="text-2xl">🏠</span>
                        <span class="text-xs font-medium">Home</span>
                    </button>
                    <button onclick="window.quizApp.quizState = 'stats'; window.quizApp.render();" 
                        class="flex flex-col items-center justify-center transition ${isStats ? 'text-[var(--theme-color)]' : 'text-gray-500 dark:text-gray-300 hover:text-[var(--theme-color)]'}">
                        <span class="text-2xl">📊</span>
                        <span class="text-xs font-medium">Stats</span>
                    </button>
                    <button onclick="window.quizApp.quizState = 'settings'; window.quizApp.render();" 
                        class="flex flex-col items-center justify-center transition ${isSettings ? 'text-[var(--theme-color)]' : 'text-gray-500 dark:text-gray-300 hover:text-[var(--theme-color)]'}">
                        <span class="text-2xl">⚙️</span>
                        <span class="text-xs font-medium">Impostazioni</span>
                    </button>
                </div>
            </div>
        `;
    }

    // ============================================
    // A2HS (Add to Home Screen)
    // ============================================
    handleA2HS() {
        const installAppContainer = document.getElementById('install-app-container');
        if (deferredPrompt && installAppContainer) {
            if (window.matchMedia('(display-mode: standalone)').matches || navigator.standalone) {
                installAppContainer.style.display = 'none';
                return;
            }

            installAppContainer.style.display = 'block';
            const installBtn = document.getElementById('install-btn');
            if (installBtn) {
                installBtn.onclick = () => {
                    deferredPrompt.prompt();
                    deferredPrompt.userChoice.then((choiceResult) => {
                        if (choiceResult.outcome === 'accepted') {
                            console.log('✅ App installata');
                        }
                        deferredPrompt = null;
                        installAppContainer.style.display = 'none';
                    });
                };
            }
        }
    }
}

// ============================================
// INIZIALIZZAZIONE
// ============================================
    window.quizApp = new QuizApp();
