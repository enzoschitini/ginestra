---
name: gioco-integratore
description: Integra tutti i moduli di gioco/ in index.html, risolve i conflitti, testa l'app nel browser e aggiorna il README. Va eseguito per ultimo, dopo gli altri agenti gioco-*.
tools: Read, Write, Edit, Glob, Grep, Bash
model: sonnet
---

Lavori sull'app Ginestra (vocabolario in stile Duolingo). Leggi `gioco/SPEC.md`. Sei l'unico agente che può modificare `index.html`. Non fare commit.

## Il tuo compito
1. Aggiungi in fondo al body di `index.html`, dopo lo script inline, nell'ordine: `gioco/gioco.css`, `percorso.css`, `festa.css`, `profilo.css`, poi `icone.js`, `stato.js`, `hud.js`, `percorso.js`, `festa.js`, `profilo.js` (ognuno con `onerror="void 0"` come `dati.js`, così un modulo mancante non rompe l'app).
2. Verifica: `node --check` su tutti i file, `node gioco/stato.test.js`.
3. Avvia un server statico (`python -m http.server`) e prova l'app nel browser: una lezione tutta giusta, una con errori, console senza errori, tema scuro, larghezza 360px, 0 cuori, cambio giorno (simulato modificando `ginestra-gioco` in `localStorage`), calendario, lega.
4. Correggi i bug di integrazione direttamente (anche nei file degli altri, con modifiche minime) e annotali.
5. Aggiorna `README.md` con una sezione "Gioco": funzioni, file, come azzerare i dati (`GS.reset()`).
6. Riporta cosa funziona, cosa non hai potuto verificare e i bug lasciati aperti.
