// Quiz Antincendio - Progressive Web App
// Versione con modalità Allenamento e Simulazione Esame

class QuizApp {
  constructor() {
    this.quizData = [];
    this.selectedQuestions = [];
    this.currentQuestionIndex = 0;
    this.selectedAnswer = null;
    this.incorrectCount = 0;
    this.answeredQuestions = [];
    this.showFeedback = false;
    this.quizState = 'start'; // start, modeSelect, quiz, results
    this.mode = null; // 'training' o 'exam'
    
    // Timer
    this.startTime = null;
    this.endTime = null;
    this.timerInterval = null;
    this.timeRemaining = 0;
    
    // Configurazioni modalità
    this.modes = {
      training: {
        name: 'Allenamento',
        questions: 'infinite',
        maxErrors: 'nessuno',
        timeLimit: null,
        description: 'Impara dai test senza limiti di tempo ed errori'
      },
      exam: {
        name: 'Simulazione Esame',
        questions: 15,
        maxErrors: 5,
        timeLimit: 30 * 60, // 30 minuti in secondi
        description: '15 domande, 30 minuti, massimo 5 errori'
      }
    };
    
    this.init();
  }

  async init() {
    await this.loadQuizData();
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

  startQuiz() {
    const config = this.modes[this.mode];
    const shuffled = this.shuffleArray(this.quizData);
    
    if (this.mode === 'training') {
      // In modalità allenamento, carica tutte le domande
      this.selectedQuestions = shuffled;
    } else {
      // In modalità esame, solo 15 domande
      this.selectedQuestions = shuffled.slice(0, config.questions);
    }
    
    this.currentQuestionIndex = 0;
    this.incorrectCount = 0;
    this.answeredQuestions = [];
    this.selectedAnswer = null;
    this.showFeedback = false;
    
    // Avvia timer
    this.startTime = Date.now();
    if (this.mode === 'exam') {
      this.timeRemaining = config.timeLimit;
      this.startTimer();
    }
    
    this.render();
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      this.timeRemaining--;
      
      // Aggiorna display timer
      const timerElement = document.getElementById('timer-display');
      if (timerElement) {
        timerElement.textContent = this.formatTime(this.timeRemaining);
        
        // Colore rosso sotto 5 minuti
        if (this.timeRemaining <= 300) {
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

  selectAnswer(option) {
    if (this.showFeedback) return;
    this.selectedAnswer = option;
    this.render();
  }

  confirmAnswer() {
    if (!this.selectedAnswer) return;

    const currentQuestion = this.selectedQuestions[this.currentQuestionIndex];
    const isCorrect = this.selectedAnswer === currentQuestion.correct_label;
    
    if (!isCorrect) {
      this.incorrectCount++;
    }

    this.answeredQuestions.push({
      question: currentQuestion,
      userAnswer: this.selectedAnswer,
      isCorrect
    });

    this.showFeedback = true;
    
    // In modalità esame, controlla se superato limite errori
    if (this.mode === 'exam' && this.incorrectCount > this.modes.exam.maxErrors) {
      setTimeout(() => this.endQuiz(), 2000);
    }
    
    this.render();
  }

  nextQuestion() {
    if (this.currentQuestionIndex < this.selectedQuestions.length - 1) {
      this.currentQuestionIndex++;
      this.selectedAnswer = null;
      this.showFeedback = false;
      this.render();
    } else {
      this.endQuiz();
    }
  }

  skipQuestion() {
    if (this.currentQuestionIndex < this.selectedQuestions.length - 1) {
      this.currentQuestionIndex++;
      this.selectedAnswer = null;
      this.showFeedback = false;
      this.render();
    } else {
      this.endQuiz();
    }
  }

  endQuiz() {
    this.stopTimer();
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

  render() {
    const root = document.getElementById('root');
    
    if (this.quizState === 'start') {
      root.innerHTML = this.renderStartScreen();
    } else if (this.quizState === 'quiz') {
      root.innerHTML = this.renderQuizScreen();
    } else if (this.quizState === 'results') {
      root.innerHTML = this.renderResultsScreen();
    }

    this.attachEventListeners();
  }

  renderStartScreen() {
    return `
      <div class="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl w-full">
          <div class="text-center mb-8">
            <div class="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
              <svg class="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <h1 class="text-4xl font-bold text-gray-800 mb-2">Quiz Antincendio</h1>
            <p class="text-gray-600 text-lg">Livello 3 - Scegli la modalità</p>
          </div>

          <div class="grid md:grid-cols-2 gap-6">
            <!-- Modalità Allenamento -->
            <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200 hover:border-blue-400 transition-all cursor-pointer transform hover:scale-105" data-mode="training">
              <div class="flex items-center mb-4">
                <div class="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                  </svg>
                </div>
                <h2 class="text-2xl font-bold text-blue-800">Allenamento</h2>
              </div>
              
              <p class="text-blue-700 mb-4">Impara dai test senza limiti</p>
              
              <div class="space-y-2 mb-6">
                <div class="flex items-center text-sm text-blue-800">
                  <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  Domande illimitate
                </div>
                <div class="flex items-center text-sm text-blue-800">
                  <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  Senza limite di tempo
                </div>
                <div class="flex items-center text-sm text-blue-800">
                  <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  Nessun limite di errori
                </div>
                <div class="flex items-center text-sm text-blue-800">
                  <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  Feedback immediato
                </div>
              </div>
              
              <button class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors">
                Inizia Allenamento
              </button>
            </div>

            <!-- Modalità Simulazione Esame -->
            <div class="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border-2 border-red-200 hover:border-red-400 transition-all cursor-pointer transform hover:scale-105" data-mode="exam">
              <div class="flex items-center mb-4">
                <div class="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mr-4">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <h2 class="text-2xl font-bold text-red-800">Simulazione Esame</h2>
              </div>
              
              <p class="text-red-700 mb-4">Prova l'esame reale</p>
              
              <div class="space-y-2 mb-6">
                <div class="flex items-center text-sm text-red-800">
                  <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  15 domande casuali
                </div>
                <div class="flex items-center text-sm text-red-800">
                  <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  30 minuti di tempo
                </div>
                <div class="flex items-center text-sm text-red-800">
                  <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  Massimo 5 errori
                </div>
                <div class="flex items-center text-sm text-red-800">
                  <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  Condizioni reali esame
                </div>
              </div>
              
              <button class="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition-colors">
                Inizia Simulazione
              </button>
            </div>
          </div>

          <div class="mt-8 text-center text-sm text-gray-600">
            <p>💡 Consiglio: Inizia con l'allenamento per familiarizzare con le domande</p>
          </div>
        </div>
      </div>
    `;
  }

  renderQuizScreen() {
    const currentQuestion = this.selectedQuestions[this.currentQuestionIndex];
    const config = this.modes[this.mode];
    const progress = this.mode === 'training' 
      ? 0 
      : ((this.currentQuestionIndex + 1) / this.selectedQuestions.length) * 100;

    const optionsHtml = Object.entries(currentQuestion.options).map(([key, value]) => {
      const isSelected = this.selectedAnswer === key;
      const isCorrect = key === currentQuestion.correct_label;
      const showResult = this.showFeedback;

      let buttonClass = "w-full text-left p-4 rounded-lg border-2 transition-all ";
      let icon = '';
      
      if (showResult) {
        if (isCorrect) {
          buttonClass += "border-green-500 bg-green-50";
          icon = `<svg class="w-6 h-6 text-green-600 ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>`;
        } else if (isSelected && !isCorrect) {
          buttonClass += "border-red-500 bg-red-50";
          icon = `<svg class="w-6 h-6 text-red-600 ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>`;
        } else {
          buttonClass += "border-gray-200 bg-gray-50";
        }
      } else {
        buttonClass += isSelected
          ? "border-red-600 bg-red-50"
          : "border-gray-300 hover:border-red-400 hover:bg-red-50";
      }

      return `
        <button data-option="${key}" class="${buttonClass}" ${showResult ? 'disabled' : ''}>
          <div class="flex items-start">
            <span class="font-bold text-red-600 mr-3 min-w-[24px]">${key}:</span>
            <span class="flex-1 text-gray-700">${value}</span>
            ${icon}
          </div>
        </button>
      `;
    }).join('');

    const feedbackHtml = this.showFeedback ? `
      <div class="mt-6 p-4 rounded-lg ${
        this.selectedAnswer === currentQuestion.correct_label
          ? 'bg-green-50 border border-green-200'
          : 'bg-red-50 border border-red-200'
      }">
        <p class="font-semibold mb-2 ${
          this.selectedAnswer === currentQuestion.correct_label
            ? 'text-green-800'
            : 'text-red-800'
        }">
          ${this.selectedAnswer === currentQuestion.correct_label ? '✅ Corretto!' : '❌ Sbagliato'}
        </p>
        ${this.selectedAnswer !== currentQuestion.correct_label ? `
          <p class="text-sm text-gray-700">
            La risposta corretta era: <strong>${currentQuestion.correct_label}</strong> - ${currentQuestion.correct_text}
          </p>
        ` : ''}
      </div>
    ` : '';

    const actionButtons = !this.showFeedback ? `
      ${this.mode === 'training' ? `
        <button id="end-training-btn" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-4 rounded-lg transition-colors">
          Termina
        </button>
      ` : ''}
      <button id="skip-btn" class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-4 rounded-lg transition-colors">
        Salta
      </button>
      <button id="confirm-btn" class="flex-1 font-semibold py-4 rounded-lg transition-colors ${
        this.selectedAnswer
          ? 'bg-red-600 hover:bg-red-700 text-white'
          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
      }" ${!this.selectedAnswer ? 'disabled' : ''}>
        Conferma
      </button>
    ` : `
      <button id="next-btn" class="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-4 rounded-lg transition-colors">
        ${(this.mode === 'exam' && this.currentQuestionIndex < this.selectedQuestions.length - 1) || this.mode === 'training' ? 'Prossima Domanda' : 'Vedi Risultati'}
      </button>
    `;

    return `
      <div class="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 p-4">
        <div class="max-w-2xl mx-auto">
          <!-- Header con info -->
          <div class="bg-white rounded-xl shadow-lg p-6 mb-4">
            <div class="flex justify-between items-center mb-4">
              <div>
                <span class="text-xs font-semibold text-gray-500 uppercase">${config.name}</span>
                <p class="text-sm font-semibold text-gray-600">
                  ${this.mode === 'training' 
                    ? `Domanda ${this.currentQuestionIndex + 1}`
                    : `Domanda ${this.currentQuestionIndex + 1} di ${this.selectedQuestions.length}`
                  }
                </p>
              </div>
              <div class="text-right">
                ${this.mode === 'exam' ? `
                  <div class="flex items-center gap-2 text-sm font-semibold">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span id="timer-display" class="${this.timeRemaining <= 300 ? 'text-red-600' : 'text-gray-700'}">${this.formatTime(this.timeRemaining)}</span>
                  </div>
                ` : `
                  <div class="flex items-center gap-2 text-sm text-gray-600">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span>${this.formatTime(this.getElapsedTime())}</span>
                  </div>
                `}
                <p class="text-sm font-semibold ${this.mode === 'exam' && this.incorrectCount > 3 ? 'text-red-600' : 'text-gray-700'}">
                  Errori: ${this.incorrectCount}${this.mode === 'exam' ? `/${config.maxErrors}` : ''}
                </p>
              </div>
            </div>
            ${this.mode === 'exam' ? `
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="bg-red-600 h-2 rounded-full transition-all duration-300" style="width: ${progress}%"></div>
              </div>
            ` : ''}
          </div>

          <!-- Domanda -->
          <div class="bg-white rounded-xl shadow-lg p-6 mb-4">
            <h2 class="text-xl font-bold text-gray-800 mb-6">${currentQuestion.instruction}</h2>
            <div class="space-y-3">
              ${optionsHtml}
            </div>
            ${feedbackHtml}
          </div>

          <!-- Pulsanti azione -->
          <div class="flex gap-3">
            ${actionButtons}
          </div>
        </div>
      </div>
    `;
  }

  renderResultsScreen() {
    const config = this.modes[this.mode];
    const correctCount = this.answeredQuestions.filter(q => q.isCorrect).length;
    const totalQuestions = this.answeredQuestions.length;
    const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const elapsedTime = this.getElapsedTime();
    
    let passed = false;
    let message = '';
    
    if (this.mode === 'exam') {
      passed = this.incorrectCount <= config.maxErrors && elapsedTime <= config.timeLimit;
      message = passed 
        ? 'Hai superato la simulazione! 🎉'
        : this.incorrectCount > config.maxErrors 
          ? 'Troppi errori. Riprova!'
          : 'Tempo scaduto!';
    } else {
      passed = percentage >= 70;
      message = `Hai completato l'allenamento!`;
    }

    return `
      <div class="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
          <div class="text-center mb-8">
            <div class="inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 ${
              passed ? 'bg-green-100' : 'bg-red-100'
            }">
              ${passed ? `
                <svg class="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
                </svg>
              ` : `
                <svg class="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              `}
            </div>
            <h2 class="text-3xl font-bold mb-2 ${passed ? 'text-green-600' : 'text-red-600'}">
              ${this.mode === 'exam' ? (passed ? 'Esame Superato!' : 'Esame Non Superato') : 'Allenamento Completato'}
            </h2>
            <p class="text-gray-600 text-lg">${message}</p>
            <p class="text-sm text-gray-500 mt-2">Modalità: ${config.name}</p>
          </div>