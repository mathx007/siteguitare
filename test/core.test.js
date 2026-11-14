const test = require('node:test');
const assert = require('node:assert');
const C = require('../js/core.js');
const D = require('../js/data.js');

const A = 9; // La

test('penta mineure de La : position 1 = cases 5 à 8', () => {
  const notes = C.fretboardNotes(A, 'pentaMin').filter((n) => n.pos.includes(0) && n.f >= 5 && n.f <= 8);
  const got = notes.map((n) => n.s + ':' + n.f).sort().join(' ');
  assert.strictEqual(got, '0:5 0:8 1:5 1:7 2:5 2:7 3:5 3:7 4:5 4:8 5:5 5:8');
});

test('penta : chaque note du manche appartient à 1 ou 2 positions, et toutes sont dans la gamme', () => {
  for (let root = 0; root < 12; root++) {
    for (const key of ['pentaMin', 'pentaMaj']) {
      for (const n of C.fretboardNotes(root, key)) {
        assert.ok(C.SCALES[key].iv.includes(C.mod(n.midi - root, 12)));
        assert.ok(n.pos.length <= 2, `${key} ${root} ${n.s}:${n.f} -> ${n.pos}`);
      }
    }
  }
});

test('penta de La : les notes entre les cases 5 et 17 sont toutes couvertes par une position', () => {
  const orphans = C.fretboardNotes(A, 'pentaMin').filter((n) => n.f >= 5 && n.f <= 17 && n.pos.length === 0);
  assert.deepStrictEqual(orphans, []);
});

test('penta majeure de Do = mêmes dessins que la penta mineure de La', () => {
  const a = C.fretboardNotes(A, 'pentaMin').map((n) => `${n.s}:${n.f}:${n.pos}`).join('|');
  const c = C.fretboardNotes(0, 'pentaMaj').map((n) => `${n.s}:${n.f}:${n.pos}`).join('|');
  assert.strictEqual(a, c);
});

test('gammes à 6 et 7 notes : chaque zone contient toutes les notes de la gamme', () => {
  for (let root = 0; root < 12; root++) {
    for (const key of ['blues', 'minNat', 'major', 'dorian', 'harmMin']) {
      const notes = C.fretboardNotes(root, key);
      for (let p = 0; p < 5; p++) {
        const pcs = new Set(notes.filter((n) => n.pos.includes(p)).map((n) => C.mod(n.midi - root, 12)));
        assert.strictEqual(pcs.size, C.SCALES[key].iv.length, `${key} tonique ${root} zone ${p + 1}`);
      }
    }
  }
});

test('séquence de contrôle : montée puis descente, sans répétition immédiate', () => {
  const seq = C.sequenceForPosition(A, 'pentaMin', 0);
  assert.strictEqual(seq.length, 23); // 12 notes en montée, 11 en descente
  assert.strictEqual(seq[0].midi, 45); // La grave, corde 6 case 5
  assert.strictEqual(seq[11].midi, 72); // Do aigu, corde 1 case 8
  assert.strictEqual(seq[22].midi, 45);
  for (let i = 1; i < seq.length; i++) assert.notStrictEqual(seq[i].midi % 12, seq[i - 1].midi % 12);
  for (let root = 0; root < 12; root++) for (let p = 0; p < 5; p++) {
    assert.ok(C.sequenceForPosition(root, 'pentaMin', p).length >= 20, `tonique ${root} position ${p + 1}`);
  }
});

test('semaine ISO et jours de la semaine', () => {
  assert.strictEqual(C.isoWeek('2026-11-13'), '2026-W46');
  assert.strictEqual(C.isoWeek('2027-01-01'), '2026-W53');
  assert.deepStrictEqual(C.weekDays('2026-11-13'), ['2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15']);
  assert.strictEqual(C.addDays('2026-10-25', 1), '2026-10-26'); // changement d'heure
  assert.strictEqual(C.addDays('2026-03-29', 1), '2026-03-30');
});

