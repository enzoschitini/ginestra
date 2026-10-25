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

  /* ---------- Lega personale: sfidi le tue settimane ---------- */
  function dataBreve(wk) { var p = wk.split('-'); return p[2] + '/' + p[1]; }
  function giorniTxt(n) { return n + (n === 1 ? ' giorno' : ' giorni'); }
  function colonna(xp, max, target, corrente, classe, etichetta, mostraVal) {
    var t = el('span', 'pf-gg-b', el('i')), l;
    t.firstChild.style.height = Math.max(xp ? 6 : 0, Math.round(xp / max * 100)) + '%';
    if (target) { l = el('u', 'pf-linea'); l.style.bottom = Math.round(target / max * 100) + '%'; t.append(l); }
    return el('div', classe, [el('span', 'pf-gg-v', mostraVal ? String(xp) : ''), t, el('span', 'pf-gg-l', etichetta)]);
  }

  window.showLega = function () {
    var b = apri('Lega', 'pf-lega'), L = GS.lega(), wrap = el('div', 'pf-wrap'), i, r, box, max, msg, rischio, st;

    /* intestazione */
    wrap.append(el('div', 'pf-lega-head', [
      gi('medaglia', 84, COL_LEGA[L.indice] || 'oro'),
      el('h2', 'pf-lega-t', 'Lega ' + L.nome),
      el('p', 'pf-lega-s', L.prossima ? 'Fai ' + L.target + ' XP entro domenica per salire in Lega ' + L.prossima + '.' : 'Sei nella lega più alta: fai ' + L.target + ' XP a settimana per restarci.'),
      el('p', 'pf-lega-g', [gi('timer', 16), ' Finisce tra ' + giorniTxt(L.giorniRimasti)])
    ]));

    /* progresso della settimana */
    rischio = L.indice > 0 && L.xp < L.retro && L.giorniRimasti <= 2;
    if (L.xp >= L.target) msg = L.prossima ? 'Obiettivo raggiunto! Lunedì sali in Lega ' + L.prossima + '.' : 'Obiettivo raggiunto! Resti in Lega ' + L.nome + '.';
    else if (L.xp === 0) msg = 'Questa settimana non hai ancora guadagnato XP: bastano ' + L.perGiorno + ' XP al giorno.';
    else msg = 'Ancora ' + L.mancanti + ' XP: circa ' + L.perGiorno + ' al giorno per ' + giorniTxt(L.giorniRimasti) + '.';
    wrap.append(el('section', 'g-card pf-sez pf-ob', [
      el('div', 'pf-ob-top', [el('h3', 'pf-h', 'Questa settimana'), el('b', 'pf-ob-n', [gi('fulmine', 18), ' ' + fmtN(L.xp) + ' / ' + fmtN(L.target) + ' XP'])]),
      barra(L.pct * 100, L.xp >= L.target ? '' : 'g-bar-blu'),
      el('p', 'pf-ob-m' + (rischio ? ' pf-rischio' : ''), (rischio ? 'Attenzione: sotto i ' + L.retro + ' XP a fine settimana scendi di lega. ' : '') + msg)
    ]));

    /* giorno per giorno */
    max = Math.max(10, GS.state.obiettivoXp);
    for (i = 0; i < L.giorni.length; i++) max = Math.max(max, L.giorni[i].xp);
    box = el('div', 'pf-gg');
    for (i = 0; i < L.giorni.length; i++) {
      r = L.giorni[i];
      box.append(colonna(r.futuro ? 0 : r.xp, max, 0, r.oggi, 'pf-gg-c' + (r.oggi ? ' pf-ora' : '') + (r.futuro ? ' pf-fut' : ''), r.lettera, !r.futuro));
    }
    wrap.append(el('section', 'g-card pf-sez', [el('h3', 'pf-h', 'Giorno per giorno'), box]));

    /* le tue settimane */
    st = L.storia.slice(-5).concat([{ wk: 'questa', xp: L.xp, target: L.target, corrente: true }]);
    for (max = 10, i = 0; i < st.length; i++) max = Math.max(max, st[i].xp, st[i].target || 0);
    box = el('div', 'pf-sett');
    for (i = 0; i < st.length; i++) {
      r = st[i];
      box.append(colonna(r.xp, max, r.target, r.corrente, 'pf-sett-c' + (r.corrente ? ' pf-ora' : '') + (r.target && r.xp >= r.target ? ' pf-ok' : ''), r.corrente ? 'Ora' : dataBreve(r.wk), true));
    }
    wrap.append(el('section', 'g-card pf-sez', [el('h3', 'pf-h', 'Le tue settimane'), box,
      el('p', 'pf-nota-l', 'La linea gialla è l\'obiettivo di quella settimana. In verde le settimane in cui lo hai raggiunto.')]));

    /* record */
    wrap.append(el('div', 'pf-recs', [
      riquadro(['timer', 22], fmtN(L.settimanaScorsa) + ' XP', 'Settimana scorsa'),
      riquadro(['trofeo', 22], fmtN(L.record) + ' XP', 'Record'),
      riquadro(['fulmine', 22], fmtN(L.media4) + ' XP', 'Media 4 sett.')
    ]));
    if (L.settimanaScorsa > 0) wrap.append(el('p', 'pf-sfida' + (L.batteScorsa ? ' pf-sfida-ok' : ''),
      L.batteScorsa ? 'Stai battendo la tua settimana scorsa! (' + fmtN(L.xp) + ' contro ' + fmtN(L.settimanaScorsa) + ' XP)' :
        'Sfida: batti la tua settimana scorsa. Ti mancano ' + fmtN(L.settimanaScorsa - L.xp + 1) + ' XP.'));

    wrap.append(el('p', 'g-sotto pf-simulata', 'Come funziona: gareggi contro te stesso, non ci sono altri giocatori. Con almeno ' + L.target + ' XP sali di lega; con meno di ' + L.retro + ' XP scendi. Se in una settimana non studi, la lega resta com\'è.'));
    fine(b, wrap);
  };
})();
