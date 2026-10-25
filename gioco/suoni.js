/* Ginestra gioco - suoni da file (sounds/*.MP3). Rispetta SOUND_ON di index.html.
 * SND.play('corretta' | 'sbagliata' | 'congratulazioni' | 'riprova' | 'click')
 * Ridefinisce sfx(ok) del motore: risposta giusta/sbagliata. */
(function () {
  if (window.SND) return;
  var FILE = {
    corretta: 'sounds/risposta_corretta.MP3',
    sbagliata: 'sounds/risposta_sbagliata.MP3',
    congratulazioni: 'sounds/congratulazioni.MP3',
    riprova: 'sounds/riprova.MP3',
    click: 'sounds/click.MP3'
  };
  var base = {}, lunghi = { congratulazioni: 1, riprova: 1 }, attivo = null;

  Object.keys(FILE).forEach(function (k) {
    try { var a = new Audio(FILE[k]); a.preload = 'auto'; base[k] = a; } catch (e) {}
  });

  function play(nome) {
    if (typeof SOUND_ON !== 'undefined' && !SOUND_ON) return;
    var a = base[nome]; if (!a) return;
    try {
      /* i brevi possono sovrapporsi (cloni), i lunghi sono esclusivi e fermano il precedente */
      if (lunghi[nome]) {
        if (attivo && attivo !== a) { attivo.pause(); attivo.currentTime = 0; }
        attivo = a; a.currentTime = 0; a.play().catch(function () {});
      } else {
        var c = a.cloneNode(); c.play().catch(function () {});
      }
    } catch (e) {}
  }

  window.SND = { play: play };
  window.sfx = function (ok) { play(ok ? 'corretta' : 'sbagliata'); };
})();
