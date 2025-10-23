# 🔥 Quiz Antincendio - Livello 3

Progressive Web App (PWA) avanzata per la preparazione all'esame Antincendio di Livello 3.

---

## ✨ Caratteristiche Aggiornate (v1.3.0)

- ✅ **350 domande ufficiali** con risposte e spiegazioni
- 🎓 **Cinque modalità di studio potenziate:**
  - **Allenamento**: domande illimitate, feedback immediato.
  - **Simulazione Esame**: 15 domande, 30 minuti, max 5 errori.
  - **Solo Errori**: Rivedi solo le domande a cui hai sbagliato in passato.
  - **Sfida 60s**: Rispondi a quante più domande puoi in un minuto.
  - 🧠 **Revisione Intelligente**: Utilizza la logica della **ripetizione spaziata** per riproporre le domande più difficili al momento ottimale.
- 🎯 **Obiettivi Giornalieri**: Traccia il tuo progresso verso un obiettivo di studio quotidiano e mantieni la tua "streak".
- ⏱️ **Classifica Locale 60s**: Competi contro te stesso e traccia i tuoi migliori punteggi nella Sfida 60s.

---

## 🎨 Personalizzazione e Premi Visivi (NOVITÀ)

### 🌑 Dark Mode e Temi

L'app ora include la **Modalità Scura** per ridurre l'affaticamento visivo e introduce la personalizzazione basata sui risultati:

| Funzionalità | Descrizione |
| :--- | :--- |
| **Modalità Scura** | Attivabile nelle impostazioni per migliorare l'esperienza utente in condizioni di scarsa illuminazione. |
| **Premi Visivi (Temi)** | Sblocca nuovi schemi di colore (es. Tema Acqua 💧, Tema Foresta 🌲, Tema Oro 👑) raggiungendo determinati **Badge** e risultati di studio. |
| **Feedback Avanzato** | Animazioni visive ("pulse") immediate alla conferma della risposta per un feedback più coinvolgente. |

### 🏆 Badge e Sblocco

L'app traccia i tuoi successi e sblocca i temi:

| Badge | Descrizione | Sblocca Tema |
| :--- | :--- | :--- |
| **Maestro del Fuoco** | 10 simulazioni d'esame superate. | Tema Foresta 🌲 |
| **Studente Pro** | 1000 domande risposte in Allenamento/Revisione. | Tema Acqua Blu 💧 |
| **Re del 60s** | Punteggio 20+ nella Sfida 60s. | Tema Oro Reale 👑 |
| **Obiettivo Raggiunto** | Completa l'obiettivo giornaliero. | Nessun tema, motivazione. |

---

## 📊 Statistiche e Analisi

- **Statistiche Persistenti**: Tracciamento delle performance, tempo medio e accuratezza.
- **Top 5 Domande Difficili**: Analisi dei tuoi punti deboli (domande con il tasso di errore più alto).
- **Azzera Statistiche**: Opzione per resettare tutti i progressi e ricominciare da capo.

---

## 🌐 Deploy

Il progetto è una PWA statica e può essere ospitato su qualsiasi servizio di hosting statico (GitHub Pages, Netlify, Vercel, ecc.).

### Struttura File

| File | Ruolo |
| :--- | :--- |
| `index.html` | Struttura principale della PWA. |
| `app.js` | Logica principale dell'applicazione (quiz, statistiche, temi, dark mode). |
| `sw.js` | Service Worker per il caching e il supporto offline. |
| `manifest.json` | Metadati PWA (icone, nome, descrizione, shortcuts). |
| `quiz_antincendio_ocr_improved.json` | Database delle 350 domande (non incluso, ma necessario). |
| `README.md` | Questo file. |