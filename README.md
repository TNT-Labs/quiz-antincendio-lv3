# 🔥 Quiz Antincendio - Progressive Web App (PWA)

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![PWA Badge](https://img.shields.io/badge/PWA-Ready-green.svg)](https://web.dev/progressive-web-apps/)

Una Progressive Web App (PWA) completa per la preparazione all'esame del **Quiz Antincendio Livello 3**, con diverse modalità di allenamento, tracciamento dei progressi, statistiche avanzate e funzionalità offline.

## ✨ Caratteristiche Principali

L'applicazione offre un'esperienza di apprendimento ricca e personalizzata per massimizzare l'efficacia dello studio.

* **Modalità Multiple di Quiz:**
    * **🏋️ Allenamento Libero:** Domande illimitate con feedback immediato per una pratica flessibile.
    * **⏱️ Simulazione Esame:** 15 domande, 30 minuti di tempo, con un limite di 5 errori per superare la prova.
    * **🧠 Revisione Intelligente:** Algoritmo di ripetizione spaziata (simile a SuperMemo/Anki) per riproporre le domande più difficili o meno recenti.
    * **❌ Solo Errori:** Concentrati esclusivamente sulle domande a cui hai risposto in modo errato in precedenza.
    * **⚡ Sfida 60 Secondi:** Una sfida a tempo di un minuto per testare la velocità e la precisione.
* **Progressive Web App (PWA):** Installabile su desktop e mobile, con supporto **offline completo** per studiare ovunque.
* **Tracciamento Avanzato:** Statistiche dettagliate su accuratezza media, tempo di risposta medio e classifica dei migliori punteggi nella "Sfida 60 Secondi".
* **Obiettivi e Badge:** Imposta e traccia un obiettivo giornaliero di domande. Sblocca **Badge** per i risultati raggiunti, come superare 10 esami o rispondere a 1000 domande.
* **Personalizzazione:** Modalità scura e temi di colore sbloccabili (es. 'foresta', 'acqua', 'oro') legati al completamento dei badge.

## 💻 Tecnologia

Il progetto è una PWA sviluppata con:

* **HTML/CSS/JavaScript (Vanilla):** Nessun framework esterno per la logica.
* **Tailwind CSS (presunto):** Per la parte di stile (basandosi sulle classi come `bg-white dark:bg-gray-700`, etc.).
* **Local Storage:** Utilizzato per la persistenza di statistiche, storia delle risposte, punteggi e impostazioni.
* **Service Worker:** Per il caching e la funzionalità offline (menzionato in `sw.js` non incluso, ma referenziato in `app.js`).

## 🚀 Utilizzo e Installazione

Questa è una Progressive Web App. Per utilizzarla:

### Uso Semplice (Web)

1.  Clona il repository.
2.  Carica i file su un server web (GitHub Pages, Vercel, ecc.).
3.  Assicurati che il file delle domande (`quiz_antincendio_ocr_improved.json`) sia accessibile.
4.  Apri l'URL nel tuo browser.

### Installazione (PWA)

Essendo una PWA, l'app è installabile su qualsiasi dispositivo:

1.  Apri l'app nel browser (es. Chrome, Edge, Safari, Firefox).
2.  Quando appare il banner **"Aggiungi a schermata Home"** (o tramite l'opzione nel menu del browser), segui le istruzioni per installarla.
3.  L'app verrà eseguita come un'applicazione nativa e sarà disponibile anche senza connessione internet.

### Sviluppo Locale

1.  **Clona il repository:**
    ```bash
    git clone [https://github.com/tuo-utente/quiz-antincendio-pwa.git](https://github.com/tuo-utente/quiz-antincendio-pwa.git)
    cd quiz-antincendio-pwa
    ```
2.  **Aggiungi i dati:**
    * Crea un file chiamato `quiz_antincendio_ocr_improved.json` nella root del progetto contenente l'array di oggetti domanda-risposta.
3.  **Avvia un server locale:**
    * Puoi utilizzare l'estensione "Live Server" per VS Code o un semplice server HTTP da riga di comando (es. `python3 -m http.server`).

## 📁 Struttura del Progetto

La struttura minima necessaria è:
quiz-antincendio-pwa/ 
                    ├── app.js # La logica principale dell'applicazione (QuizApp class) 
                    ├── index.html # Il markup HTML principale 
                    ├── style.css # (File CSS o link al CDN di Tailwind) 
                    ├── sw.js # Il Service Worker per la funzionalità offline/caching 
                    └── quiz_antincendio_ocr_improved.json # File JSON contenente le domande
## ⚙️ Logica Chiave

### Gestione dello Stato e Rendering

La classe `QuizApp` gestisce lo stato completo dell'applicazione (`this.quizState`, `this.mode`, `this.history`, `this.stats`, etc.) e utilizza il metodo `render()` per aggiornare l'interfaccia utente in base allo stato corrente (es. `'start'`, `'quiz'`, `'results'`).

### Algoritmi di Revisione (Smart Review)

Il metodo `getSmartReviewQuestions()` implementa una logica di ripetizione spaziata calcolando una `priority` per ogni domanda. La priorità è influenzata da:

* **Errori:** Le domande sbagliate di recente hanno la priorità massima (`priority = 1000`).
* **Tempo dall'ultima risposta corretta:** Più tempo è passato, più alta è la priorità.
* **Tasso di Errore Storico:** Le domande con un alto tasso di errore hanno un intervallo di revisione più breve.

$$
\text{Intervallo di Revisione} \approx 1 + (1 - \text{Tasso di Errore}) \times 10 \text{ (giorni)}
$$

Le 50 domande con la priorità più alta vengono selezionate per la revisione.

## 🤝 Contributi

I contributi sono benvenuti! Se hai suggerimenti per nuove funzionalità, correzioni di bug o miglioramenti al codice, sentiti libero di aprire una **Issue** o inviare una **Pull Request**.

---

## 📜 Licenza

Questo progetto è distribuito sotto licenza **MIT**.

## 🎯 PROSSIMI PASSI SUGGERITI

### v1.3.7 (Possibili Miglioramenti)
- [ ] **Filtro per argomento** - Seleziona solo domande su un tema specifico
- [ ] **Esportazione PDF** - Scarica riepilogo risultati
- [ ] **Grafici progressione** - Visualizza miglioramento nel tempo
- [ ] **Note personali** - Aggiungi appunti alle domande
- [ ] **Segnalibri** - Marca domande da rivedere

### v1.4.0 (Feature Maggiori)
- [ ] **Modalità multiplayer locale** - Sfida un amico
- [ ] **Text-to-Speech** - Lettura vocale domande
- [ ] **Quiz vocale** - Rispondi con la voce
- [ ] **Sincronizzazione cloud** - Backup automatico

*Ultima modifica: 29 Ottobre 2025*

