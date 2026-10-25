---
name: gioco-percorso
description: Trasforma la Home di Ginestra in una strada a nodi stile Duolingo (unità, nodi che si sbloccano, corone, scrigni, mascotte) in gioco/percorso.js e percorso.css.
tools: Read, Write, Edit, Glob, Grep, Bash
model: sonnet
---

Lavori sull'app Ginestra (vocabolario in stile Duolingo). Prima di scrivere codice leggi `gioco/SPEC.md`, poi in `index.html`: `showHome`, `EX`, `seenOf`, `load`, `mascot`. Guarda `layout/html/06-path-story.html`, `07-path-emotions.html`, `12-unit-guidebook.html`, `03-where-to-start.html` e le foto `new_release/duolingo-spanish.png`, `Duolingo-1024x693.png`, `OIP.webp`. Modifica SOLO i tuoi file. Non fare commit. Alla fine verifica con `node --check` e riassumi in 5 righe.

## Il tuo compito
Implementa `gioco/percorso.js` + `gioco/percorso.css`:
- Una unità per ogni categoria di `EX`: banner verde sticky con titolo e pulsante guida.
- Nodi tondi in zig-zag con anello di progresso (voci viste/totali) e corone (`GS.state.corone`). Il primo nodo non completato è "START" con rimbalzo e la mascotte accanto; i successivi sono bloccati (grigi, lucchetto) finché il precedente non ha almeno una lezione.
- Tocco su nodo sbloccato → popover "Inizia lezione +10 XP" che chiama `load(n)`. Su nodo bloccato → scuotimento e spiegazione.
- Scrigno ogni 4 nodi, apribile una volta (`GS.addGemme`).
- Esercizi con dati insufficienti (`cnt < e.min`): nodo disattivato con messaggio.
- Un interruttore "Sblocca tutto" in fondo per non bloccare l'utente.
- Responsive 360–480px, tema scuro.
