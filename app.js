// Quiz Antincendio - Progressive Web App
// Vanilla JavaScript version

class QuizApp {
  constructor() {
    this.quizData = [];
    this.selectedQuestions = [];
    this.currentQuestionIndex = 0;
    this.selectedAnswer = null;
    this.incorrectCount = 0;
    this.answeredQuestions = [];
    this.showFeedback = false;
    this.quizState = 'start';
    
    this.NUM_QUESTIONS = 15;
    this.MAX_ERRORS = 3;
    
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

  startQuiz() {
    const shuffled = this.shuffleArray(this.quizData);
    this.selectedQuestions = shuffled.slice(0, Math.min(this.NUM_QUESTIONS, this.quizData.length));
    this.currentQuestionIndex = 0;
    this.incorrectCount = 0;
    this.answeredQuestions = [];
    this.quizState = 'quiz';
    this.selectedAnswer = null;
    this.showFeedback = false;
    this.render();
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
    this.render();
  }

  nextQuestion() {
    if (this.currentQuestionIndex < this.selectedQuestions.length - 1) {
      this.currentQuestionIndex++;
      this.selectedAnswer = null;
      this.showFeedback = false;
      this.render();
    } else {
      this.quizState = 'results';
      this.render();
    }
  }

  skipQuestion() {
    if (this.currentQuestionIndex < this.selectedQuestions.length - 1) {
      this.currentQuestionIndex++;
      this.selectedAnswer = null;
      this.showFeedback = false;
      this.render();
    } else {
      this.quizState = 'results';
      this.render();
    }
  }

  resetQuiz() {
    this.quizState = 'start';
    this.selectedAnswer = null;
    this.showFeedback = false;
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
        <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div class="text-center mb-8">
            <div class="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
              <svg class="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <h1 class="text-3xl font-bold text-gray-800 mb-2">Quiz Antincendio</h1>
            <p class="text-gray-600">Livello 3 - Test di preparazione</p>
          </div>

          <div class="space-y-4 mb-8">
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p class="text-sm text-blue-800">📝 <strong>${this.NUM_QUESTIONS} domande</strong> selezionate casualmente</p>
            </div>
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p class="text-sm text-yellow-800">⚠️ Massimo <strong>${this.MAX_ERRORS} errori</strong> per superare l'esame</p>
            </div>
            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
              <p class="text-sm text-green-800">✅ Rispondi a tutte le domande per completare il test</p>
            </div>
          </div>

          <button id="start-btn" class="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-4 rounded-lg transition-colors shadow-lg">
            Inizia Quiz
          </button>
        </div>
      </div>
    `;
  }

  renderQuizScreen() {
    const currentQuestion = this.selectedQuestions[this.currentQuestionIndex];
    const progress = ((this.currentQuestionIndex + 1) / this.selectedQuestions.length) * 100;

    const optionsHtml = Object.entries(currentQuestion.options).map(([key, value]) => {
      const isSelected = this.selectedAnswer === key;
      const isCorrect = key === currentQuestion.correct_label;
      const showResult = this.showFeedback;

      let buttonClass = "w-full text-left p-4 rounded-lg border-2 transition-all ";
      let icon = '';
      
      if (showResult) {
        if (isCorrect) {
          buttonClass += "border-green-500 bg-green-50";
          icon = `<svg class="w-6 h-6 text-green-600 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>`;
        } else if (isSelected && !isCorrect) {
          buttonClass += "border-red-500 bg-red-50";
          icon = `<svg class="w-6 h-6 text-red-600 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        ${this.currentQuestionIndex < this.selectedQuestions.length - 1 ? 'Prossima Domanda' : 'Vedi Risultati'}
      </button>
    `;

    return `
      <div class="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 p-4">
        <div class="max-w-2xl mx-auto">
          <div class="bg-white rounded-xl shadow-lg p-6 mb-4">
            <div class="flex justify-between items-center mb-4">
              <span class="text-sm font-semibold text-gray-600">
                Domanda ${this.currentQuestionIndex + 1} di ${this.selectedQuestions.length}
              </span>
              <span class="text-sm font-semibold text-red-600">
                Errori: ${this.incorrectCount}/${this.MAX_ERRORS}
              </span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div class="bg-red-600 h-2 rounded-full transition-all duration-300" style="width: ${progress}%"></div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-lg p-6 mb-4">
            <h2 class="text-xl font-bold text-gray-800 mb-6">${currentQuestion.instruction}</h2>
            <div class="space-y-3">
              ${optionsHtml}
            </div>
            ${feedbackHtml}
          </div>

          <div class="flex gap-3">
            ${actionButtons}
          </div>
        </div>
      </div>
    `;
  }

  renderResultsScreen() {
    const passed = this.incorrectCount <= this.MAX_ERRORS;
    const correctCount = this.answeredQuestions.filter(q => q.isCorrect).length;
    const percentage = Math.round((correctCount / this.answeredQuestions.length) * 100);

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
              ${passed ? 'Congratulazioni!' : 'Non Superato'}
            </h2>
            <p class="text-gray-600 text-lg">
              ${passed ? 'Sei stato promosso! ✓' : 'Mi dispiace, sei stato bocciato.'}
            </p>
          </div>

          <div class="grid grid-cols-3 gap-4 mb-8">
            <div class="bg-blue-50 rounded-lg p-4 text-center">
              <p class="text-2xl font-bold text-blue-600">${this.answeredQuestions.length}</p>
              <p class="text-sm text-gray-600">Domande</p>
            </div>
            <div class="bg-green-50 rounded-lg p-4 text-center">
              <p class="text-2xl font-bold text-green-600">${correctCount}</p>
              <p class="text-sm text-gray-600">Corrette</p>
            </div>
            <div class="bg-red-50 rounded-lg p-4 text-center">
              <p class="text-2xl font-bold text-red-600">${this.incorrectCount}</p>
              <p class="text-sm text-gray-600">Errori</p>
            </div>
          </div>

          <div class="mb-8">
            <div class="flex justify-between mb-2">
              <span class="text-sm font-semibold text-gray-600">Percentuale Corrette</span>
              <span class="text-sm font-bold text-gray-800">${percentage}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-3">
              <div class="h-3 rounded-full transition-all ${
                passed ? 'bg-green-600' : 'bg-red-600'
              }" style="width: ${percentage}%"></div>
            </div>
          </div>

          <button id="reset-btn" class="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-4 rounded-lg transition-colors flex items-center justify-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Ricomincia Quiz
          </button>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    // Start screen
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => this.startQuiz());
    }

    // Quiz screen - options
    const optionButtons = document.querySelectorAll('[data-option]');
    optionButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectAnswer(btn.dataset.option);
      });
    });

    // Quiz screen - actions
    const confirmBtn = document.getElementById('confirm-btn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => this.confirmAnswer());
    }

    const skipBtn = document.getElementById('skip-btn');
    if (skipBtn) {
      skipBtn.addEventListener('click', () => this.skipQuestion());
    }

    const nextBtn = document.getElementById('next-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextQuestion());
    }

    // Results screen
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetQuiz());
    }
  }
}

// Inizializza l'app quando il DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
  new QuizApp();
});