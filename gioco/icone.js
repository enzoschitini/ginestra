/* Ginestra gioco - icone. window.GI.<nome>(size) -> stringa HTML.
   Le icone di base usano le immagini di layout/assets/ (<img>); quelle senza immagine (corona, medaglia, stella,
   lucchetto, scrigno aperto) sono SVG propri. `size` e' l'altezza in px; la larghezza segue le proporzioni. */
(function () {
  var uid = 0;
  function gid() { uid++; return 'gi' + uid; }
  function svg(size, vb, inner, defs, label) {
    var s = size || 24;
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + s + '" height="' + s + '" viewBox="' + vb + '" role="img" aria-label="' + (label || '') + '" focusable="false">' +
      (defs ? '<defs>' + defs + '</defs>' : '') + inner + '</svg>';
  }
  function grad(id, a, b) {
    return '<linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></linearGradient>';
  }
  var BASE = (function () {
    try { var s = document.currentScript && document.currentScript.src; if (s) return s.replace(/[^\/]*$/, '') + '../layout/assets/'; } catch (e) {}
    return 'layout/assets/';
  })();
  function img(file, size, label, stile) {
    var s = size || 24;
    return '<img class="g-ico" src="' + BASE + encodeURIComponent(file).replace(/%2F/g, '/') + '" alt="' + (label || '') + '" height="' + s + '" draggable="false" ' +
      'style="height:' + s + 'px;width:auto;vertical-align:middle;' + (stile || '') + '">';
  }
  var SPENTO = 'filter:grayscale(1) brightness(1.15);opacity:.55;';
  var GI = {};

  GI.fiamma = function (size) { return img('Icon=Streak, Size=Medium.png', size, 'Fiamma'); };
  GI.fiammaSpenta = function (size) { return img('Icon=Streak, Size=Medium.png', size, 'Fiamma spenta', SPENTO); };
  GI.gemma = function (size) { return img('Icon=Gem, Size=Small.png', size, 'Gemma'); };
  GI.cuore = function (size) { return img('Icon=Heart, Size=Small.png', size, 'Cuore'); };
  GI.cuoreSpezzato = function (size) { return img('Icon=Heart, Size=Small.png', size, 'Cuore perso', SPENTO); };
  GI.fulmine = function (size) { return img('Icon=Lightning, Size=Small.png', size, 'XP'); };
  GI.scrigno = function (size) { return img('Icon=Shiny Gold Chest, Size=Small.png', size, 'Scrigno'); };
  GI.trofeo = function (size) { return img('Icon=Trophy, Size=Small.png', size, 'Trofeo'); };
  GI.bersaglio = function (size) { return img('Icon=Target, Size=Medium.png', size, 'Obiettivo'); };
  GI.timer = function (size) { return img('Icon=Timer, Size=Medium.png', size, 'Timer'); };
  GI.campana = function (size) { return img('Icon=Bell, Size=Small.png', size, 'Notifiche'); };
  GI.spunta = function (size) { return img('Icon=Check, Size=Small.png', size, 'Fatto'); };
  GI.casa = function (size) { return img('Icon=House, Size=Small.png', size, 'Home'); };
  GI.pesi = function (size) { return img('Icon=Weights, Size=Small.png', size, 'Ripasso'); };
  GI.altro = function (size) { return img('Icon=More, Size=Small.png', size, 'Altro'); };
  GI.logo = function (size) { return img('logo 2.png', size, 'Ginestra'); };
  /* nodi del percorso (71x65): completato, oro (corrente, con stella), non disponibile */
  GI.nodoCompleto = function (size) { return img('Property 1=Complete.png', size || 65, 'Completato'); };
  GI.nodoOro = function (size) { return img('Property 1=Gold.png', size || 65, 'Disponibile'); };
  GI.nodoBloccato = function (size) { return img('Property 1=Unavailable.png', size || 65, 'Bloccato'); };
  /* percorsi dei file, per chi preferisce usarli in CSS o in un <img> proprio */
  GI.url = function (file) { return BASE + encodeURIComponent(file); };

  GI.scrignoAperto = function (size) {
    var a = gid(), b = gid(), c = gid();
    return svg(size, '0 0 64 64',
      '<path d="M8 22L14 4h36l6 18z" fill="url(#' + a + ')"/>' +
      '<rect x="6" y="26" width="52" height="30" rx="5" fill="url(#' + b + ')"/>' +
      '<rect x="10" y="22" width="44" height="12" rx="3" fill="url(#' + c + ')"/>' +
      '<circle cx="22" cy="24" r="4" fill="#fff3a0"/><circle cx="34" cy="21" r="4.5" fill="#ffc800"/><circle cx="45" cy="25" r="3.5" fill="#fff3a0"/>' +
      '<path d="M32 4v-2M20 8l-3-3M44 8l3-3" stroke="#ffc800" stroke-width="3" stroke-linecap="round"/>' +
      '<rect x="26" y="38" width="12" height="12" rx="3" fill="#ffc800" stroke="#c99400" stroke-width="2"/>',
      grad(a, '#d98a3a', '#a85d16') + grad(b, '#b8691f', '#82430c') + grad(c, '#ffe45c', '#ff9600'), 'Scrigno aperto');
  };
  GI.corona = function (size) { return img('Icon=Crown.png', size, 'Corona'); };
  GI.lucchetto = function (size) {
    var a = gid();
    return svg(size, '0 0 64 64',
      '<path d="M20 28V20a12 12 0 0 1 24 0v8" fill="none" stroke="#9aa5ac" stroke-width="7" stroke-linecap="round"/>' +
      '<rect x="10" y="28" width="44" height="30" rx="7" fill="url(#' + a + ')"/>' +
      '<circle cx="32" cy="40" r="4.5" fill="#6f7b83"/><rect x="30" y="42" width="4" height="9" rx="2" fill="#6f7b83"/>',
      grad(a, '#c9d1d6', '#98a3aa'), 'Bloccato');
  };
  GI.stella = function (size) {
    var a = gid();
    return svg(size, '0 0 64 64',
      '<path d="M32 4l8.5 18.5 20 2.5-14.8 13.8L50 59 32 49 14 59l4.3-20.2L3.5 25l20-2.5z" fill="url(#' + a + ')" stroke="#e5a800" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="M24 24l8-14" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6"/>',
      grad(a, '#ffe45c', '#ffb800'), 'Stella');
  };
  GI.medaglia = function (size, colore) {
    var cols = { bronzo: ['#e8a066', '#a8602a'], argento: ['#e4eaee', '#a3afb7'], oro: ['#ffe45c', '#ffa800'], blu: ['#7fe3ff', '#1478c4'], verde: ['#8be02a', '#3f9a00'], viola: ['#d79bff', '#8b3fd0'], rosso: ['#ff8a8a', '#d92e2e'] };
    var c = cols[colore] || (/^#/.test(colore || '') ? [colore, colore] : cols.oro);
    var a = gid();
    return svg(size, '0 0 64 64',
      '<path d="M18 2h12l6 22H24zM46 2H34l-6 22h12z" fill="#1cb0f6"/><path d="M24 2h6l4 14-3 8h-4z" fill="#1899d6"/>' +
      '<circle cx="32" cy="40" r="20" fill="url(#' + a + ')" stroke="rgba(0,0,0,.18)" stroke-width="2"/>' +
      '<circle cx="32" cy="40" r="13" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2.5"/>' +
      '<path d="M32 31l2.8 6 6.2.7-4.6 4.2 1.3 6.1L32 45l-5.7 3 1.3-6.1L23 37.7l6.2-.7z" fill="#fff" opacity=".85"/>',
      grad(a, c[0], c[1]), 'Medaglia ' + (colore || 'oro'));
  };

  window.GI = GI;
})();
