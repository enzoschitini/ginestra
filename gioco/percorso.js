/* Ginestra gioco - Home a strada di nodi (stile Duolingo). Ridefinisce showHome().
   Dipende da: index.html (EX, seenOf, load, mascot, h, $, setMode, setTop, renderTabs, cur, qi, ico), GS, GI. */
(function () {
  var KEY_SBLOCCA = 'ginestra-sblocca-tutto';
  var OGNI = 4;                       // uno scrigno ogni 4 nodi
  var OFFS = [0, 46, 70, 46, 0, -46, -70, -46]; // zig-zag in px (onda)
  var aperto = null;                  // popover aperto

  function sbloccaTutto() { try { return localStorage.getItem(KEY_SBLOCCA) === '1'; } catch (e) { return false; } }
  function setSblocca(v) { try { localStorage.setItem(KEY_SBLOCCA, v ? '1' : '0'); } catch (e) {} }
  function gi(nome, s) { return (window.GI && GI[nome]) ? GI[nome](s) : ''; }
  function stato() { var S = (window.GS && GS.state) || {}; return S; }
  function scrigni() { var S = stato(); if (!S.scrigni) S.scrigni = {}; return S.scrigni; }
  function salva() { try { GS.save(); } catch (e) {} }
  function chiudi() { if (aperto) { aperto.remove(); aperto = null; } }

  function anello(pct, col) {
    var r = 41, c = 2 * Math.PI * r;
    return '<svg class="pc-anello" viewBox="0 0 92 92" aria-hidden="true"><circle cx="46" cy="46" r="' + r + '" class="pc-anello-bg"/>' +
      '<circle cx="46" cy="46" r="' + r + '" class="pc-anello-fg" style="stroke:' + col + ';stroke-dasharray:' + (c * pct).toFixed(1) + ' ' + c.toFixed(1) + '" transform="rotate(-90 46 46)"/></svg>';
  }

  function corone(n) {
    var S = stato(), k = (S.corone && S.corone[n]) || 0, s = '';
    if (!k) return null;
    for (var i = 0; i < k; i++) s += gi('corona', 12);
    var d = h('div', { class: 'pc-corone', 'aria-label': k + (k === 1 ? ' corona' : ' corone') });
    d.innerHTML = s;
    return d;
  }

  function popover(wrap, html, azione, tipo) {
    chiudi();
    var p = h('div', { class: 'pc-pop pc-pop-' + tipo, role: 'dialog' });
    p.innerHTML = html;
    if (azione) {
      var b = h('button', { class: 'g-btn g-btn-blocco ' + (tipo === 'ok' ? 'g-btn-verde' : 'g-btn-grigio'), type: 'button' }, azione.testo);
      b.addEventListener('click', function (ev) { ev.stopPropagation(); chiudi(); azione.fn(); });
      p.appendChild(b);
    }
    wrap.appendChild(p);
    aperto = p;
    p.addEventListener('click', function (ev) { ev.stopPropagation(); });
    try { p.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) {}
  }

  function scuoti(el) {
    el.classList.remove('g-anim-shake'); void el.offsetWidth; el.classList.add('g-anim-shake');
    setTimeout(function () { el.classList.remove('g-anim-shake'); }, 500);
  }

  function nodo(e, info, off) {
    var wrap = h('div', { class: 'pc-nodo-wrap', style: 'transform:translateX(' + off + 'px);--off:' + off + 'px' });
    var cls = 'pc-nodo pc-' + info.stato;
    var btn = h('button', { class: cls, type: 'button', 'aria-label': e.name + ' - ' + info.etichetta });
    var pct = info.cnt ? info.seen / info.cnt : 0;
    var col = info.stato === 'corrente' ? 'var(--g-verde)' : 'var(--g-giallo)';
    var icona = (info.stato === 'bloccato' || info.stato === 'spento') ? gi('nodoBloccato', 68) :
      info.stato === 'completato' ? gi('nodoCompleto', 68) : gi('nodoOro', 68);
    btn.innerHTML = ((info.stato === 'corrente' || info.stato === 'completato') ? anello(pct, col) : '') + '<span class="pc-ico">' + icona + '</span>';
    wrap.appendChild(btn);

    var cor = corone(e.n);
    if (cor && info.stato !== 'bloccato') wrap.appendChild(cor);
    if (info.stato === 'corrente') {
      wrap.appendChild(h('div', { class: 'pc-start g-anim-bounce', 'aria-hidden': 'true' }, 'START'));
      var m = h('div', { class: 'pc-mascotte', 'aria-hidden': 'true' });
      try { m.appendChild(mascot()); } catch (err) {}
      wrap.appendChild(m);
    }
    wrap.appendChild(h('div', { class: 'pc-nome' }, e.name));

    btn.addEventListener('click', function (ev) {
      ev.stopPropagation();
      if (aperto && aperto.parentNode === wrap) { chiudi(); return; }
      if (info.stato === 'spento') {
        scuoti(btn);
        popover(wrap, '<b>Non ancora disponibile</b><span>Servono ' + (e.needs || 'più voci') + '. Voci idonee adesso: ' + info.cnt + '.</span>', null, 'no');
      } else if (info.stato === 'bloccato') {
        scuoti(btn);
        popover(wrap, '<b>Bloccato</b><span>Completa almeno una lezione dell\'esercizio precedente per sbloccarlo.</span>', null, 'no');
      } else {
        popover(wrap, '<b>' + e.name + '</b><span>' + (e.desc || '') + '</span><span class="pc-sub">' + info.seen + '/' + info.cnt + ' voci viste</span>',
          { testo: 'Inizia lezione +10 XP', fn: function () { load(e.n); } }, 'ok');
      }
    });
    return wrap;
  }

  function scrigno(id, sbloccato) {
    var wrap = h('div', { class: 'pc-nodo-wrap pc-scrigno-wrap', style: 'transform:translateX(0)' });
    var fatto = !!scrigni()[id];
    var btn = h('button', { class: 'pc-scrigno' + (fatto ? ' pc-aperto' : '') + (!sbloccato && !fatto ? ' pc-chiuso-bloccato' : ''), type: 'button',
      'aria-label': fatto ? 'Scrigno già aperto' : 'Scrigno' });
    btn.innerHTML = fatto ? gi('scrignoAperto', 54) : gi('scrigno', 54);
    btn.addEventListener('click', function (ev) {
      ev.stopPropagation();
      if (scrigni()[id]) { popover(wrap, '<b>Scrigno già aperto</b><span>Lo hai già svuotato.</span>', null, 'no'); return; }
      if (!sbloccato) { scuoti(btn); popover(wrap, '<b>Scrigno chiuso</b><span>Completa le lezioni precedenti per aprirlo.</span>', null, 'no'); return; }
      scrigni()[id] = 1;
      try { GS.addGemme(10); } catch (e2) {}
      salva();
      btn.innerHTML = gi('scrignoAperto', 54); btn.classList.add('pc-aperto', 'g-anim-pop');
      popover(wrap, '<b>Scrigno aperto!</b><span class="pc-gemme">' + gi('gemma', 20) + ' +10 gemme</span>', null, 'ok');
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
      var banner = h('div', { class: 'pc-unita' + ((ui % 4) ? ' pc-u' + (ui % 4) : '') });
      banner.appendChild(h('div', { class: 'pc-unita-t' }, h('small', {}, 'Unità ' + (ui + 1)), h('b', {}, c)));
      banner.appendChild(guida(c, list, banner));
      var sez = h('section', { class: 'pc-sez' }, banner);
      var strada = h('div', { class: 'pc-strada' });
      var correnteTrovato = false;

      list.forEach(function (e) {
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
        if (st === 'sbloccato' && !correnteTrovato && !tutto) { st = 'corrente'; correnteTrovato = true; }
        else if (st === 'sbloccato' && tutto && !correnteTrovato) { st = 'corrente'; correnteTrovato = true; }
        if (st === 'completato') nodiFatti++;
        // un nodo spento non blocca la strada; uno non completato la blocca
        if (!off) prevOk = lez > 0;
        var etichetta = { spento: 'dati insufficienti', completato: 'completato', corrente: 'da iniziare', sbloccato: 'disponibile', bloccato: 'bloccato' }[st];
        strada.appendChild(nodo(e, { stato: st === 'sbloccato' ? 'sbloccato' : st, cnt: cnt, seen: seen, etichetta: etichetta }, OFFS[globale % OFFS.length]));
        globale++;
        if (globale % OGNI === 0) strada.appendChild(scrigno('scrigno-' + globale, st === 'completato'));
      });
      sez.appendChild(strada);
      out.push(sez);
    });

    // interruttore sblocca tutto
    var lab = h('label', { class: 'pc-switch' });
    var chk = h('input', { type: 'checkbox', 'aria-label': 'Sblocca tutto' });
    chk.checked = tutto;
    chk.addEventListener('change', function () { if (window.SND) SND.play('click'); setSblocca(chk.checked); showHome(); });
    lab.append(chk, h('span', { class: 'pc-switch-ui', 'aria-hidden': 'true' }), h('span', { class: 'pc-switch-t' }, 'Sblocca tutto'));
    out.push(h('div', { class: 'pc-fondo' }, lab,
      h('p', { class: 'hm-note' }, 'Completati ' + nodiFatti + ' di ' + nodiTot + ' esercizi. Prima di cominciare puoi ripassare le voci in Ripasso.')));

    b.replaceChildren.apply(b, out);
    var ct = document.querySelector('.content'); if (ct) ct.scrollTop = 0;
    var sh = $('sheet'); if (sh) sh.hidden = true;
    var cor = b.querySelector('.pc-corrente');
    if (cor) setTimeout(function () { try { cor.scrollIntoView({ block: 'center' }); } catch (e) {} }, 60);
  };
  // showHome e' una function declaration globale: l'assegnazione sopra la sostituisce
  document.addEventListener('click', chiudi);
  if (window.GS && GS.on) {
    GS.on('lezione', function () { if (typeof VIEW !== 'undefined' && VIEW === 'home') showHome(); });
  }
  if (typeof VIEW !== 'undefined' && VIEW === 'home' && $('body') && $('body').classList.contains('home')) showHome();
})();
