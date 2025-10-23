// Quiz Antincendio - Progressive Web App
// Versione con modalità Allenamento, Esame, Solo Errori, Sfida 60s, Revisione Intelligente, Obiettivi Giornalieri, Temi e Dark Mode.
// Correzione Cruciale: Gestione dello stato 'loading' per risolvere la race condition nel caricamento dei dati.

// Variabile globale per A2HS (Add to Home Screen), necessaria per la comunicazione tra app e browser
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
        this.answeredQuestions = []; // Risposte della sessione corrente
        this.showFeedback = false;
        
        // ** STATO CRUCIALE **: Inizializza l'app in stato di caricamento
        this.quizState = 'loading'; // 'loading', 'error', 'start', 'quiz', 'results', 'stats', 'settings'
        
        this.mode = null; // 'training', 'exam', 'errorsOnly', 'timeChallenge', 'smartReview', 'review'

        // Timer e tempi
        this.startTime = null; 
        this.endTime = null; 
        this.timerInterval = null;
        this.timeRemaining = 0;
        this.questionStartTime = null; 

        // Dati persistenti
        this.history = []; // [{qnum, isCorrect, timestamp, mode, timeSpent}]
        this.stats = { totalAttempts: 0, totalCorrect: 0, totalTime: 0, totalQuestions: 350 };
        this.highScores60s = []; // [{score, timestamp}]
        this.badges = {}; // {'fireMaster': true, 'streak5days': false}
        this.dailyGoal = {
            target: 50, 
            completedToday: 0,
            lastGoalDate: new Date().toLocaleDateString('it-IT') 
        };
        this.settings = {
            darkMode: false,
            theme: 'red', // 'red', 'forest', 'water', 'gold'
            unlockedThemes: ['red'] // Il tema base è sempre sbloccato
        };

        this.loadPersistentData();
        this.checkDailyGoal();
        this.applySettings();
        
        // ** AVVIA IL CARICAMENTO DEI DATI IN MODO ASINCRONO **
        this.loadData();
    }

    // **********************************************
    // 1. GESTIONE CARICAMENTO DATI (CORREZIONE CRUCIALE)
    // **********************************************

    async loadData() {
        try {
            // Tenta di scaricare il file JSON delle domande
            const response = await fetch('quiz_antincendio_ocr_improved.json');
            if (!response.ok) {
                throw new Error(`Impossibile caricare i dati: Stato HTTP ${response.status}`);
            }
            const data = await response.json();
            
            this.quizData = data.map((q, index) => ({ 
                ...q, 
                qnum: index + 1 // Assegna il numero della domanda in base all'indice
            }));
            
            this.stats.totalQuestions = this.quizData.length;
            this.quizState = 'start'; // Dati caricati, passa allo stato di inizio
            
            // Ordina casualmente per assicurare che l'allenamento casuale sia pronto
            this.quizData.sort(() => Math.random() - 0.5); 
            
        } catch (error) {
            console.error("Errore caricamento dati quiz:", error);
            this.quizState = 'error'; // Passa allo stato di errore
        } finally {
            this.hideInitialLoadingScreen(); // Nasconde lo spinner iniziale nel body
            this.render(); // Renderizza l'interfaccia utente con il nuovo stato
            this.handleA2HS(); // Gestisce il banner A2HS dopo il primo render
        }
    }

    /**
     * Nasconde il div #loading in index.html dopo che l'app è pronta.
     * Integrato con la correzione del file index.html.
     */
    hideInitialLoadingScreen() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'none';
        }
    }
    
    // **********************************************
    // 2. FUNZIONI DI BASE & PERSISTENZA
    // **********************************************

    loadPersistentData() {
        // ... (Logica di caricamento da localStorage)
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
            // Assicura che 'red' sia sempre presente come tema sbloccato
            if (!this.settings.unlockedThemes || !this.settings.unlockedThemes.includes('red')) {
                this.settings.unlockedThemes = this.settings.unlockedThemes || [];
                if (!this.settings.unlockedThemes.includes('red')) {
                    this.settings.unlockedThemes.push('red');
                }
            }
        }
    }

    savePersistentData() {
        // ... (Logica di salvataggio su localStorage)
        localStorage.setItem('quizHistory', JSON.stringify(this.history));
        localStorage.setItem('quizStats', JSON.stringify(this.stats));
        localStorage.setItem('highScores60s', JSON.stringify(this.highScores60s));
        localStorage.setItem('quizBadges', JSON.stringify(this.badges));
        localStorage.setItem('dailyGoal', JSON.stringify(this.dailyGoal));
        localStorage.setItem('quizSettings', JSON.stringify(this.settings));
    }
    
    applySettings() {
        // ... (Logica per applicare Dark Mode e Tema)
        const rootElement = document.documentElement;
        if (this.settings.darkMode) {
            rootElement.classList.add('dark');
        } else {
            rootElement.classList.remove('dark');
        }

        const themeColor = this.getThemeColor(this.settings.theme);
        document.documentElement.style.setProperty('--theme-color', themeColor);
        document.querySelector('meta[name="theme-color"]').setAttribute('content', themeColor);
    }
    
    getThemeColor(themeName) {
        // ... (Mappatura dei temi)
        switch (themeName) {
            case 'forest': return '#16a34a'; // Verde
            case 'water': return '#0284c7'; // Blu
            case 'gold': return '#ca8a04'; // Oro
            case 'red':
            default: return '#dc2626'; // Rosso
        }
    }
    
    // **********************************************
    // 3. LOGICA QUIZ
    // **********************************************

    selectMode(mode) {
        // ** CONTROLLO CRUCIALE **: Blocco se i dati non sono stati caricati
        if (this.quizData.length === 0) {
            alert("I dati del quiz non sono ancora stati caricati. Riprova tra un momento.");
            return;
        }
        
        this.mode = mode;
        this.incorrectCount = 0;
        this.answeredQuestions = [];
        this.startTime = Date.now();
        this.questionStartTime = Date.now();
        
        switch(mode) {
            case 'training':
                this.selectedQuestions = [...this.quizData]; 
                this.selectedQuestions.sort(() => Math.random() - 0.5);
                this.quizState = 'quiz';
                break;
            case 'exam':
                this.selectedQuestions = this.getExamQuestions();
                this.timeRemaining = 30 * 60; // 30 minuti in secondi
                this.startTimer(1000, () => this.checkExamTime());
                this.quizState = 'quiz';
                break;
            case 'errorsOnly':
                this.selectedQuestions = this.getReviewQuestions(0.7); 
                if (this.selectedQuestions.length === 0) {
                    alert("Non hai abbastanza errori da rivedere. Continua ad allenarti!");
                    this.quizState = 'start';
                } else {
                    this.selectedQuestions.sort(() => Math.random() - 0.5);
                    this.quizState = 'quiz';
                }
                break;
            case 'smartReview':
                this.selectedQuestions = this.getSmartReviewQuestions();
                if (this.selectedQuestions.length === 0) {
                    alert("Non ci sono domande da rivedere in base alla ripetizione spaziata. Ottimo lavoro!");
                    this.quizState = 'start';
                } else {
                    this.selectedQuestions.sort(() => Math.random() - 0.5);
                    this.quizState = 'quiz';
                }
                break;
            case 'timeChallenge':
                this.selectedQuestions = [...this.quizData]; 
                this.selectedQuestions.sort(() => Math.random() - 0.5);
                this.timeRemaining = 60; // 60 secondi
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
        // ... (Logica per selezionare 15 domande casuali)
        const shuffled = [...this.quizData].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 15);
    }
    
    getReviewQuestions(minErrorRate) {
        // ... (Logica per selezionare domande con alto tasso di errore)
        const questionStats = this.getQuestionStats();
        return this.quizData.filter(q => {
            const stats = questionStats[q.qnum] || { total: 0, incorrect: 0 };
            if (stats.total === 0) return false;
            const errorRate = stats.incorrect / stats.total;
            return errorRate >= minErrorRate;
        });
    }

    getSmartReviewQuestions() {
        // ... (Logica complessa di Spaced Repetition)
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
                    const timeSinceLastReview = (now - lastHistory.timestamp) / (1000 * 60 * 60 * 24); // Giorni
                    
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
        // ... (Logica per calcolare le statistiche per ogni domanda)
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
        // ... (Logica per verificare la risposta, salvare la cronologia e aggiornare le stats)
        if (this.mode === 'results' || this.selectedAnswer !== null) return; 

        this.selectedAnswer = selectedLabel;
        const currentQ = this.selectedQuestions[this.currentQuestionIndex];
        const isCorrect = (currentQ.correct_label === selectedLabel);
        
        if (!isCorrect) {
            this.incorrectCount++;
        }
        
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
                this.endQuiz(); // Fine immediata se si sbaglia
                return;
            }
        }
        
        if (this.mode !== 'training') {
            this.answeredQuestions.push({ question: currentQ, isCorrect, selectedLabel, timeSpent });
        }
        
        this.render();
    }
    
    nextQuestion() {
        // ... (Logica per passare alla domanda successiva e concludere il quiz)
        if (this.quizState !== 'quiz') return;

        if (this.mode === 'training') {
            this.selectedAnswer = null;
        }

        if (this.mode !== 'training' && this.selectedAnswer === null) return; 
        
        this.currentQuestionIndex++;
        this.selectedAnswer = null;
        this.questionStartTime = Date.now(); 
        
        if (this.currentQuestionIndex >= this.selectedQuestions.length) {
            this.endQuiz();
        } else {
            this.render();
        }
    }

    endQuiz() {
        // ... (Logica per la fine del quiz e check high score/badge)
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
        this.savePersistentData();
        this.render();
    }
    
    reviewAnswers() {
        // ... (Logica per avviare la modalità di revisione risultati)
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.quizState = 'quiz';
        this.mode = 'review';
        this.selectedQuestions = this.answeredQuestions.map(a => a.question);
        this.currentQuestionIndex = 0;
        this.showFeedback = true; 
        this.render();
    }
    
    // ... (metodi startTimer, checkExamTime, checkTimeChallengeTime, checkDailyGoal, checkBadges, unlockBadge, checkHighScore60s, ecc.)

    // **********************************************
    // 4. RENDERING E UI
    // **********************************************

    render() {
        // Determina il colore del tema
        const themeColorHex = this.getThemeColor(this.settings.theme);
        document.documentElement.style.setProperty('--theme-color', themeColorHex);
        
        // Tailwind classes dinamiche per i pulsanti (semplificazione, i colori devono essere nel file tailwind.config)
        const primaryColorClass = `bg-[${themeColorHex}] text-white hover:bg-[${themeColorHex}]`;
        const primaryTextClass = `text-[${themeColorHex}]`;
        
        let htmlContent = '';

        switch (this.quizState) {
            case 'loading':
                // Non renderizza nulla qui, lo spinner è in index.html, nascosto quando i dati arrivano.
                htmlContent = ''; 
                break;
            case 'error':
                htmlContent = this.renderError();
                break;
            case 'start':
                htmlContent = this.renderStartMenu(primaryColorClass, primaryTextClass);
                break;
            case 'quiz':
                htmlContent = this.renderQuiz(primaryColorClass, primaryTextClass);
                break;
            case 'results':
                htmlContent = this.renderResults(primaryColorClass);
                break;
            case 'stats':
                htmlContent = this.renderStats(primaryColorClass, primaryTextClass);
                break;
            case 'settings':
                htmlContent = this.renderSettings(primaryColorClass, primaryTextClass);
                break;
        }

        this.root.innerHTML = htmlContent;
        this.addEventListeners();
    }
    
    renderError() {
        return `
            <div class="text-center p-8 mt-10 rounded-xl shadow-2xl bg-white dark:bg-gray-700 border-t-8 border-red-600">
                <h2 class="text-3xl font-extrabold text-red-700 dark:text-red-300 mb-4">🚨 Errore di Caricamento Dati</h2>
                <p class="text-gray-700 dark:text-gray-200 mb-6">
                    L'app non è riuscita a caricare il file delle domande (<code>quiz_antincendio_ocr_improved.json</code>).
                </p>
                <p class="text-md text-gray-600 dark:text-gray-400 mb-6 font-semibold">
                    Ciò è quasi sempre dovuto a:
                    <ol class="list-disc list-inside text-left mx-auto max-w-sm mt-3">
                        <li>Il file JSON non è presente nella cartella principale.</li>
                        <li>Il **Service Worker** sta servendo una versione vecchia o corrotta.</li>
                    </ol>
                </p>
                <p class="text-sm text-red-500 dark:text-red-400 mb-6">
                    **Soluzione:** Per favore, assicurati di aver aggiornato <code>sw.js</code> con un nuovo <code>CACHE_NAME</code>, e poi prova a ricaricare la pagina con **Ctrl+Shift+R** o **Cmd+Shift+R** (Hard Reload).
                </p>
                <button onclick="window.location.reload()" class="bg-red-600 text-white px-6 py-3 rounded-full font-bold hover:bg-red-700 transition duration-150 shadow-lg">
                    Ricarica Applicazione
                </button>
            </div>
        `;
    }

    renderStartMenu(themeClass, themeTextClass) {
        // ... (Codice completo per il menu di avvio)
        return `
            <h1 class="text-4xl font-extrabold text-center mb-6 ${themeTextClass}">🔥 Quiz Antincendio</h1>
            <p class="text-center text-sm mb-8 dark:text-gray-300">
                ${this.stats.totalQuestions} domande totali | Obiettivo Giornaliero: ${this.dailyGoal.completedToday}/${this.dailyGoal.target} 
                <span class="${this.dailyGoal.completedToday >= this.dailyGoal.target ? 'text-green-500' : 'text-yellow-500'}">(${this.dailyGoal.completedToday >= this.dailyGoal.target ? 'Completato' : 'In Corso'})</span>
            </p>

            <div class="space-y-4">
                <button onclick="window.quizApp.selectMode('training')" class="w-full bg-[var(--theme-color)] text-white font-bold py-3 px-4 rounded-xl shadow-lg transition duration-150 transform hover:scale-[1.02]">
                    <span class="text-lg">🏋️ Allenamento Libero</span>
                    <p class="text-xs opacity-80 mt-1">Nessun limite, feedback immediato.</p>
                </button>

                <button onclick="window.quizApp.selectMode('exam')" class="w-full bg-yellow-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition duration-150 transform hover:scale-[1.02]">
                    <span class="text-lg">⏱️ Simulazione Esame</span>
                    <p class="text-xs opacity-80 mt-1">15 domande, 30 minuti, max 5 errori.</p>
                </button>

                <button onclick="window.quizApp.selectMode('smartReview')" class="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition duration-150 transform hover:scale-[1.02]">
                    <span class="text-lg">🧠 Revisione Intelligente</span>
                    <p class="text-xs opacity-80 mt-1">Ripetizione Spaziata. Rivedi le domande più difficili al momento giusto.</p>
                </button>

                <button onclick="window.quizApp.selectMode('errorsOnly')" class="w-full bg-red-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition duration-150 transform hover:scale-[1.02]">
                    <span class="text-lg">❌ Solo Errori</span>
                    <p class="text-xs opacity-80 mt-1">Riprova solo le domande a cui hai risposto in modo errato.</p>
                </button>

                <button onclick="window.quizApp.selectMode('timeChallenge')" class="w-full bg-purple-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition duration-150 transform hover:scale-[1.02]">
                    <span class="text-lg">⚡ Sfida 60 Secondi</span>
                    <p class="text-xs opacity-80 mt-1">Un minuto per il punteggio più alto. Un solo errore ti elimina!</p>
                </button>
            </div>
            
            <div class="fixed bottom-0 left-0 right-0 max-w-xl mx-auto bg-white dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 shadow-2xl z-40">
                <div class="flex justify-around items-center h-16">
                    <button onclick="window.quizApp.quizState = 'start'; window.quizApp.render();" class="flex flex-col items-center justify-center ${this.quizState === 'start' ? primaryTextClass : 'text-gray-500 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400'}">
                        <span class="text-2xl">🏠</span>
                        <span class="text-xs font-medium">Home</span>
                    </button>
                    <button onclick="window.quizApp.quizState = 'stats'; window.quizApp.render();" class="flex flex-col items-center justify-center ${this.quizState === 'stats' ? primaryTextClass : 'text-gray-500 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400'}">
                        <span class="text-2xl">📊</span>
                        <span class="text-xs font-medium">Statistiche</span>
                    </button>
                    <button onclick="window.quizApp.quizState = 'settings'; window.quizApp.render();" class="flex flex-col items-center justify-center ${this.quizState === 'settings' ? primaryTextClass : 'text-gray-500 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400'}">
                        <span class="text-2xl">⚙️</span>
                        <span class="text-xs font-medium">Impostazioni</span>
                    </button>
                </div>
            </div>
        `;
    }
    
    // ... (metodi renderQuiz, renderResults, renderStats, renderSettings, ecc.)
    // La logica per gli altri metodi di rendering (quiz, risultati, statistiche, impostazioni) rimane invariata e deve essere inclusa nel file completo.
    
    // Metodo per gestire il banner A2HS (Add to Home Screen)
    handleA2HS() {
        const installAppContainer = document.getElementById('install-app-container');
        if (deferredPrompt && installAppContainer) {
            if (window.matchMedia('(display-mode: standalone)').matches || navigator.standalone) {
                installAppContainer.style.display = 'none'; // Già installata
                return;
            }
            
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
    
    addEventListeners() {
        // Aggiunge i listener per i bottoni dinamici renderizzati in this.render()
        // Ad esempio: document.getElementById('toggle-dark-mode').onclick = () => this.toggleDarkMode();
        // Lascia vuoto se tutti i click sono gestiti via 'onclick="window.quizApp.method()"' nell'HTML renderizzato.
    }

    // ... (Includi qui TUTTI gli altri metodi come toggleDarkMode, resetStats, checkBadges, ecc. per un file completo)
    
}

// ** INIZIALIZZAZIONE **
document.addEventListener('DOMContentLoaded', () => {
    // Rimuoviamo il setTimeout, la gestione del caricamento è ora gestita da QuizApp.loadData()
    window.quizApp = new QuizApp();
});