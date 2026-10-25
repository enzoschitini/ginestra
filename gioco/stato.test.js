'use strict';
var assert = require('assert');
var GS = require('./stato.js');
var t0 = new Date(2026, 9, 21, 10, 0, 0).getTime(); // mer 21 ott 2026, locale
var clock = t0;
GS.setNow(function () { return clock; });
function giorno(n) { clock = t0 + n * 86400000; }
var passati = 0;
function test(nome, fn) { GS.reset(); clock = t0; fn(); passati++; console.log('ok  ' + nome); }

test('oggi locale', function () { assert.strictEqual(GS.oggi(), '2026-10-21'); });

test('XP base, combo, perfetta', function () {
  var r = GS.registraLezione({ ex: 1, giuste: 8, totali: 10, combo: 3 });
  assert.strictEqual(r.xpBase, 10); assert.strictEqual(r.xpCombo, 0); assert.strictEqual(r.xpPerfetta, 0);
  assert.strictEqual(r.gemme, 5);
  r = GS.registraLezione({ ex: 1, giuste: 10, totali: 10, combo: 10 });
  assert.strictEqual(r.xpCombo, 5); assert.strictEqual(r.xpPerfetta, 5); assert.strictEqual(r.gemme, 10 + 15);
  assert.ok(r.obiettivoRaggiunto);
  assert.strictEqual(GS.state.xp, 10 + 20); assert.strictEqual(GS.state.xpOggi, 30);
  r = GS.registraLezione({ ex: 1, giuste: 10, totali: 10, combo: 10 });
  assert.ok(!r.obiettivoRaggiunto);
});

test('streak: primo giorno, giorno dopo, stesso giorno', function () {
  var r = GS.registraLezione({ ex: 1, giuste: 5, totali: 5, combo: 5 });
  assert.ok(r.streakAumentata); assert.strictEqual(r.streakDopo, 1);
  r = GS.registraLezione({ ex: 1, giuste: 5, totali: 5, combo: 5 });
  assert.ok(!r.streakAumentata); assert.strictEqual(GS.state.streak, 1);
  giorno(1);
  r = GS.registraLezione({ ex: 1, giuste: 5, totali: 5, combo: 5 });
  assert.strictEqual(r.streakPrima, 1); assert.strictEqual(r.streakDopo, 2);
  assert.strictEqual(GS.state.xpOggi, 20); // reset a cambio giorno
});

test('streak spezzata', function () {
  GS.registraLezione({ ex: 1, giuste: 5, totali: 5, combo: 0 });
  giorno(1); GS.registraLezione({ ex: 1, giuste: 5, totali: 5, combo: 0 });
  assert.strictEqual(GS.state.streak, 2);
  giorno(3); assert.strictEqual(GS.streakGiorni(7).length, 7);
  assert.strictEqual(GS.state.streak, 0); assert.strictEqual(GS.state.streakMax, 2);
  var r = GS.registraLezione({ ex: 1, giuste: 5, totali: 5, combo: 0 });
  assert.strictEqual(r.streakDopo, 1); assert.ok(r.streakAumentata);
});

test('streak: congelamento copre un giorno saltato', function () {
  GS.registraLezione({ ex: 1, giuste: 5, totali: 5, combo: 0 });
  GS.state.congelamenti = 1;
  giorno(2);
  var r = GS.registraLezione({ ex: 1, giuste: 5, totali: 5, combo: 0 });
  assert.strictEqual(r.streakDopo, 2); assert.strictEqual(GS.state.congelamenti, 0);
});

test('cuori: perdita, rigenerazione, ricarica', function () {
  assert.strictEqual(GS.cuori(), 5); assert.strictEqual(GS.prossimoCuoreTra(), 0);
  assert.strictEqual(GS.perdiCuore(), 4);
  assert.strictEqual(GS.prossimoCuoreTra(), 30 * 60000);
  clock += 10 * 60000; assert.strictEqual(GS.prossimoCuoreTra(), 20 * 60000);
  GS.perdiCuore(); GS.perdiCuore();
  assert.strictEqual(GS.cuori(), 2);
  clock += 20 * 60000; assert.strictEqual(GS.cuori(), 3);
  clock += 60 * 60000; assert.strictEqual(GS.cuori(), 5);
  for (var i = 0; i < 7; i++) GS.perdiCuore();
  assert.strictEqual(GS.cuori(), 0);
  assert.strictEqual(GS.ricaricaCuori(), false);
  GS.addGemme(120);
  assert.strictEqual(GS.ricaricaCuori(), true);
  assert.strictEqual(GS.cuori(), 5); assert.strictEqual(GS.state.gemme, 20);
});

