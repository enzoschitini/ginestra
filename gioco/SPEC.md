# Ginestra "gioco" — contratto condiviso

Obiettivo: far somigliare Ginestra a Duolingo / a un videogioco. Riferimenti: le foto in `new_release/` e i mockup in `layout/html/` (04-quest-completion, 05-streak-progress, 06-path-story, 08-lesson-complete, 12-unit-guidebook) con le icone in `layout/assets/`.

## Regole generali
- `index.html` contiene il motore (esercizi `EX`, `load`, `showQ`, `finish`, `showResult`, `showHome`, `renderTabs`, `ICON`, `h()`, `$()`, `ico()`, `mascot()`, `sfx()`, `speak()`, `hearts`). **Non modificarlo** salvo che tu sia l'agente `gioco-integratore`.
- Ogni agente scrive SOLO i propri file dentro `gioco/`. Gli script si caricano dopo lo script inline di `index.html` (fondo del body) e ridefiniscono le funzioni globali con il pattern già usato nell'app: `var showResult_engine = showResult; showResult = function () {...}`.
- Vanilla JS (ES5 stile `var`, come il resto dell'app), nessuna dipendenza, nessun build. Si apre con doppio click e funziona su GitHub Pages.
- UI in italiano. Stile Duolingo: verde `#58cc02` (ombra `#46a302`), blu `#1cb0f6` (`#1899d6`), arancio `#ff9600`, giallo `#ffc800`, rosso `#ff4b4b`, font Nunito 800/900, pulsanti con "bordo basso" 4px, angoli grandi. Deve funzionare in tema chiaro e scuro (`html.dark`) e a 360px di larghezza.
- Non copiare gli asset di Duolingo (gufo, ecc.): usa la mascotte di Ginestra (`mascot()`), le icone in `ICON`/`layout/assets` e SVG propri.
- Accessibilità: bottoni veri, `aria-label`, `prefers-reduced-motion` rispettato per le animazioni.
- Salvataggio: solo `localStorage`, sempre in try/catch. Nessun backend.
- La Lega è **personale**: nessun avversario, né reale né finto. Si gareggia contro le proprie settimane passate (vedi `GS.lega()`).

## Contratto dati: `window.GS` (file `gioco/stato.js`, chiave `ginestra-gioco`)
```
GS.state        // { xp, xpOggi, giorno, gemme, cuori, cuoriTs, streak, streakMax, giorni:{'YYYY-MM-DD':xp}, obiettivoXp,
                //   corone:{[exN]:0..5}, lezioni:{[exN]:n}, traguardi:{[id]:livello}, lega, xpSettimana, settimana, congelamenti }
GS.save()
GS.on(evento, fn) / GS.emit(evento, dati)   // eventi: 'xp', 'cuori', 'gemme', 'streak', 'lezione', 'traguardo', 'lega'
GS.oggi()                      // 'YYYY-MM-DD' locale
GS.addXP(n, motivo)            // aggiorna xp, xpOggi, giorni[oggi], xpSettimana
GS.addGemme(n)
GS.cuori() -> n                // 0..5, con rigenerazione 1 cuore ogni 30 min
GS.perdiCuore() -> n rimasti   // chiamato quando si sbaglia
GS.ricaricaCuori(costoGemme)   // spende gemme (default 100) e riempie
GS.prossimoCuoreTra() -> ms | 0
GS.registraLezione({ex, giuste, totali, combo}) -> risultato:
   { xpBase, xpCombo, xpPerfetta, gemme, streakAumentata, streakPrima, streakDopo, obiettivoRaggiunto,
     coronaSalita, nuoviTraguardi:[{id,nome,livello}], legaPromossa:bool|null }
GS.streakGiorni(n) -> [{data, attivo, oggi, lettera}]   // ultimi n giorni (default 7) per la riga S M T W T F S
GS.mese(anno, mese0) -> [{data, giorno, xp, attivo, oggi, futuro}|null ...]   // griglia calendario con padding
GS.TRAGUARDI -> [{id, nome, descr, icona, livelli:[soglie], valore: fn(state)}]
GS.lega() -> {nome, indice, prossima, target, retro, xp, pct, mancanti, giorniRimasti, perGiorno, giorni[7], storia[8], settimanaScorsa, media4, record, batteScorsa}
GS.reset()
```
Regole di gioco: lezione = 10 XP base; +5 XP "combo" se ≥5 risposte giuste di fila; +5 se lezione perfetta; obiettivo giornaliero 20 XP (modificabile 10/20/30/50); gemme = 5 per lezione + 5 se perfetta + 15 al raggiungimento obiettivo; streak +1 se prima attività del giorno, si azzera se salta un giorno (a meno di un "congelamento"); corone per esercizio da 0 a 5 (una per lezione completata con ≥80%, la quinta richiede lezione perfetta); leghe Bronzo→Argento→Oro→Zaffiro→Rubino→Ametista, si promuove a fine settimana (lunedì) se in top 10 simulata.

## Contratto UI (funzioni globali, ognuno nel proprio file)
- `gioco/hud.js`: barra in alto con 🔥 streak, 💎 gemme, ❤️ cuori (+ timer prossimo cuore), `renderTabs()` ridefinita con 4 tab: Home (`showHome`), Allenamento (`showTraining`), Obiettivi (`showProfilo`), Lega (`showLega`); modale "senza cuori" (`mostraSenzaCuori(onRicarica, onEsci)`); collega `ctx.lose`/`finish` a `GS.perdiCuore()` e mantiene `hearts` e `#hearts` in sync con `GS.cuori()`; impedisce di iniziare una lezione senza cuori.
- `gioco/percorso.js`: `showHome()` ridefinita = strada a nodi (vedi `layout/html/06-path-story.html`), un'unità per categoria di `EX`, un nodo per esercizio con stato (bloccato/disponibile "START"/completato con corone), scrigni ogni N nodi, mascotte accanto al nodo corrente, intestazione di unità verde sticky.
- `gioco/festa.js`: `showResult()` ridefinita = sequenza di schermate stile Duolingo: (1) "Lezione completata!" con riepilogo XP/combo/gemme e barra obiettivo giornaliero con scrigno, (2) se streak aumentata: "N giorni di fila!" con riga dei 7 giorni e fiamma, (3) se obiettivo raggiunto/corona/traguardo/promozione: schermata dedicata. Pulsante CONTINUA blu. Anche "combo" durante la lezione (banner "5 di fila!"). Chiama `GS.registraLezione` UNA volta.
- `gioco/profilo.js`: `showProfilo()` (statistiche: streak, XP totali, lega, medaglie; calendario mensile con fiammelle e frecce mese precedente/successivo; obiettivo giornaliero modificabile; traguardi a livelli con barre come `new_release/`), `showLega()` (classifica simulata stile "Sei salito in Lega Oro", con la tua riga evidenziata), `GS.TRAGUARDI` sta in `stato.js`.
- `gioco/gioco.css`: stili comuni e variabili (`--g-verde`, ecc.), dark mode. Ogni file JS può iniettare un proprio `<style>` solo se il CSS è specifico e piccolo; altrimenti usa `gioco.css` solo se sei l'agente `gioco-grafica`.

## Proprietà dei file
| agente | file |
|---|---|
| gioco-stato | `gioco/stato.js` |
| gioco-hud | `gioco/hud.js` |
| gioco-percorso | `gioco/percorso.js`, `gioco/percorso.css` |
| gioco-festa | `gioco/festa.js`, `gioco/festa.css` |
| gioco-profilo | `gioco/profilo.js`, `gioco/profilo.css` |
| gioco-grafica | `gioco/gioco.css`, `gioco/icone.js` (SVG propri: fiamma, gemma, cuore, scrigno, corona, medaglie → `window.GI.<nome>(size)`) |
| gioco-integratore | `index.html`, test, `README.md` |
