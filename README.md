# 🔥 Quiz Antincendio - Livello 3

Progressive Web App (PWA) avanzata per la preparazione all'esame Antincendio di Livello 3.

---

## ✨ Caratteristiche Aggiornate

- ✅ **350 domande ufficiali** con risposte e spiegazioni
- 🎓 **Cinque modalità di studio potenziate:**
  - **Allenamento**: domande illimitate, feedback immediato.
  - **Simulazione Esame**: 15 domande, 30 minuti, max 5 errori.
  - **Solo Errori**: Rivedi solo le domande a cui hai sbagliato in passato.
  - **Sfida 60s**: Rispondi a quante più domande puoi in un minuto.
  - 🧠 **Revisione Intelligente (NUOVA)**: Utilizza la logica della **ripetizione spaziata** (Spaced Repetition) per riproporre le domande più difficili al momento ottimale.
- 🎯 **Obiettivi Giornalieri (NUOVO)**: Traccia il tuo progresso verso un obiettivo di studio quotidiano e mantieni la tua "streak".
- ⭐ **Badge e Risultati (NUOVO)**: Sblocca riconoscimenti per i tuoi successi e mantieniti motivato.
- ⏱️ **Classifica Locale 60s (NUOVO)**: Competi contro te stesso e traccia i tuoi migliori punteggi nella Sfida 60s.
- 📊 **Statistiche Persistenti**: Tracciamento delle performance, tempo medio e top 5 domande difficili.
- 🗑️ **Reset Dati**: Possibilità di azzerare tutte le statistiche tramite l'app.
- ✅ **Funziona offline** dopo la prima visita
- 📱 **Installabile come app nativa** su Android/iOS
- 🔒 **Nessuna raccolta dati** - tutto salvato in locale (LocalStorage)

---

## 🚀 Installazione (Progressive Web App)

### Su Android/iOS

1.  Apri il link dell'app nel browser (Chrome/Safari).
2.  Clicca sul pulsante "Installa App" che appare nella schermata principale, oppure usa il menu del browser:
    - **Chrome (Android)**: Clicca sui tre puntini e poi **"Installa app"**.
    - **Safari (iOS)**: Clicca sull'icona di **condivisione** e poi **"Aggiungi alla schermata Home"**.
3.  L'app sarà disponibile direttamente sulla tua schermata iniziale, funzionante anche offline.

---

## 📚 Modalità di Studio Avanzate

| Modalità | Focus | Funzionamento |
| :--- | :--- | :--- |
| **Allenamento** | Flessibilità e apprendimento diretto. | Domande casuali, feedback immediato. Ideale per iniziare. |
| **Esame** | Simulazione sotto stress temporale e di errore. | Tempo e limiti di errore per replicare l'esame ufficiale. |
| **Solo Errori** | Recupero mirato delle lacune. | Estrae e ripropone solo le domande a cui hai risposto in modo errato in passato. |
| **Revisione Intelligente** | Efficienza dell'apprendimento a lungo termine. | Algoritmo che ripropone le domande difficili o meno riviste in base al tempo e al tasso di errore. |
| **Sfida 60s** | Velocità e reattività. | Un minuto per rispondere al maggior numero di domande corrette e scalare la classifica interna. |

---

## 🎨 Personalizzazione (Se vuoi cambiare i colori)

L'app usa Tailwind CSS. Per cambiare il colore principale (dal rosso al blu, ad esempio), cerca e sostituisci in `app.js` e `index.html` (o usa la tua build Tailwind):

- `bg-red-600` → `bg-blue-600` (colore primario)
- `text-red-600` → `text-blue-600`
- `border-red-600` → `border-blue-600`

---

## 🌐 Deploy

Il progetto è una PWA statica e può essere ospitato su qualsiasi servizio di hosting statico (GitHub Pages, Netlify, Vercel, ecc.).

### GitHub Pages

```bash
git init
git add .
git commit -m "Initial commit with all features"
git branch -M main
git remote add origin [https://gist.github.com/tesseslol/da62aabec74c4fed889ea39c95efc6cc](https://gist.github.com/tesseslol/da62aabec74c4fed889ea39c95efc6cc)
git push -u origin main

# Vai su Settings > Pages > Scegli 'Deploy from branch main'