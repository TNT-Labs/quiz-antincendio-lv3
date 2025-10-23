# 🔥 Quiz Antincendio - Livello 3 (Aggiornato)

Progressive Web App (PWA) per la preparazione all'esame Antincendio di Livello 3, con nuove modalità di studio basate sui dati e tracciamento delle performance.

## ✨ Caratteristiche Aggiornate

- ✅ **350 domande ufficiali** con risposte e spiegazioni
- ✅ **Quattro modalità di studio:**
  - 🎓 **Allenamento**: domande illimitate, feedback immediato.
  - 📝 **Simulazione Esame**: 15 domande, 30 minuti, max 5 errori.
  - ❌ **Nuova: Solo Errori**: Rivedi solo le domande a cui hai risposto in modo errato in passato. **Ideale per il ripasso mirato.**
  - ⏱️ **Nuova: Sfida 60s**: Rispondi correttamente al maggior numero di domande possibile in 60 secondi. **Ideale per la velocità.**
- ✅ **Statistiche Globali e Persistenza Dati**
  - Tracciamento di tutte le risposte, del tempo impiegato e del tasso di successo.
  - Visualizzazione delle **Top 5 domande più difficili** (quelle con più errori).
- ✅ **Timer avanzato** con countdown e allarmi
- ✅ **Risultati dettagliati** con analisi degli errori della sessione
- ✅ **Funziona offline** dopo la prima visita
- ✅ **Installabile come app nativa** su Android/iOS
- ✅ **Design responsive** ottimizzato per mobile
- ✅ **Nessuna raccolta dati** - tutto in locale

***

## 🚀 Installazione

### Su Android/iOS

1. Apri il link dell'app nel browser (Chrome/Safari)
2. Clicca sul menu (⋮) > **"Installa app"** / **"Aggiungi a Home"**
3. L'app apparirà nella schermata home come app nativa!

*Nota: L'app ora supporta le **Scorciatoie** (Shortcuts): tieni premuta l'icona dell'app installata per avviare direttamente l'Allenamento, la Simulazione o la modalità Solo Errori.*

### Su Desktop

1. Apri il link in Chrome/Edge
2. Clicca sull'icona **"Installa"** nella barra degli indirizzi
3. L'app si aprirà in una finestra separata

***

## 📖 Come Usare le Nuove Modalità

### Modalità Solo Errori ❌

Dopo aver completato alcune sessioni, la sezione "Statistiche Globali" monitora i tuoi errori. Questa modalità carica solo quelle domande, permettendoti di concentrarti sui punti deboli finché non le padroneggi.

### Modalità Sfida 60s ⏱️

Metti alla prova la tua velocità! Hai 60 secondi per rispondere correttamente a quante più domande puoi. Il feedback è immediato per massimizzare il tempo.

### Statistiche Globali 📊

Dal menu principale, accedi alle Statistiche per vedere il tuo progresso complessivo, il tempo medio di risposta e la lista delle domande che ti hanno messo più in difficoltà (utili per il ripasso manuale o l'uso della modalità Solo Errori).

***

## 🛠 Sviluppo e Modifiche Tecniche

Le principali modifiche al codice includono:

1.  **Persistenza Dati**: Implementazione di `localStorage` in `app.js` per salvare lo storico delle risposte e calcolare le statistiche globali (`quizHistory`).
2.  **Struttura Modulare**: Ristrutturazione di `app.js` per supportare e gestire lo stato e la logica di feedback di quattro diverse modalità di quiz.
3.  **Aggiornamento PWA**: Aggiornamento del `CACHE_NAME` in `sw.js` (a `v1.1.0-features`) per forzare l'aggiornamento della cache per gli utenti esistenti.
4.  **UX Migliorata**: Integrazione del feedback immediato nelle modalità di studio (non-esame) per velocizzare il processo di ripasso.