/* Ginestra gioco - festa di fine lezione + banner combo. Dipende da: index.html (motore), gioco/stato.js (GS), gioco/icone.js (GI).
 * Ridefinisce: finish, load, next, showResult (pattern *_engine). Nessun'altra modifica al motore. */
(function () {
  if (window.__festaCaricata) return;
  window.__festaCaricata = true;

  var combo = 0, comboMax = 0, giuste = 0, risultato = null, passi = [], idx = 0, timers = [], confettiEl = null;

  function ridotto() {
    try { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
  }
  function ic(nome, size) {
    var s = document.createElement('span');
    s.className = 'f-ico';
    try { s.innerHTML = window.GI && window.GI[nome] ? window.GI[nome](size) : ''; } catch (e) {}
    return s;
  }
  function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
  function pulisci() {
    timers.forEach(clearTimeout); timers = [];
    if (confettiEl && confettiEl.parentNode) confettiEl.parentNode.removeChild(confettiEl);
    confettiEl = null;
  }

  /* ---------- suoni (rispettano SOUND_ON) ---------- */
  function suona(fn) {
    if (typeof SOUND_ON === 'undefined' || !SOUND_ON) return;
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      if (AC.state === 'suspended') AC.resume();
      fn(AC.currentTime + 0.02);
    } catch (e) {}
  }
  function sfxCombo(n) {
    suona(function (t) {
      var base = n >= 8 ? 659.25 : n >= 5 ? 587.33 : 523.25;
      [1, 1.25, 1.5, 2].forEach(function (m, i) { tone(t + i * 0.07, base * m, base * m, 0.2, 'square', 0.12); });
    });
  }
  function sfxFesta() {
    suona(function (t) {
      [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) { tone(t + i * 0.11, f, f, 0.3, 'triangle', 0.26); });
      tone(t + 0.5, 1318.5, 1318.5, 0.6, 'sine', 0.2);
    });
  }
  function sfxDing() { suona(function (t) { tone(t, 880, 1174.7, 0.22, 'sine', 0.22); tone(t + 0.1, 1318.5, 1318.5, 0.3, 'sine', 0.16); }); }
  function sfxFiamma() { suona(function (t) { tone(t, 220, 880, 0.45, 'sawtooth', 0.12); tone(t + 0.35, 784, 784, 0.35, 'triangle', 0.22); }); }
  function sfxTriste() { suona(function (t) { tone(t, 392, 196, 0.5, 'triangle', 0.25); tone(t + 0.3, 330, 165, 0.7, 'triangle', 0.22); }); }

  /* ---------- contatori e coriandoli ---------- */
  function conta(el, da, a, ms, ritardo, fmt) {
    fmt = fmt || function (v) { return String(v); };
    if (ridotto() || da === a) { el.textContent = fmt(a); return; }
    el.textContent = fmt(da);
    later(function () {
      var t0 = null;
      function passo(ts) {
        if (!el.isConnected) return;
        if (t0 === null) t0 = ts;
        var p = Math.min(1, (ts - t0) / ms), e = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(Math.round(da + (a - da) * e));
        if (p < 1) requestAnimationFrame(passo);
      }
      requestAnimationFrame(passo);
    }, ritardo || 0);
  }
  function coriandoli(n) {
    if (ridotto()) return;
    if (confettiEl && confettiEl.parentNode) confettiEl.parentNode.removeChild(confettiEl);
    var col = ['#58cc02', '#1cb0f6', '#ff9600', '#ffc800', '#ff4b4b', '#ce82ff'], c = document.createElement('div'), i, p;
    c.className = 'f-confetti'; c.setAttribute('aria-hidden', 'true');
    for (i = 0; i < (n || 36); i++) {
      p = document.createElement('i');
      p.style.setProperty('--x', (Math.random() * 100).toFixed(1) + '%');
      p.style.setProperty('--c', col[i % col.length]);
      p.style.setProperty('--d', (Math.random() * 0.8).toFixed(2) + 's');
      p.style.setProperty('--t', (2.2 + Math.random() * 1.6).toFixed(2) + 's');
      p.style.setProperty('--r', (Math.random() * 360).toFixed(0) + 'deg');
      c.appendChild(p);
    }
    document.body.appendChild(c);
    confettiEl = c;
    later(function () { if (c.parentNode) c.parentNode.removeChild(c); if (confettiEl === c) confettiEl = null; }, 4800);
  }

  /* ---------- banner combo ---------- */
  function bannerCombo(n) {
    var old = document.querySelector('.f-banner');
    if (old) old.remove();
    var b = h('div', { class: 'f-banner' + (n >= 8 ? ' f-forte' : n >= 5 ? ' f-medio' : ''), role: 'status' }, ic('fulmine', 26), h('span', {}, n + ' di fila!'));
    document.body.appendChild(b);
    sfxCombo(n);
    setTimeout(function () { b.classList.add('f-esce'); }, 1300);
    setTimeout(function () { if (b.parentNode) b.remove(); }, 1750);
  }

  /* ---------- aggancio al motore ---------- */
  var finish_engine = finish;
  finish = function (ok, solution, note) {
    var gia = (typeof done !== 'undefined') && done;
    finish_engine.apply(this, arguments);
    if (gia) return;
    if (ok) {
      combo++; giuste++;
      if (combo > comboMax) comboMax = combo;
      if (combo === 3 || combo === 5 || combo === 8) bannerCombo(combo);
    } else { combo = 0; }
  };

  var load_engine = load;
  load = function () {
    pulisci();
    combo = 0; comboMax = 0; giuste = 0; risultato = null;
    var b = document.querySelector('.f-banner'); if (b) b.remove();
    return load_engine.apply(this, arguments);
  };

  var next_engine = next;
  next = function () {
    // cuori finiti: la lezione si interrompe subito
    if (hearts <= 0 && qi < cur.items.length - 1) { qi = cur.items.length; return showResult(); }
    return next_engine.apply(this, arguments);
  };

  var showResult_engine = showResult;
  showResult = function () {
    pulisci();
    var tot = cur && cur.items ? cur.items.length : 0;
    if (typeof hearts !== 'undefined' && hearts <= 0) return schermataFallita();
    if (!window.GS || !window.GI) return showResult_engine.apply(this, arguments);
    if (!risultato) {
      var prima = GS.state.xpOggi;
      var r = GS.registraLezione({ ex: cur.n, giuste: score, totali: tot, combo: comboMax });
      risultato = { r: r, prima: prima, dopo: GS.state.xpOggi, tot: tot, perfetta: tot > 0 && score >= tot };
    }
    passi = costruisciPassi(risultato);
    idx = 0;
    $('prog').style.width = '100%';
    mostra();
  };

  /* ---------- schermate ---------- */
  function costruisciPassi(R) {
    var r = R.r, p = [sRiepilogo];
    if (r.streakAumentata) p.push(sStreak);
    if (r.obiettivoRaggiunto) p.push(sObiettivo);
    if (r.coronaSalita) p.push(sCorona);
    (r.nuoviTraguardi || []).forEach(function (t) { p.push(function () { return sTraguardo(t); }); });
    if (r.legaPromossa === true || r.legaPromossa === false) p.push(sLega);
    return p;
  }
  function mostra() {
    pulisci();
    var b = $('body'), f = $('footer'), ultimo = idx === passi.length - 1, s = passi[idx]();
    b.className = 'festa';
    b.replaceChildren(s.el);
    $('title').textContent = '';
    f.className = 'footer f-footer';
    var btns;
    if (ultimo) {
      btns = [
        h('button', { class: 'f-btn f-blu', type: 'button', onclick: function () { pulisci(); load(cur.n); } }, 'Nuova lezione'),
        h('button', { class: 'f-btn f-grigio', type: 'button', onclick: function () { pulisci(); showHome(); } }, 'Torna al percorso')
      ];
    } else {
      btns = [h('button', { class: 'f-btn f-blu', type: 'button', onclick: function () { idx++; mostra(); } }, 'Continua')];
    }
    f.replaceChildren.apply(f, btns.concat([h('div', { class: 'home-indicator' })]));
    if (s.dopo) s.dopo();
    var primo = f.querySelector('.f-btn'); if (primo) primo.focus({ preventScroll: true });
  }
  function schermata(titolo, sotto, hero, extra, cls) {
    var el = h('div', { class: 'f-scr ' + (cls || '') },
      h('div', { class: 'f-hero' }, hero),
      h('h2', { class: 'f-titolo' }, titolo),
      sotto ? h('p', { class: 'f-sotto' }, sotto) : null,
      extra || null);
    return el;
  }
  function riquadro(cls, etichetta, icona, valore, fmt, ritardo) {
    var v = h('b', { class: 'f-val' }, '0');
    conta(v, 0, valore, 800, ritardo, fmt);
    return h('div', { class: 'f-stat ' + cls }, h('div', { class: 'f-stat-t' }, etichetta),
      h('div', { class: 'f-stat-c' }, icona, v));
  }

  function sRiepilogo() {
    var R = risultato, r = R.r, xp = r.xpBase + r.xpCombo + r.xpPerfetta;
    var obiettivo = (GS.state.obiettivoXp || 20), pctDa = Math.min(100, R.prima / obiettivo * 100), pctA = Math.min(100, R.dopo / obiettivo * 100);
    var riempi = h('i', {}), baule = ic(r.obiettivoRaggiunto ? 'scrigno' : 'scrigno', 34);
    riempi.style.setProperty('--g-pct', pctDa + '%');
    var testo = h('span', { class: 'f-ob-n' }, '');
    conta(testo, Math.min(R.prima, obiettivo), Math.min(R.dopo, obiettivo), 800, 600, function (v) { return v + ' / ' + obiettivo + ' XP'; });
    var dettagli = ['Base ' + r.xpBase];
    if (r.xpCombo) dettagli.push('Combo +' + r.xpCombo);
    if (r.xpPerfetta) dettagli.push('Perfetta +' + r.xpPerfetta);
    var stats = h('div', { class: 'f-stats' },
      riquadro('f-xp', 'XP', ic('fulmine', 22), xp, function (v) { return '+' + v; }, 200),
      riquadro('f-combo', 'Combo', ic('fiamma', 22), comboMax, null, 350),
      riquadro('f-gem', 'Gemme', ic('gemma', 22), r.gemme, function (v) { return '+' + v; }, 500));
    var barra = h('div', { class: 'f-ob' },
      h('div', { class: 'f-ob-t' }, h('span', {}, 'Obiettivo giornaliero'), testo),
      h('div', { class: 'f-ob-r' }, h('div', { class: 'g-bar f-bar', 'aria-label': 'Obiettivo giornaliero' }, riempi), h('div', { class: 'f-scrigno' }, baule)));
    var el = schermata(R.perfetta ? 'Lezione perfetta!' : 'Lezione completata!',
      'Risposte giuste: ' + score + ' su ' + R.tot + '  ·  ' + dettagli.join(' · '),
      h('div', { class: 'f-mascotte' }, mascot()), h('div', {}, stats, barra), 'f-riepilogo');
    return {
      el: el,
      dopo: function () {
        sfxFesta(); if (R.perfetta || score >= R.tot * 0.8) coriandoli(R.perfetta ? 50 : 30);
        later(function () { riempi.style.setProperty('--g-pct', pctA + '%'); }, 400);
        if (r.obiettivoRaggiunto) later(function () {
          baule.replaceChildren(ic('scrignoAperto', 34)); baule.classList.add('g-anim-pop'); sfxDing();
        }, 1300);
      }
    };
  }

  function sStreak() {
    var r = risultato.r, num = h('b', { class: 'f-streak-n' }, String(r.streakPrima));
    var giorni = GS.streakGiorni(7), oggiEl = null, riga = h('div', { class: 'f-giorni', role: 'list' });
    giorni.forEach(function (g) {
      var cella = h('div', { class: 'f-g' + (g.oggi ? ' f-oggi' : ''), role: 'listitem', 'aria-label': g.lettera + (g.attivo ? ' attivo' : ' non attivo') },
        h('span', { class: 'f-g-l' }, g.lettera), ic(g.attivo && !g.oggi ? 'fiamma' : 'fiammaSpenta', 30));
      if (g.oggi) oggiEl = cella;
      riga.appendChild(cella);
    });
    var hero = h('div', { class: 'f-fiamma-big' }, ic('fiamma', 76), num);
    var el = schermata(r.streakDopo === 1 ? '1 giorno di fila!' : r.streakDopo + ' giorni di fila!',
      'Torna domani per tenere viva la fiamma.', hero, riga, 'f-streak');
    var titolo = el.querySelector('.f-titolo');
    conta(num, r.streakPrima, r.streakDopo, 700, 300);
    return {
      el: el,
      dopo: function () {
        titolo.textContent = r.streakDopo === 1 ? '1 giorno di fila!' : r.streakDopo + ' giorni di fila!';
        later(function () {
          if (!oggiEl) return;
          var vecchio = oggiEl.querySelector('.f-ico');
          vecchio.replaceWith(ic('fiamma', 30));
          oggiEl.classList.add('f-acceso'); sfxFiamma(); coriandoli(24);
        }, 800);
      }
    };
  }

  function sObiettivo() {
    var R = risultato, ob = GS.state.obiettivoXp || 20;
    return {
      el: schermata('Obiettivo raggiunto!', 'Hai guadagnato ' + ob + ' XP oggi. Bonus: +15 gemme.',
        h('div', { class: 'f-hero-ico g-anim-pop' }, ic('bersaglio', 88)),
        h('div', { class: 'f-premio' }, ic('gemma', 26), h('b', {}, '+15')), 'f-obiettivo'),
      dopo: function () { sfxFesta(); coriandoli(44); }
    };
  }

  function sCorona() {
    var n = GS.state.corone[cur.n] || 1, stelle = h('div', { class: 'f-corone', 'aria-label': 'Corone: ' + n + ' su 5' }), i, c;
    for (i = 1; i <= 5; i++) {
      c = ic('corona', 30); if (i > n) c.classList.add('f-spenta');
      stelle.appendChild(c);
    }
    return {
      el: schermata('Nuova corona!', (cur.name || 'Esercizio') + ': livello ' + n + ' di 5.',
        h('div', { class: 'f-hero-ico g-anim-pop' }, ic('corona', 130)), stelle, 'f-corona'),
      dopo: function () { sfxFesta(); coriandoli(36); }
    };
  }

  function sTraguardo(t) {
    var cols = ['bronzo', 'argento', 'oro', 'blu', 'viola'];
    return {
      el: schermata('Nuovo traguardo!', t.nome + ' · livello ' + t.livello,
        h('div', { class: 'f-hero-ico g-anim-pop' }, ic('medaglia', 130)), null, 'f-traguardo'),
      dopo: function () {
        var s = document.querySelector('.f-traguardo .f-hero-ico');
        if (s) s.replaceChildren(ic('medaglia', 130));
        try { var svg = s.querySelector('svg'); if (svg && window.GI) s.innerHTML = window.GI.medaglia(130, cols[Math.min(4, Math.max(0, t.livello - 1))]); } catch (e) {}
        sfxFesta(); coriandoli(36);
      }
    };
  }

  function sLega() {
    var su = risultato.r.legaPromossa === true, nome = (GS.LEGHE && GS.LEGHE[GS.state.lega]) || 'Lega';
    return {
      el: schermata(su ? 'Sei salito in Lega ' + nome + '!' : 'Sei sceso in Lega ' + nome,
        su ? 'Hai raggiunto l\'obiettivo settimanale. Ottimo lavoro!' : 'La settimana scorsa hai fatto pochi XP. Questa settimana puoi risalire!',
        h('div', { class: 'f-hero-ico g-anim-pop' }, ic(su ? 'trofeo' : 'lucchetto', su ? 84 : 110)), null, 'f-lega'),
      dopo: function () { if (su) { sfxFesta(); coriandoli(50); } else sfxTriste(); }
    };
  }

  function schermataFallita() {
    var b = $('body'), f = $('footer');
    $('prog').style.width = '0%';
    $('title').textContent = '';
    b.className = 'festa';
    b.replaceChildren(h('div', { class: 'f-scr f-fallita' },
      h('div', { class: 'f-hero' }, mascot(true)),
      h('h2', { class: 'f-titolo' }, 'Peccato!'),
      h('p', { class: 'f-sotto' }, 'Hai finito i cuori e la lezione si è interrotta. Nessun XP stavolta: riprova.'),
      h('div', { class: 'f-premio f-persa' }, ic('cuoreSpezzato', 30), h('b', {}, '0 cuori'))));
    f.className = 'footer f-footer';
    f.replaceChildren(
      h('button', { class: 'f-btn f-blu', type: 'button', onclick: function () { load(cur.n); } }, 'Riprova'),
      h('button', { class: 'f-btn f-grigio', type: 'button', onclick: function () { showHome(); } }, 'Torna al percorso'),
      h('div', { class: 'home-indicator' }));
    sfxTriste();
    var p = f.querySelector('.f-btn'); if (p) p.focus({ preventScroll: true });
  }
})();
