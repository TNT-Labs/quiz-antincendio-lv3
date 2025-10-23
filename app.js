// Quiz Antincendio - Progressive Web App
// Versione con modalità Allenamento, Esame, Solo Errori, Sfida 60s e Reset Statistiche
// Correzione Finale: Aggiunto setTimeout per risolvere race condition del timer

class QuizApp {
    constructor() {
        this.quizData = [];
        this.selectedQuestions = [];
        this.currentQuestionIndex = 0;
        this.selectedAnswer = null;
        this.incorrectCount = 0;
        this.answeredQuestions = []; // Risposte della sessione corrente
        this.showFeedback = false;
        this.quizState = 'start'; // start, quiz, results, stats
        this.mode = null; // 'training', 'exam', 'errorsOnly', 'timeChallenge'

        // Timer e tempi
        this.startTime = null; // Tempo inizio quiz
        this.endTime = null; // Tempo fine quiz
        this.timerInterval = null;
        this.timeRemaining = 0;
        this.questionStartTime = null; // Tempo inizio domanda

        // Nuove proprietà per persistenza e statistiche
        this.history = []; // [{qnum, isCorrect, timestamp, mode, timeSpent}]
        this.stats = { totalAttempts: 0, totalCorrect: 0, totalTime: 0 };

        // Configurazioni modalità
        this.modes = {
            training: {
                name: 'Allenamento',
                questions: 'infinite',
                maxErrors: 'nessuno',
                timeLimit: null,
                description: 'Impara dai test senza limiti di tempo ed errori. Feedback immediato.'
            },
            exam: {
                name: 'Simulazione Esame',
                questions: 15,
                maxErrors: 5,
                timeLimit: 30 * 60, // 30 minuti in secondi
                description: '15 domande, 30 minuti, massimo 5 errori. Feedback solo alla conferma.'
            },
            errorsOnly: {
                name: 'Solo Errori',
                questions: 'variabile',
                maxErrors: 'nessuno',
                timeLimit: null,
                description: 'Rivedi solo le domande a cui hai risposto in modo errato in passato. Feedback immediato.'
            },
            timeChallenge: {
                name: 'Sfida 60s',
                questions: 'infinite',
                maxErrors: 'nessuno',
                timeLimit: 60, // 60 secondi
                description: 'Rispondi a quante più domande puoi in un minuto. Tasso di successo e velocità contano.'
            }
        };

        this.init();
    }

    // --- Persistenza e Statistiche ---

    loadHistory() {
        try {
            const historyJson = localStorage.getItem('quizHistory');
            if (historyJson) {
                this.history = JSON.parse(historyJson);
                this.calculateStats();
            }
        } catch (e) {
            console.error("Errore nel caricamento della cronologia:", e);
            this.history = [];
        }
    }

    saveHistory() {
        localStorage.setItem('quizHistory', JSON.stringify(this.history));
        this.calculateStats();
    }

    calculateStats() {
        this.stats.totalAttempts = this.history.length;
        this.stats.totalCorrect = this.history.filter(h => h.isCorrect).length;
        this.stats.totalTime = this.history.reduce((sum, h) => sum + (h.timeSpent || 0), 0);
    }
    
    // Funzione per il reset delle statistiche
    resetStats() {
        if (confirm("Sei sicuro di voler azzerare TUTTE le tue statistiche e la cronologia? Questa azione è irreversibile.")) {
            localStorage.removeItem('quizHistory');
            this.history = [];
            this.calculateStats(); 
            this.render(); 
            alert("Statistiche azzerate con successo!");
        }
    }

    // --- Inizializzazione ---

    async init() {
        await this.loadQuizData();
        this.loadHistory(); // Carica la cronologia all'avvio
        this.render();
    }

