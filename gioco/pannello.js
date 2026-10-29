/* Ginestra gioco - pannello destro per PC (>= 1024px): statistiche, Lega, progresso XP con grafico settimanale.
   Dipende da: window.GS (stato.js), window.GI (icone.js). Caricare dopo hud.js. Sotto i 1024px il pannello e' nascosto via CSS. */
(function () {
  if (!window.GS) return;
  var phone = document.getElementById('phone'), hud = document.getElementById('g-hud');
  if (!phone || !hud) return;

  function ic(n, s) { try { return window.GI && GI[n] ? GI[n](s) : ''; } catch (e) { return ''; } }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var side = document.createElement('aside');
  side.className = 'g-side'; side.id = 'g-side'; side.setAttribute('aria-label', 'Riepilogo');
  var cards = document.createElement('div'); cards.className = 'g-side-cards';
  side.appendChild(cards);
  phone.appendChild(side);

  var mq = window.matchMedia('(min-width: 1024px)');
  function sposta() {
    // su PC la barra statistiche vive in cima al pannello, altrove torna sotto il titolo
    if (mq.matches) side.insertBefore(hud, cards);
    else { var top = document.getElementById('apptop'); if (top && top.parentNode) top.parentNode.insertBefore(hud, top.nextSibling); }
  }

  function grafico(giorni, max) {
    var W = 260, H = 96, px = 14, py = 10, n = giorni.length, i, pts = [], dots = '';
    for (i = 0; i < n; i++) {
      var x = px + (W - 2 * px) * i / (n - 1), y = H - py - (H - 2 * py) * Math.min(1, giorni[i].xp / max);
      pts.push([x, y]);
    }
    var linea = pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ');
    var area = px + ',' + (H - py) + ' ' + linea + ' ' + (W - px) + ',' + (H - py);
    giorni.forEach(function (g, k) {
      if (g.futuro) return;
      dots += '<circle cx="' + pts[k][0].toFixed(1) + '" cy="' + pts[k][1].toFixed(1) + '" r="' + (g.oggi ? 5 : 3.5) + '" class="g-pt' + (g.oggi ? ' g-pt-oggi' : '') + '"/>';
    });
    var lett = giorni.map(function (g, k) {
      return '<text x="' + pts[k][0].toFixed(1) + '" y="' + (H + 14) + '" text-anchor="middle" class="g-lett' + (g.oggi ? ' g-lett-oggi' : '') + '">' + g.lettera + '</text>';
    }).join('');
    return '<svg class="g-graf" viewBox="0 0 ' + W + ' ' + (H + 20) + '" role="img" aria-label="XP dei sette giorni della settimana">' +
      '<line x1="' + px + '" x2="' + (W - px) + '" y1="' + (H - py) + '" y2="' + (H - py) + '" class="g-asse"/>' +
      '<polygon points="' + area + '" class="g-area"/><polyline points="' + linea + '" class="g-linea"/>' + dots + lett + '</svg>';
  }

  function disegna() {
    if (!mq.matches) return;
    var S = GS.state || {}, L = GS.lega(), ob = S.obiettivoXp || 20, oggi = S.xpOggi || 0;
    var pO = Math.min(100, Math.round(oggi / ob * 100)), pL = Math.round(L.pct * 100);
    var max = Math.max(ob, 10);
    L.giorni.forEach(function (g) { if (g.xp > max) max = g.xp; });
    var msg = L.mancanti > 0
      ? 'Ti mancano ' + L.mancanti + ' XP per salire' + (L.prossima ? ' in ' + esc(L.prossima) : '') + '.'
      : 'Obiettivo della settimana raggiunto!';
    cards.innerHTML =
      '<section class="g-card-lat"><header><h2>Lega ' + esc(L.nome) + '</h2><button type="button" class="g-link" data-vai="lega">Apri</button></header>' +
        '<div class="g-lega"><div class="g-lega-ic">' + ic('trofeo', 44) + '</div><div class="g-lega-t"><b>' + L.xp + ' / ' + L.target + ' XP</b><span>' + msg + '</span></div></div>' +
        '<div class="g-barra" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pL + '" aria-label="Avanzamento lega"><i style="width:' + pL + '%"></i></div></section>' +
      '<section class="g-card-lat"><header><h2>Progresso XP</h2><button type="button" class="g-link" data-vai="profilo">Obiettivo</button></header>' +
        '<div class="g-xp-riga"><span class="g-xp-ic">' + ic('fulmine', 26) + '</span><div class="g-xp-t"><b>Obiettivo di oggi</b><span>' + Math.min(oggi, ob) + ' / ' + ob + ' XP</span></div></div>' +
        '<div class="g-barra g-barra-oro" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pO + '" aria-label="Obiettivo giornaliero"><i style="width:' + pO + '%"></i></div>' +
        grafico(L.giorni, max) + '</section>';
  }

  side.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-vai]'); if (!b) return;
    var v = b.getAttribute('data-vai');
    if (v === 'lega' && typeof showLega === 'function') showLega();
    else if (typeof showProfilo === 'function') showProfilo();
  });

  ['xp', 'lezione', 'streak'].forEach(function (ev) { GS.on(ev, disegna); });
  var pr = mq.addEventListener ? 'addEventListener' : 'addListener';
  mq[pr]('change', function () { sposta(); disegna(); });
  sposta(); disegna();
  window.addEventListener('load', function () { sposta(); disegna(); });
})();
