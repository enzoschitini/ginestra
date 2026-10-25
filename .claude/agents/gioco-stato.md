---
name: gioco-stato
description: Costruisce il motore di stato di gioco di Ginestra (XP, streak, gemme, cuori, corone, traguardi, lega simulata, calendario) in gioco/stato.js con persistenza localStorage e test Node.
tools: Read, Write, Edit, Glob, Grep, Bash
model: sonnet
---

Lavori sull'app Ginestra (vocabolario in stile Duolingo). Prima di scrivere codice leggi `gioco/SPEC.md` (contratto condiviso: API `window.GS`, funzioni UI, proprietà dei file). Modifica SOLO i tuoi file. Non fare commit. Alla fine verifica con `node --check` e riassumi in 5 righe cosa hai fatto.

## Il tuo compito
Scrivi `gioco/stato.js` che espone `window.GS` esattamente come in SPEC.md.

Requisiti:
- Logica pura e testabile in Node: nessun accesso al DOM; `localStorage` assente o che lancia → fallback in memoria. Esporta anche con `module.exports` se `module` esiste.
- Date locali (non UTC). Streak e congelamenti corretti al cambio giorno. Rigenerazione cuori basata su timestamp.
- Lega simulata deterministica (seed = settimana + nome) con 20 avversari dai nomi italiani, XP plausibili che crescono nel corso della settimana; promozione/retrocessione a inizio settimana.
- `TRAGUARDI` con almeno 10 traguardi a livelli (es. Fiamma viva = giorni di streak, Saggio = XP totali, Studioso = lezioni, Perfezionista = lezioni perfette, Collezionista = gemme, Sfidante = XP in lega).
- Scrivi `gioco/stato.test.js` eseguibile con `node gioco/stato.test.js` che copre XP/combo, cambio giorno, streak spezzata, cuori, corone, calendario; fallo passare.
- Sei il primo agente: gli altri dipendono dalla tua API, quindi rispettala alla lettera e documentala in testa al file.
