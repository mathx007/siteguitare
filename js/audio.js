/* Gratte Quest : son (Web Audio). Tout démarre sur un clic de l'utilisateur. */
const Sound = (() => {
  let ctx = null, master = null;
  function ac() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0.8; master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

  /* Note pincée. */
  function pluck(midi, when, dur = 1.1, vol = 0.5) {
    const c = ac(); if (!c) return;
    const t = when == null ? c.currentTime + 0.02 : when;
    const g = c.createGain(), f = c.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.setValueAtTime(3800, t); f.frequency.exponentialRampToValueAtTime(700, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    for (const [type, det, lv] of [['sawtooth', 0, 0.5], ['triangle', 4, 0.7]]) {
      const o = c.createOscillator(), og = c.createGain();
      o.type = type; o.frequency.value = hz(midi); o.detune.value = det; og.gain.value = lv;
      o.connect(og); og.connect(f); o.start(t); o.stop(t + dur + 0.05);
    }
    f.connect(g); g.connect(master);
  }
  function click(t, accent) {
    const c = ac(); const o = c.createOscillator(), g = c.createGain();
    o.type = 'square'; o.frequency.value = accent ? 1600 : 1000;
    g.gain.setValueAtTime(accent ? 0.35 : 0.22, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.06);
  }
  function noise(t, dur, vol, hp) {
    const c = ac(); const len = Math.floor(c.sampleRate * dur);
    const b = c.createBuffer(1, len, c.sampleRate); const d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = c.createBufferSource(); s.buffer = b;
    const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp;
    const g = c.createGain(); g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(master); s.start(t);
  }
  function kick(t) {
    const c = ac(); const o = c.createOscillator(), g = c.createGain();
    o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(0.7, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.2);
  }
  function tone(midi, t, dur, type, vol, cutoff) {
    const c = ac(); const o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
    o.type = type; o.frequency.value = hz(midi); f.type = 'lowpass'; f.frequency.value = cutoff;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.03);
    g.gain.setValueAtTime(vol, t + dur * 0.7); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(f); f.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
  }

  /* Ordonnanceur commun : appelle onStep(numéro, instant) à chaque croche. */
  function makeLoop(getBpm, onStep) {
    let timer = null, next = 0, step = 0;
    return {
      get on() { return timer != null; },
      start() {
        const c = ac(); if (!c || timer != null) return;
        next = c.currentTime + 0.08; step = 0;
        timer = setInterval(() => {
          while (next < c.currentTime + 0.12) { onStep(step, next); step++; next += 30 / getBpm(); }
        }, 25);
      },
      stop() { if (timer != null) { clearInterval(timer); timer = null; } },
    };
  }

  /* Métronome : 4 temps, accent sur le premier. */
  const metro = { bpm: 80, onBeat: null };
  const metroLoop = makeLoop(() => metro.bpm, (step, t) => {
    if (step % 2) return;
    const beat = (step / 2) % 4;
    click(t, beat === 0);
    if (metro.onBeat) { const c = ac(); setTimeout(() => metro.onBeat && metro.onBeat(beat), Math.max(0, (t - c.currentTime) * 1000)); }
  });

  /* Boucle d'impro : bourdon, ou grille rock mineure (i, VI, III, VII). */
  const jam = { bpm: 85, root: 9, style: 'rock' };
  const PROG = [[0, [0, 3, 7]], [8, [0, 4, 7]], [3, [0, 4, 7]], [10, [0, 4, 7]]];
  const jamLoop = makeLoop(() => jam.bpm, (step, t) => {
    const eighth = 30 / jam.bpm, inBar = step % 8, bar = Math.floor(step / 8) % 4;
    const base = 36 + ((jam.root + 8) % 12) - 8; // tonique grave, entre Mi1 et Ré#2
    if (jam.style === 'drone') {
      if (inBar === 0) { for (const iv of [0, 7, 12]) tone(base + 12 + iv, t, eighth * 8.2, 'triangle', 0.1, 900); tone(base, t, eighth * 8.2, 'sawtooth', 0.12, 300); }
      if (inBar % 2 === 0) noise(t, 0.03, 0.05, 6000);
      return;
    }
    const [off, triad] = PROG[bar];
    if (inBar === 0) for (const iv of triad) tone(base + 24 + off + iv - (off > 6 ? 12 : 0), t, eighth * 7.8, 'triangle', 0.075, 1400);
    tone(base + off - (off > 6 ? 12 : 0) + 12, t, eighth * 0.9, 'sawtooth', 0.17, 420);
    if (inBar === 0 || inBar === 4 || inBar === 5) kick(t);
    if (inBar === 2 || inBar === 6) noise(t, 0.12, 0.22, 1800);
    noise(t, 0.03, inBar % 2 ? 0.04 : 0.07, 7000);
  });

  /* Joue une suite de notes (jeu d'oreille). Renvoie la durée totale en secondes. */
  function playSeq(midis, gap = 0.55, dur = 1.0) {
    const c = ac(); if (!c) return 0;
    const t0 = c.currentTime + 0.05;
    midis.forEach((m, i) => pluck(m, t0 + i * gap, dur));
    return midis.length * gap + dur;
  }
  /* Bourdon (tonique + quinte, grave et doux) pour installer une tonalité. */
  function drone(rootMidi, dur) {
    const c = ac(); if (!c) return;
    const t = c.currentTime + 0.03, base = 40 + ((rootMidi - 40) % 12 + 12) % 12;
    for (const [iv, lv] of [[0, 0.12], [7, 0.07], [12, 0.05]]) tone(base + iv, t, dur, 'triangle', lv, 700);
  }
  /* Bourdon puis suite de notes par-dessus. Renvoie la durée totale en secondes. */
  function playOverDrone(rootMidi, midis, gap = 0.7, dur = 1.0) {
    const c = ac(); if (!c) return 0;
    const total = 1.1 + midis.length * gap + dur;
    drone(rootMidi, total);
    const t0 = c.currentTime + 1.1;
    midis.forEach((m, i) => pluck(m, t0 + i * gap, dur, 0.55));
    return total;
  }
  function chime(good) {
    const c = ac(); if (!c) return;
    const t = c.currentTime + 0.01;
    (good ? [76, 81, 88] : [52, 51]).forEach((m, i) => tone(m, t + i * 0.09, 0.22, good ? 'triangle' : 'sawtooth', 0.14, good ? 4000 : 500));
  }
  return { ac, pluck, playSeq, drone, playOverDrone, chime, metro, metroLoop, jam, jamLoop, get ctx() { return ctx; } };
})();
