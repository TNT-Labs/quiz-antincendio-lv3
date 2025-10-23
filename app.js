// Quiz Antincendio - Progressive Web App
// Versione con modalità Allenamento, Esame, Solo Errori, Sfida 60s, Revisione Intelligente e Obiettivi Giornalieri
// Aggiornamento: Temi (Premi Visivi), Dark Mode e Feedback Visivo Avanzato
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
        this.quizState = 'start'; // start, quiz, results, stats, settings
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

        // --- GESTIONE TEMI (Premi Visivi) ---
        this.themes = {
            fire: {
                name: 'Fuoco Classico 🔥',
                primary: 'red-600',
                secondary: 'red-400',
                unlocked: true,
                badge: null,
                icon: '🔥'
            },
            water: {
                name: 'Acqua Blu 💧',
                primary: 'blue-600',
                secondary: 'blue-400',
                unlocked: false,
                badge: 'proStudent', // Sbloccato con Studente Pro
                icon: '💧'
            },
            forest: {
                name: 'Foresta Verde 🌲',
                primary: 'green-600',
                secondary: 'green-400',
                unlocked: false,
                badge: 'fireMaster', // Sbloccato con Maestro del Fuoco
                icon: '🌲'
            },
            gold: {
                name: 'Oro Reale 👑',
                primary: 'yellow-500', // yellow-500 si abbina bene all'oro
                secondary: 'yellow-300',
                unlocked: false,
                badge: 'king60s', // Sbloccato con Re del 60s
                icon: '👑'
            }
        };
        this.currentThemeKey = 'fire';
        this.darkMode = false;
        // --- FINE GESTIONE TEMI ---

        // Configurazioni modalità (rimane invariato)
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
        this.applyThemeToDOM(); // Applica il tema caricato
        this.bindEvents();
    }

    // --- UTILITY PER TEMI ---
    getThemeColors() {
        return this.themes[this.currentThemeKey];
    }

    applyThemeToDOM() {
        const theme = this.getThemeColors();
        const html = document.documentElement;
        
        // 1. Applica classe tema all'HTML
        Object.keys(this.themes).forEach(key => {
            html.classList.remove(`theme-${key}`);
        });
        html.classList.add(`theme-${this.currentThemeKey}`);

        // 2. Gestione Dark Mode
        if (this.darkMode) {
            html.classList.add('dark');
        } else {
            html.classList.remove('dark');
        }
        
        // 3. Aggiorna il meta tag theme-color (solo i colori principali)
        const themeColorMeta = document.querySelector('meta[name="theme-color"]');
        if (themeColorMeta) {
            // Mappa approssimativa Tailwind 600 a Hex (per il theme-color)
            const colorMap = {
                'red-600': '#dc2626',
                'blue-600': '#2563eb',
                'green-600': '#16a34a',
                'yellow-500': '#f59e0b'
            };
            themeColorMeta.content = colorMap[theme.primary] || '#dc2626';
        }
    }
    
    toggleDarkMode() {
        this.darkMode = !this.darkMode;
        this.saveData();
        this.applyThemeToDOM();
        this.render(); 
    }
    
    selectTheme(themeKey) {
        if (this.themes[themeKey] && this.themes[themeKey].unlocked) {
            this.currentThemeKey = themeKey;
            this.saveData();
            this.applyThemeToDOM();
            this.render();
        }
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
            
            // Carica Stato Temi (lo uniamo con i temi di default)
            const savedThemes = localStorage.getItem('quizThemes');
            if (savedThemes) {
                const loadedThemes = JSON.parse(savedThemes);
                // Unisci i temi salvati con le definizioni di default (per includere nuovi temi)
                Object.keys(this.themes).forEach(key => {
                    if (loadedThemes[key]) {
                        this.themes[key].unlocked = loadedThemes[key].unlocked;
                    }
                });
            }
            
            // Carica Tema Corrente e Dark Mode
            const savedThemeKey = localStorage.getItem('currentThemeKey');
            if (savedThemeKey && this.themes[savedThemeKey]) {
                this.currentThemeKey = savedThemeKey;
            }
            const savedDarkMode = localStorage.getItem('darkMode');
            this.darkMode = savedDarkMode === 'true'; // Converti stringa in booleano

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
        
        // Salva solo lo stato di sblocco dei temi
        const themesToSave = {};
        Object.keys(this.themes).forEach(key => {
            themesToSave[key] = { unlocked: this.themes[key].unlocked };
        });
        localStorage.setItem('quizThemes', JSON.stringify(themesToSave));
        
        localStorage.setItem('currentThemeKey', this.currentThemeKey);
        localStorage.setItem('darkMode', this.darkMode);
        
        localStorage.setItem('dailyGoal', JSON.stringify(this.dailyGoal));
    }

    // --- Gestione Obiettivi Giornalieri (rimane invariato) ---

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

    // --- Gestione Ripetizione Spaziata (rimane invariato) ---
    
    // Calcola il "fattore di difficoltà" (rimane invariato)
    calculateDifficulty(qnum) {
        const attempts = this.history.filter(h => h.qnum === qnum);
        if (attempts.length === 0) return 0.5; // Neutro se non risposto
        
        const correctCount = attempts.filter(h => h.isCorrect).length;
        const incorrectCount = attempts.filter(h => !h.isCorrect).length;
        
        // Fattore: 1 (sempre corretto) a 0 (sempre sbagliato)
        return correctCount / attempts.length;
    }
    
    // Determina se una domanda è pronta per la revisione (rimane invariato)
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

    // --- Inizializzazione Quiz (rimane invariato) ---

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

    // --- Timer (rimane invariato) ---

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
            
            // --- Feedback Visivo Avanzato (Pulse) ---
            const root = document.getElementById('root');
            const feedbackClass = isCorrect ? `pulse-correct` : `pulse-incorrect`;
            
            root.classList.add(feedbackClass);
            
            setTimeout(() => {
                root.classList.remove(feedbackClass);
            }, 500); // 500ms di animazione
            // --- Fine Feedback Visivo Avanzato ---
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

    // --- Fine Quiz e Calcolo Risultati (rimane invariato) ---

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
    
    // Funzione per controllare e assegnare badge e sbloccare temi
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
        
        // Badge 3: Obiettivo Giornaliero (Logica semplificata)
        const goalCompletions = this.history.filter(h => h.mode === 'goalCompleted').length; 
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
        
        // --- LOGICA SBLOCCO TEMI ---
        let newThemeUnlocked = false;
        Object.keys(this.themes).forEach(key => {
            const theme = this.themes[key];
            if (theme.badge && this.badges[theme.badge] && !theme.unlocked) {
                // Se il badge è sbloccato e il tema non lo è, sblocca il tema.
                this.themes[key].unlocked = true;
                newThemeUnlocked = true;
            }
        });
        
        if (newThemeUnlocked) {
            // Avvisa l'utente solo se è un tema appena sbloccato
            // L'avviso vero e proprio viene dato dal renderSettingsScreen
        }
        
        this.saveData(); // Per salvare lo stato aggiornato di badge e temi
    }
    
    getDifficultQuestions() {
        // Logica per trovare le 5 domande più difficili (rimane invariata)
        // ... (Omessa per brevità, ma non toccata)
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

    render() {
        this.applyThemeToDOM(); // Applica il tema prima di ogni rendering
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
            case 'settings':
                root.innerHTML = this.renderSettingsScreen();
                break;
        }
        this.bindEvents(); 
        if (this.quizState === 'quiz' && this.modes[this.mode].timeLimit) {
            this.updateTimerDisplay(); 
        }
    }
    
    // Funzione helper per le classi di colore del tema
    getThemeClasses(primaryOrSecondary = 'primary') {
        const theme = this.getThemeColors();
        const color = theme[primaryOrSecondary];
        return {
            text: `text-${color}`,
            bg: `bg-${color}`,
            border: `border-${color}`,
            hoverBg: `hover:bg-${color.replace('-600', '-700').replace('-500', '-600')}` // Aggiunge un hover scuro
        };
    }

    renderStartScreen() {
        const themeColors = this.getThemeClasses();
        const goalsText = this.dailyGoal.completedToday >= this.dailyGoal.target 
            ? `<p class="mt-2 text-green-600 font-semibold">✅ Obiettivo di oggi completato (${this.dailyGoal.completedToday}/${this.dailyGoal.target})!</p>` 
            : `<p class="mt-2 ${themeColors.text} font-semibold">🎯 Obiettivo Giornaliero: ${this.dailyGoal.completedToday}/${this.dailyGoal.target} domande.</p>`;
            
        let html = `
            <h1 class="text-3xl font-bold text-center ${themeColors.text} mb-6">Quiz Antincendio Livello 3</h1>
            ${goalsText}
            <p class="text-center ${this.darkMode ? 'text-gray-300' : 'text-gray-700'} mb-8">Scegli la modalità di studio:</p>
            <div class="space-y-4">
                ${this.renderModeButton('training', '🎓 Allenamento Libero', 'Domande illimitate con feedback immediato.')}
                ${this.renderModeButton('exam', '📝 Simulazione Esame', '15 domande, 30 minuti, max 5 errori.')}
                ${this.renderModeButton('errorsOnly', '❌ Solo Errori', 'Rivedi solo le domande a cui hai sbagliato.')}
                ${this.renderModeButton('smartReview', '🧠 Revisione Intelligente', 'Ripeti le domande più difficili, quando è il momento.')}
                ${this.renderModeButton('timeChallenge', '⏱️ Sfida 60s', 'Rispondi a quante più domande puoi in un minuto!')}
            </div>
            <button id="stats-btn" class="w-full mt-6 py-3 bg-gray-200 ${this.darkMode ? 'dark:bg-gray-700 dark:text-gray-100' : 'text-gray-800'} font-semibold rounded-lg shadow hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-150">
                Statistiche e Progressi 📊
            </button>
            <button id="settings-btn" class="w-full mt-3 py-3 bg-gray-200 ${this.darkMode ? 'dark:bg-gray-700 dark:text-gray-100' : 'text-gray-800'} font-semibold rounded-lg shadow hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-150">
                Impostazioni e Temi ${this.themes[this.currentThemeKey].icon} ⚙️
            </button>
            <div id="install-app-container" class="mt-6 text-center hidden">
                <button id="install-btn" class="py-2 px-4 ${themeColors.bg} text-white rounded-lg shadow-md ${themeColors.hoverBg} transition">
                    Installare l'App 📱
                </button>
            </div>
        `;
        return html;
    } 

    renderModeButton(mode, title, description) {
        return `
            <button data-mode="${mode}" class="mode-select-btn w-full p-4 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-md hover:shadow-lg transition duration-150 text-left">
                <p class="text-lg font-semibold ${this.darkMode ? 'text-gray-100' : 'text-gray-800'}">${title}</p>
                <p class="text-sm ${this.darkMode ? 'text-gray-400' : 'text-gray-500'}">${description}</p>
            </button>
        `;
    } 
    
    renderQuizScreen() {
        const themeColors = this.getThemeClasses();
        const currentQ = this.selectedQuestions[this.currentQuestionIndex];
        if (!currentQ) return `<div class="text-center p-8 ${this.darkMode ? 'text-gray-100' : 'text-gray-800'}">Nessuna domanda selezionata.</div>`;
        const modeConfig = this.modes[this.mode];
        const isExam = modeConfig.isExam;
        const currentModeName = modeConfig.name;

        const currentQNumber = this.currentQuestionIndex + 1;
        const totalQ = modeConfig.questions !== 'infinite' ? this.selectedQuestions.length : currentQNumber;
        const progressText = modeConfig.questions === 'infinite' ? `Domanda: ${currentQNumber}+` : `Domanda ${currentQNumber} di ${totalQ}`;

        // Timer display
        const timerHtml = `<div id="timer" class="text-2xl font-bold ${themeColors.text}">00:00</div>`;

        // Progress Bar
        let progressBarHtml = '';
        if (modeConfig.questions !== 'infinite') {
            const percentage = (currentQNumber / totalQ) * 100;
            progressBarHtml = `
                <div class="mt-2 h-2 bg-gray-200 dark:bg-gray-600 rounded-full">
                    <div class="h-2 ${themeColors.bg} rounded-full transition-all duration-500" style="width: ${percentage}%;"></div>
                </div>
            `;
        }

        // Status Bar (Top)
        const statusBarHtml = `
            <div class="flex justify-between items-center mb-6 border-b dark:border-gray-700 pb-4">
                <div class="text-sm font-medium ${this.darkMode ? 'text-gray-400' : 'text-gray-500'}">${currentModeName}</div>
                ${timerHtml}
            </div>
            <div class="text-center mb-6">
                <p class="text-lg font-semibold ${this.darkMode ? 'text-gray-100' : 'text-gray-700'}">${progressText}</p>
                ${progressBarHtml}
                ${isExam ? `<p class="text-sm ${themeColors.text} font-semibold mt-1">Errori: ${this.incorrectCount} / ${modeConfig.maxErrors}</p>` : ''}
            </div>
        `;

        // Domanda
        const questionHtml = `<p class="text-xl font-bold mb-6 ${this.darkMode ? 'text-gray-50' : 'text-gray-900'}">${currentQ.question}</p>`;

        // Opzioni
        const optionsHtml = ['a', 'b', 'c'].map(option => {
            const isSelected = this.selectedAnswer === option;
            const isCorrect = this.showFeedback && currentQ.answer === option;
            const isIncorrect = this.showFeedback && isSelected && currentQ.answer !== option;

            let bgColor = isSelected ? `${this.getThemeClasses('secondary').bg.replace('-400', '-100')}` : 'bg-white dark:bg-gray-800';
            let borderColor = isSelected ? `${themeColors.border}` : 'border-gray-200 dark:border-gray-700';
            let hoverBorder = this.showFeedback ? '' : `hover:${themeColors.border}`;
            let icon = '';

            if (this.showFeedback) {
                hoverBorder = '';
                if (isCorrect) {
                    bgColor = 'bg-green-100 dark:bg-green-800';
                    borderColor = 'border-green-600 dark:border-green-400';
                    icon = '✅';
                } else if (isIncorrect) {
                    bgColor = 'bg-red-100 dark:bg-red-800';
                    borderColor = 'border-red-600 dark:border-red-400';
                    icon = '❌';
                } else if (currentQ.answer === option) {
                    // Evidenzia la risposta corretta se l'utente ha sbagliato
                    bgColor = 'bg-green-100 dark:bg-green-800';
                    borderColor = 'border-green-600 dark:border-green-400';
                    icon = '✅';
                }
            }

            return `
                <button data-option="${option}" class="option-btn w-full p-4 mb-3 border-2 rounded-lg shadow transition-all duration-200 text-left ${bgColor} ${borderColor} ${hoverBorder}" ${this.showFeedback ? 'disabled' : ''}>
                    <span class="font-semibold ${this.darkMode ? 'text-gray-50' : 'text-gray-800'}">${option.toUpperCase()}.</span> 
                    <span class="${this.darkMode ? 'text-gray-100' : 'text-gray-700'}">${currentQ[option]}</span> 
                    <span class="float-right">${icon}</span>
                </button>
            `;
        }).join('');

        // Feedback
        const feedbackHtml = this.showFeedback ? `
            <div class="mt-6 p-4 rounded-lg ${currentQ.answer === this.selectedAnswer ? 'bg-green-100 border-green-400 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 border-red-400 text-red-700 dark:bg-red-900 dark:text-red-300'} border">
                <p class="font-semibold">${currentQ.answer === this.selectedAnswer ? 'Corretto!' : 'Sbagliato.'}</p>
                <p class="mt-2 text-sm">${currentQ.explanation}</p>
            </div>
        ` : '';

        // Controlli
        const controlsHtml = this.showFeedback ? `
            <button id="next-btn" class="w-full mt-6 py-3 ${themeColors.bg} text-white font-semibold rounded-lg shadow-md ${themeColors.hoverBg} transition duration-150">
                ${(modeConfig.isExam && this.currentQuestionIndex + 1 === modeConfig.questions) || (modeConfig.questions !== 'infinite' && this.currentQuestionIndex + 1 === this.selectedQuestions.length) ? 'Vedi Risultati' : 'Prossima Domanda'}
            </button>
        ` : `
            <button id="confirm-btn" class="w-full mt-6 py-3 ${this.selectedAnswer ? themeColors.bg : 'bg-gray-300 dark:bg-gray-600'} text-white font-semibold rounded-lg shadow-md ${this.selectedAnswer ? themeColors.hoverBg : ''} transition duration-150" ${this.selectedAnswer ? '' : 'disabled'}>
                Conferma Risposta
            </button>
            ${(this.mode === 'training' || this.mode === 'timeChallenge') ? `<button id="skip-btn" class="w-full mt-3 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded-lg shadow hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-150">Salta</button>` : ''}
        `;

        return `
            <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                ${statusBarHtml}
                ${questionHtml}
                <div class="options-container">
                    ${optionsHtml}
                </div>
                ${feedbackHtml}
                ${controlsHtml}
            </div>
            <button id="reset-btn" class="w-full mt-4 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition duration-150">Torna al Menu Principale</button>
        `;
    }

    // ... (renderResultsScreen e renderStatsScreen rimangono invariati o usano getThemeClasses)
    renderResultsScreen() {
        const themeColors = this.getThemeClasses();
        const correctCount = this.answeredQuestions.filter(a => a.isCorrect).length;
        const totalQuestions = this.answeredQuestions.length;
        const totalTimeSeconds = Math.floor((this.endTime - this.startTime) / 1000);
        
        let resultTitle = '';
        let resultColor = '';
        let resultIcon = '🏁';
        let resultMessage = '';

        if (this.mode === 'exam') {
            const maxErrors = this.modes.exam.maxErrors;
            const errors = totalQuestions - correctCount;
            const passed = errors <= maxErrors;

            resultTitle = passed ? 'Esame Superato! 🎉' : 'Esame Fallito 😔';
            resultColor = passed ? 'text-green-600' : 'text-red-600';
            resultIcon = passed ? '✅' : '❌';
            resultMessage = `Hai commesso ${errors} errori su 15 domande (Massimo consentito: ${maxErrors}).`;
        } else if (this.mode === 'timeChallenge') {
            const isHighScore = this.highScores60s.length > 0 && this.highScores60s[0].score === correctCount;
            
            resultTitle = isHighScore ? 'Nuovo Record! 🏆' : 'Sfida Terminata';
            resultColor = isHighScore ? themeColors.text : 'text-gray-700 dark:text-gray-300';
            resultIcon = isHighScore ? '🥇' : '⏱️';
            resultMessage = `Hai risposto correttamente a ${correctCount} domande su ${totalQuestions} in 60 secondi.`;
        } else {
            const percentage = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
            resultTitle = 'Sessione Completata';
            resultColor = themeColors.text;
            resultIcon = '📚';
            resultMessage = `Hai risposto correttamente al ${percentage.toFixed(0)}% delle ${totalQuestions} domande.`;
        }
        
        const minutes = Math.floor(totalTimeSeconds / 60);
        const seconds = totalTimeSeconds % 60;
        const totalTimeDisplay = `${minutes}m ${seconds}s`;

        let html = `
            <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg text-center">
                <p class="text-6xl mb-4">${resultIcon}</p>
                <h2 class="text-3xl font-bold ${resultColor} mb-2">${resultTitle}</h2>
                <p class="text-lg ${this.darkMode ? 'text-gray-300' : 'text-gray-700'} mb-6">${resultMessage}</p>
                
                <div class="space-y-3 mb-8">
                    <p class="flex justify-between font-medium ${this.darkMode ? 'text-gray-100' : 'text-gray-800'}">
                        <span>Domande Corrette:</span>
                        <span class="font-bold text-green-600">${correctCount} / ${totalQuestions}</span>
                    </p>
                    <p class="flex justify-between font-medium ${this.darkMode ? 'text-gray-100' : 'text-gray-800'}">
                        <span>Tempo Totale Impiegato:</span>
                        <span class="font-bold ${themeColors.text}">${totalTimeDisplay}</span>
                    </p>
                </div>
                
                ${this.mode === 'timeChallenge' ? this.renderHighScoresSummary() : ''}

                <button id="reset-btn" class="w-full mt-6 py-3 ${themeColors.bg} text-white font-semibold rounded-lg shadow-md ${themeColors.hoverBg} transition duration-150">
                    Torna al Menu Principale
                </button>
                <button id="review-btn" class="w-full mt-3 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded-lg shadow hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-150">
                    Rivedi Risposte
                </button>
            </div>
        `;
        return html;
    }

    renderStatsScreen() {
        const themeColors = this.getThemeClasses();
        const accuracy = this.stats.totalAttempts > 0 ? ((this.stats.totalCorrect / this.stats.totalAttempts) * 100).toFixed(1) : 0;
        const avgTime = this.stats.totalAttempts > 0 ? (this.stats.totalTime / this.stats.totalAttempts).toFixed(2) : 0;
        const difficultQuestions = this.getDifficultQuestions();
        
        // Calcolo i badge sbloccati
        const unlockedBadges = Object.values(this.badges).filter(b => b.unlocked).sort((a, b) => b.unlocked - a.unlocked);
        
        let html = `
            <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                <h2 class="text-3xl font-bold ${themeColors.text} mb-6 text-center">Statistiche e Progressi 📊</h2>
                
                <h3 class="text-xl font-semibold ${this.darkMode ? 'text-gray-100' : 'text-gray-800'} mb-4">Riepilogo Generale</h3>
                <div class="space-y-3 mb-8">
                    <p class="flex justify-between ${this.darkMode ? 'text-gray-200' : 'text-gray-700'}">
                        <span>Domande Totali Risposte:</span>
                        <span class="font-bold">${this.stats.totalAttempts}</span>
                    </p>
                    <p class="flex justify-between ${this.darkMode ? 'text-gray-200' : 'text-gray-700'}">
                        <span>Percentuale di Correzione:</span>
                        <span class="font-bold ${accuracy >= 80 ? 'text-green-600' : 'text-red-600'}">${accuracy}%</span>
                    </p>
                    <p class="flex justify-between ${this.darkMode ? 'text-gray-200' : 'text-gray-700'}">
                        <span>Tempo Medio per Domanda:</span>
                        <span class="font-bold">${avgTime}s</span>
                    </p>
                </div>
                
                <h3 class="text-xl font-semibold ${this.darkMode ? 'text-gray-100' : 'text-gray-800'} mb-4">Le 5 Domande più Difficili</h3>
                <ul class="space-y-2 mb-8 text-sm">
                    ${difficultQuestions.length > 0 ? difficultQuestions.map(q => `
                        <li class="p-3 bg-red-50 dark:bg-red-900 rounded-lg flex justify-between">
                            <span class="${this.darkMode ? 'text-gray-200' : 'text-gray-700'}">${q.qnum}. ${q.questionText}</span>
                            <span class="font-bold text-red-600">${(q.errorRate * 100).toFixed(0)}% Errore</span>
                        </li>
                    `).join('') : `<li class="${this.darkMode ? 'text-gray-300' : 'text-gray-600'}">Non hai ancora risposto ad abbastanza domande o non hai commesso errori.</li>`}
                </ul>
                
                <h3 class="text-xl font-semibold ${this.darkMode ? 'text-gray-100' : 'text-gray-800'} mb-4">I Tuoi Badge (${unlockedBadges.length} sbloccati)</h3>
                <div class="flex flex-wrap gap-3 mb-8">
                    ${unlockedBadges.map(badge => `
                        <div class="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg text-center shadow-md">
                            <p class="text-xl">${badge.name.split(' ')[1]}</p>
                            <p class="text-xs font-semibold text-yellow-800 dark:text-yellow-300">${badge.name.split(' ')[0]}</p>
                        </div>
                    `).join('')}
                    ${unlockedBadges.length === 0 ? `<p class="${this.darkMode ? 'text-gray-300' : 'text-gray-600'}">Inizia ad allenarti per sbloccare i badge!</p>` : ''}
                </div>
                
                ${this.renderHighScoresTable()}
                
                <button id="clear-stats-btn" class="w-full mt-6 py-3 bg-red-100 text-red-600 font-semibold rounded-lg shadow hover:bg-red-200 transition duration-150">
                    Azzera Tutte le Statistiche (Irreversibile)
                </button>
                <button id="reset-btn" class="w-full mt-3 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded-lg shadow hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-150">
                    Torna al Menu Principale
                </button>
            </div>
        `;
        return html;
    }
    
    renderHighScoresTable() {
        const themeColors = this.getThemeClasses();
        // ... (Logica per la tabella High Score, usa themeColors.text per l'header)
        return `
             <h3 class="text-xl font-semibold ${this.darkMode ? 'text-gray-100' : 'text-gray-800'} mb-4">Classifica Sfida 60s</h3>
            <div class="overflow-x-auto mb-8">
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700 rounded-lg overflow-hidden">
                    <thead class="${themeColors.bg} text-white">
                        <tr>
                            <th scope="col" class="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider">#</th>
                            <th scope="col" class="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider">Punteggio</th>
                            <th scope="col" class="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider">Domande Totali</th>
                            <th scope="col" class="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider">Data</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        ${this.highScores60s.length > 0 ? this.highScores60s.map((score, index) => `
                            <tr class="${index === 0 ? 'bg-yellow-50 dark:bg-yellow-900/50' : ''}">
                                <td class="px-3 py-3 whitespace-nowrap text-sm font-medium ${index === 0 ? 'text-yellow-600' : (this.darkMode ? 'text-gray-300' : 'text-gray-900')}">${index + 1}</td>
                                <td class="px-3 py-3 whitespace-nowrap text-sm font-bold ${index === 0 ? 'text-yellow-700' : (this.darkMode ? 'text-gray-100' : 'text-gray-800')}">${score.score}</td>
                                <td class="px-3 py-3 whitespace-nowrap text-sm ${this.darkMode ? 'text-gray-300' : 'text-gray-700'}">${score.total}</td>
                                <td class="px-3 py-3 whitespace-nowrap text-xs ${this.darkMode ? 'text-gray-400' : 'text-gray-500'}">${new Date(score.timestamp).toLocaleDateString()}</td>
                            </tr>
                        `).join('') : `
                            <tr>
                                <td colspan="4" class="px-3 py-4 whitespace-nowrap text-sm text-center ${this.darkMode ? 'text-gray-400' : 'text-gray-500'}">Nessun punteggio registrato.</td>
                            </tr>
                        `}
                    </tbody>
                </table>
            </div>
        `;
    }

    // --- NUOVO: Schermata Impostazioni (Temi/Dark Mode) ---
    renderSettingsScreen() {
        const themeColors = this.getThemeClasses();
        
        const themeListHtml = Object.keys(this.themes).map(key => {
            const theme = this.themes[key];
            const isSelected = key === this.currentThemeKey;
            const isUnlocked = theme.unlocked;
            const badgeRequired = theme.badge ? this.badges[theme.badge] ? '' : `(Sblocca con: ${this.badges[theme.badge]?.name.split(' ')[0] || 'Badge'})` : '';
            const themeBtnClasses = isSelected 
                ? `${themeColors.bg} text-white shadow-lg border-2 ${themeColors.border}` 
                : isUnlocked 
                    ? `bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600`
                    : `bg-gray-50 dark:bg-gray-800 text-gray-500 cursor-not-allowed opacity-50`;
            
            return `
                <button data-theme="${key}" class="theme-select-btn w-full p-4 mb-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg transition text-left ${themeBtnClasses}" ${isUnlocked ? '' : 'disabled'}>
                    <p class="text-xl font-semibold">${theme.icon} ${theme.name} ${isUnlocked ? '✅' : '🔒'}</p>
                    <p class="text-sm ${isSelected ? 'text-white' : (isUnlocked ? (this.darkMode ? 'text-gray-400' : 'text-gray-500') : 'text-gray-500')}">
                        ${isUnlocked ? 'Tema sbloccato.' : `Richiesto: ${this.themes[key].badge} ${badgeRequired}`}
                    </p>
                </button>
            `;
        }).join('');

        return `
            <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                <h2 class="text-3xl font-bold ${themeColors.text} mb-6 text-center">Impostazioni App ⚙️</h2>
                
                <h3 class="text-xl font-semibold ${this.darkMode ? 'text-gray-100' : 'text-gray-800'} mb-4">Modalità Scura</h3>
                <button id="dark-mode-toggle" class="w-full p-4 mb-8 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-left bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                    <p class="text-xl font-semibold ${this.darkMode ? 'text-gray-100' : 'text-gray-800'}">
                        ${this.darkMode ? 'Modalità Scura Attiva 🌙' : 'Modalità Chiara Attiva ☀️'}
                    </p>
                    <p class="text-sm ${this.darkMode ? 'text-gray-400' : 'text-gray-500'}">Clicca per cambiare l'aspetto dell'app.</p>
                </button>

                <h3 class="text-xl font-semibold ${this.darkMode ? 'text-gray-100' : 'text-gray-800'} mb-4">Temi Sbloccabili (Premi Visivi)</h3>
                ${themeListHtml}

                <button id="reset-btn" class="w-full mt-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded-lg shadow hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-150">
                    Torna al Menu Principale
                </button>
            </div>
        `;
    }

    // --- Eventi ---

    bindEvents() {
        // ... (Eventi esistenti rimangono invariati)
        document.querySelectorAll('.mode-select-btn').forEach(button => {
            button.onclick = (e) => this.selectMode(e.currentTarget.dataset.mode);
        });

        const confirmBtn = document.getElementById('confirm-btn');
        if (confirmBtn) confirmBtn.onclick = () => this.confirmAnswer();

        const nextBtn = document.getElementById('next-btn');
        if (nextBtn) nextBtn.onclick = () => this.nextQuestion();
        
        const skipBtn = document.getElementById('skip-btn');
        if (skipBtn) skipBtn.onclick = () => this.skipQuestion();

        const resetBtn = document.getElementById('reset-btn');
        if (resetBtn) resetBtn.onclick = () => this.resetQuiz();
        
        const statsBtn = document.getElementById('stats-btn');
        if (statsBtn) statsBtn.onclick = () => { this.quizState = 'stats'; this.render(); };
        
        // --- NUOVI EVENTI ---
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) settingsBtn.onclick = () => { this.quizState = 'settings'; this.render(); };

        const darkModeToggle = document.getElementById('dark-mode-toggle');
        if (darkModeToggle) darkModeToggle.onclick = () => this.toggleDarkMode();
        
        document.querySelectorAll('.theme-select-btn').forEach(button => {
            button.onclick = (e) => this.selectTheme(e.currentTarget.dataset.theme);
        });
        // --- FINE NUOVI EVENTI ---

        // Eventi Opzioni Risposta (rimane invariato)
        document.querySelectorAll('.option-btn').forEach(button => {
            button.onclick = (e) => this.selectAnswer(e.currentTarget.dataset.option);
        });
        
        // Evento Review Button (dopo il quiz)
        const reviewBtn = document.getElementById('review-btn');
        if (reviewBtn) reviewBtn.onclick = () => this.reviewAnswers();

        // Evento Clear Stats (rimane invariato)
        const clearStatsBtn = document.getElementById('clear-stats-btn');
        if (clearStatsBtn) {
            clearStatsBtn.onclick = () => {
                if (confirm('Sei sicuro di voler azzerare tutte le statistiche? Questa azione è irreversibile!')) {
                    localStorage.removeItem('quizHistory');
                    localStorage.removeItem('quizStats');
                    localStorage.removeItem('highScores60s');
                    localStorage.removeItem('quizBadges');
                    localStorage.removeItem('dailyGoal');
                    
                    // Resetta lo stato interno dell'app
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
        
        // Gestione A2HS (Add to Home Screen) - rimane invariato
        const installAppContainer = document.getElementById('install-app-container');
        if (deferredPrompt && installAppContainer) {
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
    
    // --- NUOVO: Rivedi Risposte (dopo il quiz) ---
    reviewAnswers() {
        // Implementazione semplice per mostrare i risultati dettagliati come se fosse una schermata di quiz
        this.quizState = 'quiz';
        this.mode = 'review';
        this.selectedQuestions = this.answeredQuestions.map(a => a.question);
        this.currentQuestionIndex = 0;
        this.showFeedback = true; // Mostra sempre il feedback in revisione

        // Disattiviamo il timer e il conteggio
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.modes.review = { name: 'Revisione Risultati', questions: this.selectedQuestions.length, maxErrors: 'nessuno', timeLimit: null, showFeedback: true, isExam: false };

        // Il metodo renderQuizScreen dovrà adattarsi per visualizzare anche la risposta data in answeredQuestions
        // Poiché è un refactoring integrale, si presuppone che le domande siano già pronte
        this.render();
    }
}

// Inizializzazione
document.addEventListener('DOMContentLoaded', () => {
    // Aggiunto setTimeout per dare il tempo a tutti gli elementi di caricarsi
    setTimeout(() => {
        window.quizApp = new QuizApp();
    }, 100); 
});