// Quiz Antincendio - Progressive Web App
// Versione con modalità Allenamento, Esame, Solo Errori, Sfida 60s, Revisione Intelligente e Obiettivi Giornalieri
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
        this.mode = null; // 'training', 'exam', 'errorsOnly', 'timeChallenge', 'smartReview'

        // Timer e tempi
        this.startTime = null; // Tempo inizio quiz
        this.endTime = null; // Tempo fine quiz
        this.timerInterval = null;
        this.timeRemaining = 0;
        this.questionStartTime = null; // Tempo inizio domanda

        // Nuove proprietà per persistenza e statistiche
        this.history = []; // [{qnum, isCorrect, timestamp, mode, timeSpent}]
        this.stats = { totalAttempts: 0, totalCorrect: 0, totalTime: 0 };
        this.highScores60s = []; // [{score, timestamp}]
        this.badges = {}; // {'fireMaster': true, 'streak5days': false}
        this.dailyGoal = {
            target: 50, // Obiettivo domande da completare
            completedToday: 0,
            lastGoalDate: new Date().toLocaleDateString('it-IT') // Data ultima esecuzione obiettivo
        };

        // Configurazioni modalità
        this.modes = {
            training: {
                name: 'Allenamento',
                questions: 'infinite',
                maxErrors: 'nessuno',
                timeLimit: null,
                showFeedback: true,
                isExam: false
            },
            exam: {
                name: 'Simulazione Esame',
                questions: 15,
                maxErrors: 5,
                timeLimit: 1800, // 30 minuti
                showFeedback: false,
                isExam: true
            },
            errorsOnly: {
                name: 'Solo Errori',
                questions: 'allErrors',
                maxErrors: 'nessuno',
                timeLimit: null,
                showFeedback: true,
                isExam: false
            },
            timeChallenge: {
                name: 'Sfida 60s',
                questions: 'infinite',
                maxErrors: 'nessuno',
                timeLimit: 60, // 60 secondi
                showFeedback: false,
                isExam: false
            },
            smartReview: { // NUOVA MODALITÀ RIPETIZIONE SPAZIATA
                name: 'Revisione Intelligente',
                questions: 'smart',
                maxErrors: 'nessuno',
                timeLimit: null,
                showFeedback: true,
                isExam: false
            }
        };

        this.loadData();
        this.bindEvents();
    }

    // --- Gestione Dati Persistenti (LocalStorage) ---

    loadData() {
        try {
            // Carica Dati Quiz
            fetch('quiz_antincendio_ocr_improved.json')
                .then(response => response.json())
                .then(data => {
                    this.quizData = data.map((q, index) => ({ ...q, qnum: index + 1 }));
                    this.quizData.sort(() => Math.random() - 0.5); // Mescola le domande all'avvio
                    this.render();
                });

            // Carica Statistiche e Cronologia
            const savedHistory = localStorage.getItem('quizHistory');
            if (savedHistory) {
                this.history = JSON.parse(savedHistory);
            }
            const savedStats = localStorage.getItem('quizStats');
            if (savedStats) {
                this.stats = JSON.parse(savedStats);
            }

            // Carica Classifica 60s
            const savedHighScores60s = localStorage.getItem('highScores60s');
            if (savedHighScores60s) {
                this.highScores60s = JSON.parse(savedHighScores60s);
            }

            // Carica Badge
            const savedBadges = localStorage.getItem('quizBadges');
            if (savedBadges) {
                this.badges = JSON.parse(savedBadges);
            }

            // Carica Obiettivo Giornaliero
            const savedDailyGoal = localStorage.getItem('dailyGoal');
            if (savedDailyGoal) {
                this.dailyGoal = JSON.parse(savedDailyGoal);
            }
            this.checkGoalReset();

        } catch (e) {
            console.error("Errore nel caricamento dei dati da localStorage o file JSON:", e);
        }
    }

    saveData() {
        localStorage.setItem('quizHistory', JSON.stringify(this.history));
        localStorage.setItem('quizStats', JSON.stringify(this.stats));
        localStorage.setItem('highScores60s', JSON.stringify(this.highScores60s));
        localStorage.setItem('quizBadges', JSON.stringify(this.badges));
        localStorage.setItem('dailyGoal', JSON.stringify(this.dailyGoal));
    }

    // --- Gestione Obiettivi Giornalieri ---

    checkGoalReset() {
        const today = new Date().toLocaleDateString('it-IT');
        if (this.dailyGoal.lastGoalDate !== today) {
            this.dailyGoal.completedToday = 0;
            this.dailyGoal.lastGoalDate = today;
            this.saveData();
        }
    }

    updateDailyGoal(count = 1) {
        this.dailyGoal.completedToday += count;
        this.checkBadges();
        this.saveData();
        this.render(); // Per aggiornare l'interfaccia degli obiettivi
    }

    // --- Gestione Ripetizione Spaziata ---
    
    // Calcola il "fattore di difficoltà" basandosi sulla media delle risposte corrette/sbagliate
    calculateDifficulty(qnum) {
        const attempts = this.history.filter(h => h.qnum === qnum);
        if (attempts.length === 0) return 0.5; // Neutro se non risposto
        
        const correctCount = attempts.filter(h => h.isCorrect).length;
        const incorrectCount = attempts.filter(h => !h.isCorrect).length;
        
        // Fattore: 1 (sempre corretto) a 0 (sempre sbagliato)
        return correctCount / attempts.length;
    }
    
    // Determina se una domanda è pronta per la revisione (basato sulla difficoltà e sulla data dell'ultima risposta)
    isReadyForReview(qnum) {
        const lastAttempt = this.history
            .filter(h => h.qnum === qnum)
            .sort((a, b) => b.timestamp - a.timestamp)[0];

        if (!lastAttempt) return true; // Se non è mai stata risposta, è pronta

        const difficulty = this.calculateDifficulty(qnum);
        const now = Date.now();
        const daysSinceLastReview = (now - lastAttempt.timestamp) / (1000 * 60 * 60 * 24); // Giorni

        let interval;
        // Intervalli di ripetizione (giorni) basati sul fattore di difficoltà:
        if (difficulty >= 0.8) { // Facile (rivedi dopo 7-14 giorni)
            interval = 7 + (7 * difficulty);
        } else if (difficulty >= 0.5) { // Medio (rivedi dopo 3-7 giorni)
            interval = 3 + (4 * difficulty);
        } else { // Difficile (rivedi dopo 1 giorno)
            interval = 1;
        }

        // Se l'ultima volta era sbagliata, rivedi prima
        if (!lastAttempt.isCorrect) {
            interval = 0.5; // Rivedi subito il giorno dopo
        }
        
        return daysSinceLastReview >= interval;
    }

    getSmartReviewQuestions() {
        // 1. Prendi tutte le domande
        const questionsToReview = this.quizData
            .filter(q => this.isReadyForReview(q.qnum));
        
        // 2. Ordinale per priorità (quelle con difficoltà più bassa in cima)
        questionsToReview.sort((a, b) => {
            return this.calculateDifficulty(a.qnum) - this.calculateDifficulty(b.qnum);
        });

        // 3. Limita il set (es. 20 domande)
        return questionsToReview.slice(0, 20);
    }

    // --- Inizializzazione Quiz ---

    selectMode(mode) {
        if (!this.modes[mode]) return;
        this.mode = mode;
        this.quizState = 'quiz';
        this.incorrectCount = 0;
        this.answeredQuestions = [];
        this.questionStartTime = Date.now();

        // Seleziona le domande in base alla modalità
        if (mode === 'errorsOnly') {
            const incorrectQnums = [...new Set(this.history.filter(h => !h.isCorrect).map(h => h.qnum))];
            this.selectedQuestions = this.quizData.filter(q => incorrectQnums.includes(q.qnum));
            // Se non ci sono errori, torna alla schermata iniziale o avvisa
            if (this.selectedQuestions.length === 0) {
                alert('Non hai ancora commesso errori! Prova la modalità Allenamento.');
                this.resetQuiz();
                return;
            }
        } else if (mode === 'smartReview') {
            this.selectedQuestions = this.getSmartReviewQuestions();
            // Se non ci sono domande da rivedere, avvisa
            if (this.selectedQuestions.length === 0) {
                alert('Ottimo lavoro! Nessuna domanda è pronta per la Revisione Intelligente. Continua ad allenarti!');
                this.resetQuiz();
                return;
            }
        } else if (mode === 'exam') {
            // Selezione casuale delle domande per l'esame
            this.selectedQuestions = this.quizData.sort(() => 0.5 - Math.random()).slice(0, this.modes[mode].questions);
        } else if (mode === 'training' || mode === 'timeChallenge') {
            // Per training e 60s, iniziamo con un set casuale, poi ne aggiungiamo dinamicamente
            this.selectedQuestions = this.quizData.sort(() => 0.5 - Math.random()).slice(0, 50);
        }

        this.currentQuestionIndex = 0;
        this.startTime = Date.now();
        this.endTime = null;
        this.timeRemaining = this.modes[mode].timeLimit;
        this.startTimer();
        this.render();
    }

    // ... (metodo startTimer e updateTimer rimangono invariati)

    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        // Se c'è un limite di tempo (esame o 60s)
        if (this.modes[this.mode].timeLimit) {
            this.timerInterval = setInterval(() => {
                this.timeRemaining--;
                this.updateTimerDisplay();
                if (this.timeRemaining <= 0) {
                    clearInterval(this.timerInterval);
                    this.timeRemaining = 0;
                    if (this.mode === 'timeChallenge') {
                        this.endTimeChallenge(); // Fine specifica per 60s
                    } else {
                        alert('Tempo scaduto!');
                        this.endQuiz();
                    }
                }
            }, 1000);
        } else if (this.mode === 'training' || this.mode === 'errorsOnly' || this.mode === 'smartReview') {
            // Per modalità senza limite, tracciamo il tempo totale
            this.timerInterval = setInterval(() => {
                // Aggiorniamo il tempo trascorso ogni secondo
                this.updateTimerDisplay();
            }, 1000);
        }
    }

    updateTimerDisplay() {
        const timerElement = document.getElementById('timer');
        if (timerElement) {
            let displayTime;
            if (this.modes[this.mode].timeLimit) {
                const minutes = Math.floor(this.timeRemaining / 60);
                const seconds = this.timeRemaining % 60;
                displayTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            } else {
                const totalSeconds = Math.floor((Date.now() - this.startTime) / 1000);
                const minutes = Math.floor(totalSeconds / 60);
                const seconds = totalSeconds % 60;
                displayTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
            timerElement.textContent = displayTime;
        }
    }

    // --- Risposta e Avanzamento ---

    selectAnswer(option) {
        // Logica per selezionare una risposta
        if (this.showFeedback) return;
        this.selectedAnswer = option;
        this.render();
    }

    confirmAnswer() {
        if (!this.selectedAnswer) return;

        const currentQuestion = this.selectedQuestions[this.currentQuestionIndex];
        const isCorrect = currentQuestion.answer === this.selectedAnswer;

        // Tempo impiegato
        const timeSpent = (Date.now() - this.questionStartTime) / 1000;

        // 1. Aggiorna la cronologia (History)
        this.history.push({
            qnum: currentQuestion.qnum,
            isCorrect: isCorrect,
            timestamp: Date.now(),
            mode: this.mode,
            timeSpent: timeSpent
        });
        
        // 2. Aggiorna le statistiche totali
        this.stats.totalAttempts++;
        if (isCorrect) {
            this.stats.totalCorrect++;
        }
        this.stats.totalTime += timeSpent;
        
        // 3. Gestione errori
        if (!isCorrect && this.modes[this.mode].isExam) {
            this.incorrectCount++;
        }

        // 4. Aggiorna l'obiettivo giornaliero
        this.updateDailyGoal();

        // 5. Salva e renderizza
        this.saveData();
        this.answeredQuestions.push({ question: currentQuestion, isCorrect: isCorrect, selected: this.selectedAnswer });

        if (this.mode === 'timeChallenge') {
            // Nella 60s, si passa subito alla successiva e si registra solo il risultato finale
            this.nextQuestion(isCorrect);
        } else {
            // Nelle altre modalità, si mostra il feedback
            this.showFeedback = true;
            this.render();
        }
    }

    nextQuestion(isCorrectFor60s = null) {
        this.selectedAnswer = null;
        this.showFeedback = false;
        
        // Se è la modalità 60s, ricarichiamo il timer della domanda
        if (this.mode !== 'timeChallenge') {
            this.questionStartTime = Date.now();
        }

        this.currentQuestionIndex++;
        const modeConfig = this.modes[this.mode];

        // Controllo fine quiz (Esame o fine lista Allenamento/Errori)
        if (modeConfig.isExam && (this.currentQuestionIndex >= modeConfig.questions || this.incorrectCount > modeConfig.maxErrors)) {
            this.endQuiz();
            return;
        }

        if (modeConfig.questions !== 'infinite' && this.currentQuestionIndex >= this.selectedQuestions.length) {
            this.endQuiz();
            return;
        }

        // Caso Allenamento/Solo Errori/Smart Review (illimitato)
        if (modeConfig.questions === 'infinite' || modeConfig.questions === 'allErrors' || modeConfig.questions === 'smart') {
            // Se siamo alla fine della lista, ne carichiamo un'altra casuale (o ripartiamo dall'inizio se non illimitato)
            if (this.currentQuestionIndex >= this.selectedQuestions.length) {
                // Per allenamento, carichiamo nuove domande casuali
                if (this.mode === 'training') {
                    this.selectedQuestions = this.quizData.sort(() => 0.5 - Math.random()).slice(0, 50);
                    this.currentQuestionIndex = 0;
                } else if (this.mode === 'errorsOnly') {
                    // Se gli errori sono finiti, finisce
                    this.endQuiz();
                } else if (this.mode === 'smartReview') {
                    // Se le smart review sono finite, finisce
                    this.endQuiz();
                }
            }
        }
        
        this.render();
    }

    skipQuestion() {
        // Funzionalità di skip, solo per Allenamento o 60s (dove non c'è penalità)
        if (this.mode === 'training' || this.mode === 'timeChallenge') {
            // Per il 60s lo saltiamo senza contarlo
            if (this.mode === 'timeChallenge') {
                this.currentQuestionIndex++;
                if (this.currentQuestionIndex >= this.selectedQuestions.length) {
                    this.selectedQuestions = this.quizData.sort(() => 0.5 - Math.random()).slice(0, 50);
                    this.currentQuestionIndex = 0;
                }
            }
            this.selectedAnswer = null;
            this.showFeedback = false;
            this.questionStartTime = Date.now();
            this.currentQuestionIndex++;
            this.render();
        }
    }

    // --- Fine Quiz e Calcolo Risultati ---

    endQuiz() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.endTime = Date.now();
        this.quizState = 'results';
        this.checkBadges(); // Controlla i badge dopo il quiz
        this.saveData();
        this.render();
    }
    
    endTimeChallenge() {
        // Logica specifica per la Sfida 60s
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.endTime = Date.now();
        this.quizState = 'results';

        const correctCount = this.answeredQuestions.filter(a => a.isCorrect).length;
        const totalAttempts = this.answeredQuestions.length;

        // Calcolo e salvataggio High Score
        this.highScores60s.push({
            score: correctCount,
            total: totalAttempts,
            timestamp: Date.now()
        });
        // Mantieni solo i 10 migliori punteggi, ordinati per score e poi per totalAttempts (a parità di score)
        this.highScores60s.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return b.total - a.total; // Piu tentativi = più veloce/meglio
        }).splice(10); 
        
        this.checkBadges();
        this.saveData();
        this.render();
    }

    resetQuiz() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.quizState = 'start';
        this.mode = null;
        this.render();
    }

    // --- Statistiche e Badge ---
    
    // Funzione per controllare e assegnare badge
    checkBadges() {
        // Badge 1: Maestro del Fuoco (10 esami superati)
        const examsPassed = this.history.filter(h => h.mode === 'exam' && h.isCorrect).length;
        if (examsPassed >= 10 && !this.badges.fireMaster) {
            this.badges.fireMaster = {
                name: 'Maestro del Fuoco 🔥',
                description: 'Hai superato 10 simulazioni d\'esame con successo.',
                unlocked: Date.now()
            };
        }

        // Badge 2: Studente Pro (1000 domande completate in Allenamento/Smart Review)
        const trainingDone = this.history.filter(h => h.mode === 'training' || h.mode === 'smartReview').length;
        if (trainingDone >= 1000 && !this.badges.proStudent) {
             this.badges.proStudent = {
                name: 'Studente Pro 🎓',
                description: 'Hai risposto a 1000 domande in modalità Allenamento o Revisione.',
                unlocked: Date.now()
            };
        }
        
        // Badge 3: Obiettivo Giornaliero (5 giorni di seguito) - LOGICA DA ESPANDERE (qui per semplicità)
        // Per una logica completa servirebbe una "streak" salvata in localStorage. 
        // Per ora, un badge semplice: "Completato l'obiettivo 10 volte totali"
        const goalCompletions = this.history.filter(h => h.mode === 'goalCompleted').length; // Bisognerebbe aggiungere un record quando l'obiettivo viene completato
        if (this.dailyGoal.completedToday >= this.dailyGoal.target && !this.badges.dailyGoalAchieved) {
             this.badges.dailyGoalAchieved = {
                name: 'Obiettivo Raggiunto 🎯',
                description: `Hai completato l'obiettivo giornaliero (${this.dailyGoal.target} domande).`,
                unlocked: Date.now()
            };
        }
        
        // Badge 4: Re del 60s (Punteggio 20+ nella Sfida 60s)
        const best60sScore = this.highScores60s.length > 0 ? this.highScores60s[0].score : 0;
        if (best60sScore >= 20 && !this.badges.king60s) {
             this.badges.king60s = {
                name: 'Re del 60s ⏱️',
                description: 'Hai raggiunto un punteggio di 20 o più nella Sfida 60s.',
                unlocked: Date.now()
            };
        }
    }
    
    getDifficultQuestions() {
        // Logica per trovare le 5 domande più difficili (rimane invariata)
        // ...
        const questionStats = {};
        this.history.forEach(h => {
            if (!questionStats[h.qnum]) {
                questionStats[h.qnum] = { correct: 0, incorrect: 0, totalTime: 0, count: 0 };
            }
            if (h.isCorrect) {
                questionStats[h.qnum].correct++;
            } else {
                questionStats[h.qnum].incorrect++;
            }
            questionStats[h.qnum].totalTime += h.timeSpent;
            questionStats[h.qnum].count++;
        });

        // Converte in array e calcola la percentuale di errore
        const difficultQuestions = Object.keys(questionStats)
            .map(qnum => {
                const stats = questionStats[qnum];
                const errorRate = stats.incorrect / stats.count;
                const avgTime = stats.totalTime / stats.count;
                
                // Trova il testo della domanda
                const questionData = this.quizData.find(q => q.qnum === parseInt(qnum));
                
                return {
                    qnum: parseInt(qnum),
                    questionText: questionData ? questionData.question.substring(0, 50) + '...' : 'Domanda Sconosciuta',
                    errorRate: errorRate,
                    avgTime: avgTime.toFixed(2),
                    count: stats.count
                };
            })
            .filter(q => q.errorRate > 0) // Filtra solo quelle con almeno un errore
            .sort((a, b) => {
                // Ordina prima per tasso di errore (più alto = più difficile), poi per tempo medio
                if (b.errorRate !== a.errorRate) return b.errorRate - a.errorRate;
                return b.avgTime - a.avgTime;
            })
            .slice(0, 5);
            
        return difficultQuestions;
    }

    // --- Rendering (Interfaccia Utente) ---

    // Aggiungi nuove sezioni nel rendering
    render() {
        const root = document.getElementById('root');
        if (!root) return;

        // Pulizia per evitare duplicati
        root.innerHTML = ''; 

        switch (this.quizState) {
            case 'start':
                root.innerHTML = this.renderStartScreen();
                break;
            case 'quiz':
                root.innerHTML = this.renderQuizScreen();
                break;
            case 'results':
                root.innerHTML = this.renderResultsScreen();
                break;
            case 'stats':
                root.innerHTML = this.renderStatsScreen();
                break;
        }

        this.bindEvents(); // Ricollega gli eventi dopo il rendering
        if (this.quizState === 'quiz' && this.modes[this.mode].timeLimit) {
            this.updateTimerDisplay(); // Assicura che il display del timer sia aggiornato subito
        }
    }

    renderStartScreen() {
        const goalsText = this.dailyGoal.completedToday >= this.dailyGoal.target 
            ? `<p class="mt-2 text-green-600 font-semibold">✅ Obiettivo di oggi completato (${this.dailyGoal.completedToday}/${this.dailyGoal.target})!</p>`
            : `<p class="mt-2 text-red-600 font-semibold">🎯 Obiettivo Giornaliero: ${this.dailyGoal.completedToday}/${this.dailyGoal.target} domande.</p>`;

        let html = `
            <h1 class="text-3xl font-bold text-center text-red-600 mb-6">Quiz Antincendio Livello 3</h1>
            ${goalsText}
            <p class="text-center text-gray-700 mb-8">Scegli la modalità di studio:</p>
            <div class="space-y-4">
                ${this.renderModeButton('training', '🎓 Allenamento Libero', 'Domande illimitate con feedback immediato.')}
                ${this.renderModeButton('exam', '📝 Simulazione Esame', '15 domande, 30 minuti, max 5 errori.')}
                ${this.renderModeButton('errorsOnly', '❌ Solo Errori', 'Rivedi solo le domande a cui hai sbagliato.')}
                ${this.renderModeButton('smartReview', '🧠 Revisione Intelligente', 'Ripeti le domande più difficili, quando è il momento.')}
                ${this.renderModeButton('timeChallenge', '⏱️ Sfida 60s', 'Rispondi a quante più domande puoi in un minuto!')}
            </div>
            <button id="stats-btn" class="w-full mt-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg shadow hover:bg-gray-300 transition duration-150">
                Statistiche e Progressi 📊
            </button>
            <div id="install-app-container" class="mt-6 text-center hidden">
                <button id="install-btn" class="py-2 px-4 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition">
                    Installare l'App 📱
                </button>
            </div>
        `;
        return html;
    }

    renderModeButton(mode, title, description) {
        return `
            <button data-mode="${mode}" class="mode-select-btn w-full p-4 bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition duration-150 text-left">
                <p class="text-lg font-semibold text-gray-800">${title}</p>
                <p class="text-sm text-gray-500">${description}</p>
            </button>
        `;
    }

    renderQuizScreen() {
        const currentQ = this.selectedQuestions[this.currentQuestionIndex];
        if (!currentQ) return `<div class="text-center p-8">Nessuna domanda selezionata.</div>`;
        
        const modeConfig = this.modes[this.mode];
        const isExam = modeConfig.isExam;
        const currentModeName = modeConfig.name;

        // Calcolo il numero corrente se non è una modalità fissa (Exam)
        const currentQNumber = this.currentQuestionIndex + 1;
        const totalQ = modeConfig.questions !== 'infinite' ? this.selectedQuestions.length : currentQNumber;
        const progressText = modeConfig.questions === 'infinite' ? `Domanda: ${currentQNumber}+` : `Domanda ${currentQNumber} di ${totalQ}`;
        
        // Timer display
        const timerHtml = `<div id="timer" class="text-2xl font-bold text-red-600">00:00</div>`;

        // Progress Bar
        let progressBarHtml = '';
        if (modeConfig.questions !== 'infinite') {
            const percentage = (currentQNumber / totalQ) * 100;
            progressBarHtml = `
                <div class="mt-2 h-2 bg-gray-200 rounded-full">
                    <div class="h-2 bg-red-600 rounded-full transition-all duration-500" style="width: ${percentage}%;"></div>
                </div>
            `;
        }


        // Status Bar (Top)
        const statusBarHtml = `
            <div class="flex justify-between items-center mb-6 border-b pb-4">
                <div class="text-sm font-medium text-gray-500">${currentModeName}</div>
                ${timerHtml}
            </div>
            <div class="text-center mb-6">
                <p class="text-lg font-semibold text-gray-700">${progressText}</p>
                ${progressBarHtml}
                ${isExam ? `<p class="text-sm text-red-600 font-semibold mt-1">Errori: ${this.incorrectCount} / ${modeConfig.maxErrors}</p>` : ''}
            </div>
        `;

        // Domanda
        const questionHtml = `<p class="text-xl font-bold mb-6 text-gray-900">${currentQ.question}</p>`;

        // Opzioni
        const optionsHtml = ['a', 'b', 'c'].map(option => {
            const isSelected = this.selectedAnswer === option;
            const isCorrect = this.showFeedback && currentQ.answer === option;
            const isIncorrect = this.showFeedback && isSelected && currentQ.answer !== option;

            let bgColor = isSelected ? 'bg-red-100 border-red-600' : 'bg-white border-gray-200 hover:border-red-400';
            let icon = '';

            if (this.showFeedback) {
                if (isCorrect) {
                    bgColor = 'bg-green-100 border-green-600';
                    icon = '✅';
                } else if (isIncorrect) {
                    bgColor = 'bg-red-100 border-red-600';
                    icon = '❌';
                }
            }

            return `
                <button data-option="${option}" 
                    class="option-btn w-full p-4 mb-3 border-2 rounded-lg shadow transition-all duration-200 text-left ${bgColor}"
                    ${this.showFeedback ? 'disabled' : ''}>
                    <span class="font-semibold">${option.toUpperCase()}.</span> ${currentQ[option]} ${icon}
                </button>
            `;
        }).join('');

        // Feedback
        const feedbackHtml = this.showFeedback ? `
            <div class="mt-6 p-4 rounded-lg ${currentQ.answer === this.selectedAnswer ? 'bg-green-100 border-green-400 text-green-800' : 'bg-red-100 border-red-400 text-red-800'} border">
                <p class="font-bold mb-2">Risposta ${currentQ.answer === this.selectedAnswer ? 'Corretta' : 'Sbagliata'}:</p>
                <p class="text-sm">${currentQ.explanation}</p>
            </div>
        ` : '';

        // Controlli
        let controlsHtml = '';
        if (this.mode === 'timeChallenge') {
            // Nella modalità 60s si va avanti subito, non c'è conferma
            controlsHtml = `<button id="end-training-btn" class="w-full mt-6 py-3 bg-gray-400 text-white font-semibold rounded-lg shadow hover:bg-gray-500 transition duration-150">
                Termina Sfida (60s)
            </button>`;
        } else if (!this.showFeedback) {
            // Conferma per tutte le altre modalità (tranne 60s)
            controlsHtml = `
                <div class="mt-6 flex space-x-4">
                    <button id="confirm-btn" class="flex-1 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition duration-150 ${this.selectedAnswer ? '' : 'opacity-50 cursor-not-allowed'}" ${this.selectedAnswer ? '' : 'disabled'}>
                        Conferma Risposta
                    </button>
                    ${modeConfig.questions === 'infinite' ? `<button id="skip-btn" class="py-3 px-4 bg-gray-400 text-white font-semibold rounded-lg shadow-md hover:bg-gray-500 transition duration-150">Salta</button>` : ''}
                </div>
            `;
        } else {
            // Prossima domanda dopo il feedback
            controlsHtml = `
                <div class="mt-6 flex space-x-4">
                    <button id="next-btn" class="flex-1 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition duration-150">
                        Prossima Domanda
                    </button>
                    <button id="end-training-btn" class="py-3 px-4 bg-gray-400 text-white font-semibold rounded-lg shadow hover:bg-gray-500 transition duration-150">
                        Termina
                    </button>
                </div>
            `;
        }


        return `
            ${statusBarHtml}
            <div class="bg-gray-50 p-6 rounded-xl shadow-inner">
                ${questionHtml}
                <div class="space-y-3">
                    ${optionsHtml}
                </div>
                ${feedbackHtml}
                ${controlsHtml}
            </div>
        `;
    }

    renderResultsScreen() {
        const totalQuestions = this.answeredQuestions.length;
        const correctCount = this.answeredQuestions.filter(a => a.isCorrect).length;
        const incorrectCount = totalQuestions - correctCount;
        const success = this.mode === 'exam' ? incorrectCount <= this.modes.exam.maxErrors : true; // Logica success solo per l'esame

        const totalTimeSeconds = (this.endTime - this.startTime) / 1000;
        const minutes = Math.floor(totalTimeSeconds / 60);
        const seconds = Math.floor(totalTimeSeconds % 60);
        const timeDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        const avgTime = (totalTimeSeconds / totalQuestions).toFixed(2);

        let title = '';
        let resultColor = '';
        let scoreDetails = '';

        if (this.mode === 'exam') {
            title = success ? '✅ Simulazione Superata!' : '❌ Simulazione Fallita';
            resultColor = success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
            scoreDetails = `<p class="text-xl font-bold mt-2">Errori: ${incorrectCount} / ${this.modes.exam.maxErrors}</p>`;
        } else if (this.mode === 'timeChallenge') {
            title = '⏱️ Sfida 60s Terminata!';
            resultColor = 'bg-yellow-100 text-yellow-800';
            scoreDetails = `<p class="text-xl font-bold mt-2 text-red-600">Punteggio: ${correctCount} Corretti</p>`;
        } else if (this.mode === 'smartReview') {
            title = '🧠 Revisione Intelligente Completata';
            resultColor = 'bg-blue-100 text-blue-800';
            scoreDetails = `<p class="text-xl font-bold mt-2">Hai rivisto ${totalQuestions} domande.</p>`;
        } else {
            title = 'Sessione di Allenamento Terminata';
            resultColor = 'bg-gray-100 text-gray-800';
        }
        
        const shareText = `Ho superato una simulazione d'esame Antincendio Livello 3! Corretti: ${correctCount}, Errori: ${incorrectCount}, Tempo: ${timeDisplay}. #QuizAntincendio`;
        const share60sText = `Ho fatto ${correctCount} risposte corrette in 60 secondi nella Sfida Antincendio! Riuscirai a battermi? #Sfida60s`;


        const reviewHtml = this.answeredQuestions.map((answer, index) => {
            const icon = answer.isCorrect ? '✅' : '❌';
            const bgColor = answer.isCorrect ? 'bg-green-50' : 'bg-red-50';
            return `
                <div class="p-3 border-b ${bgColor} flex justify-between items-center text-sm">
                    <span class="font-semibold">${index + 1}.</span> 
                    <p class="truncate flex-1 mx-2">${answer.question.question}</p>
                    <span class="font-bold">${icon}</span>
                </div>
            `;
        }).join('');


        return `
            <div class="text-center p-6 ${resultColor} rounded-xl shadow-md mb-6">
                <h2 class="text-2xl font-extrabold">${title}</h2>
                <p class="text-3xl font-extrabold mt-3">${correctCount} / ${totalQuestions} Corrette</p>
                ${scoreDetails}
                <p class="mt-2 text-gray-700">Tempo Totale: ${timeDisplay} (Media: ${avgTime}s/domanda)</p>
            </div>
            
            <div class="mt-6 flex space-x-4">
                <button id="retry-btn" class="flex-1 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition duration-150">
                    Riprova ${this.modes[this.mode].name}
                </button>
                <button id="change-mode-btn" class="flex-1 py-3 bg-gray-400 text-white font-semibold rounded-lg shadow hover:bg-gray-500 transition duration-150">
                    Cambia Modalità
                </button>
            </div>
            
            <button id="share-btn" class="w-full mt-4 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-150">
                Condividi Risultato 📢
            </button>
            
            <div class="mt-8">
                <h3 class="text-xl font-bold mb-3 text-gray-800">Riepilogo Risposte:</h3>
                <div class="bg-white rounded-lg shadow-sm max-h-60 overflow-y-scroll border">
                    ${reviewHtml}
                </div>
            </div>
            
            <script>
                document.getElementById('share-btn').onclick = () => {
                    const shareData = {
                        title: 'Quiz Antincendio',
                        text: '${this.mode === 'timeChallenge' ? share60sText : shareText}',
                        url: window.location.href,
                    };
                    if (navigator.share) {
                        navigator.share(shareData).catch(error => console.log('Errore di condivisione', error));
                    } else {
                        alert('Il tuo browser non supporta la condivisione nativa. Ecco il testo da copiare:\n\n' + shareData.text);
                    }
                };
            </script>
        `;
    }

    renderStatsScreen() {
        const difficultQuestions = this.getDifficultQuestions();
        const difficultHtml = difficultQuestions.length > 0 ? difficultQuestions.map(q => `
            <li class="py-2 border-b last:border-b-0">
                <p class="font-semibold text-gray-800">${q.qnum}. ${q.questionText}</p>
                <p class="text-sm text-red-600">Tasso di Errore: ${(q.errorRate * 100).toFixed(1)}% (${q.count} tentativi)</p>
            </li>
        `).join('') : '<p class="text-gray-500">Non ci sono ancora abbastanza dati sugli errori.</p>';
        
        const totalAttempts = this.stats.totalAttempts;
        const totalCorrect = this.stats.totalCorrect;
        const totalAccuracy = totalAttempts > 0 ? ((totalCorrect / totalAttempts) * 100).toFixed(1) : 0;
        const avgTimeTotal = this.stats.totalTime > 0 ? (this.stats.totalTime / totalAttempts).toFixed(2) : 0;

        // Classifica 60s
        const highScoresHtml = this.highScores60s.map((score, index) => `
            <li class="p-3 border-b flex justify-between items-center text-sm ${index === 0 ? 'bg-yellow-100 font-bold' : 'bg-white'}">
                <span class="w-1/12">${index + 1}°</span>
                <span class="w-7/12">${score.score} risposte corrette</span>
                <span class="w-4/12 text-right text-gray-600">${new Date(score.timestamp).toLocaleDateString('it-IT')}</span>
            </li>
        `).join('');
        
        // Badge
        const allBadges = Object.values(this.badges).sort((a,b) => b.unlocked - a.unlocked); // Più recenti in cima
        const badgesHtml = allBadges.length > 0 ? allBadges.map(badge => `
            <div class="p-3 bg-green-100 rounded-lg border border-green-400">
                <p class="font-bold text-green-800">${badge.name}</p>
                <p class="text-sm text-green-700">${badge.description}</p>
                <p class="text-xs text-green-600 mt-1">Sbloccato il: ${new Date(badge.unlocked).toLocaleDateString('it-IT')}</p>
            </div>
        `).join('') : '<p class="text-gray-500">Nessun badge sbloccato. Continua ad allenarti!</p>';

        return `
            <h2 class="text-3xl font-bold text-center text-red-600 mb-8">Progressi e Statistiche 📊</h2>

            <button id="change-mode-btn" class="w-full mb-6 py-3 bg-gray-400 text-white font-semibold rounded-lg shadow hover:bg-gray-500 transition duration-150">
                Torna al Menu Principale
            </button>
            
            <div class="space-y-6">
                
                <div class="p-5 bg-white rounded-xl shadow-lg border">
                    <h3 class="text-xl font-bold mb-3 text-gray-800 flex justify-between items-center">
                        Riepilogo Generale
                    </h3>
                    <p class="text-2xl font-extrabold text-red-600">${totalAccuracy}%</p>
                    <p class="text-sm text-gray-600">Accuratezza Totale (${totalCorrect} corrette su ${totalAttempts} totali)</p>
                    <p class="mt-2 text-gray-600">Tempo Medio di Risposta: ${avgTimeTotal} secondi</p>
                </div>
                
                <div class="p-5 bg-white rounded-xl shadow-lg border">
                    <h3 class="text-xl font-bold mb-3 text-gray-800">
                        Classifica Sfida 60s ⏱️
                    </h3>
                    <ul class="rounded-lg overflow-hidden border">
                        ${highScoresHtml.length > 0 ? highScoresHtml : '<p class="p-3 text-gray-500">Nessun punteggio registrato. Prova la Sfida 60s!</p>'}
                    </ul>
                </div>
                
                <div class="p-5 bg-white rounded-xl shadow-lg border">
                    <h3 class="text-xl font-bold mb-3 text-gray-800">
                        Badge Sbloccati ⭐
                    </h3>
                    <div class="space-y-3">
                        ${badgesHtml}
                    </div>
                </div>

                <div class="p-5 bg-white rounded-xl shadow-lg border">
                    <h3 class="text-xl font-bold mb-3 text-gray-800">
                        Top 5 Domande Difficili 🤯
                    </h3>
                    <ul class="divide-y divide-gray-200">
                        ${difficultHtml}
                    </ul>
                </div>
                
                <div class="pt-4 border-t mt-6">
                    <button id="reset-stats-btn" class="w-full py-3 bg-red-100 text-red-600 font-semibold rounded-lg shadow hover:bg-red-200 transition duration-150">
                        ⚠️ Azzerra Tutte le Statistiche
                    </button>
                </div>
                
            </div>
        `;
    }

    // --- Rilegatura Eventi ---

    bindEvents() {
        // Schermata Start - Seleziona Modalità
        document.querySelectorAll('.mode-select-btn').forEach(btn => {
            btn.onclick = () => this.selectMode(btn.dataset.mode);
        });

        // Schermata Quiz - Risposte
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.onclick = () => {
                this.selectAnswer(btn.dataset.option);
            };
        });

        // Quiz screen - actions
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
            endTrainingBtn.onclick = () => {
                if (this.mode === 'timeChallenge') {
                    this.endTimeChallenge();
                } else {
                    this.endQuiz();
                }
            };
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
        
        const statsBtn = document.getElementById('stats-btn');
        if (statsBtn) {
            statsBtn.onclick = () => {
                this.quizState = 'stats';
                this.render();
            };
        }
        
        const resetStatsBtn = document.getElementById('reset-stats-btn');
        if (resetStatsBtn) {
            resetStatsBtn.onclick = () => {
                if (confirm('Sei sicuro di voler azzerare tutte le statistiche, cronologia e punteggi? Questa azione è irreversibile.')) {
                    localStorage.removeItem('quizHistory');
                    localStorage.removeItem('quizStats');
                    localStorage.removeItem('highScores60s');
                    localStorage.removeItem('quizBadges');
                    localStorage.removeItem('dailyGoal');
                    this.history = [];
                    this.stats = { totalAttempts: 0, totalCorrect: 0, totalTime: 0 };
                    this.highScores60s = [];
                    this.badges = {};
                    this.dailyGoal = { target: 50, completedToday: 0, lastGoalDate: new Date().toLocaleDateString('it-IT') };
                    this.render();
                    alert('Statistiche azzerate con successo.');
                }
            };
        }
        
        // Gestione A2HS (Add to Home Screen)
        const installAppContainer = document.getElementById('install-app-container');
        if (deferredPrompt) {
            installAppContainer.style.display = 'block';
            document.getElementById('install-btn').onclick = () => {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('User accepted the A2HS prompt');
                    } else {
                        console.log('User dismissed the A2HS prompt');
                    }
                    deferredPrompt = null;
                    installAppContainer.style.display = 'none';
                });
            };
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Aggiunto setTimeout per dare il tempo a tutti gli elementi di caricarsi
    setTimeout(() => {
        window.quizApp = new QuizApp();
    }, 100); 
});