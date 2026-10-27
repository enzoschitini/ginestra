/* Ginestra gioco - navigazione a scorrimento (swipe) tra le schermate della tab bar.
   Riusa i pulsanti di #tabbar (stessi handler dei click): trascina a sinistra = scheda successiva, a destra = precedente.
   Pointer events: coprono touch e mouse. Attivo solo fuori dagli esercizi (la tab bar è nascosta in mode-ex). */
(function () {
  var SOGLIA = 70, BLOCCO = 10, MAX_TRASC = 90;
  var el = document.querySelector('.content');
  if (!el || !window.PointerEvent) return;
  var ridotto = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.style.touchAction = 'pan-y'; /* lo scroll verticale resta al browser, quello orizzontale arriva a noi */

  var g = null; /* gesto in corso: { id, x, y, dx, tipo, mouse } */

  /* schede raggiungibili ora e posizione della corrente */
  function schede() {
    var tb = document.getElementById('tabbar'); if (!tb || document.body.classList.contains('mode-ex')) return null;
    var bt = [].slice.call(tb.querySelectorAll('.tabb')), i = -1;
    bt.forEach(function (b, k) { if (b.classList.contains('on')) i = k; });
    return i < 0 ? null : { bt: bt, i: i };
  }
  function vicina(dir) {
    var s = schede(); if (!s) return null;
    for (var k = s.i + dir; k >= 0 && k < s.bt.length; k += dir) if (!s.bt[k].disabled) return s.bt[k];
    return null;
  }
  /* il gesto non deve partire su campi, link/bottoni (col mouse), elementi scrollabili in orizzontale o testo selezionato */
  function ignora(t, mouse) {
    if (!t || !t.closest) return true;
    if (t.closest('input,textarea,select,[contenteditable="true"],[data-no-swipe]')) return true;
    if (mouse && t.closest('button,a,summary')) return true;
    for (var n = t; n && n !== el; n = n.parentElement) {
      var o = getComputedStyle(n).overflowX;
      if ((o === 'auto' || o === 'scroll') && n.scrollWidth > n.clientWidth + 1) return true;
    }
    var sel = window.getSelection && getSelection();
    return !!(sel && !sel.isCollapsed && String(sel).length);
  }
  function muovi(dx, anim) {
    if (ridotto) return;
    el.style.transition = anim ? 'transform .18s ease, opacity .18s ease' : 'none';
    el.style.transform = dx ? 'translateX(' + dx + 'px)' : '';
    el.style.opacity = dx ? String(1 - Math.min(Math.abs(dx), MAX_TRASC) / 400) : '';
  }
  function fine() {
    if (!g) return;
    var dx = g.dx, tipo = g.tipo, dir = dx < 0 ? 1 : -1, b;
    try { el.releasePointerCapture(g.id); } catch (e) {}
    g = null;
    muovi(0, true);
    if (tipo === 'h' && Math.abs(dx) >= SOGLIA && (b = vicina(dir))) {
      try { var s = getSelection(); if (s) s.removeAllRanges(); } catch (e) {}
      b.click();
    }
  }

  el.addEventListener('pointerdown', function (e) {
    if (g || (e.pointerType === 'mouse' && e.button !== 0) || !e.isPrimary) return;
    if (!schede() || ignora(e.target, e.pointerType === 'mouse')) return;
    g = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, tipo: '', mouse: e.pointerType === 'mouse' };
  });
  el.addEventListener('pointermove', function (e) {
    if (!g || e.pointerId !== g.id) return;
    var dx = e.clientX - g.x, dy = e.clientY - g.y;
    if (!g.tipo) {
      if (Math.abs(dx) < BLOCCO && Math.abs(dy) < BLOCCO) return;
      /* l'orizzontale deve prevalere nettamente, altrimenti è scroll verticale: gesto abbandonato */
      if (Math.abs(dx) > Math.abs(dy) * 1.5) { g.tipo = 'h'; try { el.setPointerCapture(g.id); } catch (er) {} }
      else { g = null; return; }
    }
    g.dx = dx;
    /* senza scheda dall'altra parte il contenuto resiste: niente trascinamento libero */
    var lim = vicina(dx < 0 ? 1 : -1) ? MAX_TRASC : 20;
    muovi(Math.max(-lim, Math.min(lim, dx * 0.5)), false);
    e.preventDefault();
  });
  el.addEventListener('pointerup', function (e) { if (g && e.pointerId === g.id) fine(); });
  el.addEventListener('pointercancel', function (e) { if (g && e.pointerId === g.id) { g.dx = 0; fine(); } });
})();
