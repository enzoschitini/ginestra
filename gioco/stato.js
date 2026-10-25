/* Ginestra - motore di stato di gioco (window.GS). Chiave localStorage: "ginestra-gioco".
 *
 * API (vedi gioco/SPEC.md):
 *  GS.state                        stato (oggetto; dopo reset() e' un nuovo oggetto: rileggere GS.state)
 *     campi SPEC + extra: ultimoGiorno, perfette, gemmeTotali, xpLega, legaEsito
 *     lega = indice 0..5 (Bronzo..Ametista)
 *  GS.save() / GS.reset()
 *  GS.on(ev, fn) / GS.emit(ev, dati)  eventi: xp, cuori, gemme, streak, lezione, traguardo, lega
 *  GS.oggi()                       'YYYY-MM-DD' locale
 *  GS.addXP(n, motivo) / GS.addGemme(n)
 *  GS.cuori() / GS.perdiCuore() / GS.ricaricaCuori(costo=100) -> bool / GS.prossimoCuoreTra() -> ms
 *  GS.registraLezione({ex, giuste, totali, combo}) -> {xpBase, xpCombo, xpPerfetta, gemme, streakAumentata,
 *        streakPrima, streakDopo, obiettivoRaggiunto, coronaSalita, nuoviTraguardi, legaPromossa(true|false|null)}
 *        combo = massimo di risposte giuste consecutive nella lezione
 *  GS.streakGiorni(n=7) -> [{data, attivo, oggi, lettera}]  (lettere italiane D L M M G V S)
 *  GS.mese(anno, mese0) -> griglia con settimana da lunedi'; null di padding iniziale e finale
 *  GS.setObiettivo(xp)             10/20/30/50
 *  GS.TRAGUARDI, GS.LEGHE, GS.TARGET
 *  GS.lega() -> lega personale (nessun avversario): {nome, indice, prossima, target, retro, xp, pct, mancanti, giorniRimasti,
 *        perGiorno, giorni[7], storia[8 settimane], settimanaScorsa, media4, record, batteScorsa, simulata:false}
 *        a fine settimana: xp >= target sale, xp < 35% del target scende (solo se hai studiato)
 *  GS.setNow(fnOrMs)               solo per test (orologio finto); setNow() ripristina
 */
