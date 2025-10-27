// Quiz Antincendio - Progressive Web App v1.3.6 Stable
// Update: Risposte modificabili prima di "Prossima Domanda" (eccetto Training e TimeChallenge)

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
        this.dailyGoal = { target: 50, completedToday: 0, lastGoalDate: new Date().toLocaleDateString('it-IT') };
        this.settings = { darkMode: false, theme: 'red', unlockedThemes: ['red'] };

        this.loadPersistentData();
        this.checkDailyGoal();
        this.applySettings();
        this.loadData();
    }

    async loadData() {
        try {
            const response = await fetch('quiz_antincendio_ocr_improved.json', { cache: 'no-store' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            this.quizData = data.map((q, i) => ({ ...q, qnum: i + 1 }));
            this.stats.totalQuestions = this.quizData.length;
            this.quizData.sort(() => Math.random() - 0.5);
            this.quizState = 'start';
        } catch (err) {
            console.error("Errore caricamento dati:", err);
            this.quizState = 'error';
        } finally {
            const loading = document.getElementById('loading');
            if (loading) loading.style.display = 'none';
            this.renderQuiz();
            
        }
    }

    // ========================================
    // Persistenza dati
    // ========================================
    loadPersistentData() {
        try {
            const get = (k, def = null) => JSON.parse(localStorage.getItem(k)) || def;
            this.history = get('quizHistory', []);
            this.stats = { ...this.stats, ...get('quizStats', {}) };
            this.highScores60s = get('highScores60s', []);
            this.badges = get('quizBadges', {});
            this.dailyGoal = { ...this.dailyGoal, ...get('dailyGoal', {}) };
            this.settings = { ...this.settings, ...get('quizSettings', {}) };
            if (!this.settings.unlockedThemes.includes('red')) this.settings.unlockedThemes.push('red');
        } catch (e) {
            console.error("Errore caricamento localStorage:", e);
        }
    }

    savePersistentData() {
        try {
            const set = (k, v) => localStorage.setItem(k, JSON.stringify(v));
            set('quizHistory', this.history);
            set('quizStats', this.stats);
            set('highScores60s', this.highScores60s);
            set('quizBadges', this.badges);
            set('dailyGoal', this.dailyGoal);
            set('quizSettings', this.settings);
        } catch (e) {
            console.error("Errore salvataggio localStorage:", e);
        }
    }
    checkDailyGoal() {
        const today = new Date().toLocaleDateString('it-IT');
        if (this.dailyGoal.lastGoalDate !== today) {
            this.dailyGoal.lastGoalDate = today;
            this.dailyGoal.completedToday = 0;
            this.savePersistentData();
        }
    }

    // ========================================
    // Impostazioni visive
    // ========================================
    applySettings() {
        const root = document.documentElement;
        root.classList.toggle('dark', this.settings.darkMode);
        const color = this.getThemeColor(this.settings.theme);
        root.style.setProperty('--theme-color', color);
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', color);
    }

    getThemeColor(t) {
        return {
            forest: '#16a34a',
            water: '#0284c7',
            gold: '#ca8a04',
            red: '#dc2626'
        }[t] || '#dc2626';
    }

    // ========================================
    // Modalità di gioco
    // ========================================
    selectMode(mode) {
        if (!this.quizData.length) return alert("Dati non ancora caricati.");
        clearInterval(this.timerInterval);
        this.mode = mode;
        this.incorrectCount = 0;
        this.answeredQuestions = [];
        this.startTime = Date.now();
        this.questionStartTime = Date.now();
        this.selectedAnswer = null;
        this.showFeedback = (mode === 'training');

        switch (mode) {
            case 'training':
                this.selectedQuestions = [...this.quizData].sort(() => Math.random() - 0.5);
                break;
            case 'exam':
                this.selectedQuestions = this.getExamQuestions();
                this.timeRemaining = 30 * 60;
                this.startTimer(1000, () => this.checkExamTime());
                break;
            case 'errorsOnly':
                this.selectedQuestions = this.getReviewQuestions(0.7);
                if (!this.selectedQuestions.length) return alert("Nessun errore da rivedere!");
                break;
            case 'smartReview':
                this.selectedQuestions = this.getSmartReviewQuestions();
                if (!this.selectedQuestions.length) return alert("Nessuna domanda da ripassare!");
                break;
            case 'timeChallenge':
                this.selectedQuestions = [...this.quizData].sort(() => Math.random() - 0.5);
                this.timeRemaining = 60;
                this.startTimer(1000, () => this.checkTimeChallengeTime());
                break;
        }
        this.currentQuestionIndex = 0;
        this.quizState = 'quiz';
        this.renderQuiz();
    }

    startTimer(interval, cb) {
        clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            this.timeRemaining--;
            cb();
            this.renderQuiz();
        }, interval);
    }

    checkExamTime() { if (this.timeRemaining <= 0) this.endQuiz(); }
    checkTimeChallengeTime() { if (this.timeRemaining <= 0) this.endQuiz(); }

    // ========================================
    // Gestione risposte
    // ========================================
    checkAnswer(qnum, selectedLabel) {
        if (this.mode === 'results') return;
        const currentQ = this.selectedQuestions[this.currentQuestionIndex];
        this.selectedAnswer = selectedLabel;

        // Risposta immediata solo in training e timeChallenge
        if (['training', 'timeChallenge'].includes(this.mode)) {
            const isCorrect = (currentQ.correct_label === selectedLabel);
            if (!isCorrect) this.incorrectCount++;

            const timeSpent = (Date.now() - this.questionStartTime) / 1000;
            this.history.push({
                qnum: currentQ.qnum,
                isCorrect,
                timestamp: Date.now(),
                mode: this.mode,
                timeSpent
            });

            this.stats.totalAttempts++;
            if (isCorrect) this.stats.totalCorrect++;
            this.stats.totalTime += timeSpent;
            this.dailyGoal.completedToday += 1;
            this.savePersistentData();
            this.checkBadges();

            if (this.mode === 'timeChallenge') {
                if (isCorrect) this.nextQuestion();
                else this.endQuiz();
                return;
            }
        }

        this.renderQuiz(); // mostra selezione corrente (modificabile nelle altre modalità)
    }

    nextQuestion() {
        if (this.quizState !== 'quiz') return;

        // Salva risposta solo al momento di avanzare (per modalità non immediate)
        if (this.selectedAnswer && !['training', 'timeChallenge'].includes(this.mode)) {
            const currentQ = this.selectedQuestions[this.currentQuestionIndex];
            const isCorrect = (currentQ.correct_label === this.selectedAnswer);
            if (!isCorrect) this.incorrectCount++;

            const timeSpent = (Date.now() - this.questionStartTime) / 1000;

            this.history.push({
                qnum: currentQ.qnum,
                isCorrect,
                timestamp: Date.now(),
                mode: this.mode,
                timeSpent
            });

            this.stats.totalAttempts++;
            if (isCorrect) this.stats.totalCorrect++;
            this.stats.totalTime += timeSpent;
            this.dailyGoal.completedToday += 1;
            this.savePersistentData();
            this.checkBadges();
        }

        this.currentQuestionIndex++;
        this.selectedAnswer = null;
        this.questionStartTime = Date.now();

        if (this.currentQuestionIndex >= this.selectedQuestions.length)
            return this.endQuiz();

        this.renderQuiz();
    }

    // ========================================
    // Rendering dinamico
    // ========================================
    renderQuiz() {
        const currentQ = this.selectedQuestions[this.currentQuestionIndex];
        if (!currentQ) return `<p>Caricamento domanda...</p>`;

        let userSelectedLabel = this.selectedAnswer;
        if (this.mode === 'review' && this.answeredQuestions[this.currentQuestionIndex])
            userSelectedLabel = this.answeredQuestions[this.currentQuestionIndex].selectedLabel;

        const progress = ((this.currentQuestionIndex + 1) / this.selectedQuestions.length) * 100;
        const timerHTML = (['exam', 'timeChallenge'].includes(this.mode))
            ? `<div class="bg-red-100 dark:bg-red-900 text-center mb-4 p-2 rounded">
                 ⏱️ Tempo: ${this.formatTime(this.timeRemaining)}
               </div>` : '';

        return `
        ${timerHTML}
        <div class="bg-white dark:bg-gray-700 rounded-xl p-6 shadow-lg mb-6">
          <h2 class="text-xl font-bold mb-4 dark:text-white">${currentQ.instruction}</h2>
          <div class="space-y-3">
            ${Object.entries(currentQ.options).map(([label, text]) => {
                const isSelected = userSelectedLabel === label;
                const isCorrect = currentQ.correct_label === label;
                let style = 'bg-gray-100 dark:bg-gray-600';
                if (userSelectedLabel && this.showFeedback) {
                    if (isCorrect) style = 'bg-green-500 text-white';
                    else if (isSelected) style = 'bg-red-500 text-white';
                } else if (isSelected) style = 'bg-blue-500 text-white';
                const disabled = (this.mode === 'review' || 
                                  (['training', 'timeChallenge'].includes(this.mode) && this.selectedAnswer));
                return `
                <button onclick="window.quizApp.checkAnswer(${currentQ.qnum}, '${label}')"
                  class="w-full text-left p-4 rounded-lg font-medium ${style} ${disabled ? 'cursor-not-allowed' : ''}"
                  ${disabled ? 'disabled' : ''}>
                  <b>${label}.</b> ${text}
                </button>`;
            }).join('')}
          </div>

          ${(['exam','smartReview','errorsOnly'].includes(this.mode)) ? `
            <p class="text-xs text-gray-500 italic mt-3">Puoi cambiare la risposta finché non premi "Prossima domanda".</p>
          ` : ''}
        </div>
        <button onclick="window.quizApp.nextQuestion()" 
          class="w-full bg-[var(--theme-color)] text-white py-3 rounded-xl font-bold mt-4
          ${(!this.selectedAnswer && !['training','review'].includes(this.mode)) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}"
          ${(!this.selectedAnswer && !['training','review'].includes(this.mode)) ? 'disabled' : ''}>
          ${this.currentQuestionIndex === this.selectedQuestions.length - 1 ? 'Termina Revisione' : 'Prossima Domanda →'}
        </button>`;
    }

    // ========================================
    // Altri metodi rimangono invariati (timer, badges, renderResults, ecc.)
}

document.addEventListener('DOMContentLoaded', () => {
    window.quizApp = new QuizApp();
});

