/* Ginestra gioco - Esame.
   Pulsante "quaderno" accanto all'ingranaggio: apre una pagina a tutto schermo dove si sceglie un personaggio,
   si vede la copertina dell'esame e si fa la prova. Domande prese da tutte le voci del foglio, a pagina di quaderno,
   senza correzione immediata, con voto in trentesimi e correzione finale.
   Dipende da: i globali di index.html (ROWS, EX, FILT, SEL, GRUPPO, NQ, SEEN, SUMM, h, norm, shuffle, mascot, periodLabel),
   da GS (stato.js) e SND/GI se presenti. Non tocca il motore delle lezioni: usa un proprio runner. */
(function () {
  if (typeof EX === 'undefined' || typeof ROWS === 'undefined' || !document.getElementById('apptop')) return;

  var CHIAVE = 'ginestra-esami', ULTIMO = 'ginestra-esame-ultimo', PROMOSSO = 18;

  /* ---------- piano dell'esame: parti, esercizi, peso (quante domande) e punti ---------- */
  var PIANO = [
    { parte: 'Riconoscere', tipi: [{ n: 6, w: 3, pt: 1 }, { n: 3, w: 2, pt: 1 }, { n: 4, w: 1, pt: 1 }, { n: 1, w: 1, pt: 2, max: 1 }] },
    { parte: 'Ricordare', tipi: [{ n: 7, w: 3, pt: 2 }, { n: 10, w: 2, pt: 1 }, { n: 9, w: 1, pt: 1 }] },
    { parte: 'Capire le frasi', tipi: [{ n: 2, w: 3, pt: 1 }, { n: 11, w: 1, pt: 2 }, { n: 12, w: 1, pt: 1 }] },
    { parte: 'Ascoltare', tipi: [{ n: 13, w: 2, pt: 2 }] }
  ];

  var MOTIVI = [
    ['garibaldi', '⚔️'], ['montalcini', '🧠'], ['marconi', '📡'], ['montessori', '🧩'],
    ['brunelleschi', '🏛️'], ['rodari', '📖'], ['morricone', '🎼'], ['angela', '🔭'],
    ['benigni', '🎭'], ['medici', '🎨'], ['olivetti', '⌨️'], ['esposito', '🍕'],
    ['salgari', '🏴‍☠️'], ['petroni', '✍️'], ['ungaretti', '🪶'], ['virgilio', '📜'],
    ['cortellesi', '🎬'], ['toto', '🎩']
  ];
  var COPERTINE = [
    ['#58cc02', '#46a302'], ['#1cb0f6', '#1899d6'], ['#ff9600', '#d97f00'], ['#ce82ff', '#a560d6'],
    ['#ff4b4b', '#d93a3a'], ['#ffc800', '#d9a900'], ['#2bc4b0', '#1f9d8c'], ['#ff86d0', '#d965ae']
  ];

  /* ---------- dati ---------- */
  function emojiDi(p) {
    var k = norm(p);
    for (var i = 0; i < MOTIVI.length; i++) if (k.indexOf(MOTIVI[i][0]) >= 0) return MOTIVI[i][1];
    return '📓';
  }
  function copertinaDi(p) {
    var s = 7, i;
    for (i = 0; i < p.length; i++) s = (s * 31 + p.charCodeAt(i)) % 9973;
    return COPERTINE[s % COPERTINE.length];
  }
  function personaggi() {
    var out = [];
    ROWS.forEach(function (r) { if (r.pers && out.indexOf(r.pers) < 0) out.push(r.pers); });
    var ix = {}; out.forEach(function (p, i) { ix[p] = i; });
    out.sort(function (a, b) {
      var da = (SUMM[a] || {}).data || '', db = (SUMM[b] || {}).data || '';
      return da < db ? -1 : da > db ? 1 : ix[a] - ix[b];
    });
    return out;
  }
  /* voto salvato: nel vecchio formato era `best` */
  function votoDi(r) { return r ? (r.voto != null ? r.voto : r.best) : null; }
  function dataIt(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? m[3] + '/' + m[2] + '/' + m[1] : ''; }
  function vociDi(p) { return ROWS.filter(function (r) { return r.pers === p && !r.uncertain; }); }
  function leggi() { try { return JSON.parse(localStorage.getItem(CHIAVE) || '{}') || {}; } catch (e) { return {}; } }
  function scrivi(o) { try { localStorage.setItem(CHIAVE, JSON.stringify(o)); } catch (e) {} }
  function suona(n) { try { if (window.SND) SND.play(n); } catch (e) {} }
  function gi(nome, size, emoji) { try { if (window.GI && GI[nome]) return GI[nome](size); } catch (e) {} return emoji; }
  function ridotto() { return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function mmss(s) { var m = Math.floor(s / 60); s = s % 60; return m + ':' + (s < 10 ? '0' : '') + s; }
  function html(s) { var d = document.createElement('span'); d.innerHTML = s; return d; }

  /* genera le domande con i filtri puntati sul solo personaggio, poi rimette tutto com'era */
  function conFoglio(p, fn) {
    var sF = FILT, sS = SEL, sG = GRUPPO, sN = NQ, sE = SEEN;
    FILT = { pers: [p], per: [], cat: [] }; SEL = {}; GRUPPO = ''; NQ = 1e9; SEEN = {};
    try { return fn(); } finally { FILT = sF; SEL = sS; GRUPPO = sG; NQ = sN; SEEN = sE; }
  }
  function esercizio(n) { return EX.filter(function (e) { return e.n === n; })[0]; }

  function costruisci(p) {
    return conFoglio(p, function () {
      var nVoci = vociDi(p).length, Q = Math.max(10, Math.min(22, Math.round(nVoci * 0.45)));
      var tipi = [];
      PIANO.forEach(function (sez) {
        sez.tipi.forEach(function (t) {
          var e = esercizio(t.n), items = [];
          if (!e) return;
          try { items = e.pool().length >= e.min ? e.gen() : []; } catch (err) { items = []; }
          if (items.length) tipi.push({ t: t, e: e, items: items, cap: Math.min(items.length, t.max || 99), q: 0, sez: sez });
        });
      });
      /* ripartizione proporzionale ai pesi (metodo D'Hondt), nei limiti delle domande disponibili */
      var i, best;
      for (i = 0; i < Q; i++) {
        best = null;
        tipi.forEach(function (x) {
          if (x.q >= x.cap) return;
          var v = x.t.w / (x.q + 1);
          if (!best || v > best.v) best = { x: x, v: v };
        });
        if (!best) break;
        best.x.q++;
      }
      /* ogni voce una sola volta, finché ce ne sono */
      var usati = {}, domande = [];
      function toccata(it) { return (it._k || []).some(function (k) { return usati[k]; }); }
      tipi.forEach(function (x) {
        var scelte = [];
        x.items.forEach(function (it) {
          if (scelte.length < x.q && !toccata(it)) { scelte.push(it); (it._k || []).forEach(function (k) { usati[k] = 1; }); }
        });
        x.items.forEach(function (it) { if (scelte.length < x.q && scelte.indexOf(it) < 0) scelte.push(it); });
        scelte.forEach(function (it) { domande.push({ n: x.t.n, e: x.e, item: it, pt: x.t.pt, parte: x.sez.parte }); });
      });
      var ordinate = [], parti = [];
      PIANO.forEach(function (sez) {
        var d = shuffle(domande.filter(function (q) { return q.parte === sez.parte; }));
        if (d.length) { ordinate = ordinate.concat(d); parti.push({ nome: sez.parte, n: d.length }); }
      });
      ordinate.forEach(function (q, k) { q.i = k; });
      return { p: p, qs: ordinate, parti: parti, punti: ordinate.reduce(function (s, q) { return s + q.pt; }, 0) };
    });
  }

  /* ---------- struttura ---------- */
  var phone = document.getElementById('phone');
  var radice = h('div', { class: 'es', id: 'esame', hidden: true, role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Esame' });
  var cima = h('div', { class: 'es-cima' });
  var area = h('div', { class: 'es-area' });
  var piede = h('div', { class: 'es-piede' });
  radice.append(cima, area, piede);
  phone.appendChild(radice);

  var St = null;            // esame in corso
  var Ris = null;           // risultato mostrato: { p, e (dati salvati), ris (risposte), premi }
  var soloErrori = true;    // filtro della correzione
  var scelto = '';          // personaggio selezionato nell'hub
  var anteprime = {};
  var timer = 0;

  function aggiornaCima(nodi) { cima.replaceChildren.apply(cima, nodi); }
  function pulsante(testo, cls, fn, dis) {
    return h('button', { class: 'g-btn es-btn ' + (cls || 'g-btn-verde'), type: 'button', disabled: !!dis, onclick: function () { suona('click'); fn(); } }, testo);
  }
  function xBtn(fn, label) {
    return h('button', { class: 'es-x', type: 'button', 'aria-label': label || 'Chiudi', onclick: function () { suona('click'); fn(); } },
      html('<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>').firstChild);
  }
  function vista(cls) { radice.className = 'es ' + cls; area.scrollTop = 0; }
  function mascotte(triste) { try { return mascot(triste); } catch (e) { return h('span'); } }

  function apri() {
    if (!ROWS.length) return;
    var lista = personaggi(), salvato = '';
    try { salvato = localStorage.getItem(ULTIMO) || ''; } catch (e) {}
    if (lista.indexOf(scelto) < 0) scelto = lista.indexOf(salvato) >= 0 ? salvato : lista[lista.length - 1];
    anteprime = {};
    radice.hidden = false;
    hub();
  }
  function chiudi() {
    stopTimer(); St = null;
    try { if ('speechSynthesis' in window) speechSynthesis.cancel(); } catch (e) {}
    radice.hidden = true;
  }
  function stopTimer() { if (timer) { clearInterval(timer); timer = 0; } }

  /* ---------- hub: scelta del personaggio e copertina ---------- */
  function hub() {
    stopTimer(); St = null;
    try { if ('speechSynthesis' in window) speechSynthesis.cancel(); } catch (e) {}
    vista('es-hub');
    var lista = personaggi(), reg = leggi();
    aggiornaCima([xBtn(chiudi, 'Torna indietro'), h('div', { class: 'es-tit' }, 'Esami')]);

    var riga = h('div', { class: 'es-pers', role: 'group', 'aria-label': 'Personaggi', 'data-no-swipe': '' });
    var scheda = h('div', { class: 'es-scheda-box' });
    var bottoni = {};
    lista.forEach(function (p) {
      var c = copertinaDi(p), r = reg[p];
      var b = h('button', { class: 'es-p', type: 'button', 'aria-pressed': 'false', style: '--c:' + c[0] + ';--co:' + c[1] },
        h('span', { class: 'es-p-av' }, emojiDi(p)),
        h('span', { class: 'es-p-n' }, p),
        votoDi(r) != null ? h('span', { class: 'es-p-v' }, r.lode ? '30L' : String(votoDi(r))) : null);
      b.addEventListener('click', function () { suona('click'); scegli(p, true); });
      bottoni[p] = b; riga.append(b);
    });

    function scegli(p, anima) {
      scelto = p;
      try { localStorage.setItem(ULTIMO, p); } catch (e) {}
      Object.keys(bottoni).forEach(function (k) {
        var on = k === p; bottoni[k].classList.toggle('on', on); bottoni[k].setAttribute('aria-pressed', String(on));
      });
      if (anima) { try { bottoni[p].scrollIntoView({ inline: 'center', block: 'nearest', behavior: ridotto() ? 'auto' : 'smooth' }); } catch (e) {} }
      var an = anteprime[p] || (anteprime[p] = costruisci(p));
      scheda.replaceChildren(copertina(p, an, anima));
      var fatto = leggi()[p], riv = fatto && fatto.ris && fatto.ris.length;
      piede.replaceChildren(
        riv ? pulsante('Rivedi le risposte', 'g-btn-blu', function () { rivedi(p); }) : null,
        pulsante(fatto ? 'Rifai l\'esame' : 'Inizia l\'esame', 'g-btn-verde', function () { avvia(p); }, !an.qs.length));
    }
    area.replaceChildren(
      h('p', { class: 'es-intro' }, 'Dopo lo studio arriva il momento di dimostrare cosa hai imparato. Scegli il foglio.'),
      riga, scheda);
    scegli(scelto, false);
    /* centra il personaggio scelto nella fila senza scorrere la pagina */
    var b0 = bottoni[scelto];
    riga.scrollLeft = Math.max(0, b0.offsetLeft - (riga.clientWidth - b0.offsetWidth) / 2);
  }

  function riga(ico, t, s) {
    return h('div', { class: 'es-riga' }, h('span', { class: 'es-riga-i', 'aria-hidden': 'true' }, ico), h('div', {}, h('b', {}, t), h('small', {}, s)));
  }
  function copertina(p, an, anima) {
    var c = copertinaDi(p), reg = leggi()[p], voci = vociDi(p);
    var quanti = function (t) { return voci.filter(function (r) { return r.tipo === t; }).length; };
    var periodo = (SUMM[p] || {}).data ? periodLabel(SUMM[p].data) : '';
    var spirali = h('div', { class: 'es-spirale', 'aria-hidden': 'true' });
    for (var i = 0; i < 7; i++) spirali.append(h('i'));
    var vuoto = !an.qs.length;
    var record = votoDi(reg) != null
      ? h('div', { class: 'es-record ' + (votoDi(reg) >= PROMOSSO ? 'ok' : 'no') }, h('b', {}, reg.lode ? '30 e lode' : votoDi(reg) + '/30'), h('span', {}, 'ultimo voto'))
      : null;
    var cop = h('div', { class: 'es-cop' + (anima && !ridotto() ? ' anima' : ''), style: '--c:' + c[0] + ';--co:' + c[1] },
      spirali,
      h('div', { class: 'es-cop-in' },
        h('div', { class: 'es-cop-em', 'aria-hidden': 'true' }, emojiDi(p)),
        h('div', { class: 'es-etichetta' }, h('small', {}, 'Esame di'), h('b', {}, p), periodo ? h('em', {}, periodo) : null)),
      record);
    var info = h('div', { class: 'es-info' },
      riga('📝', vuoto ? 'Foglio troppo corto' : an.qs.length + ' domande',
        vuoto ? 'Servono più voci per fare un esame' : 'in ' + an.parti.length + (an.parti.length === 1 ? ' parte' : ' parti') + ', ' + an.punti + ' punti in tutto'),
      riga('📚', voci.length + ' voci del foglio', quanti('parola') + ' parole · ' + quanti('espressione') + ' modi di dire · ' + quanti('frase') + ' frasi'),
      riga('🎯', 'Si supera con ' + PROMOSSO + '/30', 'Tutto giusto vale 30 e lode'),
      riga('⏱️', 'Niente scadenza', 'Il cronometro corre ma puoi pensare. Niente correzione fino alla fine'));
    var parti = h('div', { class: 'es-parti' }, an.parti.map(function (x, k) {
      return h('span', { class: 'es-parte-chip' }, (k + 1) + '. ' + x.nome, h('i', {}, String(x.n)));
    }));
    var storia = h('p', { class: 'es-nota' }, votoDi(reg) != null
      ? 'Hai fatto questo esame' + (reg.data ? ' il ' + dataIt(reg.data) : '') + ': ' + (reg.lode ? '30 e lode' : votoDi(reg) + '/30') + '. Se lo rifai, questo voto viene sostituito dal nuovo.'
      : 'Non hai ancora fatto questo esame.');
    return h('div', {}, cop, info, parti, storia);
  }

  /* ---------- esame ---------- */
  function avvia(p) {
    var piano = costruisci(p);
    if (!piano.qs.length) return;
    St = { p: p, piano: piano, qs: piano.qs, i: 0, ris: [], t0: Date.now(), sec: 0, done: false, fin: null, check: null, errs: 0, corpo: null, esito: null };
    delete anteprime[p];
    stopTimer();
    timer = setInterval(function () {
      if (!St) return stopTimer();
      St.sec = Math.round((Date.now() - St.t0) / 1000);
      var el = document.getElementById('es-tempo'); if (el) el.textContent = mmss(St.sec);
    }, 1000);
    mostra();
  }

  /* contesto passato agli esercizi: stessa interfaccia del motore, ma niente cuori e niente correzione */
  var ctxEs = {
    get body() { return St && St.corpo; },
    title: function (t) { var el = document.getElementById('es-istr'); if (el) el.textContent = t; },
    isDone: function () { return !St || St.done; },
    after: function () {},
    ready: function (fn) {
      if (!St) return;
      St.check = fn || null;
      var b = document.getElementById('es-avanti'); if (b && !St.done) b.disabled = !St.check;
    },
    check: function () { conferma(false); },
    lose: function () { if (St) St.errs++; },
    finish: function (ok, sol, note) {
      if (!St || St.done) return;
      St.done = true; St.fin = { ok: ok, solution: sol, note: note };
      var b = document.getElementById('es-avanti'); if (b) b.disabled = false;
    }
  };

  function indiceParte(nome) { for (var i = 0; i < St.piano.parti.length; i++) if (St.piano.parti[i].nome === nome) return i; return 0; }

  function mostra() {
    var q = St.qs[St.i], ultima = St.i === St.qs.length - 1;
    St.done = false; St.fin = null; St.check = null; St.errs = 0;
    vista('es-quiz');
    aggiornaCima([xBtn(esci, 'Esci dall\'esame'),
      h('div', { class: 'es-prog', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(St.qs.length), 'aria-valuenow': String(St.i) },
        h('i', { style: 'width:' + Math.round(St.i / St.qs.length * 100) + '%' })),
      h('div', { class: 'es-cron', 'aria-label': 'Tempo trascorso' }, '⏱ ', h('span', { id: 'es-tempo' }, mmss(St.sec)))]);

    St.corpo = h('div', { class: 'es-corpo' });
    area.replaceChildren(h('div', { class: 'es-carta' + (ridotto() ? '' : ' entra') },
      h('div', { class: 'es-testa' },
        h('span', { class: 'es-parte' }, 'Parte ' + (indiceParte(q.parte) + 1) + ' · ' + q.parte),
        h('span', { class: 'es-num' }, 'Domanda ' + (St.i + 1) + ' di ' + St.qs.length + ' · ' + q.pt + (q.pt === 1 ? ' punto' : ' punti'))),
      h('h2', { class: 'es-istr', id: 'es-istr' }, typeof q.e.title === 'string' ? q.e.title : ''),
      St.corpo));

    piede.replaceChildren(
      h('button', { class: 'g-btn g-btn-verde es-btn', id: 'es-avanti', type: 'button', disabled: true, onclick: function () { suona('click'); conferma(false); } }, ultima ? 'Consegna' : 'Avanti'),
      h('button', { class: 'es-salta', type: 'button', onclick: function () { suona('click'); conferma(true); } }, 'Non lo so'));

    q.e.render(q.item, ctxEs);
    /* nessun aiuto durante l'esame */
    St.corpo.querySelectorAll('.hint-btn, .hint-line[hidden]').forEach(function (n) { n.remove(); });
    area.scrollTop = 0;
  }

  function conferma(salta) {
    if (!St || !St.corpo) return;
    var q = St.qs[St.i], r, mia = '';
    var sel = St.corpo.querySelector('.choice-card.selected'), inp = St.corpo.querySelector('.text-in');
    if (sel) mia = sel.textContent; else if (inp) mia = inp.value;
    if (salta) r = { ok: false, skipped: true };
    else if (St.done && St.fin) r = St.fin;
    else if (St.check) { try { r = St.check(); } catch (e) { r = { ok: false }; } }
    else return;
    St.done = true;
    /* l'associazione dà credito parziale: ogni coppia sbagliata toglie una quota */
    var credito = r.skipped ? 0 : q.n === 1 ? (r.ok ? Math.max(0, 1 - St.errs / Math.max(1, q.item.pairs.length)) : 0) : (r.ok ? 1 : 0);
    var ok = !!r.ok && credito > 0.999;
    St.ris.push({
      i: q.i, n: q.n, pt: q.pt, ok: ok, punti: credito * q.pt,
      solution: r.solution || soluzione(q), note: r.note || '', mia: mia, skipped: !!r.skipped, errs: St.errs,
      testo: testoDomanda(q),
      istr: (document.getElementById('es-istr') || {}).textContent || ''
    });
    St.i++;
    if (St.i >= St.qs.length) fine(); else mostra();
  }

  /* risposta giusta ricavata dalla domanda, per quando l'esercizio non la dà (domanda saltata) */
  function soluzione(q) {
    var it = q.item;
    if (q.n === 1) return it.pairs.map(function (p) { return p[0] + ' = ' + p[1]; }).join(' · ');
    if (q.n === 9) return it.tokens.join('');
    if (q.n === 11) return it.tokens.join(' ');
    if (q.n === 12) return it.fix || '';
    return it.answer || '';
  }
  /* il testo della domanda, senza etichette come "Portoghese" */
  function testoDomanda(q) {
    if (q.n === 12) return q.item.t.join(' ');
    var pr = St.corpo.querySelector('.speech-bubble, .sentence, .blank-sentence, .prompt');
    if (!pr || q.n === 1) return '';
    var c = pr.cloneNode(true);
    c.querySelectorAll('.bubble-label, button').forEach(function (n) { n.remove(); });
    return c.textContent.replace(/\s+/g, ' ').trim();
  }

  function esci() {
    var m = h('div', { class: 'es-modale-ov' },
      h('div', { class: 'es-modale', role: 'alertdialog', 'aria-label': 'Uscire dall\'esame?' },
        h('div', { class: 'es-modale-m' }, mascotte(true)),
        h('h2', {}, 'Vuoi uscire dall\'esame?'),
        h('p', {}, 'Se esci adesso perdi le risposte date e l\'esame non viene registrato.'),
        pulsante('Continua l\'esame', 'g-btn-verde', function () { m.remove(); }),
        h('button', { class: 'es-salta', type: 'button', onclick: function () { m.remove(); suona('click'); hub(); } }, 'Esci')));
    radice.append(m);
    var b = m.querySelector('button'); if (b) b.focus();
  }

  /* ---------- voto ---------- */
  function giudizio(v, lode) {
    if (lode) return 'Con lode!';
    if (v < 12) return 'Bisogna studiare ancora';
    if (v < PROMOSSO) return 'Quasi ci sei';
    if (v < 22) return 'Sufficiente';
    if (v < 25) return 'Buono';
    if (v < 28) return 'Ottimo';
    if (v < 30) return 'Eccellente';
    return 'Perfetto!';
  }
  function fine() {
    stopTimer();
    var sec = Math.round((Date.now() - St.t0) / 1000);
    var tot = St.piano.punti, preso = St.ris.reduce(function (s, r) { return s + r.punti; }, 0);
    var giuste = St.ris.filter(function (r) { return r.ok; }).length, pct = tot ? preso / tot : 0;
    var lode = giuste === St.qs.length, voto = lode ? 30 : Math.min(29, Math.round(pct * 30));
    var passato = voto >= PROMOSSO;

    /* l'ultimo esame di ogni personaggio sostituisce il precedente, risposte comprese */
    var dati = { voto: voto, lode: lode, passato: passato, giuste: giuste, tot: tot, preso: preso, sec: sec, data: new Date().toISOString().slice(0, 10), ris: St.ris };
    var reg = leggi(); reg[St.p] = dati; scrivi(reg);

    /* ricompense: l'esame vale come una lezione (serie, XP, gemme) e, se superato, ha un bonus */
    var xp = 0, gemme = 0, serie = 0;
    try {
      if (window.GS) {
        var lz = GS.registraLezione({ ex: 'esame', giuste: giuste, totali: St.qs.length, combo: 0 });
        xp = lz.xpBase + lz.xpCombo + lz.xpPerfetta; gemme = lz.gemme;
        if (lz.streakAumentata) serie = lz.streakDopo;
        if (passato) {
          var bx = 10 + Math.round(pct * 20), bg = 10 + (lode ? 25 : voto >= 27 ? 10 : 0);
          GS.addXP(bx, 'esame'); GS.addGemme(bg); xp += bx; gemme += bg;
        }
      }
    } catch (e) {}
    Ris = { p: St.p, e: dati, ris: St.ris, premi: { xp: xp, gemme: gemme, serie: serie } };
    soloErrori = true;
    suona(passato ? 'congratulazioni' : 'riprova');
    paginaVoto(true);
  }
  function stat(l, v) { return h('div', { class: 'es-st' }, h('b', {}, v), h('span', {}, l)); }
  function premio(ico, testo) {
    var el = h('span', { class: 'es-premio' }); el.innerHTML = ico + ' <b>' + testo + '</b>'; return el;
  }
  function paginaVoto(prima) {
    var e = Ris.e, anima = prima && !ridotto(), risposte = Ris.ris || [], nq = risposte.length;
    vista('es-ris');
    aggiornaCima([xBtn(hub, 'Chiudi'), h('div', { class: 'es-tit' }, prima ? 'Esame consegnato' : 'Il tuo esame')]);
    var votoEl = h('span', { class: 'es-voto-n' }, anima ? '0' : String(e.voto));
    var cerchio = html('<svg class="es-giro' + (anima ? '' : ' fatto') + '" viewBox="0 0 200 120" aria-hidden="true"><path d="M30 62C28 28 80 8 126 14C176 20 192 52 176 82C160 112 96 116 56 102C26 92 22 76 34 58" fill="none" stroke="#ff4b4b" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>').firstChild;
    var p = prima && Ris.premi;
    var premi = p ? h('div', { class: 'es-premi' },
      p.serie ? premio(gi('fiamma', 22, '🔥'), 'Serie ' + p.serie) : null,
      premio('✨', '+' + p.xp + ' XP'),
      premio(gi('gemma', 22, '💎'), '+' + p.gemme)) : null;
    area.replaceChildren(h('div', { class: 'es-carta es-carta-ris' + (anima ? ' entra' : '') },
      h('div', { class: 'es-testa' }, h('span', { class: 'es-parte' }, 'Esame di ' + Ris.p), h('span', { class: 'es-num' }, dataIt(e.data) || new Date().toLocaleDateString('it-IT'))),
      h('div', { class: 'es-voto' }, cerchio, votoEl, h('span', { class: 'es-su' }, '/30'), e.lode ? h('span', { class: 'es-lode' }, 'e lode') : null),
      h('div', { class: 'es-giud' }, giudizio(e.voto, e.lode)),
      h('div', { class: 'es-timbro ' + (e.passato ? 'ok' : 'no') + (anima ? ' batte' : '') }, e.passato ? 'Promosso' : 'Rimandato'),
      h('div', { class: 'es-stat' },
        stat('Risposte giuste', e.giuste + '/' + nq),
        stat('Punti', (Math.round(e.preso * 10) / 10) + '/' + e.tot),
        stat('Tempo', mmss(e.sec))),
      premi,
      !e.passato ? h('p', { class: 'es-nota' }, 'Per superare servono ' + PROMOSSO + '/30. Rivedi le risposte, ripassa le voci sbagliate e riprova: l\'esame cambia ogni volta.') : null));
    area.scrollTop = 0;
    var errori = risposte.filter(function (x) { return !x.ok; }).length;
    piede.replaceChildren(
      pulsante(errori ? 'Rivedi le risposte (' + errori + ' errori)' : 'Rivedi le risposte', 'g-btn-blu', correzione),
      h('div', { class: 'es-duo' },
        pulsante('Rifai', 'g-btn-grigio', function () { avvia(Ris.p); }),
        pulsante('Esami', 'g-btn-grigio', hub)));
    if (anima) {
      var n = 0, passo = Math.max(1, Math.ceil(e.voto / 24)), iv = setInterval(function () {
        n = Math.min(e.voto, n + passo); votoEl.textContent = String(n);
        if (n >= e.voto) clearInterval(iv);
      }, 45);
    }
  }

  /* dalla pagina degli esami: riapre l'ultimo esame salvato di quel personaggio */
  function rivedi(p) {
    var r = leggi()[p];
    if (!r || !r.ris || !r.ris.length) return;
    Ris = { p: p, e: r, ris: r.ris, premi: null };
    soloErrori = r.ris.some(function (x) { return !x.ok; });
    paginaVoto(false);
  }

  /* ---------- correzione: tutte le risposte, con filtro sugli errori ---------- */
  function correzione() {
    vista('es-cor');
    var tutte = Ris.ris, sbagliate = tutte.filter(function (x) { return !x.ok; });
    if (!sbagliate.length) soloErrori = false;
    aggiornaCima([xBtn(function () { paginaVoto(false); }, 'Indietro'), h('div', { class: 'es-tit' }, 'Risposte')]);
    function filtro(testo, on, valore) {
      return h('button', { class: 'es-filtro' + (on ? ' on' : ''), type: 'button', 'aria-pressed': String(on), onclick: function () { suona('click'); soloErrori = valore; correzione(); } }, testo);
    }
    var mostrate = soloErrori ? sbagliate : tutte;
    var carta = h('div', { class: 'es-carta' + (ridotto() ? '' : ' entra') },
      h('div', { class: 'es-testa' }, h('span', { class: 'es-parte' }, 'Correzione'),
        h('span', { class: 'es-num' }, (tutte.length - sbagliate.length) + ' giuste · ' + sbagliate.length + (sbagliate.length === 1 ? ' errore' : ' errori'))),
      sbagliate.length ? h('div', { class: 'es-filtri' }, filtro('Solo errori (' + sbagliate.length + ')', soloErrori, true), filtro('Tutte (' + tutte.length + ')', !soloErrori, false)) : null);
    if (!sbagliate.length) carta.append(h('div', { class: 'es-zero' }, mascotte(false), h('p', {}, 'Nessun errore! Il professore non ha niente da correggere.')));
    mostrate.forEach(function (x) {
      carta.append(h('div', { class: 'es-err ' + (x.ok ? 'giusta' : 'sbagliata') },
        h('div', { class: 'es-err-t' }, h('span', { class: 'es-err-n' }, 'N. ' + (x.i + 1)), x.istr,
          h('span', { class: 'es-segno', 'aria-label': x.ok ? 'Giusta' : 'Sbagliata' }, x.ok ? '✓' : '✗')),
        x.testo ? h('div', { class: 'es-err-p' }, x.testo) : null,
        x.ok
          ? (x.mia ? h('div', { class: 'es-err-g' }, 'Tu: ', h('b', {}, x.mia)) : (x.solution ? h('div', { class: 'es-err-g' }, 'Giusto: ', h('b', {}, x.solution)) : null))
          : [x.skipped ? h('div', { class: 'es-err-m' }, 'Non hai risposto') : (x.mia ? h('div', { class: 'es-err-m' }, 'Tu: ', h('s', {}, x.mia)) : null),
            x.solution ? h('div', { class: 'es-err-g' }, 'Giusto: ', h('b', {}, x.solution)) : null],
        !x.ok && x.note ? h('div', { class: 'es-err-note' }, x.note)
          : (!x.ok && !x.solution && x.errs ? h('div', { class: 'es-err-note' }, x.errs + (x.errs === 1 ? ' coppia sbagliata' : ' coppie sbagliate')) : null)));
    });
    area.replaceChildren(carta); area.scrollTop = 0;
    piede.replaceChildren(pulsante('Fatto', 'g-btn-verde', function () { paginaVoto(false); }));
  }

  /* ---------- pulsante accanto all'ingranaggio ---------- */
  var gear = document.getElementById('gear');
  if (gear && gear.parentNode) {
    var btn = h('button', { class: 'gear es-apri', id: 'es-apri', type: 'button', 'aria-label': 'Esami' });
    btn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h11a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6z"/><path d="M6 3v18"/><path d="M3 7h3M3 12h3M3 17h3"/><path d="M10 8h6M10 12h6M10 16h3"/></svg>';
    btn.addEventListener('click', function () { suona('click'); apri(); });
    var wrap = h('div', { class: 'es-btns' });
    gear.parentNode.insertBefore(wrap, gear);
    wrap.append(btn, gear);
  }
  document.addEventListener('keydown', function (e) {
    if (radice.hidden || e.key !== 'Escape') return;
    var m = radice.querySelector('.es-modale-ov');
    if (m) { m.remove(); return; }
    if (radice.classList.contains('es-quiz')) esci(); else if (radice.classList.contains('es-hub')) chiudi(); else hub();
  });

  window.Esame = { apri: apri, costruisci: costruisci, PIANO: PIANO, stato: function () { return St; }, risultato: function () { return Ris; } };
})();
