# Ginestra

https://enzoschitini.github.io/ginestra/

## Gioco

Ginestra ha una parte "a gioco" in stile Duolingo, tutta dentro la cartella `gioco/` e caricata in fondo a `index.html` (ogni file con `onerror="void 0"`: se un modulo manca l'app funziona comunque).

Funzioni:
- **Percorso** (Home): strada a nodi, un'unita per categoria, scrigni ogni 4 nodi, corone da 0 a 5 per esercizio.
- **Lezione**: 10 XP base, +5 XP combo (5 risposte giuste di fila), +5 XP lezione perfetta; gemme, streak, obiettivo giornaliero (10/20/30/50 XP).
- **Cuori**: 5 cuori, uno si rigenera ogni 30 minuti; senza cuori si puo ricaricare con 100 gemme o allenarsi gratis.
- **Fine lezione**: sequenza di schermate (riepilogo, streak, obiettivo, corona, traguardi, lega).
- **Esame**: il pulsante "quaderno" accanto all'ingranaggio apre una pagina a tutto schermo. Si sceglie il personaggio (si riparte dall'ultimo usato, la prima volta dal foglio piu recente), si vede la copertina con le informazioni e si inizia. L'esame prende domande da tutte le voci del foglio (10-22 domande in 4 parti: Riconoscere, Ricordare, Capire le frasi, Ascoltare), su una pagina di quaderno a righe, senza cuori, senza indizi e senza correzione fino alla consegna. Voto in trentesimi (18 per superarlo, 30 e lode se tutto giusto), timbro "Promosso/Rimandato", correzione delle risposte sbagliate, record per personaggio. Nessuna scadenza, solo un cronometro. Vale come una lezione (serie, XP, gemme) con un bonus se superato. Record salvati in `localStorage` alla chiave `ginestra-esami`.
- **Obiettivi**: statistiche, calendario mensile, obiettivo giornaliero, traguardi a livelli.
- **Lega**: sfida personale, senza altri giocatori. Ogni lega ha un obiettivo settimanale di XP (60, 120, 200, 300, 420, 560): a fine settimana lo raggiungi e sali, sotto il 35% scendi, se non studi non cambia nulla. La pagina mostra progresso, giorno per giorno, ultime settimane, record e media.

File: `stato.js` (stato `window.GS`, salvato in `localStorage` alla chiave `ginestra-gioco`), `icone.js` (`window.GI`, usa le immagini di `layout/assets/`), `gioco.css`, `hud.js`, `percorso.js/.css`, `festa.js/.css`, `profilo.js/.css`, `esame.js/.css`, `SPEC.md` (contratto), `stato.test.js` (`node gioco/stato.test.js`).

Azzerare i dati di gioco: nella schermata Obiettivi il pulsante "Azzera i dati", oppure dalla console del browser `GS.reset()`. Lo sblocco di tutti i nodi e' nell'interruttore "Sblocca tutto" in fondo alla Home.
