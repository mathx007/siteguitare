/* Gratte Quest : logique pure (aucun accès au DOM), testable sous Node. */
const NOTE_FR = ['Do', 'Do#', 'Ré', 'Ré#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];
const NOTE_EN = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']; // notation anglo-saxonne (blocs de l'Accueil)
const OPEN_MIDI = [40, 45, 50, 55, 59, 64]; // cordes 6 (Mi grave) à 1 (Mi aigu)
const STRING_FR = ['Mi grave', 'La', 'Ré', 'Sol', 'Si', 'Mi aigu'];
const MAXFRET = 17;
const DEG_LABEL = ['T', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7'];

const SCALES = {
  pentaMin: { name: 'Pentatonique mineure', iv: [0, 3, 5, 7, 10], minor: true, penta: true },
  blues: { name: 'Blues (penta + blue note)', iv: [0, 3, 5, 6, 7, 10], minor: true, blues: true },
  pentaMaj: { name: 'Pentatonique majeure', iv: [0, 2, 4, 7, 9], minor: false, penta: true },
  minNat: { name: 'Mineure naturelle', iv: [0, 2, 3, 5, 7, 8, 10], minor: true },
  major: { name: 'Majeure', iv: [0, 2, 4, 5, 7, 9, 11], minor: false },
  dorian: { name: 'Dorien', iv: [0, 2, 3, 5, 7, 9, 10], minor: true },
  harmMin: { name: 'Mineure harmonique', iv: [0, 2, 3, 5, 7, 8, 11], minor: true },
};

/* Les 5 positions de la pentatonique mineure : cases par corde (6 vers 1),
   comptées depuis la tonique sur la corde de Mi grave. */
const BOX = [
  [[0, 3], [0, 2], [0, 2], [0, 2], [0, 3], [0, 3]],
  [[3, 5], [2, 5], [2, 5], [2, 4], [3, 5], [3, 5]],
  [[5, 7], [5, 7], [5, 7], [4, 7], [5, 8], [5, 7]],
  [[7, 10], [7, 10], [7, 9], [7, 9], [8, 10], [7, 10]],
  [[10, 12], [10, 12], [9, 12], [9, 12], [10, 12], [10, 12]],
];

function mod(n, m) { return ((n % m) + m) % m; }
function noteName(midi) { return NOTE_FR[mod(midi, 12)]; }

/* Case de la tonique mineure (ou relative mineure) sur la corde de Mi grave. */
function boxRootFret(rootPc, scaleKey) {
  const sc = SCALES[scaleKey];
  const minorRoot = sc.minor ? rootPc : mod(rootPc + 9, 12);
  return mod(minorRoot - 4, 12);
}

/* Décalages d'octave (-12, 0, +12) pour lesquels la position tient sur le manche. */
function positionShifts(rootPc, scaleKey, p) {
  const r = boxRootFret(rootPc, scaleKey);
  const out = [];
  for (const sh of [-12, 0, 12]) {
    let lo = 99, hi = -99;
    for (let s = 0; s < 6; s++) {
      lo = Math.min(lo, r + BOX[p][s][0] + sh);
      hi = Math.max(hi, r + BOX[p][s][1] + sh);
    }
    if (lo >= 0 && hi <= MAXFRET) out.push(sh);
  }
  return out;
}

/* La case f de la corde s appartient-elle à la position p (pour un décalage donné) ? */
function inPosition(rootPc, scaleKey, p, sh, s, f) {
  const sc = SCALES[scaleKey];
  const r = boxRootFret(rootPc, scaleKey);
  const lo = r + BOX[p][s][0] + sh, hi = r + BOX[p][s][1] + sh;
  if (sc.penta) return f === lo || f === hi;
  if (sc.blues) return f >= lo && f <= hi;
  return f >= lo - 1 && f <= hi; // gammes à 7 notes : zone élargie d'une case
}

/* Toutes les notes de la gamme sur le manche, avec les positions auxquelles elles appartiennent. */
function fretboardNotes(rootPc, scaleKey) {
  const sc = SCALES[scaleKey];
  const notes = [];
  const shifts = [0, 1, 2, 3, 4].map((p) => positionShifts(rootPc, scaleKey, p));
  for (let s = 0; s < 6; s++) {
    for (let f = 0; f <= MAXFRET; f++) {
      const midi = OPEN_MIDI[s] + f;
      const iv = mod(midi - rootPc, 12);
      if (!sc.iv.includes(iv)) continue;
      const pos = [];
      for (let p = 0; p < 5; p++) {
        if (shifts[p].some((sh) => inPosition(rootPc, scaleKey, p, sh, s, f))) pos.push(p);
      }
      notes.push({ s, f, midi, pc: mod(midi, 12), iv, isRoot: iv === 0, pos });
    }
  }
  return notes;
}

/* Suite de notes à jouer pour contrôler une position : montée puis descente. */
function sequenceForPosition(rootPc, scaleKey, p) {
  const sc = SCALES[scaleKey];
  const shifts = positionShifts(rootPc, scaleKey, p);
  if (!shifts.length) return [];
  const sh = shifts[0];
  const seen = new Set();
  const up = [];
  for (let s = 0; s < 6; s++) {
    for (let f = 0; f <= MAXFRET; f++) {
      const midi = OPEN_MIDI[s] + f;
      if (!sc.iv.includes(mod(midi - rootPc, 12))) continue;
      if (!inPosition(rootPc, scaleKey, p, sh, s, f)) continue;
      if (seen.has(midi)) continue;
      seen.add(midi);
      up.push({ midi, s, f });
    }
  }
  up.sort((a, b) => a.midi - b.midi);
  return up.concat(up.slice(0, -1).reverse());
}

/* ---------- Dates, série, niveaux ---------- */
function pad2(n) { return (n < 10 ? '0' : '') + n; }
function dayKey(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
function parseDay(k) { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d, 12); }
function addDays(k, n) { const d = parseDay(k); d.setDate(d.getDate() + n); return dayKey(d); }
function dayNumber(k) { const d = parseDay(k); return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000); }
function isoWeek(k) {
  const d = parseDay(k);
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dow = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dow);
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return t.getUTCFullYear() + '-W' + pad2(Math.ceil(((t - y0) / 86400000 + 1) / 7));
}
function weekDays(k) { // lundi à dimanche de la semaine de k
  const d = parseDay(k); const dow = d.getDay() || 7;
  const out = []; for (let i = 1; i <= 7; i++) out.push(addDays(k, i - dow));
  return out;
}

