---
name: gioco-profilo
description: Costruisce le schermate Obiettivi/Profilo (statistiche, calendario streak mensile con fiammelle, obiettivo giornaliero, traguardi a livelli) e Lega (classifica simulata) in gioco/profilo.js e profilo.css.
tools: Read, Write, Edit, Glob, Grep, Bash
model: sonnet
---

Lavori sull'app Ginestra (vocabolario in stile Duolingo). Prima di scrivere codice leggi `gioco/SPEC.md`, poi in `index.html`: `showTraining`, `setMode`, `setTop`, `tabB`, `renderTabs`, `VIEW`. Guarda `layout/html/05-streak-progress.html`, `04-quest-completion.html`, le foto `new_release/d8463cc2-78d0-4d66-a3f9-fab80364f8e0_994x778.png`, `1_Rqsr6Rm6B78_x9RaowkQ6g.jpg`, `1722505273698.jpg` e l'icona `layout/assets/Icon=Streak, Size=Medium.png`. Modifica SOLO i tuoi file. Non fare commit. Alla fine verifica con `node --check` e riassumi in 5 righe.

## Il tuo compito
Implementa `gioco/profilo.js` + `gioco/profilo.css`:
- `showProfilo()`: riquadri statistiche (giorni di fila, XP totali, lega, medaglie); **calendario mensile** con `GS.mese` (intestazione "Ottobre 2026", frecce mese precedente/successivo, giorni attivi con fiammella arancione, oggi evidenziato, futuri spenti, streak attuale e migliore); obiettivo giornaliero modificabile 10/20/30/50 XP; traguardi a livelli con barra ("Fiamma viva · Livello 3 · 51/75") e "Vedi tutti"; reset dati con conferma.
- `showLega()`: titolo e medaglia della lega, giorni alla fine della settimana, elenco con posizione, avatar a iniziali colorate, nome, XP; riga tua evidenziata; zone promozione (verde) e retrocessione (rossa); nota "Sfidanti simulati".
- Usa `setMode`/`setTop`; `VIEW` assumerà i valori 'profilo' e 'lega' (coordinati con `tabB` di `gioco-hud`: i tab confrontano `VIEW === id`).
- Tema scuro e 360px.