test('corone: 4 con >=80%, la quinta solo perfetta', function () {
  var r, i;
  r = GS.registraLezione({ ex: 7, giuste: 7, totali: 10, combo: 2 });
  assert.ok(!r.coronaSalita); assert.strictEqual(GS.state.corone[7] || 0, 0);
  for (i = 0; i < 4; i++) { r = GS.registraLezione({ ex: 7, giuste: 8, totali: 10, combo: 2 }); assert.ok(r.coronaSalita); }
  assert.strictEqual(GS.state.corone[7], 4);
  r = GS.registraLezione({ ex: 7, giuste: 9, totali: 10, combo: 2 }); assert.ok(!r.coronaSalita);
  r = GS.registraLezione({ ex: 7, giuste: 10, totali: 10, combo: 10 }); assert.ok(r.coronaSalita);
  assert.strictEqual(GS.state.corone[7], 5);
  r = GS.registraLezione({ ex: 7, giuste: 10, totali: 10, combo: 10 }); assert.ok(!r.coronaSalita);
  assert.strictEqual(GS.state.lezioni[7], 8);
});

test('calendario: streakGiorni e mese', function () {
  GS.registraLezione({ ex: 1, giuste: 5, totali: 5, combo: 0 });
  var g = GS.streakGiorni(7);
  assert.strictEqual(g.length, 7); assert.ok(g[6].oggi && g[6].attivo); assert.ok(!g[5].attivo);
  assert.strictEqual(g[6].lettera, 'M'); // mercoledi
  var m = GS.mese(2026, 9); // ottobre 2026 inizia di giovedi
  assert.strictEqual(m.length % 7, 0);
  assert.strictEqual(m[0], null); assert.strictEqual(m[3].giorno, 1);
  var c = m.filter(function (x) { return x; });
  assert.strictEqual(c.length, 31);
  assert.ok(c[20].oggi && c[20].attivo && c[20].xp === 15); assert.ok(c[21].futuro); assert.ok(!c[19].futuro);
});

test('lega simulata deterministica e promozione', function () {
  var a = GS.lega(), b = GS.lega();
  assert.deepStrictEqual(a, b);
  assert.strictEqual(a.righe.length, 21); assert.strictEqual(a.nome, 'Bronzo'); assert.ok(a.simulata);
  assert.strictEqual(a.righe.filter(function (r) { return r.tu; }).length, 1);
  var xp1 = GS.lega().righe.reduce(function (s, r) { return s + r.xp; }, 0);
  giorno(3);
  var xp2 = GS.lega().righe.reduce(function (s, r) { return s + r.xp; }, 0);
  assert.ok(xp2 > xp1);
  // lunedi 2026-10-19 e' la settimana corrente; molti XP -> primo, promozione al lunedi dopo
  clock = t0;
  GS.addXP(5000, 'test'); assert.strictEqual(GS.lega().posizione, 1);
  clock = new Date(2026, 9, 26, 9, 0, 0).getTime(); // lunedi successivo
  var r = GS.registraLezione({ ex: 1, giuste: 5, totali: 5, combo: 0 });
  assert.strictEqual(r.legaPromossa, true); assert.strictEqual(GS.state.lega, 1);
  assert.strictEqual(GS.state.xpSettimana, 15);
  r = GS.registraLezione({ ex: 1, giuste: 5, totali: 5, combo: 0 });
  assert.strictEqual(r.legaPromossa, null);
});

test('traguardi a livelli', function () {
  assert.ok(GS.TRAGUARDI.length >= 10);
  var r = GS.registraLezione({ ex: 1, giuste: 5, totali: 5, combo: 5 });
  var ids = r.nuoviTraguardi.map(function (x) { return x.id; });
  assert.ok(ids.indexOf('studioso') >= 0 && ids.indexOf('perfezionista') >= 0);
  r = GS.registraLezione({ ex: 1, giuste: 5, totali: 5, combo: 5 });
  assert.ok(r.nuoviTraguardi.every(function (x) { return x.id !== 'studioso'; }));
  assert.strictEqual(GS.state.traguardi.studioso, 1);
});

test('persistenza con localStorage che lancia: fallback in memoria', function () {
  GS.addXP(5); GS.save(); assert.strictEqual(GS.state.xp, 5);
});

console.log('\n' + passati + ' test passati');