/* Série : jours validés consécutifs ; un jour manqué par semaine ISO est pardonné (jour de pause). */
function computeStreak(days, today) {
  const ok = (k) => !!(days[k] && days[k].ok);
  let cur = ok(today) ? today : addDays(today, -1);
  let n = 0, pending = [];
  const weeks = new Set(), pausedDays = [];
  for (let i = 0; i < 2000; i++) {
    if (ok(cur)) { n++; pausedDays.push(...pending); pending = []; }
    else {
      const w = isoWeek(cur);
      if (weeks.has(w)) break;
      weeks.add(w); pending.push(cur);
    }
    cur = addDays(cur, -1);
  }
  // une pause ne compte que si elle est encadrée par des jours validés
  return { streak: n, jokerUsed: pausedDays.some((k) => isoWeek(k) === isoWeek(today)), pausedDays };
}

function levelInfo(xp) {
  let level = 1, rest = Math.max(0, Math.floor(xp));
  for (;;) {
    const need = 150 + 50 * level;
    if (rest < need) return { level, into: rest, need };
    rest -= need; level++;
  }
}

const RANKS = [
  [1, 'Gratteur de salon'], [3, 'Dompteur de médiator'], [6, 'Chasseur de pentas'],
  [10, 'Shredder du dimanche'], [15, 'Héros du manche'], [20, 'Sorcier des six cordes'],
  [30, 'Kami du manche'], [40, 'Légende vivante'],
];
function rankFor(level) { let r = RANKS[0][1]; for (const [l, n] of RANKS) if (level >= l) r = n; return r; }

/* Passages à 100 % d'un morceau : 3 pour acquérir la carte, 2 au maximum par jour. */
function passesInfo(list, today, needed = 3, perDay = 2) {
  const all = Array.isArray(list) ? list : [];
  const n = Math.min(needed, all.length);
  const todayN = all.filter((d) => d === today).length;
  return { n, today: todayN, owned: all.length >= needed, canPass: all.length < needed && todayN < perDay };
}

/* PV du boss (100 au départ, 0 seulement quand sa carte est acquise).
   Premier boss : paliers 60, mini-boss 5 chacun (4), étapes du boss 2 chacune (3), passages 7 chacun (2).
   Boss suivants : étapes 20 chacune (3), passages 20 chacun (2). */
