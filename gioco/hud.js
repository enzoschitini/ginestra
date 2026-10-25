/* Ginestra gioco - HUD (streak, gemme, cuori), tab bar a 4 voci, modale "senza cuori".
   Dipende da: window.GS (stato.js), window.GI (icone.js, con fallback emoji). Caricare dopo lo script inline di index.html. */
(function () {
  if (!window.GS) return;
  var MAXC = 5, perso0 = false, modale = null;

  function ic(nome, size, emoji) {
    try { if (window.GI && GI[nome]) return GI[nome](size); } catch (e) {}
    return '';
  }
  function fmtT(ms) {
    var s = Math.ceil(ms / 1000), m = Math.floor(s / 60);
    s = s % 60; return m + ':' + (s < 10 ? '0' : '') + s;
  }

  /* ---------- stile ---------- */
  var st = document.createElement('style');
  st.textContent =
    '.g-hud{display:none;align-items:center;justify-content:space-around;gap:4px;margin:4px 14px 8px;padding:8px 10px;background:var(--g-card);border:2px solid var(--g-bordo);border-radius:var(--g-raggio);font-family:var(--g-font,inherit)}' +
    'body:not(.mode-ex) .g-hud{display:flex}' +
    '.g-hud .g-pill{padding:4px 6px;min-width:0}' +
    '.g-hud .g-pill b{font-weight:900}' +
    '.g-hud-t{font-size:12px;font-weight:800;color:var(--g-testo-2,#777);margin-left:2px}' +
    '.g-hud .g-pill.g-spenta{color:var(--g-testo-3,#afafaf)}' +
    '.g-tabs{display:flex;gap:4px}' +
    '.tabbar .tabb.g-tab{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;gap:4px;font-family:inherit}' +
    '.tabbar .tabb.g-tab span{font-size:11px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}' +
    '.tabbar .tabb.g-tab svg{display:block;width:28px;height:28px}' +
    '.tabbar .tabb.g-tab[disabled]{opacity:.4;cursor:not-allowed}' +
    '.g-modale-ov{position:absolute;inset:0;z-index:300;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.6)}' +
    '.g-modale{width:100%;box-sizing:border-box;background:var(--g-bg,#fff);color:var(--g-testo,#3c3c3c);border-radius:26px 26px 0 0;padding:24px 20px calc(24px + env(safe-area-inset-bottom,0px));display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center;font-family:var(--g-font,inherit);animation:g-pop .4s both}' +
    '.g-modale h2{margin:0;font:900 22px/1.2 var(--g-font,inherit)}' +
    '.g-modale p{margin:0;font:800 15px/1.35 var(--g-font,inherit);color:var(--g-testo-2,#777)}' +
    '.g-modale .g-btn{width:100%}' +
    '.g-hud-gem{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:999px;background:#fff;color:#1899d6}' +
    '.g-modale-x{background:none;border:0;cursor:pointer;font:900 14px var(--g-font,inherit);letter-spacing:.8px;text-transform:uppercase;color:var(--g-blu-ombra,#1899d6);padding:10px}' +
    '.tabbar .tabb.g-tab{padding-left:2px;padding-right:2px;letter-spacing:.2px}' +
    '@media (max-width:420px){.tabbar{gap:2px;padding-left:8px;padding-right:8px}.tabbar .tabb.g-tab span{font-size:11px;letter-spacing:0;text-transform:none}}' +
    '@media (max-width:380px){.g-hud{margin:4px 8px 8px;padding:6px 6px}.g-hud .g-pill{font-size:14px;gap:4px}}' +
    '@media (prefers-reduced-motion:reduce){.g-modale{animation:none}}';
  document.head.appendChild(st);

  /* ---------- HUD ---------- */
  var hud = document.createElement('div');
  hud.className = 'g-hud'; hud.id = 'g-hud'; hud.setAttribute('role', 'status'); hud.setAttribute('aria-label', 'Statistiche');
  hud.innerHTML =
    '<div class="g-pill g-pill-fiamma" id="g-streak"></div>' +
    '<div class="g-pill g-pill-gemma" id="g-gemme"></div>' +
    '<div class="g-pill g-pill-cuore" id="g-cuori"></div>';
  var top = document.getElementById('apptop');
  if (top && top.parentNode) top.parentNode.insertBefore(hud, top.nextSibling);

  var prev = {};
  function setPill(id, key, val, html, label) {
    var el = document.getElementById(id); if (!el) return;
    el.innerHTML = html; el.setAttribute('aria-label', label);
    if (prev[key] !== undefined && prev[key] !== val) {
      el.classList.remove('g-anim-pop'); void el.offsetWidth; el.classList.add('g-anim-pop');
    }
    prev[key] = val;
  }
  function aggiorna() {
    var S = GS.state || {}, c = GS.cuori(), t = c < MAXC ? GS.prossimoCuoreTra() : 0;
    var sk = S.streak || 0, gm = S.gemme || 0;
    setPill('g-streak', 'streak', sk, ic(sk > 0 ? 'fiamma' : 'fiammaSpenta', 24, '🔥') + '<b>' + sk + '</b>', 'Serie: ' + sk + ' giorni');
    var sp = document.getElementById('g-streak'); if (sp) sp.classList.toggle('g-spenta', sk === 0);
    setPill('g-gemme', 'gemme', gm, ic('gemma', 24, '💎') + '<b>' + gm + '</b>', 'Gemme: ' + gm);
    setPill('g-cuori', 'cuori', c, ic(c > 0 ? 'cuore' : 'cuoreSpezzato', 24, '❤️') + '<b>' + c + '</b>' +
      (t > 0 ? '<span class="g-hud-t">' + fmtT(t) + '</span>' : ''), 'Cuori: ' + c + (t > 0 ? ', prossimo tra ' + fmtT(t) : ''));
    syncCuori(c);
  }
  function syncCuori(c) {
    try { hearts = c; } catch (e) {}
    var el = document.getElementById('hearts'); if (el) el.textContent = c;
    var hs = el && el.parentNode && el.parentNode.querySelector('svg');
    if (hs && window.GI && GI.cuore) { var sp = document.createElement('span'); sp.innerHTML = ic('cuore', 22); hs.replaceWith(sp.firstChild); }
  }
  ['xp', 'cuori', 'gemme', 'streak', 'lezione'].forEach(function (ev) { GS.on(ev, aggiorna); });
  setInterval(function () { if (!document.hidden) aggiorna(); }, 1000);

  /* ---------- tab bar ---------- */
  function tab(id, label, icona, emoji, fn) {
    var on = typeof VIEW !== 'undefined' && VIEW === id, ok = typeof fn === 'function';
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'tabb g-tab' + (on ? ' on' : '');
    b.setAttribute('aria-label', label); b.setAttribute('aria-current', on ? 'page' : 'false');
    if (!ok) b.disabled = true; else b.onclick = fn;
    b.innerHTML = (typeof icona === 'function' ? ic(icona(), 28, emoji) : '') + '<span></span>';
    b.lastChild.textContent = label;
    return b;
  }
  renderTabs = function () {
    var tb = document.getElementById('tabbar'); if (!tb) return;
    var home = tab('home', 'Home', function () { return 'casa'; }, '', function () { showHome(); });
    var train = tab('train', 'Ripasso', function () { return 'pesi'; }, '', function () { showTraining(); });
    var ob = tab('profilo', 'Obiettivi', function () { return 'bersaglio'; }, '🎯',
      typeof showProfilo === 'function' ? function () { showProfilo(); } : null);
    var lega = tab('lega', 'Lega', function () { return 'trofeo'; }, '🏆',
      typeof showLega === 'function' ? function () { showLega(); } : null);
    tb.replaceChildren(home, train, ob, lega);
    aggiorna();
  };

  /* ---------- modale senza cuori ---------- */
  function chiudiModale() { if (modale && modale.parentNode) modale.parentNode.removeChild(modale); modale = null; }
  window.mostraSenzaCuori = function (onRicarica, onEsci) {
    chiudiModale();
    var costo = 100, gem = (GS.state && GS.state.gemme) || 0, puo = gem >= costo;
    if (window.SND) SND.play('riprova');
    var ov = document.createElement('div'); ov.className = 'g-modale-ov';
    var m = document.createElement('div'); m.className = 'g-modale';
    m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-label', 'Hai finito i cuori');
    m.innerHTML = ic('cuoreSpezzato', 60) +
      '<h2>Hai finito i cuori!</h2>' +
      '<p id="g-sc-p"></p>';
    var t = GS.prossimoCuoreTra();
    m.querySelector('#g-sc-p').textContent = 'Il prossimo cuore arriva tra ' + fmtT(t) + '. Ricaricali con le gemme oppure allenati gratis.';
    function btn(cls, html, fn) {
      var b = document.createElement('button'); b.type = 'button'; b.className = cls; b.innerHTML = html;
      b.onclick = fn; m.appendChild(b); return b;
    }
    var r = btn('g-btn g-btn-blu g-btn-blocco', 'Ricarica con <span class="g-hud-gem">' + ic('gemma', 18) + '<b>' + costo + '</b></span>', function () {
      if (GS.ricaricaCuori(costo)) { chiudiModale(); perso0 = false; aggiorna(); if (onRicarica) onRicarica(); }
    });
    if (!puo) { r.disabled = true; r.setAttribute('aria-label', 'Ricarica: servono ' + costo + ' gemme, ne hai ' + gem); }
    btn('g-btn g-btn-verde g-btn-blocco', 'Ripassa (gratis)', function () { chiudiModale(); perso0 = false; showTraining(); });
    var x = document.createElement('button'); x.type = 'button'; x.className = 'g-modale-x'; x.textContent = 'Esci';
    x.onclick = function () { chiudiModale(); perso0 = false; if (onEsci) onEsci(); else showHome(); };
    m.appendChild(x);
    ov.appendChild(m);
    (document.getElementById('phone') || document.body).appendChild(ov);
    modale = ov;
    try { var f = r.disabled ? m.querySelector('.g-btn-verde') : r; f.focus(); } catch (e) {}
  };
  function modaleLezione() {
    if (perso0) return; perso0 = true;
    setTimeout(function () {
      if (GS.cuori() > 0) { perso0 = false; return; }
      mostraSenzaCuori(function () {
        // cuori ricaricati: se la schermata "Peccato!" e' gia' comparsa si rigioca la lezione, altrimenti si prosegue col tasto Continua
        if (document.querySelector('.f-fallita') && cur && cur.n > 0) { load(cur.n); return; }
        var b = document.querySelector('#footer .btn-main'); if (b) try { b.focus(); } catch (e) {}
      }, function () { showHome(); });
    }, 700);
  }

  /* ---------- collegamento al motore ---------- */
  ctx.lose = function () {
    var r = GS.perdiCuore();
    syncCuori(r);
    var el = document.getElementById('hearts');
    if (el && el.parentNode) { el.parentNode.classList.remove('g-anim-shake'); void el.offsetWidth; el.parentNode.classList.add('g-anim-shake'); }
    if (r <= 0) modaleLezione();
  };
  var finish_engine = finish;
  finish = function (ok, solution, note) { finish_engine(ok, solution, note); syncCuori(GS.cuori()); };

  var load_engine = load;
  load = function (n) {
    if (n !== 0 && GS.cuori() <= 0) {
      mostraSenzaCuori(function () { load(n); }, function () { showHome(); });
      return;
    }
    load_engine(n);
    syncCuori(GS.cuori());
  };

  aggiorna();
  renderTabs();
  window.addEventListener('load', function () { renderTabs(); aggiorna(); });
})();
