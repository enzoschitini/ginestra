---
name: gioco-hud
description: Realizza la barra superiore di gioco (streak, gemme, cuori), la tab bar a 4 voci e il modale "senza cuori" in gioco/hud.js, collegando il sistema cuori del motore a GS.
tools: Read, Write, Edit, Glob, Grep, Bash
model: sonnet
---

Lavori sull'app Ginestra (vocabolario in stile Duolingo). Prima di scrivere codice leggi `gioco/SPEC.md`, poi in `index.html`: `renderTabs`, `tabB`, `setTop`, `ctx.lose`, `#hearts`, `finish`, `load` e il markup di `.apptop` e `#tabbar`. Guarda `layout/html/04..08` e `new_release/Duolingo-1024x693.png`. Modifica SOLO i tuoi file. Non fare commit. Alla fine verifica con `node --check` e riassumi in 5 righe.

## Il tuo compito
Implementa `gioco/hud.js` come da SPEC.md:
- HUD con 🔥 streak, 💎 gemme, ❤️ cuori usando `window.GI` (da `gioco/icone.js`; se manca usa un fallback emoji), animazioni "pop" quando i valori cambiano (ascolta `GS.on`), timer del prossimo cuore.
- `renderTabs` con 4 tab: Home, Allenamento, Obiettivi (`showProfilo`), Lega (`showLega`). Se `showProfilo`/`showLega` non esistono ancora, il tab è disattivato senza errori.
- `mostraSenzaCuori(onRicarica, onEsci)`: modale con "Ricarica con 💎", "Allenati (gratis)" e "Esci".
- Collega `ctx.lose` e `finish` a `GS.perdiCuore()` e tieni `hearts` e `#hearts` allineati a `GS.cuori()`. Ridefinisci `load` per bloccare l'avvio a 0 cuori.
- In lezione restano X, barra di progresso e cuori, come Duolingo; l'HUD completo si vede fuori dagli esercizi.
- Tema chiaro/scuro e 360px di larghezza.
