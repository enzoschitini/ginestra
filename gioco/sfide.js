/* Ginestra gioco - Sfide. Per ora una sola: la Maratona, una corsa contro il tempo.
   Le domande arrivano dagli stessi esercizi della Home, mescolate dall'app: non si sceglie nulla.
   Ogni risposta giusta regala tempo e fa salire la combo, ogni errore lo toglie. Quando il tempo finisce la corsa si chiude.
   Dipende da: i globali di index.html (EX, cur, qi, done, ctx, finish, next, showQ, setMode, $, h, shuffle, mascot, HOME),
   da GS (stato.js) e GI/SND se presenti. Carica dopo profilo.js, hud.js e percorso.js. Espone window.sfideSezione() per Obiettivi. */
(function () {
  if (!window.GS || typeof EX === 'undefined') return;

  /* regole della Maratona */
  var TEMPO0 = 90, TEMPO_MAX = 120, BONUS = 5, PENALITA = 8, PUNTI = 10, COMBO_MAX = 5;
  var TIPI = [2, 3, 4, 6, 7, 9, 10, 11, 12]; // esercizi a domanda singola, adatti alla corsa
  var M = { on: false };

  function suona(n) { try { if (window.SND) SND.play(n); } catch (e) {} }
  function gi(nome, size) { try { return window.GI && GI[nome] ? GI[nome](size) : ''; } catch (e) { return ''; } }
  function el(tag, cls, kids) {
    var e = document.createElement(tag), i;
    if (cls) e.className = cls;
    kids = kids == null ? [] : [].concat(kids);
    for (i = 0; i < kids.length; i++) if (kids[i] != null && kids[i] !== false) e.append(kids[i].nodeType ? kids[i] : document.createTextNode(kids[i]));
    return e;
  }
  function dati() {
    var S = GS.state; S.sfide = S.sfide || {};
    return S.sfide.maratona = S.sfide.maratona || { record: 0, giuste: 0, combo: 0, partite: 0 };
  }
  function tipiPronti() { return EX.filter(function (e) { return TIPI.indexOf(e.n) >= 0 && e.pool().length >= (e.min || 1); }); }
  function mmss(s) { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + (s % 60); }

  /* ---------- scheda nella schermata Obiettivi ---------- */
  window.sfideSezione = function () {
    var d = dati(), box = el('section', 'g-card pf-sez sf-sez'), pronto = tipiPronti().length > 0, b;
    b = el('button', 'g-btn g-btn-verde', pronto ? 'Parti' : 'Non disponibile');
    b.type = 'button'; b.disabled = !pronto;
    b.addEventListener('click', function () { introMaratona(); });
    box.append(el('h3', 'pf-h', 'Sfide'),
      el('div', 'sf-card', [
        el('div', 'sf-ico', el('span', '', '')),
        el('div', 'sf-t', [el('b', '', 'Maratona'),
          el('span', '', 'Corri contro il tempo: ogni risposta giusta ti regala ' + BONUS + ' secondi.'),
          el('span', 'sf-rec', d.record ? 'Record: ' + d.record + ' punti' : 'Nessun record: stabiliscilo!')]),
        b]),
      el('p', 'g-sotto pf-nota', 'Altre sfide arriveranno presto.'));
    box.querySelector('.sf-ico span').innerHTML = gi('timer', 44);
    return box;
  };

  /* ---------- domande: gli esercizi della Home, mescolati ---------- */
  function rifornisci() {
    var gruppi = shuffle(tipiPronti()).map(function (e) {
      var it = [];
      try { it = e.gen() || []; } catch (x) {}
      return shuffle(it).map(function (q) { delete q._k; delete q._wrap; q._ex = e; return q; });
    }), out = [], i, vivo = true;
    while (vivo) {
      vivo = false;
      for (i = 0; i < gruppi.length; i++) if (gruppi[i].length) { out.push(gruppi[i].shift()); vivo = true; }
    }
    // mai due domande dello stesso tipo di fila
    for (i = 1; i < out.length; i++) {
      if (out[i]._ex === out[i - 1]._ex) {
        for (var j = i + 1; j < out.length; j++) if (out[j]._ex !== out[i - 1]._ex) { var t = out[i]; out[i] = out[j]; out[j] = t; break; }
      }
    }
    return out;
  }
  function prossima() {
    if (M.coda.length < 3) {
      var ult = M.coda.length ? M.coda[M.coda.length - 1]._ex : M.ultimoTipo;
      var nuove = rifornisci();
      if (nuove.length > 1 && nuove[0]._ex === ult) nuove.push(nuove.shift());
      M.coda = M.coda.concat(nuove);
    }
    return M.coda.shift();
  }

  /* ---------- barra superiore: tempo e punteggio ---------- */
  function montaBarra() {
    var bar = document.querySelector('.lesson-bar'), cont = document.querySelector('.content');
    M.orologio = el('div', 'sf-tempo', [el('span', 'sf-tempo-ic', ''), el('b', 'sf-tempo-n', mmss(M.tempo)), el('span', 'sf-delta', '')]);
    M.orologio.firstChild.innerHTML = gi('timer', 22);
    M.orologio.setAttribute('role', 'timer'); M.orologio.setAttribute('aria-label', 'Tempo rimasto');
    var pb = bar.querySelector('.progress-bg'); pb.after(M.orologio);
    M.hud = el('div', 'sf-hud', [
      el('div', 'sf-punti', [el('b', '', '0'), el('span', '', 'punti')]),
      el('div', 'sf-combo', [el('span', 'sf-combo-ic', ''), el('b', '', 'x1')]),
      el('div', 'sf-giuste', [el('b', '', '0'), el('span', '', 'giuste')])]);
    M.hud.querySelector('.sf-combo-ic').innerHTML = gi('fiamma', 24);
    cont.insertBefore(M.hud, cont.firstChild);
  }
  function aggiornaHud(anima) {
    if (!M.hud) return;
    var mult = moltiplicatore();
    M.hud.querySelector('.sf-punti b').textContent = M.punti;
    M.hud.querySelector('.sf-giuste b').textContent = M.giuste;
    M.hud.querySelector('.sf-combo b').textContent = 'x' + mult;
    M.hud.querySelector('.sf-combo').classList.toggle('acceso', M.combo >= 3);
    if (anima) {
      var k = M.hud.querySelector(anima); if (!k) return;
      k.classList.remove('sf-pop'); void k.offsetWidth; k.classList.add('sf-pop');
    }
  }
  function moltiplicatore() { return Math.min(COMBO_MAX, 1 + Math.floor(M.combo / 3)); }
  function mostraTempo() {
    if (!M.orologio) return;
    M.orologio.querySelector('.sf-tempo-n').textContent = mmss(M.tempo);
    M.orologio.classList.toggle('sf-poco', M.tempo <= 15);
    document.body.classList.toggle('sfida-poco', M.tempo <= 15);
    var pb = $('prog'); if (pb) pb.style.width = Math.max(0, Math.min(100, M.tempo / TEMPO_MAX * 100)) + '%';
  }
  function delta(s) {
    if (!M.orologio) return;
    var d = M.orologio.querySelector('.sf-delta');
    d.textContent = (s > 0 ? '+' : '') + s + ' s'; d.className = 'sf-delta ' + (s > 0 ? 'su' : 'giu');
    void d.offsetWidth; d.classList.add('vai');
  }

  /* ---------- schermate: presentazione, conto alla rovescia, risultato ---------- */
  function schermata(titolo, corpo, bottoni) {
    $('title').textContent = '';
    var b = $('body'); b.className = 'result sf-schermo'; b.replaceChildren.apply(b, corpo);
    var f = $('footer'); f.className = 'footer'; f.replaceChildren.apply(f, bottoni.concat([h('div', { class: 'home-indicator' })]));
    var c = document.querySelector('.content'); if (c) c.scrollTop = 0;
    var main = f.querySelector('.btn-main'); if (main) try { main.focus(); } catch (e) {}
  }
  function btnMain(t, fn) { return h('button', { class: 'btn-main', type: 'button', onclick: fn }, t); }
  function btnLink(t, fn) { return h('button', { class: 'btn-link home-link', type: 'button', onclick: fn }, t); }
  function torna() { chiudi(); if (window.showProfilo) showProfilo(); else showHome(); }

  function preparaSchermo() {
    if (!M.on) {
      M.on = true; M.ctxLose = ctx.lose; ctx.lose = function () {};
      document.body.classList.add('sfida');
    }
    cur = { n: 999, name: 'Maratona', title: '', items: [], pool: function () { return []; }, needs: '' };
    qi = 0; done = false; checkFn = null; afterFn = null;
    setMode('ex');
    var sh = $('sheet'); if (sh) sh.hidden = true;
  }
  function introMaratona() {
    if (!tipiPronti().length) return;
    chiudi(); preparaSchermo();
    var d = dati();
    $('prog').style.width = '100%';
    schermata('Maratona', [
      el('div', 'sf-eroe', el('span', '', '')),
      h('h2', {}, 'Maratona'),
      h('p', {}, 'Rispondi più in fretta che puoi. Gli esercizi li scegliamo noi.'),
      el('ul', 'sf-regole', [
        el('li', '', ['Parti con ', el('b', '', TEMPO0 + ' secondi'), '.']),
        el('li', '', [el('b', 'su', '+' + BONUS + ' s'), ' per ogni risposta giusta.']),
        el('li', '', [el('b', 'giu', '−' + PENALITA + ' s'), ' per ogni errore.']),
        el('li', '', ['Più risposte giuste di fila, più punti: fino a ', el('b', '', 'x' + COMBO_MAX), '.'])]),
      el('div', 'sf-rec-riga', d.record ? ['Il tuo record: ', el('b', '', d.record + ' punti')] : ['Ancora nessun record.'])
    ], [btnMain('Via!', contoAllaRovescia), btnLink('Non adesso', torna)]);
    $('body').querySelector('.sf-eroe span').innerHTML = gi('timer', 96);
  }
  function contoAllaRovescia() {
    var n = 3, f = $('footer');
    f.className = 'footer'; f.replaceChildren(h('div', { class: 'home-indicator' }));
    var num = el('div', 'sf-conto', String(n));
    $('body').className = 'result sf-schermo'; $('body').replaceChildren(el('p', 'sf-pronti', 'Pronti…'), num);
    suona('click');
    M.conto = setInterval(function () {
      n--;
      if (!M.on) { clearInterval(M.conto); return; }
      if (n > 0) { num.textContent = String(n); num.classList.remove('sf-pop'); void num.offsetWidth; num.classList.add('sf-pop'); suona('click'); }
      else { clearInterval(M.conto); M.conto = null; parti(); }
    }, 800);
  }
  function risultato(motivo) {
    var d = dati(), nuovo = M.punti > d.record, totali = M.giuste + M.errate, res = null, xpExtra = Math.min(40, M.giuste);
    d.partite++; d.giuste = Math.max(d.giuste, M.giuste); d.combo = Math.max(d.combo, M.comboMax);
    if (nuovo) d.record = M.punti;
    if (M.giuste > 0) {
      res = GS.registraLezione({ ex: 'maratona', giuste: M.giuste, totali: Math.max(totali, 1), combo: M.comboMax });
      delete GS.state.corone.maratona; // la corona e' dei livelli della Home
      GS.addXP(xpExtra, 'maratona');
      if (nuovo && d.partite > 1) GS.addGemme(10);
    }
    GS.save();
    var xp = res ? res.xpBase + res.xpCombo + res.xpPerfetta + xpExtra : 0, gem = res ? res.gemme + (nuovo && d.partite > 1 ? 10 : 0) : 0;
    suona(M.giuste > 0 ? 'congratulazioni' : 'riprova');
    var cella = function (cl, tit, val) { return el('div', 'sf-cella ' + cl, [el('b', '', tit), el('span', '', String(val))]); };
    schermata('Maratona', [
      el('div', 'sf-eroe', el('span', '', '')),
      h('h2', {}, motivo === 'tempo' ? 'Tempo scaduto!' : 'Corsa finita'),
      el('div', 'sf-grande', [el('b', '', String(M.punti)), el('span', '', 'punti')]),
      nuovo && M.punti > 0 ? el('div', 'sf-nuovo', 'Nuovo record!') : el('div', 'sf-rec-riga', ['Record: ', el('b', '', d.record + ' punti')]),
      el('div', 'sf-griglia', [cella('v', 'Giuste', M.giuste), cella('r', 'Errori', M.errate), cella('a', 'Combo', 'x' + moltiplicatoreDi(M.comboMax)), cella('b', 'Tempo', mmss(M.durata))]),
      xp || gem ? el('div', 'sf-premi', [xp ? el('span', '', ['+' + xp + ' XP']) : null, gem ? el('span', '', ['+' + gem + ' gemme']) : null]) : el('p', '', 'Rispondi bene a qualche domanda per guadagnare XP e gemme.')
    ], [btnMain('Riprova', function () { introRipartenza(); }), btnLink('Torna agli obiettivi', torna)]);
    $('body').querySelector('.sf-eroe span').innerHTML = gi(nuovo && M.punti > 0 ? 'trofeo' : 'timer', 84);
    fermaTimer();
    var cl = $('close'); if (cl) cl.disabled = false;
    if (M.orologio) { M.orologio.remove(); M.orologio = null; }
    if (M.hud) { M.hud.remove(); M.hud = null; }
    $('prog').style.width = '100%'; document.body.classList.remove('sfida-poco');
  }
  function moltiplicatoreDi(c) { return Math.min(COMBO_MAX, 1 + Math.floor(c / 3)); }
  function introRipartenza() { introMaratona(); }

  /* ---------- la corsa ---------- */
  function parti() {
    M.tempo = TEMPO0; M.punti = 0; M.giuste = 0; M.errate = 0; M.combo = 0; M.comboMax = 0; M.durata = 0;
    M.coda = []; M.ultimoTipo = null; M.chiusa = false;
    montaBarra(); mostraTempo();
    domanda();
    M.t0 = performance.now();
    M.timer = setInterval(tick, 100);
  }
  function fermaTimer() { if (M.timer) { clearInterval(M.timer); M.timer = null; } if (M.conto) { clearInterval(M.conto); M.conto = null; } }
  function tick() {
    var ora = performance.now(), dt = (ora - M.t0) / 1000; M.t0 = ora;
    if (!M.on || M.chiusa) return;
    if (done) return; // il tempo si ferma mentre leggi la correzione
    M.tempo -= dt; M.durata += dt;
    if (M.tempo <= 0) { M.tempo = 0; mostraTempo(); termina('tempo'); return; }
    mostraTempo();
  }
  function domanda() {
    var q = prossima();
    if (!q) { termina('fine'); return; }
    M.ultimoTipo = q._ex;
    cur.items = [q]; cur.title = q._ex.title; cur.render = q._ex.render; cur.auto = q._ex.auto; cur.n = 999;
    qi = 0; showQ();
    $('footer').querySelector('.btn-main') && ($('footer').querySelector('.btn-main').textContent = 'Controlla');
    mostraTempo();
    M.t0 = performance.now();
  }
  function termina(motivo) {
    if (M.chiusa) return; M.chiusa = true; fermaTimer();
    var b = $('body'); if (b) b.querySelectorAll('input,button').forEach(function (x) { x.disabled = true; });
    var f = $('footer'); f.className = 'footer';
    M.hud && M.hud.classList.add('fine');
    if (motivo === 'tempo') {
      f.replaceChildren(h('div', { class: 'sf-stop' }, 'Tempo scaduto!'), h('div', { class: 'home-indicator' }));
      suona('riprova');
      setTimeout(function () { if (M.on && M.chiusa) risultato(motivo); }, 900);
    } else risultato(motivo);
  }
  function chiudi() {
    fermaTimer();
    if (M.orologio) M.orologio.remove();
    if (M.hud) M.hud.remove();
    if (M.on && M.ctxLose) ctx.lose = M.ctxLose;
    document.body.classList.remove('sfida', 'sfida-poco');
    M = { on: false };
  }

  /* ---------- aggancio al motore ---------- */
  var finish_prec = finish;
  finish = function (ok, solution, note) {
    if (!M.on || M.chiusa || done || cur.n !== 999) return finish_prec(ok, solution, note);
    finish_prec(ok, solution, note);
    var btn = $('footer').querySelector('.btn-main');
    if (ok) {
      M.combo++; M.giuste++; if (M.combo > M.comboMax) M.comboMax = M.combo;
      M.punti += PUNTI * moltiplicatore();
      M.tempo = Math.min(TEMPO_MAX, M.tempo + BONUS); delta(BONUS);
      aggiornaHud('.sf-punti'); mostraTempo();
      if (btn) btn.textContent = 'Continua';
      // risposta giusta: si va avanti da soli, la corsa non si ferma
      M.auto = setTimeout(function () { if (M.on && !M.chiusa && done) avanti(); }, 750);
    } else {
      M.combo = 0; M.errate++;
      M.tempo = Math.max(0, M.tempo - PENALITA); delta(-PENALITA);
      aggiornaHud('.sf-combo'); mostraTempo();
      if (btn) btn.textContent = M.tempo <= 0 ? 'Vedi il risultato' : 'Continua';
    }
  };
  function avanti() {
    if (M.auto) { clearTimeout(M.auto); M.auto = null; }
    if (M.tempo <= 0) { termina('tempo'); return; }
    domanda();
  }
  var next_prec = next;
  next = function () { if (M.on && !M.chiusa && cur.n === 999) avanti(); else next_prec(); };

  /* uscire a meta' corsa riporta a Obiettivi, senza premi */
  var chiudiBtn = document.getElementById('close');
  if (chiudiBtn) chiudiBtn.addEventListener('click', function (e) {
    if (!M.on) return;
    e.stopImmediatePropagation(); torna();
  }, true);
  /* qualunque altra schermata che si apre chiude la corsa */
  var setMode_prec = setMode;
  setMode = function (v) { if (M.on && v !== 'ex') chiudi(); return setMode_prec(v); };
})();
