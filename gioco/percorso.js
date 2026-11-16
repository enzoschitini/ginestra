/* Ginestra gioco - Home a "sentiero" (erbario). Ridefinisce showHome().
   Ogni categoria e' una sezione con il suo stelo; ogni esercizio e' una scheda legata allo stelo da un marcatore
   (spunta = fatto, fiore = da fare, lucchetto = bloccato). Toccando la scheda si apre il riquadro con "Inizia".
   Dipende da: index.html (EX, seenOf, load, mascot, h, $, setMode, setTop, renderTabs, cur, qi), GS, GI. */
(function () {
  var KEY_SBLOCCA = 'ginestra-sblocca-tutto';
  var OGNI = 4;                       // una cassetta ogni 4 esercizi
  var aperto = null;                  // riquadro aperto
  var tieniSheet = false;             // showHome richiamata dal foglio impostazioni: non chiuderlo
  var ultimo = null;                  // ultimo esercizio avviato: la Home ci torna a scrollare

  function sbloccaTutto() { try { return localStorage.getItem(KEY_SBLOCCA) === '1'; } catch (e) { return false; } }
  function setSblocca(v) { try { localStorage.setItem(KEY_SBLOCCA, v ? '1' : '0'); } catch (e) {} }
  function gi(nome, s) { return (window.GI && GI[nome]) ? GI[nome](s) : ''; }
  function stato() { var S = (window.GS && GS.state) || {}; return S; }
  function scrigni() { var S = stato(); if (!S.scrigni) S.scrigni = {}; return S.scrigni; }
  function salva() { try { GS.save(); } catch (e) {} }
  /* ramo di ginestra disegnato a mano: decora l'intestazione del capitolo (colore dal capitolo) */
  var RAMO = '<svg viewBox="0 0 150 90" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M2 80C40 74 78 52 146 8" stroke="var(--cap-ink)" stroke-width="2.4"/>' +
    '<path d="M34 72c-2-12 4-21 14-25 3 10-3 20-14 25zM66 58c-1-12 5-20 15-23 2 10-4 19-15 23zM100 38c0-11 6-18 15-20 1 9-4 17-15 20z" fill="var(--cap)" stroke="var(--cap-ink)" stroke-width="1.6"/>' +
    '<g stroke="var(--cap-ink)" stroke-width="1.4"><circle cx="52" cy="62" r="5" fill="#fffcf4"/><circle cx="86" cy="43" r="5.5" fill="#fffcf4"/><circle cx="122" cy="22" r="6" fill="#fffcf4"/><circle cx="140" cy="12" r="4" fill="#fffcf4"/></g></svg>';
  function chiudi() { if (aperto) { aperto.remove(); aperto = null; } }

  /* le corolle guadagnate (0-5) con le altre vuote, cosi' si vede quanto manca */
  function corolle(n) {
    var S = stato(), k = (S.corone && S.corone[n]) || 0, s = '';
    for (var i = 0; i < 5; i++) s += '<span class="pc-cor' + (i < k ? ' pc-cor-on' : '') + '">' + gi('corona', 14) + '</span>';
    var d = h('span', { class: 'pc-corolle', 'aria-label': k + (k === 1 ? ' corolla' : ' corolle') + ' su 5' });
    d.innerHTML = s;
    return d;
  }

  function riquadro(wrap, html, azione, tipo) {
    chiudi();
    var p = h('div', { class: 'pc-pop pc-pop-' + tipo, role: 'dialog' });
    p.innerHTML = html;
    if (azione) {
      var b = h('button', { class: 'g-btn g-btn-blocco g-btn-verde', type: 'button' }, azione.testo);
      b.addEventListener('click', function (ev) { ev.stopPropagation(); chiudi(); azione.fn(); });
      p.appendChild(b);
    }
    wrap.appendChild(p);
    aperto = p;
    p.addEventListener('click', function (ev) { ev.stopPropagation(); });
    inVista(p, 'nearest');
  }

  /* scrolla solo .content: scrollIntoView muoverebbe anche body.app (overflow:hidden) e lascerebbe vuoto sotto la tab bar */
  function inVista(el, modo) {
    var ct = document.querySelector('.content');
    if (!ct || !el) return;
    var r = el.getBoundingClientRect(), c = ct.getBoundingClientRect();
    var d = 0;
    if (modo === 'center') d = (r.top + r.height / 2) - (c.top + c.height / 2);
    else if (r.bottom > c.bottom) d = r.bottom - c.bottom + 8;
    else if (r.top < c.top) d = r.top - c.top - 8;
    if (d) ct.scrollTop += d;
  }

  function scuoti(el) {
    el.classList.remove('g-anim-shake'); void el.offsetWidth; el.classList.add('g-anim-shake');
    setTimeout(function () { el.classList.remove('g-anim-shake'); }, 500);
  }

  function marcatore(info, num) {
    var m = h('span', { class: 'pc-marc', 'aria-hidden': 'true' });
    if (info.stato === 'completato') m.innerHTML = gi('spunta', 22);
    else if (info.stato === 'bloccato' || info.stato === 'spento') m.innerHTML = gi('lucchetto', 18);
    else m.textContent = String(num);
    return m;
  }

  function nodo(e, info, num) {
    var wrap = h('div', { class: 'pc-nodo-wrap', 'data-ex': String(e.n) });
    var btn = h('button', { class: 'pc-nodo pc-' + info.stato, type: 'button', 'aria-label': e.name + ' - ' + info.etichetta });
    var pct = info.cnt ? Math.round(100 * info.seen / info.cnt) : 0;
    btn.appendChild(marcatore(info, num));

    var testo = h('span', { class: 'pc-testo' },
      h('span', { class: 'pc-nome' }, e.name),
      h('span', { class: 'pc-desc' }, info.stato === 'spento' ? 'Dati insufficienti' : (e.desc || '')));
    if (info.stato !== 'spento') {
      testo.appendChild(h('span', { class: 'pc-meta' },
        h('span', { class: 'pc-voci' }, info.seen + '/' + info.cnt + ' voci'),
        info.stato === 'bloccato' ? '' : corolle(e.n)));
      testo.appendChild(h('span', { class: 'pc-filo', 'aria-hidden': 'true' }, h('i', { style: 'width:' + pct + '%' })));
    }
    btn.appendChild(testo);

    if (info.stato === 'corrente') {
      btn.appendChild(h('span', { class: 'pc-tag' }, 'Tocca a te'));
      var m = h('span', { class: 'pc-mascotte', 'aria-hidden': 'true' });
      try { m.appendChild(mascot()); } catch (err) {}
      btn.appendChild(m);
    }
    wrap.appendChild(btn);

    btn.addEventListener('click', function (ev) {
      ev.stopPropagation();
      if (aperto && aperto.parentNode === wrap) { chiudi(); return; }
      if (info.stato === 'spento') {
        scuoti(btn);
        riquadro(wrap, '<b>Non ancora disponibile</b><span>Servono ' + (e.needs || 'più voci') + '. Voci idonee adesso: ' + info.cnt + '.</span>', null, 'no');
      } else if (info.stato === 'bloccato') {
        scuoti(btn);
        riquadro(wrap, '<b>Ancora chiuso</b><span>Completa almeno una lezione dell\'esercizio precedente per aprirlo.</span>', null, 'no');
      } else {
        riquadro(wrap, '<b>' + e.name + '</b><span>' + (e.desc || '') + '</span><span class="pc-sub">' + info.seen + ' voci viste su ' + info.cnt + '</span>',
          { testo: 'Inizia la lezione · +10 XP', fn: function () { ultimo = e.n; load(e.n); } }, 'ok');
      }
    });
    return wrap;
  }

  function scrigno(id, sbloccato) {
    var wrap = h('div', { class: 'pc-nodo-wrap pc-scrigno-wrap' });
    var fatto = !!scrigni()[id];
    var btn = h('button', { class: 'pc-scrigno' + (fatto ? ' pc-aperto' : '') + (!sbloccato && !fatto ? ' pc-chiuso-bloccato' : ''), type: 'button',
      'aria-label': fatto ? 'Cassetta già aperta' : 'Cassetta dei semi' });
    var ico = h('span', { class: 'pc-scrigno-ico' });
    ico.innerHTML = fatto ? gi('scrignoAperto', 34) : gi('scrigno', 34);
    btn.appendChild(ico);
    btn.appendChild(h('span', { class: 'pc-testo' },
      h('span', { class: 'pc-nome' }, fatto ? 'Cassetta aperta' : 'Cassetta dei semi'),
      h('span', { class: 'pc-desc' }, fatto ? 'Hai già raccolto le gemme' : (sbloccato ? 'Tocca per aprirla: +10 gemme' : 'Si apre completando le lezioni sopra'))));
    btn.addEventListener('click', function (ev) {
      ev.stopPropagation();
      if (scrigni()[id]) { riquadro(wrap, '<b>Cassetta già aperta</b><span>Hai già raccolto le gemme.</span>', null, 'no'); return; }
      if (!sbloccato) { scuoti(btn); riquadro(wrap, '<b>Cassetta chiusa</b><span>Completa le lezioni precedenti per aprirla.</span>', null, 'no'); return; }
      scrigni()[id] = 1;
      try { GS.addGemme(10); } catch (e2) {}
      salva();
      ico.innerHTML = gi('scrignoAperto', 34); btn.classList.add('pc-aperto'); ico.classList.add('g-anim-pop');
      riquadro(wrap, '<b>Cassetta aperta!</b><span class="pc-gemme">' + gi('gemma', 20) + ' +10 gemme</span>', null, 'ok');
    });
    wrap.appendChild(btn);
    return wrap;
  }

  function guida(c, list, banner) {
    var box = null;
    return h('button', { class: 'pc-guida', type: 'button', 'aria-label': 'Guida dell\'unità ' + c, 'aria-expanded': 'false',
      onclick: function (ev) {
        ev.stopPropagation();
        if (box) { box.remove(); box = null; this.setAttribute('aria-expanded', 'false'); return; }
        if (window.SND) SND.play('click');
        box = h('div', { class: 'pc-guida-box' }, [h('b', {}, 'In questa unità')].concat(list.map(function (e) { return h('div', {}, e.name + ' - ' + (e.desc || '')); })));
        banner.parentNode.insertBefore(box, banner.nextSibling);
        this.setAttribute('aria-expanded', 'true');
      } }, 'Guida');
  }

  window.showHome = showHome = function () {
    chiudi();
    cur = HOME; qi = 0;
    setMode('home'); setTop('Home'); renderTabs();
    var b = $('body'); b.className = 'home pc-home';
    var S = stato(), tutto = sbloccaTutto();
    var cats = [], out = [], globale = 0, prevOk = true, nodiTot = 0, nodiFatti = 0;
    EX.forEach(function (e) { if (cats.indexOf(e.cat) < 0) cats.push(e.cat); });

    cats.forEach(function (c, ui) {
      var list = EX.filter(function (e) { return e.cat === c; });
      var banner = h('div', { class: 'pc-unita' });
      var ramo = h('span', { class: 'pc-ramo' }); ramo.innerHTML = RAMO;
      banner.appendChild(h('span', { class: 'pc-num', 'aria-hidden': 'true' }, String(ui + 1)));
      banner.appendChild(h('div', { class: 'pc-unita-t' }, h('small', {}, 'Capitolo ' + (ui + 1) + ' · ' + list.length + (list.length === 1 ? ' esercizio' : ' esercizi')), h('b', {}, c)));
      banner.appendChild(ramo);
      banner.appendChild(guida(c, list, banner));
      var sez = h('section', { class: 'pc-sez pc-c' + (ui % 5) }, banner);
      var strada = h('div', { class: 'pc-strada' });
      var correnteTrovato = false;

      list.forEach(function (e, k) {
        var pool = e.pool(), cnt = pool.length, Sx = seenOf(e.n);
        var seen = pool.filter(function (x) { return Sx[x.id]; }).length;
        var lez = (S.lezioni && S.lezioni[e.n]) || 0;
        var off = cnt < e.min;
        var st;
        nodiTot++;
        if (off) st = 'spento';
        else if (lez > 0) st = 'completato';
        else if (tutto || prevOk) st = 'sbloccato';
        else st = 'bloccato';
        if (st === 'sbloccato' && !correnteTrovato) { st = 'corrente'; correnteTrovato = true; }
        if (st === 'completato') nodiFatti++;
        // un esercizio spento non blocca il sentiero; uno non completato lo blocca
        if (!off) prevOk = lez > 0;
        var etichetta = { spento: 'dati insufficienti', completato: 'completato', corrente: 'da iniziare', sbloccato: 'disponibile', bloccato: 'bloccato' }[st];
        strada.appendChild(nodo(e, { stato: st, cnt: cnt, seen: seen, etichetta: etichetta }, k + 1));
        globale++;
        if (globale % OGNI === 0) strada.appendChild(scrigno('scrigno-' + globale, st === 'completato'));
      });
      sez.appendChild(strada);
      out.push(sez);
    });

    // interruttore sblocca tutto
    var chk = $('sw-sblocca');
    if (chk) chk.checked = tutto;
    out.push(h('div', { class: 'pc-fondo' },
      h('p', { class: 'hm-note' }, 'Completati ' + nodiFatti + ' di ' + nodiTot + ' esercizi. Prima di cominciare puoi ripassare le voci in Ripasso.')));

    b.replaceChildren.apply(b, out);
    var ct = document.querySelector('.content'); if (ct) ct.scrollTop = 0;
    var sh = $('sheet'); if (sh && !tieniSheet) sh.hidden = true;
    tieniSheet = false;
    /* tornando da un esercizio si riporta in vista quella scheda (una volta sola), altrimenti la corrente */
    var cor = ultimo != null && b.querySelector('[data-ex="' + ultimo + '"]') || b.querySelector('.pc-corrente');
    ultimo = null;
    if (cor) setTimeout(function () { inVista(cor, 'center'); }, 60);
  };
  // showHome e' una function declaration globale: l'assegnazione sopra la sostituisce
  document.addEventListener('click', chiudi);
  // interruttore nelle impostazioni: ridisegna la Home restando nel foglio
  var sw = $('sw-sblocca');
  if (sw) {
    sw.checked = sbloccaTutto();
    sw.addEventListener('change', function () {
      if (window.SND) SND.play('click');
      setSblocca(sw.checked);
      if (typeof VIEW !== 'undefined' && VIEW === 'home') { tieniSheet = true; showHome(); }
    });
  }
  if (window.GS && GS.on) {
    GS.on('lezione', function () { if (typeof VIEW !== 'undefined' && VIEW === 'home') showHome(); });
  }
  if (typeof VIEW !== 'undefined' && VIEW === 'home' && $('body') && $('body').classList.contains('home')) showHome();
})();