    async loadQuizData() {
        try {
            const response = await fetch('quiz_antincendio_ocr_improved.json');
            this.quizData = await response.json();
            console.log(`Caricate ${this.quizData.length} domande`);
        } catch (error) {
            console.error('Errore nel caricamento dei dati:', error);
            this.quizData = [];
        }
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    selectMode(mode) {
        this.mode = mode;
        this.quizState = 'quiz';
        this.startQuiz();
    }
    
    goToStats() {
        this.quizState = 'stats';
        this.render();
    }

    // --- Avvio Quiz ---

    startQuiz() {
        const config = this.modes[this.mode];
        let questionsSource = [...this.quizData];

        if (this.mode === 'errorsOnly') {
            const incorrectQnums = [...new Set(this.history.filter(h => !h.isCorrect).map(h => h.qnum))];
            if (incorrectQnums.length === 0) {
                // Nessun errore storico, usa un set casuale
                questionsSource = this.shuffleArray(questionsSource).slice(0, 30);
            } else {
                questionsSource = questionsSource.filter(q => incorrectQnums.includes(q.qnum));
            }
        }
        
        const shuffled = this.shuffleArray(questionsSource);

        if (this.mode === 'exam') {
            this.selectedQuestions = shuffled.slice(0, config.questions);
        } else {
            // Per tutte le altre modalità, usiamo il set completo o filtrato, shuffleato
            this.selectedQuestions = shuffled;
        }

        this.currentQuestionIndex = 0;
        this.incorrectCount = 0;
        this.answeredQuestions = [];
        this.selectedAnswer = null;
        this.showFeedback = false;
        
        // Avvia timer e tracciamento
        this.startTime = Date.now();
        this.questionStartTime = Date.now();
        
        // PASSO 1: Renderizza la schermata prima di avviare il timer
        this.render(); 
        
        if (config.timeLimit) {
            this.timeRemaining = config.timeLimit;
            // PASSO 2: Avvia il timer dopo un breve ritardo per prevenire la race condition (Errore 159)
            setTimeout(() => {
                this.startTimer();
            }, 50); // 50ms di attesa per il disegno del DOM
        }
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timeRemaining--;
            
            // L'elemento è ora garantito esistere
            const timerElement = document.getElementById('timer-display');
            if (timerElement) {
                timerElement.textContent = this.formatTime(this.timeRemaining);
                if (this.timeRemaining <= 300 && this.mode === 'exam') { // Allarme 5 minuti solo per esame
                    timerElement.classList.add('text-yellow-400', 'font-bold');
                } else if (this.timeRemaining <= 10 && this.mode === 'timeChallenge') { // Allarme 10 secondi per sfida
                     timerElement.classList.add('text-red-600', 'font-bold');
                }
            }
            
            // Tempo scaduto
            if (this.timeRemaining <= 0) {
                this.stopTimer();
                this.endQuiz();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.endTime = Date.now();
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    getElapsedTime() {
        if (!this.startTime) return 0;
        const end = this.endTime || Date.now();
        return Math.floor((end - this.startTime) / 1000);
    }

    // --- Risposta e Feedback ---

    selectAnswer(option) {
        if (this.showFeedback) return;
        this.selectedAnswer = option;
        this.render();

        // In modalità Training, Solo Errori, o Sfida 60s, la selezione è anche la conferma
        if (this.mode !== 'exam') {
            this.confirmAnswer();
        }
    }

    confirmAnswer() {
        if (!this.selectedAnswer) return;

        const currentQuestion = this.selectedQuestions[this.currentQuestionIndex];
        const isCorrect = this.selectedAnswer === currentQuestion.correct_label;
        const timeSpent = Date.now() - this.questionStartTime;

        if (!isCorrect) {
            this.incorrectCount++;
        }

        const answerRecord = {
            qnum: currentQuestion.qnum,
            userAnswer: this.selectedAnswer,
            isCorrect: isCorrect,
            mode: this.mode,
            timestamp: Date.now(),
            timeSpent: timeSpent
        };

        this.answeredQuestions.push(answerRecord);
        this.history.push(answerRecord);

        this.showFeedback = true;
        this.render();

        // Controllo per fine quiz anticipata (Esame: troppi errori)
        if (this.mode === 'exam' && this.incorrectCount > this.modes.exam.maxErrors) {
            setTimeout(() => this.endQuiz(), 2000);
        }
        
        // Modalità con feedback immediato: avanza dopo un breve ritardo
        if (this.mode !== 'exam') {
            setTimeout(() => this.nextQuestion(), 1500); 
        }
    }

    nextQuestion() {
        this.questionStartTime = Date.now();
        this.selectedAnswer = null;
        this.showFeedback = false;
        
        if (this.currentQuestionIndex < this.selectedQuestions.length - 1) {
            this.currentQuestionIndex++;
            this.render();
        } else if (this.mode === 'timeChallenge' && this.timeRemaining > 0) {
             // In Sfida 60s, se finiscono le domande, ricomincia da capo (loop infinito)
             this.currentQuestionIndex = 0;
             this.selectedQuestions = this.shuffleArray(this.quizData); // Ricarica set casuale
             this.render();
        } else {
            this.endQuiz();
        }
    }
    
    skipQuestion() {
        // Solo in modalità Esame ha senso saltare
        if (this.mode !== 'exam') return;
        
        // Registra come risposta "non data" o errata per coerenza nel tracciamento
        const currentQuestion = this.selectedQuestions[this.currentQuestionIndex];
        const answerRecord = {
            qnum: currentQuestion.qnum,
            userAnswer: 'SALTATA',
            isCorrect: false, // Considerata errata se saltata in esame
            mode: this.mode,
            timestamp: Date.now(),
            timeSpent: Date.now() - this.questionStartTime
        };
        this.answeredQuestions.push(answerRecord);
        this.history.push(answerRecord);
        this.incorrectCount++; // Anche le domande saltate contano come errore nel limite

        if (this.currentQuestionIndex < this.selectedQuestions.length - 1) {
            this.currentQuestionIndex++;
            this.selectedAnswer = null;
            this.showFeedback = false;
            this.questionStartTime = Date.now();
            this.render();
        } else {
            this.endQuiz();
        }
    }


    endQuiz() {
        this.stopTimer();
        this.saveHistory(); // Salva la cronologia e aggiorna le stats
        this.quizState = 'results';
        this.render();
    }

    resetQuiz() {
        this.stopTimer();
        this.mode = null;
        this.quizState = 'start';
        this.selectedAnswer = null;
        this.showFeedback = false;
        this.startTime = null;
        this.endTime = null;
        this.render();
    }

    // --- Rendering ---
    
    renderStartScreen() {
        return `
            <div class="p-6">
                <h1 class="text-3xl font-bold text-red-600 mb-6 text-center">Quiz Antincendio Livello 3 🔥</h1>
                <p class="text-gray-600 text-center mb-10">Scegli una modalità per iniziare la tua preparazione:</p>

                ${Object.keys(this.modes).map(modeKey => {
                    const mode = this.modes[modeKey];
                    const isNew = modeKey === 'errorsOnly' || modeKey === 'timeChallenge';
                    return `
                        <div class="mb-4 bg-white p-4 rounded-lg shadow-lg border-l-4 border-${isNew ? 'blue' : 'red'}-600 cursor-pointer hover:bg-red-50 transition duration-150" data-select-mode="${modeKey}">
                            <h2 class="text-xl font-semibold text-gray-800">${mode.name} ${isNew ? '<span class="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full ml-2">NUOVA</span>' : ''}</h2>
                            <p class="text-sm text-gray-500">${mode.description}</p>
                            ${modeKey === 'exam' ? `<p class="text-xs text-red-500 mt-1">Regole: ${mode.questions} Domande, ${mode.timeLimit / 60} min, Max ${mode.maxErrors} errori.</p>` : ''}
                        </div>
                    `;
                }).join('')}
                
                <div class="mt-8 text-center">
                    <button id="stats-btn" class="text-red-600 hover:text-red-800 font-medium py-2 px-4 rounded-full border border-red-600 hover:bg-red-50 transition duration-150">
                        📊 Visualizza Statistiche Globali (${this.stats.totalAttempts} risposte registrate)
                    </button>
                </div>
            </div>
        `;
    }

    renderQuizScreen() {
        const currentQuestion = this.selectedQuestions[this.currentQuestionIndex];
        if (!currentQuestion) {
             // Questo accade se errorsOnly non ha domande, o un errore generale
             if (this.mode === 'errorsOnly' && this.history.length > 0) {
                 return this.renderErrorScreen("Ottimo! Non hai errori recenti. Torna al menu principale.");
             }
             return this.renderErrorScreen("Errore: Domanda non trovata o quiz vuoto.");
        }

        const isTrainingMode = this.mode !== 'exam';
        const config = this.modes[this.mode];
        
        let headerContent = '';
        let questionNumberDisplay = '';
        
        if (this.mode === 'exam' || this.mode === 'timeChallenge') {
             const isExam = this.mode === 'exam';
             headerContent = `
                <div class="flex justify-between items-center p-4 bg-red-600 text-white shadow-md">
                    <span class="font-semibold text-lg">${config.name}</span>
                    <span id="timer-display" class="text-2xl">${this.formatTime(this.timeRemaining)}</span>
                    ${isExam 
                        ? `<span class="text-sm">Errori: ${this.incorrectCount} / ${config.maxErrors}</span>`
                        : `<span class="text-sm">Corrette: ${this.answeredQuestions.filter(q => q.isCorrect).length}</span>`
                    }
                </div>
            `;
            questionNumberDisplay = `Domanda: ${this.currentQuestionIndex + 1} di ${this.selectedQuestions.length}`;
        } else {
             // Training e Solo Errori
             headerContent = `
                <div class="flex justify-between items-center p-4 bg-red-600 text-white shadow-md">
                    <span class="font-semibold text-lg">${config.name}</span>
                    <button id="end-training-btn" class="bg-white text-red-600 text-xs font-bold py-1 px-3 rounded-full hover:bg-gray-100 transition">Termina</button>
                </div>
            `;
            questionNumberDisplay = `Sequenza: ${this.answeredQuestions.length + 1}`;
        }
        

        // Logica per i pulsanti di azione
        let actionButtons = '';
        if (this.showFeedback && !this.modes[this.mode].timeLimit) {
            // Dopo aver risposto in modalità Esame (senza tempo)
            actionButtons = `
                <button id="next-btn" class="bg-green-600 text-white font-bold py-3 px-6 rounded-lg w-full mt-4 shadow-xl hover:bg-green-700 transition">
                    Prossima Domanda
                </button>
            `;
        } else if (this.mode === 'exam' && !this.showFeedback) {
            // Modalità Esame, prima di confermare
            actionButtons = `
                <button id="confirm-btn" ${!this.selectedAnswer ? 'disabled' : ''} class="bg-red-600 text-white font-bold py-3 px-6 rounded-lg w-full mt-4 shadow-xl ${!this.selectedAnswer ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-700 transition'}">
                    Conferma Risposta
                </button>
                <button id="skip-btn" class="text-red-600 hover:text-red-800 font-medium py-2 px-4 rounded-full mt-2 w-full">
                    Salta Domanda
                </button>
            `;
        } else if (isTrainingMode && !this.modes[this.mode].timeLimit && !this.showFeedback) {
             actionButtons = `<p class="text-center text-gray-500 mt-4">Tocca un'opzione per ricevere feedback immediato.</p>`;
        }
        
        // Logica per l'elenco delle opzioni (con feedback)
        const optionsHtml = Object.keys(currentQuestion.options).map(key => {
            const optionText = currentQuestion.options[key];
            let classes = '';
            let feedbackIcon = '';
            
            if (this.showFeedback) {
                // Dopo la conferma
                if (key === currentQuestion.correct_label) {
                    classes = 'bg-green-100 border-green-600 text-green-800 font-semibold shadow-md';
                    feedbackIcon = '✅';
                } else if (key === this.selectedAnswer) {
                    classes = 'bg-red-100 border-red-600 text-red-800 font-semibold shadow-md line-through';
                    feedbackIcon = '❌';
                } else {
                    classes = 'bg-gray-100 border-gray-300 text-gray-500 opacity-60';
                }
            } else if (key === this.selectedAnswer) {
                // Prima della conferma (solo evidenziazione in esame)
                classes = 'bg-red-50 border-red-600 font-semibold';
            } else {
                classes = 'bg-white border-gray-200 hover:bg-gray-50';
            }
            
            return `<div ${this.showFeedback ? '' : `data-option="${key}"`} class="p-4 mb-3 border rounded-lg cursor-pointer transition duration-150 text-left ${classes} flex items-center" ${this.showFeedback ? '' : `onclick="app.selectAnswer('${key}')"`}>
                        <span class="font-bold mr-3">${key}.</span>
                        <span>${optionText}</span>
                        <span class="ml-auto text-2xl">${feedbackIcon}</span>
                    </div>`;
        }).join('');

        // Logica per la Spiegazione (usando correct_text come suggerito)
        const explanationHtml = this.showFeedback ? `
            <div class="mt-6 p-4 bg-blue-100 border-l-4 border-blue-500 text-blue-800 rounded-lg shadow-inner">
                <p class="font-bold mb-2">Spiegazione:</p>
                <p>${currentQuestion.correct_text || 'Spiegazione non disponibile.'}</p>
            </div>
        ` : '';

        return `
            ${headerContent}
            <div class="p-6">
                <p class="text-sm text-gray-500 mb-4">${questionNumberDisplay}</p>
                <h2 class="text-xl font-bold mb-6 text-gray-900">${currentQuestion.instruction}</h2>
                
                <div id="options-container">
                    ${optionsHtml}
                </div>
                
                ${explanationHtml}
                
                <div class="mt-8">
                    ${actionButtons}
                </div>
            </div>
        `;
    }

    renderResultsScreen() {
        const totalAnswered = this.answeredQuestions.length;
        const correctAnswers = this.answeredQuestions.filter(q => q.isCorrect).length;
        const incorrectAnswers = totalAnswered - correctAnswers;
        const scorePercentage = totalAnswered > 0 ? ((correctAnswers / totalAnswered) * 100).toFixed(1) : 0;
        const elapsedTime = this.getElapsedTime();
        
        let resultMessage = '';
        let resultIcon = '';
        let resultColor = 'text-green-600';

        if (this.mode === 'exam') {
            const passed = incorrectAnswers <= this.modes.exam.maxErrors;
            resultMessage = passed ? 'Esame Superato! Complimenti!' : 'Esame Fallito. Troppi errori o tempo scaduto.';
            resultIcon = passed ? '🎉' : '😔';
            resultColor = passed ? 'text-green-600' : 'text-red-600';
        } else if (this.mode === 'timeChallenge') {
            resultMessage = `Sfida Terminata! Hai risposto correttamente a ${correctAnswers} domande.`;
            resultIcon = '⏱️';
            resultColor = 'text-blue-600';
        } else {
            resultMessage = `Sessione di Allenamento Terminata.`;
            resultIcon = '📖';
            resultColor = 'text-blue-600';
        }

        return `
            <div class="p-6 text-center">
                <h1 class="text-4xl font-bold ${resultColor} mb-2">${resultIcon} ${resultMessage}</h1>
                <p class="text-gray-600 text-lg mb-8">Tempo totale: ${this.formatTime(elapsedTime)}</p>

                <div class="bg-gray-100 p-6 rounded-lg shadow-inner mb-8">
                    <p class="text-xl font-semibold mb-4">Riepilogo Performance</p>
                    <div class="grid grid-cols-2 gap-4 text-left">
                        <div class="bg-white p-3 rounded-md shadow-sm border-l-4 border-green-500">
                            <p class="text-3xl font-bold text-green-600">${correctAnswers}</p>
                            <p class="text-sm text-gray-500">Risposte Corrette</p>
                        </div>
                        <div class="bg-white p-3 rounded-md shadow-sm border-l-4 border-red-500">
                            <p class="text-3xl font-bold text-red-600">${incorrectAnswers}</p>
                            <p class="text-sm text-gray-500">Risposte Errate</p>
                        </div>
                        <div class="bg-white p-3 rounded-md shadow-sm border-l-4 border-blue-500 col-span-2">
                            <p class="text-3xl font-bold text-blue-600">${scorePercentage}%</p>
                            <p class="text-sm text-gray-500">Percentuale di Successo</p>
                        </div>
                    </div>
                </div>

                <button id="retry-btn" class="bg-red-600 text-white font-bold py-3 px-6 rounded-lg w-full shadow-xl hover:bg-red-700 transition mb-3">
                    Riprova ${this.modes[this.mode].name}
                </button>
                <button id="change-mode-btn" class="text-gray-600 hover:text-red-600 font-medium py-2 px-4 rounded-full w-full border border-gray-300 hover:border-red-600 transition">
                    Torna al Menu Principale
                </button>
            </div>
        `;
    }

    renderStatsScreen() {
        this.calculateStats(); // Assicurati che le statistiche siano aggiornate
        const { totalAttempts, totalCorrect, totalTime } = this.stats;
        const totalIncorrect = totalAttempts - totalCorrect;
        const avgTimePerQuestion = totalAttempts > 0 ? (totalTime / totalAttempts / 1000).toFixed(1) : 0;
        const successRate = totalAttempts > 0 ? ((totalCorrect / totalAttempts) * 100).toFixed(1) : 0;
        
        const errorMap = this.history.filter(h => !h.isCorrect).reduce((map, h) => {
            map[h.qnum] = (map[h.qnum] || 0) + 1;
            return map;
        }, {});
        
        const mostDifficult = Object.entries(errorMap)
            .sort(([, countA], [, countB]) => countB - countA)
            .slice(0, 5)
            .map(([qnum, count]) => {
                const question = this.quizData.find(q => q.qnum === parseInt(qnum));
                return `<li class="text-sm text-gray-700 p-2 border-b last:border-b-0">
                            <span class="font-semibold text-red-600">${count} errori:</span> 
                            ${question ? question.instruction.substring(0, 80) + '...' : 'Domanda Sconosciuta'}
                        </li>`;
            }).join('');


        return `
            <div class="p-6">
                <h1 class="text-3xl font-bold text-red-600 mb-6 text-center">📊 Statistiche Globali</h1>
                
                <div class="bg-gray-100 p-6 rounded-lg shadow-inner mb-8">
                    <p class="text-xl font-semibold mb-4 text-gray-800">Riepilogo Totale</p>
                    <div class="grid grid-cols-2 gap-4 text-center">
                        <div class="bg-white p-4 rounded-md shadow-sm border-b-4 border-blue-500">
                            <p class="text-3xl font-bold text-blue-600">${totalAttempts}</p>
                            <p class="text-sm text-gray-500">Domande Tentate</p>
                        </div>
                        <div class="bg-white p-4 rounded-md shadow-sm border-b-4 border-green-500">
                            <p class="text-3xl font-bold text-green-600">${successRate}%</p>
                            <p class="text-sm text-gray-500">Tasso di Successo</p>
                        </div>
                        <div class="bg-white p-4 rounded-md shadow-sm border-b-4 border-yellow-500">
                            <p class="text-3xl font-bold text-yellow-600">${avgTimePerQuestion}s</p>
                            <p class="text-sm text-gray-500">Tempo Medio / Domanda</p>
                        </div>
                        <div class="bg-white p-4 rounded-md shadow-sm border-b-4 border-red-500">
                            <p class="text-3xl font-bold text-red-600">${totalIncorrect}</p>
                            <p class="text-sm text-gray-500">Errori Totali</p>
                        </div>
                    </div>
                </div>

                <div class="bg-white p-6 rounded-lg shadow-lg mb-8">
                    <h2 class="text-xl font-semibold text-gray-800 mb-4">Top 5 Domande Più Difficili</h2>
                    <ul class="divide-y divide-gray-200 max-h-64 overflow-y-auto">
                        ${mostDifficult.length > 0 ? mostDifficult : '<p class="text-gray-500 italic">Non hai ancora commesso errori. Continua così!</p>'}
                    </ul>
                </div>
                
                <button id="change-mode-btn" class="text-red-600 hover:text-red-800 font-medium py-3 px-6 rounded-lg w-full border border-red-600 hover:bg-red-50 transition mb-3">
                    Torna al Menu Principale
                </button>
                
                <button id="reset-stats-btn" class="text-gray-500 hover:text-red-600 text-sm py-2 px-4 rounded-lg w-full border border-gray-300 hover:border-red-600 transition">
                    ⚠️ Azzerra Tutte le Statistiche
                </button>
            </div>
        `;
    }
    
    renderErrorScreen(message) {
        return `
            <div class="p-6 text-center">
                <h1 class="text-4xl font-bold text-red-600 mb-4">⚠️ Errore</h1>
                <p class="text-lg text-gray-700 mb-8">${message}</p>
                <button id="change-mode-btn" class="bg-red-600 text-white font-bold py-3 px-6 rounded-lg w-full shadow-xl hover:bg-red-700 transition">
                    Torna al Menu Principale
                </button>
            </div>
        `;
    }
    
    render() {
        const root = document.getElementById('root');
        if (this.quizState === 'start') {
            root.innerHTML = this.renderStartScreen();
        } else if (this.quizState === 'quiz') {
            root.innerHTML = this.renderQuizScreen();
        } else if (this.quizState === 'results') {
            root.innerHTML = this.renderResultsScreen();
        } else if (this.quizState === 'stats') {
             root.innerHTML = this.renderStatsScreen();
        }
        this.attachEventListeners();
    }

    attachEventListeners() {
        // Rimuove tutti gli event listener vecchi prima di attaccare i nuovi (importante per il rendering manuale)
        // Uso onclick per semplicità di implementazione

        // Start screen - select mode
        const modeSelectors = document.querySelectorAll('[data-select-mode]');
        modeSelectors.forEach(el => {
            el.onclick = () => { 
                this.selectMode(el.dataset.selectMode);
            };
        });
        
        // Start screen - Stats button
        const statsBtn = document.getElementById('stats-btn');
        if (statsBtn) {
            statsBtn.onclick = () => this.goToStats();
        }

        // Quiz screen - options
        const optionButtons = document.querySelectorAll('[data-option]');
        optionButtons.forEach(btn => {
             btn.onclick = () => {
                this.selectAnswer(btn.dataset.option);
            };
        });

        // Quiz screen - actions (Solo per modalità Esame o feedback manuale)
        const confirmBtn = document.getElementById('confirm-btn');
        if (confirmBtn) {
            confirmBtn.onclick = () => this.confirmAnswer();
        }

        const skipBtn = document.getElementById('skip-btn');
        if (skipBtn) {
            skipBtn.onclick = () => this.skipQuestion();
        }

        const nextBtn = document.getElementById('next-btn');
        if (nextBtn) {
            nextBtn.onclick = () => this.nextQuestion();
        }

        const endTrainingBtn = document.getElementById('end-training-btn');
        if (endTrainingBtn) {
            endTrainingBtn.onclick = () => this.endQuiz();
        }
        
        // Results/Stats screen - actions
        const retryBtn = document.getElementById('retry-btn');
        if (retryBtn) {
            retryBtn.onclick = () => {
                this.selectMode(this.mode);
            };
        }

        const changeModeBtn = document.getElementById('change-mode-btn');
        if (changeModeBtn) {
            changeModeBtn.onclick = () => this.resetQuiz();
        }
        
        const resetStatsBtn = document.getElementById('reset-stats-btn');
        if (resetStatsBtn) {
            resetStatsBtn.onclick = () => this.resetStats();
        }
    }
}

const app = new QuizApp();