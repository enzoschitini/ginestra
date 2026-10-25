---
name: gioco-festa
description: Crea le schermate di fine lezione stile Duolingo (XP, combo, streak con 7 giorni, obiettivo giornaliero, corone, promozione di lega) e il banner combo in lezione, in gioco/festa.js e festa.css.
tools: Read, Write, Edit, Glob, Grep, Bash
model: sonnet
---

Lavori sull'app Ginestra (vocabolario in stile Duolingo). Prima di scrivere codice leggi `gioco/SPEC.md`, poi in `index.html`: `showResult`, `finish`, `next`, `score`, `cur`, `ctx`, `sfx`, `tone`, `SOUND_ON`. Guarda `layout/html/04-quest-completion.html`, `05-streak-progress.html`, `08-lesson-complete.html`, `13-lesson-exercises-feedback.html` e le foto `new_release/1722505273698.jpg`, `1_Rqsr6Rm6B78_x9RaowkQ6g.jpg`, `image-13-1024x916.webp`. Modifica SOLO i tuoi file. Non fare commit. Alla fine verifica con `node --check` e riassumi in 5 righe.

## Il tuo compito
Implementa `gioco/festa.js` + `gioco/festa.css`:
- Conteggio della combo (risposte giuste di fila) agganciato a `finish`; banner "N di fila!" a 3, 5 e 8.
- `showResult` ridefinita: chiama `GS.registraLezione` UNA volta, poi sequenza di schermate con contatori animati: (1) "Lezione completata!" con XP, combo, gemme e barra dell'obiettivo giornaliero con scrigno; (2) se la streak è aumentata, "N giorni di fila!" con la riga S M T W T F S e la fiamma di oggi che si accende (`GS.streakGiorni`); (3) schermate dedicate per obiettivo raggiunto, corona, traguardo, promozione di lega.
- Coriandoli leggeri (CSS o canvas), suoni nuovi con `tone` che rispettano `SOUND_ON`.
- Pulsante CONTINUA blu in basso; l'ultima schermata offre "Torna al percorso" (`showHome`) e "Nuova lezione".
- Gestisci la lezione interrotta per cuori finiti ("Peccato! Riprova").