(function (root) {
  'use strict';
  var KEY = 'ginestra-gioco';
  var MAXC = 5, REGEN = 30 * 60 * 1000, DAY = 86400000;
  var LEGHE = ['Bronzo', 'Argento', 'Oro', 'Zaffiro', 'Rubino', 'Ametista'];
  var TARGET = [60, 120, 200, 300, 420, 560]; // XP settimanali per salire dalla lega i -> i+1
  var RETRO = 0.35;                           // sotto il 35% dell'obiettivo si scende
  var LETTERE = ['D', 'L', 'M', 'M', 'G', 'V', 'S'];

  var nowFn = null, store = null, mem = null, S = null, ls = {};
  function now() { return nowFn ? nowFn() : Date.now(); }
  function p2(n) { return (n < 10 ? '0' : '') + n; }
  function fmt(d) { return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); }
  function parse(s) { var a = s.split('-'); return new Date(+a[0], +a[1] - 1, +a[2]); }
  function diffGiorni(a, b) { // b - a in giorni
    var x = parse(a), y = parse(b);
    return Math.round((Date.UTC(y.getFullYear(), y.getMonth(), y.getDate()) - Date.UTC(x.getFullYear(), x.getMonth(), x.getDate())) / DAY);
  }
  function addGiorni(s, n) { var d = parse(s); d.setDate(d.getDate() + n); return fmt(d); }
  function lunedi(s) { var d = parse(s); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return fmt(d); }
  function oggi() { return fmt(new Date(now())); }

  function storage() {
    if (store !== null) return store;
    try { store = root.localStorage || false; if (store) { store.getItem(KEY); } } catch (e) { store = false; }
    return store;
  }
  function defaults() {
    return { xp: 0, xpOggi: 0, giorno: '', gemme: 0, cuori: MAXC, cuoriTs: 0, streak: 0, streakMax: 0, giorni: {},
      obiettivoXp: 20, corone: {}, lezioni: {}, traguardi: {}, lega: 0, xpSettimana: 0, settimana: '', congelamenti: 0,
      ultimoGiorno: '', scrigni: {}, perfette: 0, gemmeTotali: 0, xpLega: 0, legaEsito: null, storia: [], record: 0 };
  }
  function carica() {
    var s = defaults(), raw = null, k;
    try { var st = storage(); raw = st ? st.getItem(KEY) : mem; } catch (e) { raw = mem; }
    if (raw) { try { var o = JSON.parse(raw); for (k in o) { if (o.hasOwnProperty(k)) s[k] = o[k]; } } catch (e2) {} }
    return s;
  }
  function save() {
    var j = JSON.stringify(S); mem = j;
    try { var st = storage(); if (st) st.setItem(KEY, j); } catch (e) {}
  }

  var GS = {};
  GS.LEGHE = LEGHE;
  GS.on = function (ev, fn) { (ls[ev] = ls[ev] || []).push(fn); };
  GS.emit = function (ev, dati) {
    var a = (ls[ev] || []).slice(), i;
    for (i = 0; i < a.length; i++) { try { a[i](dati); } catch (e) {} }
  };

  // ---- lega personale: sfidi le tue settimane passate ----
  function addData(d, n) { var x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; }

  // ---- cambio giorno / settimana ----
  function ensure() {
    var o = oggi(), wk = lunedi(o), tgt, missed;
    if (S.giorno !== o) { S.giorno = o; S.xpOggi = S.giorni[o] || 0; }
    if (S.ultimoGiorno && S.streak > 0) {
      missed = diffGiorni(S.ultimoGiorno, o) - 1;
      if (missed > 0 && missed > S.congelamenti) { S.streak = 0; GS.emit('streak', S.streak); }
    }
    if (S.settimana !== wk) {
      if (S.settimana && S.xpSettimana > 0) {
        tgt = TARGET[S.lega];
        S.storia = (S.storia || []).concat([{ wk: S.settimana, xp: S.xpSettimana, target: tgt, lega: S.lega }]).slice(-12);
        if (S.xpSettimana > (S.record || 0)) S.record = S.xpSettimana;
        if (S.xpSettimana >= tgt && S.lega < LEGHE.length - 1) { S.lega++; S.legaEsito = true; }
        else if (S.xpSettimana < tgt * RETRO && S.lega > 0) { S.lega--; S.legaEsito = false; }
        GS.emit('lega', { xp: S.xpSettimana, target: tgt, esito: S.legaEsito });
      }
      S.settimana = wk; S.xpSettimana = 0;
    }
  }
  function rigenera() {
    var n;
    if (S.cuori >= MAXC) { S.cuori = MAXC; S.cuoriTs = 0; return; }
    n = Math.floor((now() - S.cuoriTs) / REGEN);
    if (n > 0) {
      S.cuori = Math.min(MAXC, S.cuori + n);
      S.cuoriTs = S.cuori >= MAXC ? 0 : S.cuoriTs + n * REGEN;
    }
  }

  // ---- API base ----
  GS.save = save;
  GS.oggi = oggi;
  GS.setNow = function (f) { nowFn = f == null ? null : (typeof f === 'function' ? f : function () { return f; }); };
  GS.reset = function () { S = defaults(); GS.state = S; ensure(); save(); GS.emit('xp', 0); };
  GS.setObiettivo = function (n) { ensure(); S.obiettivoXp = n; save(); };

  GS.addXP = function (n, motivo) {
    ensure();
    n = Math.max(0, Math.floor(n) || 0);
    S.xp += n; S.xpOggi += n; S.xpSettimana += n; S.xpLega += n;
    S.giorni[S.giorno] = (S.giorni[S.giorno] || 0) + n;
    save(); GS.emit('xp', { n: n, motivo: motivo || '', xp: S.xp });
  };
  GS.addGemme = function (n) {
    n = Math.floor(n) || 0;
    S.gemme = Math.max(0, S.gemme + n);
    if (n > 0) S.gemmeTotali += n;
    save(); GS.emit('gemme', S.gemme);
  };

  GS.cuori = function () { ensure(); rigenera(); return S.cuori; };
  GS.perdiCuore = function () {
    ensure(); rigenera();
    if (S.cuori > 0) {
      if (S.cuori >= MAXC) S.cuoriTs = now();
      S.cuori--;
    }
    save(); GS.emit('cuori', S.cuori); return S.cuori;
  };
  GS.ricaricaCuori = function (costo) {
    costo = costo == null ? 100 : costo;
    ensure(); rigenera();
    if (S.cuori >= MAXC || S.gemme < costo) return false;
    S.gemme -= costo; S.cuori = MAXC; S.cuoriTs = 0;
    save(); GS.emit('gemme', S.gemme); GS.emit('cuori', S.cuori); return true;
  };
  GS.prossimoCuoreTra = function () {
    ensure(); rigenera();
    if (S.cuori >= MAXC) return 0;
    return Math.max(0, S.cuoriTs + REGEN - now());
  };

  // ---- traguardi ----
  function somma(o) { var k, t = 0; for (k in o) if (o.hasOwnProperty(k)) t += o[k]; return t; }
  GS.TRAGUARDI = [
    { id: 'fiamma', nome: 'Fiamma viva', descr: 'Giorni di streak consecutivi', icona: 'fiamma', livelli: [3, 7, 14, 30, 100], valore: function (s) { return Math.max(s.streak, s.streakMax); } },
    { id: 'saggio', nome: 'Saggio', descr: 'XP totali guadagnati', icona: 'fulmine', livelli: [100, 500, 1500, 5000, 15000], valore: function (s) { return s.xp; } },
    { id: 'studioso', nome: 'Studioso', descr: 'Lezioni completate', icona: 'spunta', livelli: [1, 10, 30, 100, 300], valore: function (s) { return somma(s.lezioni); } },
    { id: 'perfezionista', nome: 'Perfezionista', descr: 'Lezioni senza errori', icona: 'bersaglio', livelli: [1, 5, 20, 50, 150], valore: function (s) { return s.perfette; } },
    { id: 'collezionista', nome: 'Collezionista', descr: 'Gemme raccolte', icona: 'gemma', livelli: [50, 250, 1000, 3000, 10000], valore: function (s) { return s.gemmeTotali; } },
    { id: 'sfidante', nome: 'Sfidante', descr: 'XP guadagnati in lega', icona: 'trofeo', livelli: [50, 300, 1000, 3000, 10000], valore: function (s) { return s.xpLega; } },
    { id: 'coronato', nome: 'Coronato', descr: 'Corone ottenute negli esercizi', icona: 'corona', livelli: [1, 5, 15, 30, 60], valore: function (s) { return somma(s.corone); } },
    { id: 'costante', nome: 'Costante', descr: 'Giorni in cui hai studiato', icona: 'timer', livelli: [3, 10, 30, 60, 150], valore: function (s) { var k, t = 0; for (k in s.giorni) if (s.giorni.hasOwnProperty(k) && s.giorni[k] > 0) t++; return t; } },
    { id: 'scalatore', nome: 'Scalatore', descr: 'Lega raggiunta (1 = Argento)', icona: 'trofeo', livelli: [1, 2, 3, 4, 5], valore: function (s) { return s.lega; } },
    { id: 'maratoneta', nome: 'Maratoneta', descr: 'XP in un solo giorno', icona: 'fulmine', livelli: [30, 60, 100, 200, 400], valore: function (s) { var k, m = 0; for (k in s.giorni) if (s.giorni.hasOwnProperty(k) && s.giorni[k] > m) m = s.giorni[k]; return m; } }
  ];
  function livelloDi(t, v) { var i, l = 0; for (i = 0; i < t.livelli.length; i++) if (v >= t.livelli[i]) l = i + 1; return l; }
  function controllaTraguardi() {
    var out = [], i, t, l;
    for (i = 0; i < GS.TRAGUARDI.length; i++) {
      t = GS.TRAGUARDI[i]; l = livelloDi(t, t.valore(S));
      if (l > (S.traguardi[t.id] || 0)) { S.traguardi[t.id] = l; out.push({ id: t.id, nome: t.nome, livello: l }); GS.emit('traguardo', out[out.length - 1]); }
    }
    return out;
  }

  // ---- lezione ----
  GS.registraLezione = function (p) {
    p = p || {};
    ensure();
    var giuste = p.giuste | 0, totali = p.totali | 0, combo = p.combo | 0, ex = String(p.ex);
    var perfetta = totali > 0 && giuste >= totali;
    var xpBase = giuste > 0 ? 10 : 0, xpCombo = combo >= 5 ? 5 : 0, xpPerfetta = perfetta ? 5 : 0;
    var gemme = giuste > 0 ? 5 + (perfetta ? 5 : 0) : 0;
    var prima = S.xpOggi, o = S.giorno, streakPrima = S.streak, aumentata = false, missed, c, corona = false, obiettivo;
    var res;

    if (S.ultimoGiorno !== o) {
      if (!S.ultimoGiorno) S.streak = 1;
      else {
        missed = diffGiorni(S.ultimoGiorno, o) - 1;
        if (missed <= 0) S.streak++;
        else if (missed <= S.congelamenti) { S.congelamenti -= missed; S.streak++; }
        else S.streak = 1;
      }
      S.ultimoGiorno = o; aumentata = true;
      if (S.streak > S.streakMax) S.streakMax = S.streak;
      if (aumentata && S.streak > 0 && S.streak % 7 === 0 && S.congelamenti < 2) S.congelamenti++;
      GS.emit('streak', S.streak);
    }

    GS.addXP(xpBase + xpCombo + xpPerfetta, 'lezione');
    obiettivo = prima < S.obiettivoXp && S.xpOggi >= S.obiettivoXp;
    if (obiettivo) gemme += 15;
    GS.addGemme(gemme);

    S.lezioni[ex] = (S.lezioni[ex] || 0) + 1;
    if (perfetta) S.perfette++;
    c = S.corone[ex] || 0;
    if (totali > 0 && giuste / totali >= 0.8 && c < 5 && (c < 4 || perfetta)) { S.corone[ex] = c + 1; corona = true; }

    res = {
      xpBase: xpBase, xpCombo: xpCombo, xpPerfetta: xpPerfetta, gemme: gemme, streakAumentata: aumentata,
      streakPrima: streakPrima, streakDopo: S.streak, obiettivoRaggiunto: obiettivo, coronaSalita: corona,
      nuoviTraguardi: controllaTraguardi(), legaPromossa: S.legaEsito
    };
    S.legaEsito = null;
    save(); GS.emit('lezione', res);
    return res;
  };

  // ---- calendario ----
  GS.streakGiorni = function (n) {
    ensure(); n = n || 7;
    var out = [], i, d, o = S.giorno;
    for (i = n - 1; i >= 0; i--) {
      d = addGiorni(o, -i);
      out.push({ data: d, attivo: (S.giorni[d] || 0) > 0, oggi: i === 0, lettera: LETTERE[parse(d).getDay()] });
    }
    return out;
  };
  GS.mese = function (anno, mese0) {
    ensure();
    var out = [], primo = new Date(anno, mese0, 1), n = new Date(anno, mese0 + 1, 0).getDate(), i, d, xp, o = S.giorno;
    for (i = 0; i < (primo.getDay() + 6) % 7; i++) out.push(null);
    for (i = 1; i <= n; i++) {
      d = anno + '-' + p2(mese0 + 1) + '-' + p2(i); xp = S.giorni[d] || 0;
      out.push({ data: d, giorno: i, xp: xp, attivo: xp > 0, oggi: d === o, futuro: d > o });
    }
    while (out.length % 7) out.push(null);
    return out;
  };

  // ---- lega ----
  GS.TARGET = TARGET;
  GS.lega = function () {
    ensure();
    var inizio = parse(S.settimana), oggiD = parse(oggi()), i, d, k, w, tgt = TARGET[S.lega], xp = S.xpSettimana;
    var giorni = [], storia = [], mappa = {}, ultime = [], somma = 0, scorsa = 0;
    for (i = 0; i < 7; i++) {
      d = addData(inizio, i); k = fmt(d);
      giorni.push({ data: k, lettera: ['L', 'M', 'M', 'G', 'V', 'S', 'D'][i], xp: S.giorni[k] || 0, oggi: k === oggi(), futuro: d.getTime() > oggiD.getTime() });
    }
    (S.storia || []).forEach(function (r) { mappa[r.wk] = r; });
    for (i = 8; i >= 1; i--) {
      w = fmt(addData(inizio, -7 * i));
      storia.push(mappa[w] || { wk: w, xp: 0, target: null, lega: null });
    }
    scorsa = storia[storia.length - 1].xp;
    ultime = storia.slice(-4).map(function (r) { return r.xp; });
    ultime.forEach(function (x) { somma += x; });
    var rimasti = Math.max(1, Math.round((addData(inizio, 7).getTime() - oggiD.getTime()) / DAY));
    return {
      nome: LEGHE[S.lega], indice: S.lega, prossima: LEGHE[S.lega + 1] || null,
      target: tgt, retro: Math.ceil(tgt * RETRO), xp: xp, pct: Math.min(1, xp / tgt),
      mancanti: Math.max(0, tgt - xp), giorniRimasti: rimasti, perGiorno: Math.ceil(Math.max(0, tgt - xp) / rimasti),
      giorni: giorni, storia: storia, settimanaScorsa: scorsa, media4: Math.round(somma / 4), record: Math.max(S.record || 0, xp),
      batteScorsa: xp > scorsa, simulata: false
    };
  };

  S = carica(); GS.state = S; ensure(); save();
  root.GS = GS;
  if (typeof module !== 'undefined' && module.exports) module.exports = GS;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