test('série : jour en cours non validé, pause hebdomadaire, rupture', () => {
  const ok = { ok: true };
  assert.strictEqual(C.computeStreak({}, '2026-11-13').streak, 0);
  // 3 jours d'affilée, aujourd'hui pas encore fait
  let days = { '2026-11-10': ok, '2026-11-11': ok, '2026-11-12': ok };
  assert.strictEqual(C.computeStreak(days, '2026-11-13').streak, 3);
  // aujourd'hui fait
  days['2026-11-13'] = ok;
  assert.strictEqual(C.computeStreak(days, '2026-11-13').streak, 4);
  // un jour manqué dans la semaine : pardonné
  days = { '2026-11-09': ok, '2026-11-10': ok, '2026-11-12': ok, '2026-11-13': ok };
  let r = C.computeStreak(days, '2026-11-13');
  assert.strictEqual(r.streak, 4);
  assert.strictEqual(r.jokerUsed, true);
  // deux jours manqués la même semaine : série cassée au deuxième
  days = { '2026-11-09': ok, '2026-11-12': ok, '2026-11-13': ok };
  assert.strictEqual(C.computeStreak(days, '2026-11-13').streak, 2);
  // premier jour de jeu : aucune pause consommée
  r = C.computeStreak({ '2026-11-13': ok }, '2026-11-13');
  assert.deepStrictEqual([r.streak, r.jokerUsed, r.pausedDays.length], [1, false, 0]);
  // hier manqué, aujourd'hui pas encore joué : la série tient grâce à la pause
  r = C.computeStreak({ '2026-11-10': ok, '2026-11-11': ok }, '2026-11-13');
  assert.deepStrictEqual([r.streak, r.jokerUsed], [2, true]);
  // une pause par semaine sur deux semaines
  days = {};
  for (const k of ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-06', '2026-11-07', '2026-11-08', '2026-11-09', '2026-11-10', '2026-11-12', '2026-11-13']) days[k] = ok;
  assert.strictEqual(C.computeStreak(days, '2026-11-13').streak, 10);
});

test('niveaux et rangs', () => {
  assert.deepStrictEqual(C.levelInfo(0), { level: 1, into: 0, need: 200 });
  assert.deepStrictEqual(C.levelInfo(199), { level: 1, into: 199, need: 200 });
  assert.deepStrictEqual(C.levelInfo(200), { level: 2, into: 0, need: 250 });
  assert.strictEqual(C.levelInfo(450).level, 3);
  assert.strictEqual(C.levelInfo(-5).level, 1);
  assert.strictEqual(C.rankFor(1), 'Gratteur de salon');
  assert.strictEqual(C.rankFor(12), 'Shredder du dimanche');
});

test('PV du boss : premier boss', () => {
  const base = { first: true, paliersDone: 0, paliersTotal: 32, miniOwned: 0, steps: 0, passes: 0, owned: false };
  assert.strictEqual(C.bossHp(base), 100);
  assert.strictEqual(C.bossHp({ ...base, paliersDone: 16, miniOwned: 1 }), 65);
  // tout fait sauf le dernier passage : il reste 1 PV, jamais 0 avant la carte
  assert.strictEqual(C.bossHp({ ...base, paliersDone: 32, miniOwned: 4, steps: 3, passes: 2 }), 1);
  assert.strictEqual(C.bossHp({ ...base, owned: true }), 0);
  assert.strictEqual(C.bossHp({ ...base, paliersTotal: 0 }), 100);
});

test('PV du boss : boss suivants', () => {
  const b = { first: false, steps: 0, passes: 0, owned: false };
  assert.strictEqual(C.bossHp(b), 100);
  assert.strictEqual(C.bossHp({ ...b, steps: 3 }), 40);
  assert.strictEqual(C.bossHp({ ...b, steps: 3, passes: 2 }), 1);
  assert.strictEqual(C.bossHp({ ...b, steps: 3, passes: 3, owned: true }), 0);
});

test('passages à 100 % : 2 par jour, 3 pour acquérir', () => {
  const t = '2026-11-14';
  assert.deepStrictEqual(C.passesInfo(undefined, t), { n: 0, today: 0, owned: false, canPass: true });
  assert.deepStrictEqual(C.passesInfo([t], t), { n: 1, today: 1, owned: false, canPass: true });
  assert.deepStrictEqual(C.passesInfo([t, t], t), { n: 2, today: 2, owned: false, canPass: false });
  assert.deepStrictEqual(C.passesInfo(['2026-11-13', t], t), { n: 2, today: 1, owned: false, canPass: true });
  assert.deepStrictEqual(C.passesInfo(['2026-11-13', '2026-11-13', t], t), { n: 3, today: 1, owned: true, canPass: false });
});

test('jours validés par semaine', () => {
  const ok = { ok: true };
  assert.strictEqual(C.maxWeekOk({}), 0);
  assert.strictEqual(C.maxWeekOk({ '2026-11-09': ok, '2026-11-10': ok, '2026-11-16': ok, '2026-11-11': { ok: false } }), 2);
});

test('contenu : identifiants uniques et cohérents', () => {
  const ids = D.SONGS.map((s) => s.id);
  assert.strictEqual(new Set(ids).size, ids.length);
  assert.ok(ids.includes(D.FIRST_BOSS));
  for (const m of D.MINI_BOSSES) assert.ok(ids.includes(m), m);
  for (const s of D.SONGS) { assert.ok(D.RARITY[s.r], s.id); assert.strictEqual(s.art.length, 3, s.id); }
  const pal = Object.values(D.PALIERS).flat().map((p) => p.id);
  assert.strictEqual(new Set(pal).size, pal.length);
  for (const id of D.EXO_ROTATION) assert.ok(D.EXOS[id], id);
  const f = { fullDays: 0, miniOwned: 0, maxWeekOk: 0, bestStreak: 0, pentaPaliers: 0, ponts: 0, tremMax: 0, earBest: 0, earSongs: 0, micClean: 0, cards: 0, defeated: 0 };
  for (const t of D.TROPHIES) { const [v, g] = t.p(f); assert.strictEqual(v, 0, t.id); assert.ok(g > 0, t.id); }
});

function guitarTone(freq, sr, n, phase = 0.3) {
  const buf = new Float32Array(n);
  const amps = [1, 0.7, 0.5, 0.35, 0.2, 0.12];
  for (let i = 0; i < n; i++) {
    let v = 0;
    for (let h = 0; h < amps.length; h++) v += amps[h] * Math.sin(2 * Math.PI * freq * (h + 1) * i / sr + phase * h);
    buf[i] = 0.15 * v * Math.exp(-i / (sr * 0.8));
  }
  return buf;
}

test('détection de hauteur : toutes les notes de Mi grave à la case 17 du Mi aigu, à moins de 10 cents', () => {
  for (const sr of [44100, 48000]) {
    for (let midi = 40; midi <= 81; midi++) {
      const f = C.midiToFreq(midi);
      const r = C.detectPitch(guitarTone(f, sr, 4096), sr);
      assert.ok(r, `rien détecté pour ${midi} à ${sr}`);
      const cents = 100 * (C.freqToMidi(r.freq) - midi);
      assert.ok(Math.abs(cents) < 10, `midi ${midi} à ${sr} Hz : ${cents.toFixed(1)} cents`);
    }
  }
});

test('détection de hauteur : fondamentale faible (harmonique 2 dominante) et note désaccordée', () => {
  const sr = 48000, n = 4096, f = C.midiToFreq(45);
  const buf = new Float32Array(n);
  for (let i = 0; i < n; i++) buf[i] = 0.05 * Math.sin(2 * Math.PI * f * i / sr) + 0.2 * Math.sin(2 * Math.PI * 2 * f * i / sr) + 0.1 * Math.sin(2 * Math.PI * 3 * f * i / sr);
  const r = C.detectPitch(buf, sr);
  assert.strictEqual(Math.round(C.freqToMidi(r.freq)), 45);
  const sharp = C.detectPitch(guitarTone(C.midiToFreq(57.3), sr, n), sr);
  assert.ok(Math.abs(C.freqToMidi(sharp.freq) - 57.3) < 0.05);
});

test('détection de hauteur : silence et bruit ne donnent rien', () => {
  assert.strictEqual(C.detectPitch(new Float32Array(4096), 48000), null);
  const rnd = C.seeded(42); const noise = new Float32Array(4096);
  for (let i = 0; i < noise.length; i++) noise[i] = (rnd() - 0.5) * 0.4;
  assert.strictEqual(C.detectPitch(noise, 48000), null);
});

test('suivi de notes : stabilité, changement, répétition après silence', () => {
  const t = new C.NoteTracker(3, 4);
  const out = [];
  const feed = (arr) => arr.forEach((v) => { const r = t.feed(v); if (r != null) out.push(r); });
  feed([57.1, 56.9, 57.0, 57.0, 57.2]); // une seule émission
  feed([60.4, 59.8]); // instable : rien
  feed([60, 60.1, 59.9]); // nouvelle note
  feed([null, null]); // silence court : la note reste « en cours »
  feed([60, 60, 60]);
  feed([null, null, null, null]); // vrai silence
  feed([60, 60, 60]); // rejouée : nouvelle émission
  assert.deepStrictEqual(out, [57, 60, 60]);
});

test('générateur déterministe', () => {
  const a = C.seeded(7), b = C.seeded(7);
  assert.strictEqual(a(), b());
  const v = C.seeded(1)();
  assert.ok(v >= 0 && v < 1);
});
