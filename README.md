# 🔥 Quiz Antincendio - App Completa

## ✅ Tutte le Funzionalità Implementate

### 🎯 Due Modalità di Quiz

#### 1️⃣ **Modalità Allenamento**
- ✅ Domande illimitate (tutte le 350)
- ✅ Nessun limite di tempo
- ✅ Nessun limite di errori
- ✅ L'utente decide quando terminare
- ✅ Conteggio errori visualizzato
- ✅ Feedback immediato dopo ogni risposta
- ✅ Timer che conta il tempo trascorso

#### 2️⃣ **Modalità Simulazione Esame**
- ✅ 15 domande casuali
- ✅ 30 minuti di tempo limite
- ✅ Massimo 5 errori
- ✅ Timer countdown con allarme visivo
- ✅ Termina automaticamente se:
  - Tempo scaduto
  - Superato limite errori
  - Completate tutte le domande
- ✅ Condizioni realistiche dell'esame

### 📊 Schermata Risultati Completa

Visualizza:
- ✅ **Statistiche principali**: domande totali, corrette, errori
- ✅ **Tempo impiegato**: formato MM:SS
- ✅ **Confronto con tempo limite** (modalità esame)
- ✅ **Percentuale di successo**
- ✅ **Elenco dettagliato errori** con:
  - Domanda sbagliata
  - Risposta data
  - Risposta corretta con spiegazione
- ✅ **Valutazione finale** (superato/non superato)
- ✅ **Messaggi motivazionali** basati sulla performance

### ⏱️ Sistema Timer Avanzato

- ✅ **Modalità Allenamento**: timer progressivo che conta il tempo
- ✅ **Modalità Esame**: countdown da 30 minuti
- ✅ **Allarme visivo**: testo rosso sotto 5 minuti
- ✅ **Auto-terminazione**: quiz termina a tempo scaduto
- ✅ **Visualizzazione risultati**: tempo totale impiegato

### 🎨 Interfaccia Utente

- ✅ Design responsive (mobile-first)
- ✅ Animazioni e transizioni fluide
- ✅ Feedback visivo immediato (verde/rosso)
- ✅ Icone intuitive
- ✅ Barra di progresso (modalità esame)
- ✅ Colori distintivi per le due modalità
- ✅ Accessibile e usabile

---

## 📦 File Pronti per il Deploy

### Struttura Completa

```
quiz-antincendio-pwa/
│
├── index.html                          # ✅ Creato
├── app.js                              # ✅ Creato (versione completa)
├── manifest.json                       # ✅ Creato
├── sw.js                               # ✅ Creato (Service Worker)
├── quiz_antincendio_ocr_improved.json  # 📥 Il tuo file esistente
│
├── icons/
│   ├── icon-192.png                    # ⚠️ Da creare
│   ├── icon-512.png                    # ⚠️ Da creare
│   └── favicon.ico                     # ⚠️ Opzionale
│
└── README.md                           # ✅ Creato
```

---

## 🚀 Come Procedere

### Passo 1: Preparare i File

1. **Crea una cartella** sul tuo PC:
   ```
   quiz-antincendio-pwa/
   ```

2. **Copia i file** che ti ho fornito:
   - `index.html`
   - `app.js` (dal secondo artifact - versione JavaScript completa)
   - `manifest.json`
   - `sw.js`
   - `README.md`

3. **Aggiungi il tuo file JSON**:
   - Copia `quiz_antincendio_ocr_improved.json` nella cartella principale

### Passo 2: Creare le Icone

**Opzione Rapida - Emoji come Icona:**

1. Crea un file `create-icon.html`:

```html
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0; display:flex; align-items:center; justify-content:center; 
             width:512px; height:512px; background:#dc2626;">
    <div style="font-size:280px;">🔥</div>
</body>
</html>
```

2. Apri in Chrome/Firefox
3. Fai screenshot (512x512)
4. Salva come `icon-512.png`
5. Ridimensiona a 192x192 per `icon-192.png`

**Oppure usa uno di questi tool online:**
- https://favicon.io/emoji-favicons/ (genera automaticamente)
- https://www.favicon-generator.org/
- https://realfavicongenerator.net/

### Passo 3: Testare in Locale

**Windows:**
```bash
cd quiz-antincendio-pwa
python -m http.server 8000
```

**Mac/Linux:**
```bash
cd quiz-antincendio-pwa
python3 -m http.server 8000
```

**Oppure con Node.js:**
```bash
npx serve
```

Apri: `http://localhost:8000`

### Passo 4: Testare su Android

1. **Connetti il telefono alla stessa rete WiFi**
2. **Trova l'IP del PC**:
   - Windows: `ipconfig` → cerca IPv4
   - Mac/Linux: `ifconfig` → cerca inet
3. **Sul telefono**, apri Chrome e vai a: `http://TUO_IP:8000`
4. **Installa l'app**:
   - Menu (⋮) → "Installa app" / "Aggiungi a Home"

### Passo 5: Deploy Online

#### Opzione A: GitHub Pages (Consigliata)

