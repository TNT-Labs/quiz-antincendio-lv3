# 🔥 Quiz Antincendio - Livello 3

Progressive Web App per la preparazione all'esame Antincendio di Livello 3.

## ✨ Caratteristiche

- ✅ **350 domande ufficiali** con risposte e spiegazioni
- ✅ **Due modalità di studio:**
  - 🎓 **Allenamento**: domande illimitate, nessun limite
  - 📝 **Simulazione Esame**: 15 domande, 30 minuti, max 5 errori
- ✅ **Timer avanzato** con countdown e allarmi
- ✅ **Risultati dettagliati** con analisi errori
- ✅ **Funziona offline** dopo la prima visita
- ✅ **Installabile come app nativa** su Android/iOS
- ✅ **Design responsive** ottimizzato per mobile
- ✅ **Nessuna raccolta dati** - tutto in locale

## 🚀 Installazione

### Su Android/iOS

1. Apri il link dell'app nel browser (Chrome/Safari)
2. Clicca sul menu (⋮) > **"Installa app"** / **"Aggiungi a Home"**
3. L'app apparirà nella schermata home come app nativa!

### Su Desktop

1. Apri il link in Chrome/Edge
2. Clicca sull'icona **"Installa"** nella barra degli indirizzi
3. L'app si aprirà in una finestra separata

## 📖 Come Usare

### Modalità Allenamento 🎓

- Domande illimitate da tutte le 350 disponibili
- Nessun limite di tempo
- Nessun limite di errori
- Termina quando vuoi con il pulsante "Termina"
- Perfetta per imparare e memorizzare

### Modalità Simulazione Esame 📝

- 15 domande casuali
- 30 minuti di tempo
- Massimo 5 errori consentiti
- Condizioni realistiche dell'esame
- Termina automaticamente a tempo scaduto o errori superati

## 📊 Risultati

Alla fine di ogni quiz riceverai:

- ✅ Numero totale di domande risposte
- ✅ Domande corrette e sbagliate
- ✅ Tempo totale impiegato
- ✅ Percentuale di successo
- ✅ Elenco dettagliato degli errori con spiegazioni
- ✅ Valutazione finale (superato/non superato)

## 🛠️ Sviluppo Locale

### Prerequisiti

- Python 3 (già installato su Mac/Linux)
- Oppure Node.js

### Avvio

```bash
# Con Python
python -m http.server 8000

# Oppure con Python 3
python3 -m http.server 8000

# Oppure con Node.js
npx serve
```

Apri il browser su: `http://localhost:8000`

### Test su Dispositivo Mobile

1. Connetti il telefono alla stessa rete WiFi del PC
2. Trova l'IP del PC:
   - Windows: `ipconfig`
   - Mac/Linux: `ifconfig`
3. Sul telefono, apri: `http://IP_DEL_PC:8000`

## 📁 Struttura File

```
quiz-antincendio-pwa/
├── index.html                          # Pagina principale
├── app.js                              # Logica applicazione
├── manifest.json                       # Configurazione PWA
├── sw.js                               # Service Worker (offline)
├── quiz_antincendio_ocr_improved.json  # Database domande
├── icon-192.png                        # Icona 192x192
├── icon-512.png                        # Icona 512x512
└── README.md                           # Questa documentazione
```

## 🔧 Personalizzazione

### Modificare i Parametri dell'Esame

In `app.js`, cerca la sezione `modes`:

```javascript
exam: {
  name: 'Simulazione Esame',
  questions: 15,        // ← Cambia numero domande
  maxErrors: 5,         // ← Cambia errori massimi
  timeLimit: 30 * 60,   // ← Cambia tempo (secondi)
  description: '...'
}
```

### Cambiare i Colori

Cerca e sostituisci in `app.js`:

- `bg-red-600` → `bg-blue-600` (colore primario)
- `text-red-600` → `text-blue-600`
- `border-red-600` → `border-blue-600`

## 🌐 Deploy

### GitHub Pages

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/USERNAME/quiz-antincendio.git
git push -u origin main

# Vai su Settings > Pages > Deploy from branch 'main'
```

### Netlify

1. Vai su https://app.netlify.com/drop
2. Trascina la cartella del progetto
3. Ottieni l'URL istantaneo

### Vercel

```bash
npm i -g vercel
vercel
```

## ❓ Risoluzione Problemi

### L'app non si installa

- Verifica che sia servita via **HTTPS**
- Controlla che `manifest.json` sia valido
- Usa Chrome (migliore supporto PWA)

### Il timer non funziona

- Apri DevTools (F12) → Console
- Verifica errori JavaScript
- Ricarica la pagina (Ctrl+F5)

### Le domande non si caricano

- Verifica che `quiz_antincendio_ocr_improved.json` sia nella cartella
- Controlla che il JSON sia valido: https://jsonlint.com/

### Non funziona offline

- Visita l'app online almeno una volta
- Verifica Service Worker in DevTools → Application

## 📝 Licenza

Questo progetto è rilasciato per scopi educativi.

## 🤝 Contributi

Contributi, segnalazioni bug e richieste di funzionalità sono benvenuti!

---

**Buona fortuna con l'esame antincendio! 🔥👨‍🚒**

Per domande o supporto, apri una issue su GitHub.