<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="theme-color" content="#dc2626">
    <meta name="description" content="Quiz di preparazione per l'esame Antincendio di Livello 3. 350 domande, simulazioni complete. Aggiunte modalità Solo Errori e Sfida 60s con persistenza dati.">
    <meta name="keywords" content="quiz, antincendio, livello 3, esame, VVF, sicurezza, pwa, formazione">
    <meta name="author" content="Quiz Antincendio">
    
    <title>Quiz Antincendio Livello 3 - Aggiornato</title>
    
    <link rel="manifest" href="manifest.json">
    <link rel="icon" type="image/png" href="icon-192.png">
    <link rel="apple-touch-icon" href="icon-192.png">
    
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="Quiz Antincendio">
    
    <script src="https://cdn.tailwindcss.com"></script>
    
    <style>
        /* Stili per rimuovere le evidenziazioni al tocco su iOS/Android */
        * {
            -webkit-tap-highlight-color: transparent;
        }
        body {
            background-color: #f7f7f7;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            min-height: 100vh;
            background-color: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.05);
        }
        /* Stili per lo spinner di caricamento */
        #loading {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #dc2626;
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            color: white;
            font-size: 2rem;
            flex-direction: column;
        }
        .spinner {
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-top: 4px solid #fff;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin-bottom: 10px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div id="loading">
        <div class="spinner"></div>
        Caricamento Quiz...
    </div>
    
    <div class="container">
        <div id="root"></div>
    </div>
    
    <script src="app.js"></script>
    
    <script>
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('sw.js')
                    .then(registration => {
                        console.log('✅ Service Worker registrato:', registration);
                    })
                    .catch(error => {
                        console.log('❌ Errore registrazione Service Worker:', error);
                    });
            });
        }
        
        // Nascondi loading screen dopo caricamento
        window.addEventListener('load', () => {
            setTimeout(() => {
                const loading = document.getElementById('loading');
                if (loading) {
                    loading.style.display = 'none';
                }
            }, 500);
        });
    </script>
    
    <script>
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            console.log('📱 App installabile!');
        });
        
        window.addEventListener('appinstalled', () => {
            console.log('✅ App installata con successo!');
            deferredPrompt = null;
        });
    </script>
</body>
</html>