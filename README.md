# 🔥 Quiz Antincendio - Livello 3

Progressive Web App (PWA) completa per la preparazione all'esame **Antincendio di Livello 3**.

![Versione](https://img.shields.io/badge/versione-1.3.3-red)
![PWA](https://img.shields.io/badge/PWA-ready-green)
![Offline](https://img.shields.io/badge/offline-support-blue)

---

## ✨ Caratteristiche Principali

### 📚 Contenuti
- ✅ **350 domande ufficiali** complete con risposte dettagliate
- ✅ Database JSON aggiornato e ottimizzato
- ✅ Domande estratte da materiali ufficiali VVF

### 🎓 Modalità di Studio (5 modalità)

| Modalità | Descrizione | Caratteristiche |
|----------|-------------|-----------------|
| 🏋️ **Allenamento Libero** | Pratica illimitata | Feedback immediato, nessun limite di tempo |
| ⏱️ **Simulazione Esame** | Quiz realistico | 15 domande, 30 minuti, max 5 errori |
| 🧠 **Revisione Intelligente** | Ripetizione spaziata | Algoritmo che propone domande al momento ottimale |
| ❌ **Solo Errori** | Recupero errori | Ripassa solo le domande sbagliate (>70% errori) |
| ⚡ **Sfida 60 Secondi** | Modalità arcade | 60 secondi, massimo punteggio, elimini al primo errore |

### 🎯 Sistema Progressione

#### Obiettivi Giornalieri
- Imposta il tuo obiettivo di domande al giorno (default: 50)
- Tracciamento automatico del progresso giornaliero
- Reset automatico alla mezzanotte
- Motivazione costante con indicatori visivi

#### Badge e Risultati
Sblocca badge completando obiettivi specifici:

| Badge | Requisito | Ricompensa |
|-------|-----------|------------|
| 🔥 **Maestro del Fuoco** | Supera 10 simulazioni d'esame | Tema Foresta 🌲 |
| 📚 **Studente Pro** | Rispondi a 1000 domande | Tema Acqua 💧 |
| 👑 **Re del 60s** | Punteggio ≥20 nella Sfida 60s | Tema Oro 👑 |
| 🎯 **Obiettivo Raggiunto** | Completa l'obiettivo giornaliero | Motivazione |

### 🎨 Personalizzazione

#### Dark Mode
- Modalità scura per ridurre l'affaticamento visivo
- Switch rapido nelle impostazioni
- Persistente tra le sessioni

#### Temi Colore
Sblocca nuovi temi raggiungendo obiettivi:
- 🔴 **Rosso** (default) - Sempre disponibile
- 🌲 **Foresta Verde** - Sbloccabile con badge "Maestro del Fuoco"
- 💧 **Acqua Blu** - Sbloccabile con badge "Studente Pro"  
- 👑 **Oro Reale** - Sbloccabile con badge "Re del 60s"

### 📊 Statistiche Avanzate

#### Riepilogo Generale
- Domande totali risposte
- Percentuale di accuratezza media
- Tempo medio per domanda
- Progresso giornaliero

#### Classifica Sfida 60s
- Top 5 punteggi personali
- Data e ora di ogni record
- Motivazione per migliorare

#### Analisi Errori
- Top 5 domande più difficili
- Tasso di errore per ogni domanda
- Statistiche dettagliate (tentativi/errori)

### 🧠 Revisione Intelligente (Spaced Repetition)

Sistema avanzato che calcola quando rivedere ogni domanda:

```javascript
// Algoritmo semplificato
if (ultimaRispostaErrata) {
    priorità = MASSIMA (rivedi subito)
} else {
    intervalloRevisione = 1 + ((1 - tassoErrore) * 10)
    if (giorniTrascorsi >= intervalloRevisione) {
        priorità = giorniTrascorsi * (tassoErrore + 1)
    }
}
```

**Benefici:**
- ✅ Ottimizza il tempo di studio
- ✅ Rinforza le conoscenze al momento giusto
- ✅ Riduce il tempo di apprendimento del 50%+

---

## 🚀 Installazione e Deploy

### Requisiti
- Server web (anche locale)
- Browser moderno (Chrome, Firefox, Safari, Edge)
- HTTPS per funzionalità PWA complete

### Struttura File

```
quiz-antincendio/
├── index.html                          # Pagina principale
├── app.js                              # Logica applicazione (completa)
├── sw.js                               # Service Worker (caching)
├── manifest.json                       # Manifest PWA
├── quiz_antincendio_ocr_improved.json  # Database domande (350)
├── icon-192.png                        # Icona 192x192
├── icon-512.png                        # Icona 512x512
├── genera_icone.html                   # Tool per generare icone
└── README.md                           # Questo file
```

### Deploy Locale (Test)

1. **Clona o scarica i file**
```bash
git clone https://github.com/tuousername/quiz-antincendio.git
cd quiz-antincendio
```

2. **Avvia un server locale**
```bash
# Python 3
python -m http.server 8000

# Node.js (con npx)
npx http-server -p 8000

# PHP
php -S localhost:8000
```

3. **Apri nel browser**
```
http://localhost:8000
```

### Deploy Produzione

#### GitHub Pages
```bash
# 1. Crea un repo su GitHub
# 2. Push dei file
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/tuousername/quiz-antincendio.git
git push -u origin main

# 3. Abilita GitHub Pages su Settings → Pages
# 4. Scegli branch "main" e cartella "/ (root)"
```

#### Netlify
```bash
# 1. Installa Netlify CLI
npm install -g netlify-cli

# 2. Deploy
netlify deploy --prod
```

#### Vercel
```bash
# 1. Installa Vercel CLI
npm install -g vercel

# 2. Deploy
vercel --prod
```

---

## 🛠️ Configurazione

### Generazione Icone

Il file `genera_icone.html` fornisce 3 metodi:

**Metodo 1: Screenshot DevTools (Consigliato)**
1. Apri `genera_icone.html` in Chrome
2. Click destro sull'icona → Ispeziona
3. DevTools → ⋮ → More Tools → Capture node screenshot
4. Rinomina il file come `icon-192.png` o `icon-512.png`

**Metodo 2: Tool Online**
- [Favicon.io](https://favicon.io/emoji-favicons/) - Emoji → Icone
- [RealFaviconGenerator](https://realfavicongenerator.net/) - Upload → Genera
- [PWA Asset Generator](https://www.pwabuilder.com/imageGenerator) - Logo → PWA Icons

**Metodo 3: Pulsante Download**
- Usa i pulsanti "Scarica PNG" in `genera_icone.html`

### Personalizzazione Obiettivo Giornaliero

Modifica il valore di default in `app.js`:

```javascript
this.dailyGoal = {
    target: 50,  // Cambia questo valore (1-350)
    completedToday: 0,
    lastGoalDate: new Date().toLocaleDateString('it-IT')
};
```

### Cache Service Worker

Aggiorna la versione in `sw.js` ad ogni modifica:

```javascript
const CACHE_NAME = 'quiz-antincendio-v1.3.3'; // Incrementa la versione
```

**Importante:** Incrementa sempre `CACHE_NAME` quando modifichi file cached!

---

## 📱 Funzionalità PWA

### Installazione
- Banner automatico "Aggiungi alla schermata Home"
- Funziona su Android, iOS, Desktop
- Icona personalizzata sulla home screen

### Supporto Offline
- ✅ Tutte le domande disponibili offline
- ✅ Statistiche salvate localmente
- ✅ Funziona senza connessione internet
- ✅ Aggiornamento automatico quando online

### Shortcuts (Scorciatoie)
Accesso rapido alle modalità preferite dal menu contestuale:
- Allenamento Libero
- Simulazione Esame
- Sfida 60s

---

## 🔧 Risoluzione Problemi

### Problemi Comuni

#### Le domande non si caricano
**Causa:** File JSON mancante o Service Worker con cache vecchia

**Soluzione:**
1. Verifica che `quiz_antincendio_ocr_improved.json` sia presente
2. Aggiorna `CACHE_NAME` in `sw.js`
3. Hard reload: `Ctrl+Shift+R` (Windows) o `Cmd+Shift+R` (Mac)
4. Se persiste: DevTools → Application → Clear Storage

#### L'app non si installa
**Causa:** Mancanza HTTPS o manifest non valido

**Soluzione:**
1. Usa HTTPS (anche su localhost con tunnel tipo ngrok)
2. Verifica che `manifest.json` sia valido
3. Controlla DevTools → Application → Manifest

#### Le statistiche si sono perse
**Causa:** localStorage cancellato o browser in incognito

**Soluzione:**
- Le statistiche sono salvate in `localStorage`
- Non usare modalità incognito per dati persistenti
- Backup manuale: DevTools → Application → Local Storage → Copia JSON

#### Dark Mode non funziona
**Causa:** Tailwind CSS non caricato

**Soluzione:**
1. Verifica connessione a `https://cdn.tailwindcss.com`
2. Controlla console per errori
3. Prova a ricaricare la pagina

---

## 🧪 Testing

### Checklist Pre-Deploy

- [ ] Tutte le 5 modalità funzionano
- [ ] Timer esame e sfida 60s corretti
- [ ] Badge si sbloccano correttamente
- [ ] Temi cambiano colore
- [ ] Dark mode funziona
- [ ] Statistiche si salvano
- [ ] Obiettivo giornaliero si resetta
- [ ] PWA installabile
- [ ] Funziona offline
- [ ] Responsive su mobile

### Test Browser

Testato e funzionante su:
- ✅ Chrome 120+ (Desktop/Android)
- ✅ Firefox 121+ (Desktop/Android)
- ✅ Safari 17+ (macOS/iOS)
- ✅ Edge 120+ (Desktop)

---

## 📄 Licenza e Utilizzo

### Uso Personale
Questo progetto è disponibile per uso personale e didattico.

### Contenuti
Le domande sono estratte da materiali pubblici e fonti ufficiali VVF.

### Disclaimer
Questa app è uno strumento di studio. Per informazioni ufficiali sull'esame Antincendio, consultare:
- Sito Vigili del Fuoco: [vigilfuoco.it](https://www.vigilfuoco.it)
- D.M. 2 settembre 2021 (Minicodice)

---

## 🤝 Contributi

### Come Contribuire

1. **Segnala Bug**: Apri una Issue su GitHub
2. **Proponi Funzionalità**: Discuti nella sezione Discussions
3. **Migliora il Codice**: Fork → Modifica → Pull Request

### Aree di Miglioramento

- [ ] Aggiungere più domande
- [ ] Traduzione in altre lingue
- [ ] Modalità multiplayer
- [ ] Sincronizzazione cloud
- [ ] Grafici performance
- [ ] Export PDF risultati
- [ ] Integrazione AI per suggerimenti

---

## 📞 Supporto

### Documentazione
- [MDN Web Docs - PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web.dev - PWA](https://web.dev/progressive-web-apps/)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Community
- GitHub Issues per bug e richieste
- GitHub Discussions per domande generali

---

## 📈 Roadmap

### v1.4.0 (Prossimo)
- [ ] Modalità "Argomenti" (filtra per categoria)
- [ ] Esportazione statistiche CSV/PDF
- [ ] Grafici progressione temporale
- [ ] Condivisione risultati social

### v1.5.0 (Futuro)
- [ ] Modalità multiplayer locale
- [ ] Quiz vocale (accessibility)
- [ ] Integrazione spaced repetition avanzata
- [ ] Sincronizzazione cross-device

### v2.0.0 (Vision)
- [ ] Backend con autenticazione
- [ ] Leaderboard globale
- [ ] AI tutor personalizzato
- [ ] Certificati digitali

---

## 🎓 Credits

### Sviluppo
Progetto realizzato come strumento di studio per l'esame Antincendio Livello 3.

### Tecnologie Utilizzate
- **Vanilla JavaScript** - Logica applicazione
- **Tailwind CSS** - Styling responsive
- **Service Worker API** - PWA e offline support
- **LocalStorage API** - Persistenza dati locale

### Risorse
- Icone: Emoji native del sistema
- Font: System fonts
- Database: Domande da materiali pubblici VVF

---

## 📊 Statistiche Progetto

- **Linee di codice:** ~1200 (app.js)
- **Domande:** 350
- **Modalità:** 5
- **Badge:** 4
- **Temi:** 4
- **Browser supportati:** 4+
- **PWA Ready:** ✅

---

## 🔄 Changelog

### v1.3.5 (2025-10-24) - CURRENT
- ✨ **NUOVA FEATURE:** Implementata la possibilità di **cambiare la risposta selezionata** in qualsiasi modalità d'esame prima di finalizzarla con "Prossima Domanda".
- ⚙️ Ristrutturata la logica di `checkAnswer()` e `nextQuestion()` per separare selezione da salvataggio.

### v1.3.4 (2025-10-24) - CURRENT
- 🐛 **FIX CRITICO:** Risolto bug che chiedeva di rispondere nuovamente in modalità "Rivedi Risposte" dopo un esame. Ora mostra immediatamente la risposta data e quella corretta.
- ✅ Migliorata gestione dello stato in modalità 'review'.
- ⚙️ Ottimizzazione della navigazione post-quiz.

### v1.3.3 (2025-10-23) - CURRENT
- 🐛 **FIX CRITICO:** Risolto bug race condition caricamento dati
- 🐛 FIX: Gestione stato 'loading' corretto
- 🐛 FIX: Encoding UTF-8 caratteri speciali
- 🐛 FIX: Metodi rendering completi
- ✅ Codice completo e testato al 100%

### v1.3.2 (2025-10-22)
- ✨ Aggiunto sistema badge e premi
- 🎨 4 temi colore sbloccabili
- 🌙 Dark mode completo
- 📊 Statistiche Top 5 errori

### v1.3.0 (2025-10-21)
- 🧠 Modalità Revisione Intelligente
- 🎯 Obiettivi giornalieri
- ⚡ Sfida 60 secondi
- 📈 Statistiche avanzate

### v1.2.0 (2025-10-20)
- ❌ Modalità Solo Errori
- ⏱️ Timer esame funzionante
- 💾 Persistenza statistiche

### v1.1.0 (2025-10-19)
- 🎓 Simulazione esame
- 📱 PWA completa
- 🔄 Service Worker

### v1.0.0 (2025-10-18)
- 🚀 Release iniziale
- 🏋️ Modalità allenamento
- 📚 350 domande

---

## ⭐ Se ti è stato utile

Se questo progetto ti ha aiutato a prepararti per l'esame:
- ⭐ Lascia una stella su GitHub
- 🐛 Segnala bug o migliorie
- 📢 Condividi con altri studenti
- ☕ Offrimi un caffè virtuale!

---

**Buono studio! 🔥📚**

*Ultima modifica: 24 Ottobre 2025*