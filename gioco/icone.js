/* Ginestra gioco - icone. window.GI.<nome>(size) -> stringa HTML.
   Set proprio, tutto SVG: forme piatte, colore pieno e contorno d'inchiostro (variabile --g-contorno).
   Tema botanico: la serie e' un fiore di ginestra, le gemme sono gemme di pianta, la "corona" e' una corolla.
   I nomi (fiamma, gemma, cuore, ...) restano quelli di prima: cambia solo il disegno. `size` e' l'altezza in px. */
(function () {
  var C = 'var(--g-contorno,#1d2b24)';
  var SPENTO = 'filter:grayscale(1);opacity:.45;';
  function svg(size, inner, label, stile) {
    var s = size || 24;
    return '<svg class="g-ico" xmlns="http://www.w3.org/2000/svg" width="' + s + '" height="' + s + '" viewBox="0 0 32 32" role="img" aria-label="' + (label || '') + '" focusable="false" ' +
      'style="vertical-align:middle;overflow:visible;' + (stile || '') + '" fill="none" stroke="' + C + '" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>';
  }
  var GI = {};

  /* serie: fiore di ginestra (cinque petali attorno a un cuore arancio) */
  function fiore(petali, centro) {
    var p = '';
    for (var i = 0; i < 5; i++) p += '<ellipse cx="16" cy="8.2" rx="4.6" ry="6.6" fill="' + petali + '" transform="rotate(' + (i * 72) + ' 16 16)"/>';
    return p + '<circle cx="16" cy="16" r="3.6" fill="' + centro + '"/>';
  }
  GI.fiamma = function (size) { return svg(size, fiore('#f5b800', '#d9692b'), 'Serie'); };
  GI.fiammaSpenta = function (size) { return svg(size, fiore('#f5b800', '#d9692b'), 'Serie spenta', SPENTO); };

  /* gemma: gemma di pianta (germoglio con due foglioline) */
  GI.gemma = function (size) {
    return svg(size, '<path d="M16 29V15" /><path d="M16 17C9 17 5 12 5 6c7 0 11 4 11 11z" fill="#5aa57a"/><path d="M16 14c0-6 4-10 11-10 0 6-4 10-11 10z" fill="#7fcf9f"/>', 'Gemma');
  };

  GI.cuore = function (size) {
    return svg(size, '<path d="M16 27C6 20 3.5 15 3.5 10.5A6.5 6.5 0 0 1 16 8a6.5 6.5 0 0 1 12.5 2.5C28.5 15 26 20 16 27z" fill="#c8442f"/><path d="M8.5 10.5a3 3 0 0 1 3-3" stroke="#fffcf4" stroke-width="1.6"/>', 'Cuore');
  };
  GI.cuoreSpezzato = function (size) {
    return svg(size, '<path d="M16 27C6 20 3.5 15 3.5 10.5A6.5 6.5 0 0 1 16 8a6.5 6.5 0 0 1 12.5 2.5C28.5 15 26 20 16 27z" fill="#9a9c8c"/><path d="M16 8l-3 6 4 3-3 6"/>', 'Cuore perso', 'opacity:.7;');
  };

  /* XP: scintilla a quattro punte */
  GI.fulmine = function (size) {
    return svg(size, '<path d="M16 3c1 7 3 10 13 13-10 3-12 6-13 13-1-7-3-10-13-13C13 13 15 10 16 3z" fill="#f5b800"/>', 'XP');
  };

  GI.scrigno = function (size) {
    return svg(size, '<rect x="4" y="13" width="24" height="15" rx="2.5" fill="#b0501b"/><path d="M4 15V12a3 3 0 0 1 3-3h18a3 3 0 0 1 3 3v3z" fill="#d9692b"/><path d="M4 18h24"/><rect x="13" y="16" width="6" height="7" rx="1.5" fill="#f5b800"/>', 'Cassetta');
  };
  GI.scrignoAperto = function (size) {
    return svg(size, '<rect x="4" y="15" width="24" height="13" rx="2.5" fill="#b0501b"/><path d="M5 15l2-9a2 2 0 0 1 2-1.5h14a2 2 0 0 1 2 1.5l2 9z" fill="#d9692b"/><circle cx="12" cy="12" r="2.2" fill="#f5b800"/><circle cx="19" cy="10.5" r="2.4" fill="#7fcf9f"/><circle cx="24" cy="13" r="1.8" fill="#f5b800"/><rect x="13" y="19" width="6" height="6" rx="1.5" fill="#f5b800"/>', 'Cassetta aperta');
  };

  /* lega: coppa a calice */
  GI.trofeo = function (size) {
    return svg(size, '<path d="M9 4h14v9a7 7 0 0 1-14 0z" fill="#f5b800"/><path d="M9 7H4c0 5 2 7 5 7M23 7h5c0 5-2 7-5 7"/><path d="M16 20v5"/><rect x="10" y="25" width="12" height="3.5" rx="1.5" fill="#c99400"/>', 'Coppa');
  };
  GI.bersaglio = function (size) {
    return svg(size, '<circle cx="16" cy="16" r="12.5" fill="#fffcf4"/><circle cx="16" cy="16" r="8" fill="#c8442f"/><circle cx="16" cy="16" r="3.6" fill="#fffcf4"/><path d="M16 16L27 5"/>', 'Obiettivo');
  };
  GI.timer = function (size) {
    return svg(size, '<circle cx="16" cy="17" r="11" fill="#fffcf4"/><path d="M16 10v7l4.5 3M12 3.5h8"/>', 'Timer');
  };
  GI.campana = function (size) {
    return svg(size, '<path d="M7 23V15a9 9 0 0 1 18 0v8l2.5 2.5h-23z" fill="#f5b800"/><path d="M13 28.5a3 3 0 0 0 6 0"/>', 'Notifiche');
  };
  GI.spunta = function (size) {
    return svg(size, '<circle cx="16" cy="16" r="12.5" fill="#7fcf9f"/><path d="M9.5 16.5l4.5 4.5 8.5-9.5" stroke-width="2.4"/>', 'Fatto');
  };
  GI.casa = function (size) {
    return svg(size, '<path d="M4.5 15L16 4.5 27.5 15"/><path d="M7 13v14h18V13" fill="#fdf0c0"/><rect x="13" y="18" width="6" height="9" rx="1" fill="#d9692b"/>', 'Sentiero');
  };
  /* ripasso: libro aperto */
  GI.pesi = function (size) {
    return svg(size, '<path d="M16 8C12 5.5 7 5.5 3.5 6.5V25c3.5-1 8.5-1 12.5 1.5z" fill="#fdf0c0"/><path d="M16 8c4-2.5 9-2.5 12.5-1.5V25c-3.5-1-8.5-1-12.5 1.5z" fill="#fffcf4"/><path d="M16 8v18.5M7 11.5c2-.4 4-.2 6 .8M19 12.3c2-1 4-1.2 6-.8"/>', 'Ripasso');
  };
  GI.altro = function (size) {
    return svg(size, '<circle cx="6" cy="16" r="2" fill="' + C + '"/><circle cx="16" cy="16" r="2" fill="' + C + '"/><circle cx="26" cy="16" r="2" fill="' + C + '"/>', 'Altro');
  };

  /* logo: resta quello di Ginestra */
  var BASE = (function () {
    try { var s = document.currentScript && document.currentScript.src; if (s) return s.replace(/[^\/]*$/, '') + '../layout/assets/'; } catch (e) {}
    return 'layout/assets/';
  })();
  GI.logo = function (size) {
    var s = size || 24;
    return '<img class="g-ico" src="' + BASE + 'logo-g.png" alt="Ginestra" height="' + s + '" draggable="false" style="height:' + s + 'px;width:auto;vertical-align:middle">';
  };
  GI.url = function (file) { return BASE + encodeURIComponent(file); };

  /* nodi di un percorso (compat): cerchio con spunta, fiore, lucchetto */
  GI.nodoCompleto = function (size) { return GI.spunta(size || 40); };
  GI.nodoOro = function (size) { return GI.corona(size || 40); };
  GI.nodoBloccato = function (size) { return GI.lucchetto(size || 40); };

  /* corona = corolla: un fiore pieno a cinque petali */
  GI.corona = function (size) { return svg(size, fiore('#f5b800', '#fffcf4'), 'Corolla'); };
  GI.lucchetto = function (size) {
    return svg(size, '<path d="M10 14V10a6 6 0 0 1 12 0v4"/><rect x="6.5" y="14" width="19" height="14" rx="3" fill="#cbbf9f"/><circle cx="16" cy="20.5" r="2" fill="' + C + '" stroke="none"/>', 'Bloccato');
  };
  GI.stella = function (size) {
    return svg(size, '<path d="M16 3.5l3.7 8 8.8 1-6.5 6 1.8 8.7L16 23l-7.8 4.2L10 18.5 3.5 12.5l8.8-1z" fill="#f5b800"/>', 'Stella');
  };
  /* medaglia: rosetta (disco con petali di nastro) */
  GI.medaglia = function (size, colore) {
    var cols = { bronzo: '#d9692b', argento: '#cbbf9f', oro: '#f5b800', blu: '#8fa9d6', verde: '#7fcf9f', viola: '#b99ad9', rosso: '#e08a78' };
    var c = cols[colore] || (/^#/.test(colore || '') ? colore : cols.oro);
    return svg(size, '<path d="M10 3h6l3 12h-6zM22 3h-6l-3 12h6z" fill="#3a5a8c"/><circle cx="16" cy="20" r="9" fill="' + c + '"/><circle cx="16" cy="20" r="5.2" stroke-width="1.4"/><path d="M16 16.4l1.2 2.5 2.7.3-2 1.8.6 2.7-2.5-1.4-2.5 1.4.6-2.7-2-1.8 2.7-.3z" fill="#fffcf4" stroke="none"/>', 'Medaglia ' + (colore || 'oro'));
  };

  window.GI = GI;
})();
