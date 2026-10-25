/* Ginestra gioco - schermate Obiettivi (showProfilo) e Lega (showLega). Dipende da GS (stato.js), GI (icone.js), h/$/setMode/setTop/renderTabs di index.html */
(function () {
  'use strict';
  var MESI = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
  var GIORNI = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];
  var COL_LEGA = ['bronzo', 'argento', 'oro', 'blu', 'rosso', 'viola'];
  var ICONA_ALT = { xp: 'fulmine', libro: 'spunta', lega: 'trofeo', calendario: 'timer' };
  var COL_AV = ['#1cb0f6', '#58cc02', '#ff9600', '#ce82ff', '#ff4b4b', '#00cd9c', '#ffc800', '#ff86d0'];
  var meseVisto = null; // {a, m}

  function gi(nome, size, arg) {
    var f = window.GI && (window.GI[nome] || window.GI[ICONA_ALT[nome]]);
    var s = document.createElement('span');
    s.className = 'pf-ico'; s.setAttribute('aria-hidden', 'true');
    if (f) s.innerHTML = f(size, arg);
    return s;
  }
  function el(tag, cls, kids) {
    var e = document.createElement(tag), i;
    if (cls) e.className = cls;
    kids = kids == null ? [] : [].concat(kids);
    for (i = 0; i < kids.length; i++) if (kids[i] != null && kids[i] !== false) e.append(kids[i].nodeType ? kids[i] : document.createTextNode(kids[i]));
    return e;
  }
  function btn(cls, label, testo, fn) {
    var b = el('button', cls, testo); b.type = 'button';
    if (label) b.setAttribute('aria-label', label);
    b.addEventListener('click', fn); return b;
  }
  function fmtN(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function barra(pct, cls) {
    var b = el('div', 'g-bar g-bar-sottile ' + (cls || ''), el('i'));
    b.firstChild.style.setProperty('--g-pct', Math.max(0, Math.min(100, pct)) + '%');
    b.setAttribute('role', 'progressbar'); b.setAttribute('aria-valuemin', '0'); b.setAttribute('aria-valuemax', '100'); b.setAttribute('aria-valuenow', Math.round(pct));
    return b;
  }
  function apri(titolo, classe) {
    if (typeof HOME !== 'undefined') cur = HOME;
    if (typeof qi !== 'undefined') qi = 0;
    var tit = titolo === 'Obiettivi' ? 'profilo' : 'lega';
    setMode(tit); setTop(titolo); renderTabs();
    var b = $('body'); b.className = 'pf ' + classe;
    var s = $('sheet'); if (s) s.hidden = true;
    return b;
  }
  function fine(b, nodo) {
    b.replaceChildren(nodo);
    b.scrollTop = 0;
    var c = document.querySelector('.content'); if (c) c.scrollTop = 0;
  }

  /* ---------- Obiettivi / Profilo ---------- */
  function riquadro(icona, valore, etichetta) {
    return el('div', 'pf-stat', [gi(icona[0], 28, icona[1]), el('div', 'pf-stat-t', [el('b', '', valore), el('span', '', etichetta)])]);
  }
  function calendario(S) {
    var oggiD = new Date(), box = el('section', 'g-card pf-sez pf-cal'), head, griglia, celle, i, c, d;
    if (!meseVisto) meseVisto = { a: oggiD.getFullYear(), m: oggiD.getMonth() };
    function ridisegna() { var nuovo = calendario(S); box.replaceWith(nuovo); }
    function muovi(dm) {
      var m = meseVisto.m + dm, a = meseVisto.a;
      if (m < 0) { m = 11; a--; } else if (m > 11) { m = 0; a++; }
      meseVisto = { a: a, m: m }; ridisegna();
    }
    var corrente = meseVisto.a === oggiD.getFullYear() && meseVisto.m === oggiD.getMonth();
    var prec = btn('pf-freccia', 'Mese precedente', '‹', function () { muovi(-1); });
    var succ = btn('pf-freccia', 'Mese successivo', '›', function () { muovi(1); });
    head = el('div', 'pf-cal-head', [prec, el('h3', 'pf-cal-mese', MESI[meseVisto.m] + ' ' + meseVisto.a), succ]);
    griglia = el('div', 'pf-griglia'); griglia.setAttribute('role', 'grid');
    for (i = 0; i < 7; i++) griglia.append(el('span', 'pf-gl', GIORNI[i]));
    celle = GS.mese(meseVisto.a, meseVisto.m);
    for (i = 0; i < celle.length; i++) {
      c = celle[i];
      if (!c) { griglia.append(el('span', 'pf-g pf-vuoto')); continue; }
      d = el('span', 'pf-g' + (c.attivo ? ' pf-attivo' : '') + (c.oggi ? ' pf-oggi' : '') + (c.futuro ? ' pf-futuro' : ''),
        c.attivo ? [gi('fiamma', 22), el('em', '', String(c.giorno))] : el('em', '', String(c.giorno)));
      d.setAttribute('role', 'gridcell');
      d.setAttribute('aria-label', c.giorno + ' ' + MESI[meseVisto.m] + (c.attivo ? ', ' + c.xp + ' XP' : c.futuro ? '' : ', nessuna attività') + (c.oggi ? ', oggi' : ''));
      griglia.append(d);
    }
    box.append(head, griglia,
      el('div', 'pf-cal-sotto', [
        el('div', 'pf-cs', [gi('fiamma', 26), el('div', '', [el('b', '', S.streak + (S.streak === 1 ? ' giorno' : ' giorni')), el('span', '', 'Streak attuale')])]),
        el('div', 'pf-cs', [gi('trofeo', 26), el('div', '', [el('b', '', Math.max(S.streakMax, S.streak) + (Math.max(S.streakMax, S.streak) === 1 ? ' giorno' : ' giorni')), el('span', '', 'Streak migliore')])])
      ]));
    if (!corrente) box.append(btn('pf-oggi-btn', 'Torna al mese corrente', 'Torna a oggi', function () { meseVisto = null; ridisegna(); }));
    return box;
  }
  function obiettivo(S) {
    var box = el('section', 'g-card pf-sez'), pct = Math.min(100, S.obiettivoXp ? S.xpOggi / S.obiettivoXp * 100 : 0), opz = el('div', 'pf-opz'), v;
    opz.setAttribute('role', 'radiogroup'); opz.setAttribute('aria-label', 'Obiettivo giornaliero in XP');
    [10, 20, 30, 50].forEach(function (n) {
      var b = btn('pf-opt' + (S.obiettivoXp === n ? ' on' : ''), n + ' XP al giorno', n + ' XP', function () {
        GS.setObiettivo(n); box.replaceWith(obiettivo(GS.state));
      });
      b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', S.obiettivoXp === n ? 'true' : 'false');
      opz.append(b);
    });
    v = barra(pct, 'g-bar-giallo');
    box.append(el('h3', 'pf-h', 'Obiettivo giornaliero'),
      el('div', 'pf-ob-riga', [gi('bersaglio', 34), el('div', 'pf-ob-t', [el('b', '', Math.min(S.xpOggi, 9999) + ' / ' + S.obiettivoXp + ' XP oggi'),
        el('span', '', S.xpOggi >= S.obiettivoXp ? 'Obiettivo raggiunto!' : 'Ancora ' + (S.obiettivoXp - S.xpOggi) + ' XP')])]),
      v, el('p', 'g-sotto pf-nota', 'Scegli quanto vuoi impegnarti ogni giorno:'), opz);
    return box;
  }
  function traguardi(S, tutti) {
    var box = el('section', 'g-card pf-sez'), lista = el('div', 'pf-tr'), T = GS.TRAGUARDI.slice(), i, t, v, liv, max, next, prev, pct, riga;
    T.forEach(function (x) { x._v = x.valore(S); });
    T.sort(function (a, b) { return (S.traguardi[b.id] || 0) - (S.traguardi[a.id] || 0); });
    T = tutti ? GS.TRAGUARDI.slice() : T.slice(0, 3);
    for (i = 0; i < T.length; i++) {
      t = T[i]; v = t.valore(S); liv = 0;
      t.livelli.forEach(function (s, k) { if (v >= s) liv = k + 1; });
      max = liv >= t.livelli.length;
      next = max ? t.livelli[t.livelli.length - 1] : t.livelli[liv];
      prev = liv > 0 ? t.livelli[liv - 1] : 0;
      pct = max ? 100 : (v - prev) / (next - prev) * 100;
      riga = el('div', 'pf-t' + (liv === 0 ? ' pf-t0' : ''), [
        el('div', 'pf-t-ico', [gi(t.icona, 40)]),
        el('div', 'pf-t-c', [
          el('div', 'pf-t-top', [el('b', '', t.nome), el('span', 'pf-t-liv', liv ? 'Livello ' + liv + (max ? ' ★' : '') : 'Da sbloccare')]),
          barra(pct, 'g-bar-arancio'),
          el('div', 'pf-t-bot', [el('span', '', t.descr), el('b', '', fmtN(Math.min(v, next)) + '/' + fmtN(next))])
        ])
      ]);
      lista.append(riga);
    }
    box.append(el('div', 'pf-h-riga', [el('h3', 'pf-h', 'Traguardi'),
      btn('pf-link', tutti ? 'Mostra meno traguardi' : 'Vedi tutti i traguardi', tutti ? 'Mostra meno' : 'Vedi tutti', function () { box.replaceWith(traguardi(GS.state, !tutti)); })]), lista);
    return box;
  }
  function reset() {
    var box = el('section', 'pf-sez pf-reset'), stato = 0;
    function disegna() {
      box.replaceChildren();
      if (!stato) box.append(btn('g-btn g-btn-grigio g-btn-blocco pf-reset-b', 'Azzera i dati di gioco', 'Azzera i dati', function () { stato = 1; disegna(); }));
      else box.append(el('p', 'pf-conf', 'Cancellare XP, streak, gemme e traguardi? Non si può annullare.'),
        el('div', 'pf-conf-b', [
          btn('g-btn g-btn-grigio', 'Annulla', 'Annulla', function () { stato = 0; disegna(); }),
          btn('g-btn g-btn-rosso', 'Conferma azzeramento', 'Azzera', function () { GS.reset(); meseVisto = null; showProfilo(); })
        ]));
    }
    disegna(); return box;
  }

  window.showProfilo = function () {
    var b = apri('Obiettivi', 'pf-profilo'), S = GS.state, l = GS.lega(), medaglie = 0, k, wrap = el('div', 'pf-wrap');
    for (k in S.traguardi) if (S.traguardi.hasOwnProperty(k)) medaglie += S.traguardi[k] > 0 ? 1 : 0;
    wrap.append(
      el('div', 'pf-stats', [
        riquadro(['fiamma'], String(S.streak), 'Giorni di fila'),
        riquadro(['fulmine'], fmtN(S.xp), 'XP totali'),
        riquadro(['medaglia', COL_LEGA[l.indice] || 'oro'], l.nome, 'Lega'),
        riquadro(['trofeo'], String(medaglie), 'Medaglie')
      ]),
      calendario(S), obiettivo(S), traguardi(S, false), reset());
    fine(b, wrap);
  };

  /* ---------- Lega ---------- */
  function iniziali(n) { return n.charAt(0).toUpperCase(); }
  function hashN(s) { var h = 0, i; for (i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
  function giorniAFine() { var d = new Date().getDay(); return d === 0 ? 1 : 8 - d; } // fino al lunedi'

  window.showLega = function () {
    var b = apri('Lega', 'pf-lega'), L = GS.lega(), wrap = el('div', 'pf-wrap'), lista = el('ol', 'pf-lista'), n = L.righe.length, i, r, pos, zona, riga, gg = giorniAFine();
    wrap.append(el('div', 'pf-lega-head', [
      gi('medaglia', 84, COL_LEGA[L.indice] || 'oro'),
      el('h2', 'pf-lega-t', 'Lega ' + L.nome),
      el('p', 'pf-lega-s', 'Sei al ' + L.posizione + '° posto. Primi 10 in Lega ' + (GS.LEGHE[L.indice + 1] || 'massima') + '.'),
      el('p', 'pf-lega-g', [gi('fiamma', 16), ' Finisce tra ' + gg + (gg === 1 ? ' giorno' : ' giorni')])
    ]));
    for (i = 0; i < n; i++) {
      r = L.righe[i]; pos = i + 1;
      zona = pos <= 10 ? 'pf-su' : (pos > n - 5 ? 'pf-giu' : '');
      riga = el('li', 'pf-r ' + zona + (r.tu ? ' pf-tu' : ''), [
        el('span', 'pf-pos', String(pos)),
        el('span', 'pf-av', iniziali(r.nome)),
        el('span', 'pf-nome', r.tu ? 'Tu' : r.nome),
        el('span', 'pf-xp', fmtN(r.xp) + ' XP')
      ]);
      riga.children[1].style.background = r.tu ? 'var(--g-verde)' : COL_AV[hashN(r.nome) % COL_AV.length];
      if (r.tu) riga.setAttribute('aria-current', 'true');
      riga.setAttribute('aria-label', pos + ' posto, ' + r.nome + ', ' + r.xp + ' XP' + (pos <= 10 ? ', zona promozione' : zona ? ', zona retrocessione' : ''));
      lista.append(riga);
      if (pos === 10) lista.append(el('li', 'pf-sep pf-sep-su', 'Zona promozione ▲'));
      if (pos === n - 5) lista.append(el('li', 'pf-sep pf-sep-giu', 'Zona retrocessione ▼'));
    }
    wrap.append(lista, el('p', 'g-sotto pf-simulata', 'Sfidanti simulati: gli avversari sono generati dall\'app, non sono persone reali.'));
    fine(b, wrap);
  };
})();
