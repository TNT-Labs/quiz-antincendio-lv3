# 🔥 Quiz Antincendio - Livello 3

Progressive Web App per la preparazione all'esame Antincendio di Livello 3.

## ✨ Caratteristiche

- ✅ **350 domande ufficiali** con risposte e spiegazioni
- ✅ **Quattro modalità di studio:**
  - 🎓 **Allenamento**: domande illimitate, feedback immediato.
  - 📝 **Simulazione Esame**: 15 domande, 30 minuti, max 5 errori.
  - ❌ **Solo Errori (NUOVA)**: Rivedi solo le domande a cui hai sbagliato in passato.
  - ⏱️ **Sfida 60s (NUOVA)**: Rispondi a quante più domande puoi in un minuto.
- ✅ **Statistiche Persistenti (NUOVO)**: Tracciamento delle performance, tempo medio e top 5 domande difficili.
- ✅ **Reset Dati (NUOVO)**: Possibilità di azzerare tutte le statistiche tramite l'app.
- ✅ **Timer avanzato** con countdown e allarmi
- ✅ **Risultati dettagliati** con analisi errori
- ✅ **Funziona offline** dopo la prima visita
- ✅ **Installabile come app nativa** su Android/iOS
- ✅ **Design responsive** ottimizzato per mobile
- ✅ **Nessuna raccolta dati** - tutto in locale

---

## 🚀 Installazione

### Su Android/iOS

1.  Apri il link dell'app nel browser (Chrome/Safari).
2.  Clicca sul menu (⋮) > **"Installa app"** / **"Aggiungi a Home"**.
3.  L'app apparirà nella schermata home come app nativa!

### Su Desktop

1.  Apri il link in Chrome/Edge.
2.  Clicca sull'icona **"Installa"** nella barra degli indirizzi.
3.  L'app si aprirà in una finestra separata.

---

## 📖 Come Usare

### Modalità Allenamento 🎓

- Domande illimitate da tutte le categorie.
- Feedback immediato (risposta corretta/sbagliata) dopo ogni selezione.
- Usa questa modalità per imparare e memorizzare le risposte.

### Modalità Solo Errori ❌

- **Disponibile solo dopo aver commesso un errore** in una sessione precedente.
- Presenta in modo casuale solo le domande che hai sbagliato. Perfetto per il ripasso mirato.

### Visualizzare e Azzerare le Statistiche 📊

- Dal menu principale, clicca su **"Visualizza Statistiche Globali"**.
- Troverai il riepilogo totale delle tue performance e le domande più difficili.
- In fondo a questa schermata è presente il pulsante **"Azzerra Tutte le Statistiche"** per resettare la tua cronologia.

---

## 🎨 Personalizzazione (Se vuoi cambiare i colori)

L'app usa Tailwind CSS. Per cambiare il colore principale (dal rosso al blu, ad esempio), cerca e sostituisci in `app.js` e `index.html` (o usa la tua build Tailwind):

- `bg-red-600` → `bg-blue-600` (colore primario)
- `text-red-600` → `text-blue-600`
- `border-red-600` → `border-blue-600`

---

## 🌐 Deploy

### GitHub Pages

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin [https://github.com/USERNAME/quiz-antincendio.git](https://github.com/USERNAME/quiz-antincendio.git)
git push -u origin main

# Vai su Settings > Pages > Deploy from branch 'main'
Netlify
Vai su https://app.netlify.com/drop

Trascina la cartella del progetto

Ottieni l'URL istantaneo

Vercel
Bash

npm i -g vercel
vercel
❓ Risoluzione Problemi
L'app non si installa
Verifica che sia servita via HTTPS.

Controlla che manifest.json sia valido.

Usa Chrome (migliore supporto PWA).

L'app non si aggiorna (mostra la vecchia versione)
Soluzione 1 (Sviluppatore): Aggiorna la costante CACHE_NAME in sw.js (ad esempio a 'quiz-antincendio-v1.1.0') e carica il file aggiornato.

Soluzione 2 (Utente/Tester): Apri DevTools (F12) → Application → Service Workers → Abilita "Update on reload" e ricarica la pagina.