function bossHp(o) {
  if (o.owned) return 0;
  let dmg;
  if (o.first) dmg = (o.paliersTotal ? 60 * o.paliersDone / o.paliersTotal : 0) + 5 * Math.min(4, o.miniOwned) + 2 * Math.min(3, o.steps) + 7 * Math.min(2, o.passes);
  else dmg = 20 * Math.min(3, o.steps) + 20 * Math.min(2, o.passes);
  return Math.max(1, Math.round(100 - dmg));
}

/* Plus grand nombre de jours validés dans une même semaine ISO. */
function maxWeekOk(days) {
  const per = {};
  for (const k of Object.keys(days || {})) if (days[k] && days[k].ok) { const w = isoWeek(k); per[w] = (per[w] || 0) + 1; }
  return Object.values(per).reduce((m, v) => Math.max(m, v), 0);
}

/* ---------- Détection de hauteur (NSDF, type McLeod) ---------- */
function detectPitch(buf, sampleRate) {
  const n = buf.length;
  let sum = 0;
  for (let i = 0; i < n; i++) sum += buf[i] * buf[i];
  const rms = Math.sqrt(sum / n);
  if (rms < 0.008) return null;
  const minLag = Math.max(2, Math.floor(sampleRate / 1400));
  const maxLag = Math.min(Math.floor(sampleRate / 70), (n >> 1) - 1);
  const nsdf = new Float32Array(maxLag + 2);
  for (let tau = 0; tau <= maxLag + 1; tau++) {
    let acf = 0, m = 0;
    for (let i = 0; i < n - tau; i++) { const a = buf[i], b = buf[i + tau]; acf += a * b; m += a * a + b * b; }
    nsdf[tau] = m > 0 ? (2 * acf) / m : 0;
  }
  let tau = 1;
  while (tau <= maxLag && nsdf[tau] > 0) tau++;
  const peaks = [];
  while (tau <= maxLag) {
    while (tau <= maxLag && nsdf[tau] <= 0) tau++;
    let pk = -1, pv = 0;
    while (tau <= maxLag && nsdf[tau] > 0) { if (nsdf[tau] > pv) { pv = nsdf[tau]; pk = tau; } tau++; }
    if (pk >= minLag) peaks.push([pk, pv]);
  }
  if (!peaks.length) return null;
  let mx = 0; for (const p of peaks) if (p[1] > mx) mx = p[1];
  if (mx < 0.6) return null;
  const ch = peaks.find((p) => p[1] >= 0.9 * mx);
  let lag = ch[0];
  const a = nsdf[lag - 1], b = nsdf[lag], c = nsdf[lag + 1];
  const den = a - 2 * b + c;
  if (den !== 0) lag += (0.5 * (a - c)) / den;
  return { freq: sampleRate / lag, clarity: ch[1], rms };
}
function freqToMidi(f) { return 69 + 12 * Math.log2(f / 440); }
function midiToFreq(m) { return 440 * Math.pow(2, (m - 69) / 12); }

/* Transforme un flux de hauteurs en événements « note jouée » stables. */
class NoteTracker {
  constructor(stableFrames = 3, silenceFrames = 4) {
    this.stableFrames = stableFrames; this.silenceFrames = silenceFrames;
    this.cand = null; this.count = 0; this.current = null; this.silent = 0;
  }
  /* midiFloat : hauteur détectée, ou null si rien de net. Renvoie la note MIDI quand une nouvelle note est confirmée. */
  feed(midiFloat) {
    if (midiFloat == null) {
      this.cand = null; this.count = 0;
      if (++this.silent >= this.silenceFrames) this.current = null;
      return null;
    }
    this.silent = 0;
    const m = Math.round(midiFloat);
    if (m === this.cand) this.count++; else { this.cand = m; this.count = 1; }
    if (this.count === this.stableFrames && m !== this.current) { this.current = m; return m; }
    return null;
  }
}

/* Générateur pseudo-aléatoire déterministe (pour les missions du jour). */
function seeded(seed) {
  let t = (seed >>> 0) + 0x6d2b79f5;
  return function () {
    t = (t + 0x6d2b79f5) | 0;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

const Core = {
  NOTE_FR, NOTE_EN, OPEN_MIDI, STRING_FR, MAXFRET, DEG_LABEL, SCALES, BOX, mod, noteName, boxRootFret, positionShifts,
  inPosition, fretboardNotes, sequenceForPosition, dayKey, parseDay, addDays, dayNumber, isoWeek, weekDays,
  computeStreak, levelInfo, rankFor, RANKS, bossHp, passesInfo, maxWeekOk, detectPitch, freqToMidi, midiToFreq, NoteTracker, seeded,
};
if (typeof module !== 'undefined' && module.exports) module.exports = Core;