```bash
# Installa Git se non l'hai già
# Vai su github.com e crea un nuovo repository "quiz-antincendio"

cd quiz-antincendio-pwa
git init
git add .
git commit -m "Initial commit - Quiz Antincendio PWA"
git branch -M main
git remote add origin https://github.com/TUO_USERNAME/quiz-antincendio.git
git push -u origin main

# Vai su Settings > Pages
# Source: "Deploy from branch 'main'"
# Salva e aspetta 2-3 minuti
```

URL finale: `https://TUO_USERNAME.github.io/quiz-antincendio`

#### Opzione B: Netlify (Più Veloce)

1. Vai su https://app.netlify.com/drop
2. Trascina la cartella `quiz-antincendio-pwa`
3. Ottieni subito l'URL: `https://quiz-antincendio-XXXXX.netlify.app`

#### Opzione C: Vercel

```bash
npm i -g vercel
cd quiz-antincendio-pwa
vercel
```

---

## 📱 Installazione su Android

### Da URL Online (Dopo il Deploy)

1. Apri l'URL in **Chrome** su Android
2. Menu (⋮) → **"Installa app"** o **"Aggiungi a schermata Home"**
3. L'app apparirà come app nativa!

### Da File APK (Opzionale - Più Complesso)

Se vuoi un vero APK, puoi usare:
- **PWA Builder**: https://www.pwabuilder.com/
  1. Inserisci l'URL della tua PWA
  2. Genera APK Android
  3. Scarica e installa

---

## 🎯 Test delle Funzionalità

### Checklist Completa

**Modalità Allenamento:**
- [ ] Avvia modalità allenamento
- [ ] Rispondi ad alcune domande
- [ ] Verifica che il timer conta in avanti
- [ ] Verifica feedback corretto/sbagliato
- [ ] Clicca "Termina" quando vuoi
- [ ] Controlla riepilogo finale con:
  - [ ] Tempo totale
  - [ ] Errori (senza limite)
  - [ ] Lista domande sbagliate

**Modalità Esame:**
- [ ] Avvia simulazione esame
- [ ] Verifica 15 domande
- [ ] Verifica countdown da 30:00
- [ ] Rispondi ad alcune domande
- [ ] Verifica che con 6 errori il quiz termina
- [ ] Controlla riepilogo finale con:
  - [ ] Tempo impiegato vs limite
  - [ ] Superato/Non superato
  - [ ] Confronto errori

**Funzionalità Generali:**
- [ ] App installabile su Android
- [ ] Funziona offline (dopo prima visita)
- [ ] Design responsive su mobile
- [ ] Pulsanti tutti funzionanti
- [ ] Animazioni fluide

---

## 🔧 Personalizzazioni Possibili

### Cambiare Colori

Nel file `app.js` o nelle classi Tailwind:

```javascript
// Rosso → Blu
"bg-red-600" → "bg-blue-600"
"text-red-600" → "text-blue-600"
"border-red-600" → "border-blue-600"
```

### Modificare Parametri Esame

Nel file `app.js`, cerca la sezione `this.modes`:

```javascript
exam: {
  name: 'Simulazione Esame',
  questions: 15,        // ← Cambia numero domande
  maxErrors: 5,         // ← Cambia errori massimi
  timeLimit: 30 * 60,   // ← Cambia tempo (in secondi)
  description: '...'
}
```

### Aggiungere Suoni

Dopo `handleConfirmAnswer()`:

```javascript
// Suono corretto
if (isCorrect) {
  new Audio('correct.mp3').play();
} else {
  new Audio('wrong.mp3').play();
}
```

### Salvare Statistiche

Aggiungi al `localStorage`:

```javascript
// In endQuiz()
const stats = {
  mode: this.mode,
  score: correctCount,
  errors: this.incorrectCount,
  time: elapsedTime,
  date: new Date().toISOString()
};

const history = JSON.parse(localStorage.getItem('quizHistory') || '[]');
history.push(stats);
localStorage.setItem('quizHistory', JSON.stringify(history));
```

---

## ❓ Problemi Comuni

### "L'app non si installa su Android"
- Verifica che sia servita via **HTTPS** (GitHub Pages e Netlify lo fanno automaticamente)
- Controlla che `manifest.json` sia valido
- Prova con Chrome (non tutti i browser supportano PWA)

### "Il timer non funziona"
- Verifica che il JavaScript sia caricato correttamente
- Apri DevTools (F12) e controlla errori nella Console

### "Le domande non si caricano"
- Verifica che `quiz_antincendio_ocr_improved.json` sia nella stessa cartella di `index.html`
- Controlla che il file JSON sia valido (usa https://jsonlint.com/)

### "L'app non funziona offline"
- Prima visita online richiesta per cache
- Verifica che Service Worker sia registrato (DevTools → Application → Service Workers)

---

## 📞 Supporto

Se hai problemi:
1. Apri DevTools (F12) → scheda Console
2. Copia eventuali errori
3. Chiedi aiuto specificando il problema

---

## 🎓 Risultato Finale

Avrai un'app completamente funzionante con:
- ✅ Due modalità (Allenamento + Esame)
- ✅ Timer avanzato
- ✅ Risultati dettagliati con tempo
- ✅ Installabile su Android come app nativa
- ✅ Funziona offline
- ✅ Interface professionale e moderna

**Buona fortuna con l'esame antincendio! 🔥👨‍🚒**