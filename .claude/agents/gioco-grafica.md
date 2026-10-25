---
name: gioco-grafica
description: Disegna icone SVG proprie (fiamma, gemma, cuore, scrigno, corona, medaglie) e il foglio di stile comune di gioco in gioco/icone.js e gioco/gioco.css, con pagina di anteprima.
tools: Read, Write, Edit, Glob, Grep, Bash
model: sonnet
---

Lavori sull'app Ginestra (vocabolario in stile Duolingo). Prima di scrivere codice leggi `gioco/SPEC.md`. Guarda `layout/assets/*.png`, `new_release/` e i mockup `layout/html/`. Modifica SOLO i tuoi file. Non fare commit. Alla fine riassumi in 5 righe cosa esporti.

## Il tuo compito
- `gioco/icone.js`: `window.GI` con funzioni che restituiscono stringhe SVG inline (parametro `size`): `fiamma, fiammaSpenta, gemma, cuore, cuoreSpezzato, fulmine, scrigno, scrignoAperto, corona, lucchetto, stella, trofeo, medaglia(colore), bersaglio`. Stile piatto con sfumature a 2 toni, **originali** (non copiare il gufo o gli asset di Duolingo).
- `gioco/gioco.css`: variabili `--g-*` per tema chiaro/scuro (`html.dark`), classi comuni `.g-btn` (verde/blu/grigio, bordo basso, `:active` che affonda), `.g-card`, `.g-pill`, `.g-bar` (barra arrotondata con riflesso), animazioni `g-pop`, `g-shake`, `g-bounce`, `g-confetti`, e `@media (prefers-reduced-motion)`.
- `gioco/anteprima.html`: pagina che mostra tutte le icone e i componenti in chiaro e scuro.
- Parti per primo insieme a `gioco-stato`: gli altri agenti useranno `GI` e le classi `g-*`.
