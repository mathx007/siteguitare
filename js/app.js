/* Gratte Quest : état, sauvegarde, règles, rendu et événements. */
(() => {
  'use strict';
  const LS = 'gratte-quest-v2', LS_GUEST = 'gq-guest';
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const E = (name, size = 24, cls = '') => `<img class="emo ${cls}" src="assets/emoji/${name}.svg" alt="" width="${size}" height="${size}" aria-hidden="true">`;
  const today = () => Core.dayKey(new Date());
  const BR = Object.fromEntries(BRANCHES.map((b) => [b.id, b]));
  const ALL_PAL = BRANCHES.flatMap((b) => PALIERS[b.id].map((p, i) => ({ ...p, br: b.id, idx: i })));
  const MIC_OK = !!(window.isSecureContext && navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  const POS_COL = ['#2BC4AE', '#FFC53D', '#FF6B6B', '#6EA8FF', '#F47BE0'];
  /* [id, nom, icône, nom court affiché dans la barre du bas sur téléphone] */
  const TABS = [['accueil', 'Accueil', 'guitar'], ['paliers', 'Paliers', 'chart-increasing'], ['collection', 'Collection', 'card-file-box'], ['trophees', 'Trophées', 'trophy'], ['doc', 'Documentation', 'scroll', 'Docs'], ['progres', 'Progrès', 'sparkles']];
  const VIEWS = TABS.map((t) => t[0]).concat(['manche', 'oreille']);
  /* Miniature Wikimedia en taille standard (500 ou 1280 px), demandée sans cookie ni référent. */
  const commons = (file, w) => {
    const p = ART_PATH[file]; if (!p) return '';
    const n = encodeURIComponent(file.replace(/ /g, '_')).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
    return `https://upload.wikimedia.org/wikipedia/commons/thumb/${p}/${n}/${w > 500 ? 1280 : 500}px-${n}`;
  };
  const artAttrs = (s) => (st.img[s.id] ? '' : ' crossorigin="anonymous"') + ' referrerpolicy="no-referrer"';
  const commonsPage = (file) => 'https://commons.wikimedia.org/wiki/File:' + encodeURIComponent(file.replace(/ /g, '_'));

  /* ---------- État ---------- */
  function fresh() {
    return { v: 2, xp: 0, days: {}, skills: {}, steps: {}, passes: {}, bonus: {}, bpm: {}, ear: { best: {}, total: 0 }, stats: { micClean: 0 },
      trophies: {}, boss: { current: FIRST_BOSS, defeated: [] }, banner: null, custom: [], img: {}, active: 'hysteria', short: false, noArt: false, best: 0, name: '', updatedAt: 0, syncedUser: null };
  }
  function normalize(o) {
    if (!o || typeof o !== 'object' || typeof o.days !== 'object') return null;
    const f = fresh();
    if (o.v === 1) { // ancienne version : on garde l'essentiel
      f.xp = Number(o.xp) || 0; f.days = o.days || {}; f.skills = o.skills || {}; f.bonus = o.bonus || {}; f.bpm = o.bpm || {};
      f.ear = Object.assign(f.ear, o.ear || {}); f.short = !!o.short; f.best = o.best || 0;
      for (const [id, lv] of Object.entries(o.songs || {})) f.steps[id] = Math.min(3, Number(lv) || 0);
      if (o.active) f.active = o.active;
      return f;
    }
    if (o.v !== 2) return null;
    const out = Object.assign(f, o);
    for (const k of ['days', 'skills', 'steps', 'passes', 'bonus', 'bpm', 'trophies', 'img', 'stats']) if (!out[k] || typeof out[k] !== 'object' || Array.isArray(out[k])) out[k] = k === 'stats' ? { micClean: 0 } : {};
    out.ear = Object.assign({ best: {}, total: 0 }, o.ear || {});
    out.boss = Object.assign({ current: FIRST_BOSS, defeated: [] }, o.boss || {});
    if (!Array.isArray(out.boss.defeated)) out.boss.defeated = [];
    if (!Array.isArray(out.custom)) out.custom = [];
    out.xp = Math.max(0, Number(out.xp) || 0);
    return out;
  }
  const hasProgress = (s) => !!s && (s.xp > 0 || Object.keys(s.days || {}).length > 0);
  let st = fresh();
  const ui = {
    tab: 'accueil', modal: null, armed: null, timer: null, session: null, dock: false, beat: -1, bpmDraft: '', bpmExo: 'trem', flipped: null,
    colTab: 'songs', rar: 'all', preview: false, fb: { root: 9, scale: 'pentaMin', pos: [0, 1, 2, 3, 4], labels: 'notes' },
    ear: { mode: 'note', level: 1, q: null, streak: 0, result: null, tries: [], revealed: false },
    mic: { on: false, err: '', devices: [], device: '' }, check: null, importMsg: '', login: { show: false, state: 'idle', email: '', msg: '' }, sync: 'local',
  };

  /* ---------- Thème : clair (mise en page actuelle) ou sombre (« Mur de cartes ») ----------
     Par défaut, le site suit le réglage de l'appareil ; le bouton de la barre du haut force l'un ou l'autre (mémorisé). */
  const LS_THEME = 'gq-theme', mqDark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  const storedTheme = () => { try { const t = localStorage.getItem(LS_THEME); return t === 'dark' || t === 'light' ? t : null; } catch (e) { return null; } };
  const isDark = () => document.documentElement.dataset.theme === 'dark';
  function applyTheme() {
    const t = storedTheme() || (mqDark && mqDark.matches ? 'dark' : 'light');
    document.documentElement.dataset.theme = t;
    const m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', t === 'dark' ? '#0B0B12' : '#5B4BFF');
  }
  applyTheme();
  if (mqDark && mqDark.addEventListener) mqDark.addEventListener('change', () => { if (!storedTheme()) { applyTheme(); render(); } });
  const ICON_THEME = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2z"/></svg>';
  const ICON_PLAY = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M7 4.8v14.4a1 1 0 0 0 1.5.86l11.6-7.2a1 1 0 0 0 0-1.72L8.5 3.94A1 1 0 0 0 7 4.8z"/></svg>';

  /* ---------- Sauvegarde locale et en ligne ---------- */
  function loadLocal() { try { const raw = localStorage.getItem(LS); if (raw) { const o = normalize(JSON.parse(raw)); if (o) st = o; } } catch (e) { /* stockage indisponible */ } }
  function saveLocal() { try { localStorage.setItem(LS, JSON.stringify(st)); } catch (e) { /* idem */ } }
  let pushTimer = null, pushing = false, pushAgain = false;
  function save() {
    st.updatedAt = Date.now(); saveLocal();
    if (Cloud.user) { clearTimeout(pushTimer); pushTimer = setTimeout(push, 1500); ui.sync = 'saving'; refreshSync(); }
  }
  async function push() {
    pushTimer = null;
    if (!Cloud.user) return;
    if (pushing) { pushAgain = true; return; }
    pushing = true;
    try { st.syncedUser = Cloud.user.id; saveLocal(); await Cloud.save(st); ui.sync = 'ok'; } catch (e) { ui.sync = 'err'; }
    pushing = false; refreshSync();
    if (pushAgain) { pushAgain = false; push(); }
  }
  let syncing = false;
  async function syncNow() {
    if (!Cloud.user || syncing) return;
    syncing = true;
    try { await syncInner(); } finally { syncing = false; }
  }
  async function syncInner() {
    ui.sync = 'saving'; refreshSync();
    let remote = null;
    try { remote = normalize(await Cloud.load()); } catch (e) { ui.sync = 'err'; refreshSync(); return; }
    const uid = Cloud.user.id;
    if (!remote) { await push(); return; }
    if (st.syncedUser !== uid && hasProgress(st) && hasProgress(remote) && st.updatedAt !== remote.updatedAt) {
      ui.modal = { type: 'merge', remote }; ui.sync = 'ok'; render(); return;
    }
    if (remote.updatedAt > st.updatedAt || !hasProgress(st)) { st = remote; st.syncedUser = uid; saveLocal(); ui.sync = 'ok'; render(); }
    else await push();
    refreshSync();
  }
  async function pullIfNewer() {
    if (!Cloud.user || pushTimer || pushing) return;
    try {
      const remote = normalize(await Cloud.load());
      if (remote && remote.updatedAt > st.updatedAt) { st = remote; st.syncedUser = Cloud.user.id; saveLocal(); render(); }
    } catch (e) { /* hors ligne : on garde l'état local */ }
  }
  function syncLabel() {
    if (!Cloud.user) return 'Sans compte : progression gardée sur cet appareil';
    return { ok: 'Synchronisée avec ton compte', saving: 'Synchronisation…', err: 'Dernier envoi échoué : nouvel essai au prochain changement', local: 'Synchronisée avec ton compte' }[ui.sync] || '';
  }
  function refreshSync() { const el = $('#sync-status'); if (el) el.textContent = syncLabel(); }

  /* ---------- Morceaux, cartes, boss ---------- */
  const allSongs = () => SONGS.concat(st.custom || []);
  const songById = (id) => allSongs().find((s) => s.id === id);
  const stepsOf = (id) => Math.min(3, st.steps[id] || 0);
  const pinfo = (id) => Core.passesInfo(st.passes[id], today(), PASSES_NEEDED, PASSES_PER_DAY);
  const owned = (id) => pinfo(id).owned;
  const songImg = (s, w) => st.img[s.id] || (s.art && !st.noArt ? commons(s.art[0], w) : '');
  /* Texte alternatif : décrit l'œuvre affichée (ou l'image choisie par l'utilisateur). */
  const songAlt = (s) => st.img[s.id] ? 'Illustration choisie pour ' + s.t : s.art && !st.noArt ? 'Illustration : ' + s.art[1] : '';
  const curIdx = (br) => { const l = PALIERS[br]; let i = 0; while (i < l.length && st.skills[l[i].id]) i++; return i; };
  const skillsDone = () => ALL_PAL.filter((p) => st.skills[p.id]).length;
  const isDefeated = (id) => st.boss.defeated.includes(id);
  function bossState() {
    const id = st.boss.current;
    if (!id || !songById(id)) return null;
    const first = id === FIRST_BOSS && !st.boss.defeated.length;
    const hp = Core.bossHp({ first, owned: owned(id), paliersDone: skillsDone(), paliersTotal: ALL_PAL.length, miniOwned: MINI_BOSSES.filter(owned).length, steps: stepsOf(id), passes: pinfo(id).n });
    return { id, song: songById(id), first, hp };
  }
  function bossHint(b) {
    if (b.first) {
      const pending = BRANCHES.map((br) => ALL_PAL.find((p) => p.br === br.id && p.idx === curIdx(br.id))).filter(Boolean);
      if (pending.length) { const p = pending.sort((x, y) => x.idx - y.idx)[0]; return `valider le palier « ${p.t} »`; }
      const mini = MINI_BOSSES.find((m) => !owned(m)); if (mini) return `acquérir la carte ${songById(mini).t}`;
    }
    const s = stepsOf(b.id);
    return s < 3 ? `réussir l'étape « ${(b.song.ear ? STEPS_EAR : STEPS_SONG)[s]} » de ${b.song.t}` : `jouer ${b.song.t} en entier à 100 %`;
  }

  /* ---------- Toasts et XP ---------- */
  function toast(msg, icon) {
    const el = document.createElement('div'); el.className = 'toast';
    el.innerHTML = (icon ? E(icon, 22) : '') + '<span></span>'; el.querySelector('span').textContent = msg;
    const box = $('#toasts'); box.appendChild(el); while (box.children.length > 3) box.firstElementChild.remove(); setTimeout(() => el.remove(), 2400);
  }
  function gain(n, why, silent) {
    const before = Core.levelInfo(st.xp).level;
    st.xp = Math.max(0, st.xp + n);
    const after = Core.levelInfo(st.xp).level;
    if (n > 0 && !silent) toast('+' + n + ' XP' + (why ? ' · ' + why : ''), 'sparkles');
    if (after > before) toast('Niveau ' + after + ' : ' + Core.rankFor(after), 'party-popper');
  }

  /* ---------- Trophées ---------- */
  function facts() {
    const bonusN = BONUS.filter((b) => st.bonus[b.id]).length;
    return {
      fullDays: Object.values(st.days).filter((d) => d && d.chest).length,
      miniOwned: MINI_BOSSES.filter(owned).length,
      maxWeekOk: Core.maxWeekOk(st.days),
      bestStreak: Math.max(st.best || 0, Core.computeStreak(st.days, today()).streak),
      pentaPaliers: ['g1', 'g2', 'g3'].filter((id) => st.skills[id]).length,
      ponts: st.skills.g4 ? 1 : 0,
      tremMax: (st.bpm.trem || []).reduce((m, x) => Math.max(m, x[1]), 0),
      earBest: Object.values(st.ear.best || {}).reduce((m, v) => Math.max(m, v), 0),
      earSongs: SONGS.filter((s) => s.ear && stepsOf(s.id) >= 2).length,
      micClean: (st.stats && st.stats.micClean) || 0,
      cards: allSongs().filter((s) => owned(s.id)).length + skillsDone() + bonusN,
      defeated: st.boss.defeated.length,
    };
  }
  function checkTrophies() {
    const f = facts();
    for (const t of TROPHIES) {
      if (st.trophies[t.id]) continue;
      const [v, g] = t.p(f);
      if (v >= g) { st.trophies[t.id] = today(); st.lastTrophy = t.id; gain(XP.trophy, '', true); toast('Trophée débloqué : ' + t.n, t.e); }
    }
  }
  function commit() { checkTrophies(); save(); render(); }

  /* ---------- Missions du jour ---------- */
  const getRec = (k) => st.days[k] || { done: [], ok: false, ear: 0 };
  const mutRec = (k) => st.days[k] || (st.days[k] = { done: [], ok: false, ear: 0 });
  function gamMission(n, gi) {
    const A = 9;
    if (gi === 0) return { fun: 'Camp de base', sub: 'Penta de La, position 1', text: 'Penta mineure de La, position 1 (case 5). 5 allers-retours lents, sans regarder ta main gauche. Dis « La » à chaque tonique.', fb: ['pentaMin', A, [0]] };
    if (gi === 1) { const p = 1 + (n % 2); return { fun: 'Un étage plus haut', sub: `Penta de La, position ${p + 1}`, text: `Penta de La, position ${p + 1}. Apprends le dessin corde par corde, puis enchaîne avec la position ${p}.`, fb: ['pentaMin', A, [p - 1, p]] }; }
    if (gi === 2) { const p = 3 + (n % 2); return { fun: 'Tout en haut du manche', sub: `Penta de La, position ${p + 1}`, text: `Penta de La, position ${p + 1}. Apprends le dessin, puis enchaîne avec la position ${p}.`, fb: ['pentaMin', A, [p - 1, p]] }; }
    if (gi === 3) { const a = n % 5, b = (a + 1) % 5; return { fun: 'Chantier des ponts', sub: `Relier les positions ${a + 1} et ${b + 1}`, text: `Monte dans la position ${a + 1}, glisse sur une note bicolore, redescends dans la position ${b + 1}. 10 passages.`, fb: ['pentaMin', A, [a, b]] }; }
    if (gi === 4) { const k = [4, 7, 2, 11, 6, 0, 5, 1, 8, 3, 10][n % 11]; const r = Core.boxRootFret(k, 'pentaMin'); return { fun: 'Changement de décor', sub: `Penta de ${Core.NOTE_FR[k]}`, text: `Penta mineure de ${Core.NOTE_FR[k]} : la tonique est ${r === 0 ? 'la corde de Mi grave à vide' : 'case ' + r + ' sur la corde de Mi grave'}. Pose la position 1 dessus, puis enchaîne les positions.`, fb: ['pentaMin', k, [0, 1, 2, 3, 4]] }; }
    if (gi === 5) return n % 2 ? { fun: 'Deux notes de plus', sub: 'La mineur naturel', text: `La mineur naturel, zone ${1 + (n % 5)}. Repère les 2 notes ajoutées à la penta : Si et Fa.`, fb: ['minNat', A, [n % 5]] } : { fun: 'Le côté lumineux', sub: 'Do majeur', text: `Do majeur, zone ${1 + (n % 5)}. Mêmes notes que La mineur, mais tout revient vers Do.`, fb: ['major', 0, [n % 5]] };
    if (gi === 6) return n % 2 ? { fun: 'La note qui grince', sub: 'Gamme blues de La', text: `Gamme blues de La, position ${1 + (n % 5)}. Passe sur la blue note sans t'y arrêter.`, fb: ['blues', A, [n % 5]] } : { fun: 'Soleil sur le manche', sub: 'Penta majeure de La', text: 'Penta majeure de La, position 1. Mêmes dessins, 3 cases plus bas, autre ambiance.', fb: ['pentaMaj', A, [0]] };
    if (gi === 7) return n % 2 ? { fun: 'Couleur dorienne', sub: 'La dorien', text: 'La dorien, zone 1. La note qui change par rapport à La mineur naturel : Fa devient Fa dièse.', fb: ['dorian', A, [0]] } : { fun: 'Ambiance château hanté', sub: 'La mineur harmonique', text: 'La mineur harmonique, zone 1. La note qui change : Sol devient Sol dièse.', fb: ['harmMin', A, [0]] };
    const keys = Object.keys(Core.SCALES), rnd = Core.seeded(n);
    const sk = keys[Math.floor(rnd() * keys.length)], k = Math.floor(rnd() * 12), p = Math.floor(rnd() * 5);
    return { fun: 'Tirage au sort', sub: `${Core.SCALES[sk].name} de ${Core.NOTE_FR[k]}`, text: `Révision surprise : ${Core.SCALES[sk].name.toLowerCase()} de ${Core.NOTE_FR[k]}, zone ${p + 1}. Monte, descends, puis improvise 2 minutes dedans.`, fb: [sk, k, [p]] };
  }
  const earPreset = (oi) => (oi <= 0 ? ['note', 1] : oi === 1 ? ['inter', 1] : oi === 2 ? ['inter', 2] : ['melo', oi === 3 ? 2 : 3]);
  const EAR_NAME = { note: 'Note mystère', inter: 'Intervalles', melo: 'Mélodie' };
  function missionsFor(k) {
    const r = getRec(k), short = r.short !== undefined ? r.short : st.short, n = Core.dayNumber(k);
    const exoId = EXO_ROTATION[n % EXO_ROTATION.length], exo = EXOS[exoId];
    const vit = { id: 'vit', br: 'vit', min: short ? 4 : 6, fun: exo.fun, sub: exo.t, text: exo.d, exo: exoId, why: WHY.vit };
    const g = gamMission(n, curIdx('gam'));
    const gam = { id: 'gam', br: 'gam', min: short ? 6 : 8, fun: g.fun, sub: g.sub, text: g.text, fb: g.fb, why: WHY.gam };
    const earSongs = SONGS.filter((s) => s.ear && !owned(s.id));
    let ore;
    if (n % 2 === 1 && earSongs.length) {
      const s = earSongs[Math.floor(n / 2) % earSongs.length];
      ore = { id: 'ore', br: 'ore', min: 5, fun: 'Détective sans tablature', sub: s.t, text: `Écoute « ${s.t} » (${s.a}), guitare en main, et retrouve les premières notes. Aucune tab autorisée.`, song: s.id, why: WHY.oreSong };
    } else {
      const [mode, level] = earPreset(curIdx('ore'));
      ore = { id: 'ore', br: 'ore', min: 5, fun: 'Radar à notes', sub: `${EAR_NAME[mode]}, niveau ${level}`, text: `8 bonnes réponses au jeu « ${EAR_NAME[mode]} », niveau ${level}. La mission se valide toute seule.`, game: [mode, level], auto: true, why: WHY.oreJeu };
    }
    let jeu;
    if (n % 2 === 0) {
      const s = songById(st.active) || songById('hysteria');
      jeu = { id: 'jeu', br: 'sol', min: short ? 6 : 11, fun: 'Répétition générale', sub: s.t, text: `« ${s.t} » : isole le passage le plus dur, boucle-le à 60 % du tempo, puis remonte de 5 bpm à chaque passage propre.`, song: s.id, why: WHY.song };
    } else {
      const pool = IMPRO_POOL[Math.min(curIdx('imp'), IMPRO_POOL.length - 1)];
      jeu = { id: 'jeu', br: 'imp', min: short ? 6 : 11, fun: 'Scène ouverte', sub: 'Impro sur la boucle', text: pool[n % pool.length] + ' Lance la boucle d\'impro et joue par-dessus.', jam: true, why: WHY.imp };
    }
    return short ? [vit, n % 2 ? gam : jeu] : [vit, gam, ore, jeu];
  }
  function completeMission(id) {
    const k = today(), r = mutRec(k);
    if (r.done.includes(id)) return;
    if (r.short === undefined) r.short = !!st.short;
    const ms = missionsFor(k), m = ms.find((x) => x.id === id);
    if (!m) return;
    r.done.push(id);
    if (m.exo) { const v = Number(ui.bpmDraft); if (v >= 30 && v <= 320) logBpm(m.exo, Math.round(v)); ui.bpmDraft = ''; }
    gain(XP.mission, 'mission validée');
    if (r.done.length >= (r.short ? 2 : 3)) r.ok = true;
    if (!r.chest && ms.every((x) => r.done.includes(x.id))) { r.chest = 'ready'; gain(XP.day, 'journée complète'); }
    if (ui.timer && ui.timer.mid === id) stopTimer();
    st.best = Math.max(st.best || 0, Core.computeStreak(st.days, k).streak);
    if (ui.session) {
      /* Mode séance : la suite (compte à rebours, mission suivante, récapitulatif) est gérée par le plein écran. */
      const next = ms.find((x) => !r.done.includes(x.id));
      if (ui.modal && ui.modal.type === 'mission') ui.modal = null;
      if (!next) { seanceToolsOff(); ui.session.on = false; ui.session.view = 'recap'; ui.session.count = null; checkTrophies(); save(); }
      else if (!ui.session.committing) { ui.session.view = 'full'; seanceCount('next'); } /* validée ailleurs (jeu d'oreille) : on revient au plein écran */
    } else if (ui.modal && ui.modal.type === 'mission') ui.modal = null;
    commit();
  }
  function logBpm(exo, v) {
    const arr = st.bpm[exo] || (st.bpm[exo] = []), k = today();
    if (arr.length && arr[arr.length - 1][0] === k) arr[arr.length - 1][1] = Math.max(arr[arr.length - 1][1], v); else arr.push([k, v]);
    if (arr.length > 120) arr.splice(0, arr.length - 120);
  }
  function openBooster() {
    const r = mutRec(today());
    if (r.chest !== 'ready') return;
    let x = Math.random() * 100, rar = 1;
    for (let i = 1; i <= 4; i++) { if (x < DROP[i]) { rar = i; break; } x -= DROP[i]; }
    const pool = BONUS.filter((b) => b.r === rar), card = pool[Math.floor(Math.random() * pool.length)];
    const dupe = !!st.bonus[card.id];
    st.bonus[card.id] = (st.bonus[card.id] || 0) + 1; r.chest = 'opened';
    if (dupe) gain(XP.dupe, 'doublon recyclé');
    ui.modal = { type: 'booster', card: card.id, dupe };
    Sound.chime(true); commit();
  }
  function validatePalier(id) {
    const p = ALL_PAL.find((x) => x.id === id);
    if (!p || st.skills[id] || curIdx(p.br) !== p.idx) return;
    st.skills[id] = today(); ui.armed = null;
    gain(XP.palier, 'palier franchi');
    ui.modal = { type: 'palier', id }; Sound.chime(true); commit();
  }
  function undoPalier(id) {
    const p = ALL_PAL.find((x) => x.id === id);
    if (!p || !st.skills[id] || curIdx(p.br) !== p.idx + 1) return;
    delete st.skills[id]; gain(-XP.palier); commit();
  }
  function songStep(id, delta) {
    const lv = stepsOf(id), nv = Math.max(0, Math.min(3, lv + delta));
    if (nv === lv || (delta < 0 && (st.passes[id] || []).length)) return;
    st.steps[id] = nv;
    if (delta > 0) { gain(XP.step, 'étape réussie'); Sound.chime(true); } else gain(-XP.step);
    commit();
  }
  function passSong(id) {
    const s = songById(id), pi = pinfo(id);
    if (!s || stepsOf(id) < 3 || !pi.canPass) return;
    (st.passes[id] = st.passes[id] || []).push(today());
    gain(XP.pass, 'passage à 100 %'); Sound.chime(true);
    if (owned(id)) {
      gain(XP.own, 'carte acquise', true);
      if (st.boss.current === id) {
        st.boss.defeated.push(id); st.boss.current = null; st.banner = id; gain(XP.boss, '', true);
        ui.modal = { type: 'boss-win', id }; ui.flipped = null;
      } else {
        if (MINI_BOSSES.includes(id) && !st.boss.defeated.length) toast('Mini-boss vaincu : ' + s.t, 'crossed-swords');
        else toast('Carte acquise : ' + s.t, 'sparkles');
      }
    }
    commit();
  }

  /* ---------- Chrono et session ---------- */
  let tick = null;
  const fmt = (sec) => { sec = Math.max(0, Math.ceil(sec)); return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'); };
  function startTimer(mid, minutes, fresh) {
    Sound.ac();
    if (!fresh && ui.timer && ui.timer.mid === mid && !ui.timer.running && ui.timer.left > 0) ui.timer.end = Date.now() + ui.timer.left * 1000;
    else ui.timer = { mid, end: Date.now() + minutes * 60000, left: minutes * 60, total: minutes * 60 };
    ui.timer.running = true; ui.timer.over = false;
    clearInterval(tick);
    tick = setInterval(() => {
      const t = ui.timer; if (!t || !t.running) return;
      t.left = (t.end - Date.now()) / 1000;
      document.querySelectorAll('[data-timer]').forEach((el) => { el.textContent = fmt(t.left); });
      const seg = document.querySelector('.sx-prog i.cur'); if (seg) seg.style.setProperty('--p', Math.min(1, 1 - t.left / t.total).toFixed(3)); /* segment de la mission en cours */
      if (t.left <= 0) { t.running = false; t.left = 0; t.over = true; clearInterval(tick); Sound.chime(true); toast('Temps écoulé : valide la mission quand c\'est bon', 'stopwatch'); render(); }
    }, 400);
    render();
  }
  function pauseTimer() { if (ui.timer) { ui.timer.running = false; ui.timer.left = Math.max(0, (ui.timer.end - Date.now()) / 1000); } clearInterval(tick); render(); }
  function stopTimer() { ui.timer = null; clearInterval(tick); }

  /* ---------- Rendu : en-tête, navigation, barre de session ---------- */
  function renderHeader() {
    const li = Core.levelInfo(st.xp), s = Core.computeStreak(st.days, today()), u = Cloud.user;
    const initial = st.name ? st.name.trim().charAt(0).toUpperCase() : u && u.email ? u.email.charAt(0).toUpperCase() : '?';
    $('#top').innerHTML = `<div class="wrap topin">
      <a class="brand" href="#accueil">${E('guitar', 30)}<span>Gratte Quest</span></a>
      <nav id="nav" aria-label="Sections">${TABS.map(([id, n, ic, sh]) => `<a href="#${id}" class="${ui.tab === id ? 'on' : ''}"${ui.tab === id ? ' aria-current="page"' : ''}>${E(ic, 20, 'navic')}${sh ? `<span class="nav-full">${n}</span><span class="nav-short">${sh}</span>` : `<span>${n}</span>`}</a>`).join('')}</nav>
      <div class="hud">
        <span class="streak" title="Jours validés d'affilée">${E('fire', 20)}<b class="num">${s.streak}</b><span class="hide-s">jour${s.streak > 1 ? 's' : ''}</span></span>
        <span class="lvl hide-s"><span>Niveau ${li.level} · <span class="num">${li.into} / ${li.need}</span> XP</span><span class="bar" role="progressbar" aria-label="Expérience" aria-valuemin="0" aria-valuemax="${li.need}" aria-valuenow="${li.into}"><i style="width:${(100 * li.into / li.need).toFixed(1)}%"></i></span></span>
        <button class="theme-btn" data-act="theme" aria-pressed="${isDark()}" aria-label="Mode sombre" title="${isDark() ? 'Passer en mode clair' : 'Passer en mode sombre'}">${ICON_THEME}</button>
        <button class="avatar${u ? ' on' : ''}" data-act="account" aria-label="${u ? 'Compte connecté' : 'Se connecter'}">${esc(initial)}</button>
      </div></div>`;
  }
  function renderSessionBar() {
    const el = $('#sessionbar');
    if (!ui.session || ui.session.view !== 'min') { el.innerHTML = ''; el.hidden = true; return; } /* visible seulement quand la séance plein écran est en pause */
    const k = today(), r = getRec(k), ms = missionsFor(k), cur = ms.find((m) => !r.done.includes(m.id));
    if (!cur) { el.innerHTML = ''; el.hidden = true; return; }
    const i = ms.indexOf(cur) + 1, b = BR[cur.br], t = ui.timer && ui.timer.mid === cur.id ? ui.timer : null;
    el.hidden = false; el.style.setProperty('--soft', b.soft); el.style.setProperty('--col', b.color);
    el.innerHTML = `<div class="wrap sessin">
      <span class="sess-ic">${E(b.icon, 26)}</span>
      <span class="sess-t"><b>Mission ${i}/${ms.length} · ${esc(cur.fun)}</b><span>${esc(b.name)} · ${esc(cur.sub)}</span></span>
      <span class="sess-time num" ${t && t.running ? 'data-timer' : ''}>${t ? (t.over ? 'Temps écoulé' : fmt(t.left)) : fmt(cur.min * 60)}</span>
      <span class="sess-act">
        <button class="btn sm" data-act="session">Reprendre en plein écran</button>
        <button class="link" data-act="session-stop">Arrêter la séance</button>
      </span></div>`;
  }

  /* ---------- Mode séance plein écran ----------
     ui.session = { on, view: 'full' | 'min' | 'recap', count, pending, played, xp0, drawer }.
     Une validation n'est enregistrée qu'à la fin du compte à rebours de 3 s : « Annuler » ne touche donc jamais aux données. */
  const SEANCE_ART = { vit: 'cantstop', gam: 'skyfall', ore: 'lostwoods', imp: 'johnny', sol: 'johnny' };
  const seanceArt = (m) => { const s = m.song && songById(m.song); return s && songImg(s, 1200) ? s : songById(SEANCE_ART[m.br]) || songById('hysteria'); };
  const seanceCur = () => { const k = today(), r = getRec(k); return missionsFor(k).find((m) => !r.done.includes(m.id)); };
  const seanceOn = () => !!(ui.session && (ui.session.view === 'full' || ui.session.view === 'recap'));
  let seanceLastMid = null;
  function seanceToolsOff() { if (Sound.metroLoop.on) { Sound.metroLoop.stop(); ui.beat = -1; } if (Sound.jamLoop.on) Sound.jamLoop.stop(); }
  /* L'outil de la mission démarre avec le chrono : métronome en vitesse, boucle en impro. */
  function seanceToolsOn(m) { if (m.exo && !Sound.metroLoop.on) { Sound.jamLoop.stop(); Sound.metroLoop.start(); } if (m.jam && !Sound.jamLoop.on) { Sound.metroLoop.stop(); ui.beat = -1; Sound.jamLoop.start(); } }
  function seanceStartTimer(m) { if (!(ui.timer && ui.timer.mid === m.id)) ui.timer = { mid: m.id, end: 0, left: m.min * 60, total: m.min * 60, running: false }; startTimer(m.id, m.min); seanceToolsOn(m); }
  /* Libellé du bouton de séance : il dit ce qui va se passer (reprise avec le temps restant si une séance est en pause). */
  function seanceLabel(next, doneN) {
    if (ui.session && ui.session.on && next) return `Reprendre la séance${ui.timer && ui.timer.mid === next.id && ui.timer.left < ui.timer.total ? ' · ' + fmt(ui.timer.left) : ''}`;
    return doneN ? 'Continuer la séance' : 'Jouer la séance';
  }
  function startSession() {
    const next = seanceCur();
    if (!next) { toast('Séance du jour déjà terminée', 'check-mark-button'); return; }
    ui.modal = null;
    if (ui.session && ui.session.on) { /* reprise après une pause : le chrono repart là où il était */
      ui.session.view = 'full';
      if (ui.timer && ui.timer.mid === next.id && ui.timer.left < ui.timer.total) { seanceStartTimer(next); announce(`Séance reprise : ${next.fun}.`); } else seanceCount('start');
      render(); return;
    }
    ui.session = { on: true, view: 'full', count: null, pending: null, played: 0, xp0: st.xp, drawer: false };
    ui.timer = null; seanceCount('start'); render();
  }
  function seanceCount(kind) {
    const s = ui.session; if (!s) return;
    if (s.count) clearTimeout(s.count.t);
    s.count = { kind, paused: false, rest: 3000, at: Date.now(), t: setTimeout(seanceCountDone, 3000) };
    const cur = seanceCur(), nx = kind === 'next' ? missionsFor(today()).find((m) => !getRec(today()).done.includes(m.id) && (!s.pending || m.id !== s.pending.id)) : null;
    announce(kind === 'start' ? `Le chrono démarre dans 3 secondes : ${cur ? cur.fun : ''}. Entrée pour démarrer, Espace pour attendre.` : kind === 'end' ? 'Dernière mission validée. Récapitulatif dans 3 secondes. Contrôle Z pour annuler.' : `Mission validée. Mission suivante dans 3 secondes${nx ? ' : ' + nx.fun : ''}. Contrôle Z pour annuler.`);
  }
  function seanceHold() {
    const c = ui.session && ui.session.count; if (!c) return;
    if (c.paused) { c.paused = false; c.at = Date.now(); c.t = setTimeout(seanceCountDone, c.rest); } else { c.paused = true; clearTimeout(c.t); c.rest = Math.max(0, c.rest - (Date.now() - c.at)); }
    render();
  }
  /* Enregistre la mission en attente (fin du compte à rebours, sortie, arrêt ou fermeture de la page). */
  function seanceCommit() {
    const s = ui.session; if (!s || !s.pending) return;
    const p = s.pending; s.pending = null; s.committing = true; ui.bpmDraft = p.bpm || '';
    completeMission(p.id); s.committing = false;
  }
  function seanceCountDone() {
    const s = ui.session; if (!s || !s.count) return;
    const c = s.count; clearTimeout(c.t); s.count = null;
    if (c.kind !== 'start') seanceCommit();
    if (ui.session && ui.session.view === 'full') { const m = seanceCur(); if (m) { const ms = missionsFor(today()); seanceStartTimer(m); announce(`Mission ${ms.findIndex((x) => x.id === m.id) + 1} sur ${ms.length} : ${m.fun}. Chrono lancé.`); } }
    render();
  }
  function seanceValidate() {
    const s = ui.session, m = seanceCur(); if (!s || s.count || !m || m.auto) return;
    const t = ui.timer && ui.timer.mid === m.id ? ui.timer : null;
    if (t) { if (t.running) t.left = Math.max(0, (t.end - Date.now()) / 1000); s.played += t.total - t.left; t.running = false; clearInterval(tick); }
    seanceToolsOff(); s.drawer = false;
    s.pending = { id: m.id, bpm: ui.bpmDraft, played: t ? t.total - t.left : 0 };
    const rest = missionsFor(today()).filter((x) => !getRec(today()).done.includes(x.id) && x.id !== m.id).length;
    seanceCount(rest ? 'next' : 'end'); Sound.chime(false);
    render();
    const st0 = $('.sx-stamp'); if (st0) { st0.classList.remove('go'); void st0.offsetWidth; st0.classList.add('go'); }
  }
  function seanceUndo() {
    const s = ui.session; if (!s || !s.pending || !s.count) return;
    clearTimeout(s.count.t); s.count = null; s.played -= s.pending.played || 0; ui.bpmDraft = s.pending.bpm || ''; s.pending = null;
    announce('Validation annulée. Chrono en pause : Espace pour reprendre.'); render();
  }
  /* Quitter le plein écran : la séance reste en cours (barre de séance), le chrono est mis en pause. */
  function seanceMin() {
    const s = ui.session; if (!s) return;
    if (s.view === 'recap') { ui.session = null; render(); return; }
    if (s.count) { clearTimeout(s.count.t); const kind = s.count.kind; s.count = null; if (kind !== 'start') seanceCommit(); }
    if (!ui.session) { render(); return; }
    if (ui.timer && ui.timer.running) pauseTimer();
    seanceToolsOff(); ui.session.view = 'min'; ui.session.drawer = false; render();
    announce('Séance en pause. Reprends-la depuis la barre de séance ou l\'Accueil.');
  }
  function seanceStop() { if (ui.session && ui.session.count) { clearTimeout(ui.session.count.t); ui.session.count = null; seanceCommit(); } seanceToolsOff(); ui.session = null; if (ui.timer && ui.timer.running) pauseTimer(); render(); }
  function seanceTool(m) {
    const r = getRec(today());
    if (m.exo) return `<div class="sx-tool"><span class="sx-bpm num" id="sheet-bpm">${Sound.metro.bpm}</span><span class="sx-u">bpm</span>${[-5, -1, 1, 5].map((v) => `<button type="button" class="b b-sm" data-act="metro-step" data-v="${v}" aria-label="${v > 0 ? 'Plus' : 'Moins'} ${Math.abs(v)} bpm">${v > 0 ? '+' : '−'}${Math.abs(v)}</button>`).join('')}<button type="button" class="b b-sm" data-act="metro-toggle" aria-pressed="${Sound.metroLoop.on}">Métronome <span class="key">M</span></button><span class="sx-beats" id="sx-beats" aria-hidden="true">${[0, 1, 2, 3].map((i) => `<i class="${ui.beat === i ? 'on' : ''}"></i>`).join('')}</span>
      <label class="sx-field">Tempo propre atteint <input type="number" id="bpm-in" inputmode="numeric" min="30" max="320" placeholder="bpm" value="${esc(ui.bpmDraft)}" data-input="bpm"></label></div>`;
    if (m.fb) { const [scale, root, pos] = m.fb; return `<div class="sx-tool col"><div class="fb-wrap compact">${fretboardSvg({ root, scale, pos, labels: 'notes' }, { compact: true })}</div><button type="button" class="b b-sm" data-act="show-fb" data-fb="${esc(JSON.stringify(m.fb))}">Ouvrir le manche et le contrôle au micro</button></div>`; }
    if (m.game) return `<div class="sx-tool"><button type="button" class="b" data-act="go-ear" data-mode="${m.game[0]}" data-level="${m.game[1]}">${E('ear', 22)} Jouer (${Math.min(8, r.ear || 0)}/8)</button><span class="sx-note">Se valide toute seule à 8 bonnes réponses.</span></div>`;
    if (m.jam) return `<div class="sx-tool"><select id="jam-root2" data-change="jam-root" aria-label="Tonalité de la boucle">${Core.NOTE_FR.map((n, i) => `<option value="${i}"${i === Sound.jam.root ? ' selected' : ''}>${n} mineur</option>`).join('')}</select><button type="button" class="b b-sm" data-act="jam-toggle" aria-pressed="${Sound.jamLoop.on}">Boucle d'impro <span class="key">M</span></button></div>`;
    if (m.song) { const s = songById(m.song); return `<div class="sx-tool">${links(s)}<button type="button" class="b b-sm" data-act="song" data-id="${s.id}">Fiche du morceau</button></div>`; }
    return '';
  }
  function seanceUp(ms, r, m) {
    const s = ui.session, c = s.count, pend = s.pending, nx = ms.find((x) => !r.done.includes(x.id) && x.id !== m.id);
    if (c) {
      const who = c.kind === 'start' ? m.fun : c.kind === 'end' ? 'Séance terminée' : nx ? nx.fun : '';
      const what = c.paused ? 'En attente : Espace pour reprendre' : c.kind === 'start' ? 'Le chrono démarre dans 3 s' : c.kind === 'end' ? 'Récapitulatif dans 3 s' : 'Mission suivante dans 3 s';
      return `<b>${esc(who)}</b><div class="sx-bar"><i class="run${c.paused ? ' paused' : ''}" style="animation-duration:3s;animation-delay:-${((3000 - c.rest + (c.paused ? 0 : Date.now() - c.at)) / 1000).toFixed(2)}s"></i></div><span class="l">${what}</span>
        <div class="a"><button type="button" class="b b-sm b-gold" data-act="seance-now">${c.kind === 'end' ? 'Voir le récap' : 'Lancer'} <span class="key">Entrée</span></button><button type="button" class="b b-sm" data-act="seance-hold">${c.paused ? 'Reprendre' : 'Attendre'} <span class="key">Espace</span></button>${pend ? '<button type="button" class="b b-sm mob" data-act="seance-undo">Annuler</button>' : ''}</div>`;
    }
    return `<b>${nx ? esc(nx.fun) : 'Fin de séance et booster'}</b><span>${nx ? `${esc(BR[nx.br].name)} · ${nx.min} min · 3 s pour te préparer après la validation` : 'Le boss encaisse le coup de ta séance.'}</span>`;
  }
  function seanceHtml() {
    const k = today(), r = getRec(k), ms = missionsFor(k), s = ui.session, m = ms.find((x) => !r.done.includes(x.id)); /* même liste que ms : indexOf fiable */
    if (!m) return '';
    const i = ms.indexOf(m), b = BR[m.br], t = ui.timer && ui.timer.mid === m.id ? ui.timer : null, art = seanceArt(m), img = songImg(art, 1200), pend = s.pending && s.pending.id === m.id;
    const g = m.exo && GUIDES[m.exo];
    const prog = ms.map((x) => `<i class="${x.id === m.id ? 'cur' : ''}" style="--m:${x.min};--c:${BR[x.br].color};--p:${r.done.includes(x.id) || (pend && x.id === m.id) ? 1 : x.id === m.id && t ? (1 - t.left / t.total).toFixed(3) : 0}"></i>`).join('');
    const queue = ms.map((x) => x.id === m.id ? '' : `<div class="sx-q${r.done.includes(x.id) ? ' done' : ''}"><b>${esc(x.fun)}</b><span>${esc(BR[x.br].name)} · ${r.done.includes(x.id) ? 'faite' : x.min + ' min'}</span></div>`).join('');
    const okOff = !!s.count || m.auto;
    return `<div class="sx${s.count ? ' counting' : ''}" id="sx" tabindex="-1">
      <div class="sx-art">${img ? `<img src="${esc(img)}" alt="" loading="eager"${artAttrs(art)} onerror="this.remove()">` : ''}</div>${img && art.art && !st.img[art.id] ? `<p class="sx-credit">${esc(art.art[1])}</p>` : ''}
      <header class="sx-top"><span class="t">Séance du jour</span><div class="sx-prog" aria-hidden="true">${prog}</div><span class="count">Mission ${i + 1} sur ${ms.length}</span><span class="sp"></span><button type="button" class="b b-sm" data-act="seance-min">Quitter <span class="key">Échap</span></button></header>
      <div class="sx-stage"><section class="sx-hero${seanceLastMid && seanceLastMid !== m.id ? ' swap-in' : ''}" aria-labelledby="sx-title">
        <h1 class="sx-h1${m.fun.length > 18 ? ' long' : ''}" id="sx-title">${esc(m.fun)}</h1>
        <p class="sx-meta">${E(b.icon, 24)} ${esc(b.name)} · ${esc(m.sub)} · ${m.min} minutes</p>
        <p class="sx-lede">${esc(m.text)}</p>
        <div class="sx-clock"><span class="sx-time num" ${t && t.running ? 'data-timer' : ''}>${t ? (t.over ? '0:00' : fmt(t.left)) : fmt(m.min * 60)}</span><button type="button" class="b" data-act="seance-pause" id="sx-pause">${t && t.running ? 'Pause' : 'Reprendre'} <span class="key">Espace</span></button><span class="sx-state">${t && t.over ? 'Temps écoulé : valide quand tu as fini' : t && !t.running && !s.count ? 'En pause' : ''}</span></div>
        ${seanceTool(m)}</section>
        <div class="sx-dock"><button type="button" class="b b-gold b-big" data-act="seance-ok" id="sx-ok"${okOff ? ' aria-disabled="true"' : ''}>${m.auto ? 'Validation au jeu' : 'Validée'} <span class="key">Entrée</span></button>${g ? `<button type="button" class="b sx-gbtn" data-act="seance-guide" aria-expanded="${!!s.drawer}" aria-controls="sx-drawer">${E('scroll', 22)}<span class="lbl"> Comment bien faire l'exo</span> <span class="key">G</span></button>` : ''}${pend ? '<button type="button" class="b mob" data-act="seance-undo">Annuler</button>' : ''}</div></div>
      <section class="sx-next${s.count ? ' counting' : ''}" aria-label="À suivre"><h2 aria-hidden="true">À suivre</h2>${queue}<div class="sx-up${s.count ? ' counting' : ''}">${seanceUp(ms, r, m)}</div></section>
      ${pend && s.count ? `<div class="sx-toast" role="status"><span>Mission validée</span><button type="button" class="b b-sm" data-act="seance-undo">Annuler <span class="key">Ctrl</span><span class="key">Z</span></button></div>` : ''}
      ${g ? `<aside class="sx-drawer${s.drawer ? ' on' : ''}" id="sx-drawer" aria-label="Comment bien faire l'exo"><div class="sx-dhead"><h2>${esc(EXOS[m.exo].t)}</h2><button type="button" class="b b-sm" data-act="seance-guide">Fermer <span class="key">G</span></button></div>${guideBody(m.exo)}</aside>` : ''}
      <div class="sx-stamp" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>
    </div>`;
  }
  function seanceRecapHtml() {
    const k = today(), r = getRec(k), ms = missionsFor(k), s = ui.session, b = bossState(), art = b ? b.song : songById(st.active) || songById('hysteria'), img = songImg(art, 1200);
    const streak = Core.computeStreak(st.days, k).streak, xp = Math.max(0, st.xp - s.xp0);
    const day = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
    return `<div class="sx recap" id="sx" tabindex="-1">
      <div class="sx-art">${img ? `<img src="${esc(img)}" alt=""${artAttrs(art)} onerror="this.remove()">` : ''}</div>${img && art.art && !st.img[art.id] ? `<p class="sx-credit">${esc(art.art[1])}</p>` : ''}
      <header class="sx-top"><span class="t">Séance du jour</span><div class="sx-prog" aria-hidden="true">${ms.map((x) => `<i style="--m:${x.min};--c:${BR[x.br].color};--p:1"></i>`).join('')}</div><span class="sp"></span></header>
      <div class="sx-stage"><section class="sx-hero" tabindex="0" aria-labelledby="sx-title">
        <h1 class="sx-h1" id="sx-title">Séance terminée</h1><p class="sx-meta">${esc(day)} · ${ms.length} missions sur ${ms.length}</p>
        <div class="sx-stats"><div><b class="num">${fmt(s.played)}</b><span>temps joué</span></div><div><b class="num">+${xp} XP</b><span>missions et séance du jour</span></div><div><b class="num">${streak} jour${streak > 1 ? 's' : ''}</b><span>de série</span></div></div>
        ${b ? `<div class="sx-boss hit"><div class="bh"><b>${esc(b.song.t)} encaisse le coup</b><span>${b.first ? 'Boss final' : 'Boss'} · ${esc(b.song.a)} · ${b.hp} PV sur 100</span></div><span class="sx-hp" role="progressbar" aria-label="Points de vie du boss" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${b.hp}"><i style="width:${b.hp}%"></i></span><span class="bt">Les PV baissent quand tu franchis un palier. Prochain coup : ${esc(bossHint(b))}.</span></div>` : ''}
      </section><div class="sx-dock">${r.chest === 'ready' ? `<button type="button" class="b b-gold b-big" data-act="seance-booster">${E('wrapped-gift', 26)}<span>Ouvrir le booster<span class="lbl-long"> du jour</span></span></button>` : ''}<button type="button" class="b${r.chest === 'ready' ? '' : ' b-gold b-big'}" data-act="seance-close">Retour à l'Accueil</button></div></div>
      <section class="sx-next keep" aria-label="Missions faites">${ms.map((x) => `<div class="sx-q done"><b>${esc(x.fun)}</b><span>${esc(BR[x.br].name)} · ${x.min} min · faite</span></div>`).join('')}</section>
    </div>`;
  }
  function renderSeance() {
    const el = $('#seance'), on = seanceOn();
    document.body.classList.toggle('in-seance', on);
    if (!on) { if (!el.hidden) { el.hidden = true; el.innerHTML = ''; } seanceLastMid = null; return; }
    const a = document.activeElement, inside = el.contains(a) && a.id !== 'sx', sel = inside ? (a.id ? '#' + CSS.escape(a.id) : a.dataset && a.dataset.act ? `[data-act="${a.dataset.act}"]` + (a.dataset.v ? `[data-v="${CSS.escape(a.dataset.v)}"]` : '') : null) : null;
    const wasHidden = el.hidden, m = ui.session.view === 'full' ? seanceCur() : null;
    el.innerHTML = ui.session.view === 'recap' ? seanceRecapHtml() : seanceHtml();
    el.hidden = false; seanceLastMid = m ? m.id : null;
    const t = sel && el.querySelector(sel);
    if (t) t.focus({ preventScroll: true }); else if (wasHidden || !el.contains(document.activeElement)) { const sx = $('#sx'); if (sx) sx.focus({ preventScroll: true }); }
  }

  /* ---------- Cartes ---------- */
  function dots(n, total = 3) { return `<span class="dots" aria-hidden="true">${Array.from({ length: total }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</span>`; }
  function songCardHtml(s, mode) {
    const pi = pinfo(s.id), own = pi.owned, color = own || ui.preview || mode === 'big' || mode === 'fan', alt = isDefeated(s.id), stp = stepsOf(s.id);
    const idx = allSongs().indexOf(s) + 1, num = '#' + String(idx).padStart(3, '0') + '/' + String(allSongs().length).padStart(3, '0');
    const statsTxt = own ? 'ACQUISE' : stp < 3 ? 'ÉTAPE ' + stp + '/3' : '100 % ' + pi.n + '/3';
    const img = songImg(s, 480);
    const front = `<div class="face front"><div>
        <div class="ctop"><div class="cname">${esc(s.t)}</div><div class="badge" title="${RARITY[s.r]}">${alt ? '★' : s.r}</div></div>
        <div class="art"><div class="poster">${esc(s.t)}</div>${img ? `<img src="${esc(img)}" alt="${esc(songAlt(s))}" loading="lazy"${artAttrs(s)} onload="this.classList.add('ok')" onerror="this.remove()">` : ''}<div class="shine"></div>${s.boss === 'final' && !alt ? '<span class="flag">BOSS FINAL</span>' : s.boss === 'mini' && !own ? '<span class="flag">MINI-BOSS</span>' : st.boss.current === s.id && s.boss !== 'final' ? '<span class="flag">BOSS</span>' : ''}</div>
        <div class="meta"><div class="num">${num}</div><div class="artist">${esc(s.a)}</div></div>
        <div class="stats"><span>${statsTxt}</span>${dots(own ? 3 : stp < 3 ? stp : pi.n)}</div>
      </div></div>`;
    if (mode === 'big' || mode === 'static') return `<div class="card r${s.r}${alt ? ' alt' : ''}${color ? '' : ' todo'} ${mode}">${front}</div>`;
    if (mode === 'fan') return `<div class="slot"><div class="card r${s.r}${alt ? ' alt' : ''} static">${front}</div></div>`;
    const back = `<div class="face back"><div>
        <div class="ctop"><span class="small">${alt ? 'Alt-mythique' : RARITY[s.r]}</span><span class="small num">${num}</span></div>
        <p class="bt">${esc(s.t)}</p><div class="small">${esc(s.a)}</div>
        <div class="cell"><span>Étapes</span>${stp} sur 3</div>
        <div class="cell"><span>Passages à 100 %</span>${pi.n} sur 3 · aujourd'hui ${pi.today} sur ${PASSES_PER_DAY}</div>
        <button class="btn sm cbtn" data-act="song" data-id="${s.id}">Ouvrir la fiche</button>
        <button class="link flipback" data-act="flip" data-id="${s.id}">Retourner la carte</button>
      </div></div>`;
    /* Un vrai bouton transparent couvre le recto (clavier et lecteurs d'écran), sans contenir d'autres éléments interactifs. */
    const hit = `<button type="button" class="flip-hit" data-act="flip" data-id="${s.id}" aria-label="${esc(s.t)}, ${esc(s.a)}, ${alt ? 'Alt-mythique' : RARITY[s.r]}, ${own ? 'acquise' : 'non acquise'}. Retourner la carte"></button>`;
    return `<div class="slot"><div class="card r${s.r}${alt ? ' alt' : ''}${color ? '' : ' todo'}${ui.flipped === s.id ? ' flipped' : ''}" data-act="flip" data-id="${s.id}">${front}${back}${hit}</div></div>`;
  }
  function simpleCard(o) { // carte palier ou bonus
    return `<div class="slot"><div class="card r${o.r}${o.on ? '' : ' todo'} ${o.mode || ''}"${o.act ? ' ' + o.act + ' tabindex="0" role="button"' : ''}><div class="face front"><div>
      <div class="ctop"><div class="cname">${esc(o.t)}</div><div class="badge">${o.r}</div></div>
      <div class="art emo-art"><span class="big-emo" aria-hidden="true">${o.on ? o.e : '🔒'}</span><div class="shine"></div></div>
      <div class="meta"><div class="artist">${esc(o.s)}</div></div>
      <div class="stats"><span>${esc(o.foot)}</span></div></div></div></div></div>`;
  }
  const palierRar = (p) => (p.idx >= PALIERS[p.br].length - 1 ? 'L' : p.idx >= 4 ? 'E' : p.idx >= 2 ? 'R' : 'C');
  function palierCard(p, mode) { const on = !!st.skills[p.id]; return simpleCard({ r: palierRar(p), on, e: p.e, t: p.t, s: BR[p.br].name + ' · palier ' + (p.idx + 1), foot: on ? RARITY[palierRar(p)] : 'Verrouillée', mode }); }
  function bonusCard(b, mode) {
    const n = st.bonus[b.id] || 0, r = BONUS_RAR[b.r];
    return n ? simpleCard({ r, on: true, e: b.e, t: b.t, s: mode === 'big' ? b.d : 'Carte bonus', foot: RARITY[r] + (n > 1 ? ' ×' + n : ''), mode, act: mode ? '' : `data-act="bonus" data-id="${b.id}"` })
      : simpleCard({ r, on: false, e: '', t: '???', s: 'Dans un booster du jour', foot: RARITY[r], mode });
  }

  /* ---------- Accueil : repère des notes et manche complet (notation anglo-saxonne) ---------- */
  function repereBlock() {
    /* Vertical, comme un manche tenu tête en haut : cases de haut en bas, corde de Mi grave à gauche, La à droite. */
    const strings = [[0, 'Mi grave'], [1, 'La']];
    const frets = Array.from({ length: 13 }, (_, f) => f);
    const head = `<tr><td class="rep-c"></td>${strings.map(([s, nm]) => `<th scope="col">${'EADGBE'[s]}<span class="sr-only"> : corde de ${nm}</span></th>`).join('')}</tr>`;
    const rows = frets.map((f) => `<tr class="${f === 0 ? 'f0' : f === 1 ? 'f1' : ''}"><th scope="row" class="rep-c"><span class="sr-only">Case </span>${f}<span class="rep-dots" aria-hidden="true">${f === 12 ? '<i class="rep-dot"></i><i class="rep-dot"></i>' : [3, 5, 7, 9].includes(f) ? '<i class="rep-dot"></i>' : ''}</span></th>${strings.map(([s, nm]) => {
      const midi = Core.OPEN_MIDI[s] + f, pc = Core.mod(midi, 12), n = Core.NOTE_EN[pc], root = pc === ui.fb.root;
      /* Notes naturelles seulement (A à G), comme en mode sombre : une case vide porte un dièse ou un bémol. */
      return n.length > 1 ? '<td></td>' : `<td><button type="button" class="rn nat${root ? ' root' : ''}" data-act="pluck" data-midi="${midi}" aria-label="Corde de ${nm}, case ${f} : ${n}${root ? ', tonique de la gamme choisie' : ''}">${n}</button></td>`;
    }).join('')}</tr>`).join('');
    return `<section class="panel dark repere" aria-labelledby="rep-title"><div><div class="kicker">Repère</div><h2 class="h2" id="rep-title">Notes des cordes de Mi grave et de La</h2><p class="muted">Notes naturelles, cases 0 à 12. Pour placer la tonique d'un accord barré ou d'une gamme.</p></div>
      <div class="rep-wrap"><table class="rep"><caption class="sr-only">Notes naturelles des cordes de Mi grave et de La, cases 0 à 12 ; une case vide porte un dièse ou un bémol. Les notes se répètent ensuite.</caption><thead>${head}</thead><tbody>${rows}</tbody></table></div>
      <p class="small muted">En orange : la tonalité choisie dans le manche complet, en bas de page. Clique sur une case pour l'entendre.</p></section>`;
  }
  function mancheBlock() {
    const fb = ui.fb, sc = Core.SCALES[fb.scale], all = fb.pos.length === 5, word = sc.penta || sc.blues ? 'Position' : 'Zone';
    const which = all ? 'toutes les positions' : (fb.pos.length > 1 ? word.toLowerCase() + 's ' : word.toLowerCase() + ' ') + fb.pos.map((p) => p + 1).join(' et ');
    return `<section class="panel dark" aria-labelledby="hm-title"><div class="row between"><div><div class="kicker">Outil</div><h2 class="h2" id="hm-title">Le manche complet</h2><p class="muted">${esc(sc.name)} de ${Core.NOTE_EN[fb.root]}, ${which}</p></div><a class="link strong" href="#manche">Ouvrir dans l'onglet Manche</a></div>
      <div class="row"><label for="hm-root">Tonalité</label><select id="hm-root" data-change="fb-root">${Core.NOTE_EN.map((n, i) => `<option value="${i}"${i === fb.root ? ' selected' : ''}>${n}</option>`).join('')}</select>
        <label for="hm-scale">Gamme</label><select id="hm-scale" data-change="fb-scale">${Object.entries(Core.SCALES).map(([k, s]) => `<option value="${k}"${k === fb.scale ? ' selected' : ''}>${s.name}</option>`).join('')}</select>
        <div class="chips" role="group" aria-label="Affichage"><button class="chip${fb.labels === 'notes' ? ' on' : ''}" data-act="fb-labels" data-v="notes" aria-pressed="${fb.labels === 'notes'}">Notes</button><button class="chip${fb.labels === 'deg' ? ' on' : ''}" data-act="fb-labels" data-v="deg" aria-pressed="${fb.labels === 'deg'}">Degrés</button></div></div>
      <div class="chips" role="group" aria-label="Positions"><button class="chip${all ? ' on' : ''}" data-act="fb-all" aria-pressed="${all}">Toutes</button>${[0, 1, 2, 3, 4].map((p) => { const on = !all && fb.pos.includes(p); return `<button class="chip${on ? ' on' : ''}" data-act="fb-pos" data-p="${p}" aria-pressed="${on}" style="${on ? `background:${POS_COL[p]};border-color:${POS_COL[p]};color:#17132B` : ''}">${word} ${p + 1}</button>`; }).join('')}</div>
      <div class="fb-wrap" data-keep-scroll tabindex="0" aria-label="Manche complet, défilement horizontal">${fretboardSvg(fb, { letters: true, stringNames: true, rootAccent: true, compact: true })}</div>
      <div class="row between"><div class="legend">${[0, 1, 2, 3, 4].map((p) => `<span><i style="background:${POS_COL[p]}"></i>${word} ${p + 1}</span>`).join('')}<span><i style="background:#FF4D2E;border:3px solid #fff"></i>Tonique</span></div>
        <button class="btn gold sm" data-act="fb-play">${E('headphone', 20)} Écouter la gamme</button></div>
      <p class="small muted">Corde de Mi grave en bas, comme sur une tablature. Clique sur une note pour l'entendre. « Écouter la gamme » joue ${all ? 'la position 1' : 'la ' + word.toLowerCase() + ' ' + (Math.min(...fb.pos) + 1)} en montée puis en descente.</p></section>`;
  }

  /* ---------- Mode sombre : « Mur de cartes » (une vitrine, puis des rangées qu'on parcourt de côté) ---------- */
  const wImg = (s, w) => { const src = songImg(s, w); return src ? `<img src="${esc(src)}" alt="${esc(songAlt(s))}" loading="lazy"${artAttrs(s)} onerror="this.remove()">` : ''; };
  const wBill = (s, inner) => `<section class="w-bill">${s ? wImg(s, 1200) : ''}<div class="w-bill-in">${inner}</div></section>`;
  /* Une rangée sans bouton reste défilable au clavier (tabindex) ; avec des boutons, le focus suffit à la faire défiler. */
  const wRow = (title, count, items) => { const html = items.join(''), kb = /<(button|a)\b/.test(html) ? '' : ` tabindex="0" role="group" aria-label="${esc(title)}"`;
    return `<section class="w-row"><h2>${esc(title)}${count ? ` <span>${esc(count)}</span>` : ''}</h2><div class="w-rail"${kb}>${html}</div></section>`; };
  /* Tuile générique : bouton (act), lien (href) ou simple bloc (attrs, extra pour des boutons internes). */
  function wTile(o) {
    const tag = o.act ? 'button' : o.href ? 'a' : 'div';
    const attrs = o.act ? ` type="button" ${o.act}` : o.href ? ` href="${o.href}"` : o.attrs ? ' ' + o.attrs : '';
    return `<${tag} class="w-mt${o.cls ? ' ' + o.cls : ''}"${attrs}>${o.icon ? E(o.icon, 32, 'w-ic') : ''}${o.art || ''}<span class="w-mt-t"><b>${esc(o.t)}</b>${o.s ? `<span>${esc(o.s)}</span>` : ''}${o.p ? `<span class="w-p">${esc(o.p)}</span>` : ''}</span>`
      + (o.bar != null ? `<span class="w-bar" role="progressbar" aria-label="${esc(o.barLabel || o.t)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${o.bar}"><i style="width:${o.bar}%"></i></span>` : '') + (o.extra || '') + `</${tag}>`;
  }
  function wCard(s, focus) {
    const own = owned(s.id), alt = isDefeated(s.id), stp = stepsOf(s.id);
    const sub = own ? 'Acquise' : stp ? `Étape ${stp}/3` : RARITY[s.r];
    const flag = s.boss === 'final' && !alt ? 'Boss final' : s.boss === 'mini' && !own ? 'Mini-boss' : st.boss.current === s.id && s.boss !== 'final' ? 'Boss' : '';
    /* Le nom accessible reprend le texte visible de la carte, complété par la rareté et l'action (texte réservé aux lecteurs d'écran). */
    return `<button type="button" class="w-cd r${s.r}${own || ui.preview ? '' : ' todo'}${alt ? ' alt' : ''}${focus ? ' is-focus' : ''}" data-act="song" data-id="${s.id}">`
      + `<span class="w-poster" aria-hidden="true">${esc(s.t)}</span>${wImg(s, 480)}${flag ? `<span class="w-flag">${flag}</span>` : ''}<span class="w-cap"><b>${esc(s.t)}</b><span>${esc(s.a)} · ${sub}</span></span><span class="sr-only">, ${alt ? 'Alt-mythique' : RARITY[s.r]}${own ? '' : ', non acquise'}. Ouvrir la fiche</span></button>`;
  }
  /* Repère vertical des cordes de Mi grave et de La : notes naturelles seulement (A à G), cases 0 à 12. */
  function repereNat() {
    let rows = '';
    for (let f = 0; f <= 12; f++) {
      rows += `<tr class="${f === 0 ? 'f0' : f === 1 ? 'f1' : ''}"><th scope="row"><span class="sr-only">Case </span>${f}<span class="w-dots" aria-hidden="true">${f === 12 ? '<i></i><i></i>' : [3, 5, 7, 9].includes(f) ? '<i></i>' : ''}</span></th>`
        + [[0, 'Mi grave'], [1, 'La']].map(([s, nm]) => {
          const midi = Core.OPEN_MIDI[s] + f, pc = Core.mod(midi, 12), n = Core.NOTE_EN[pc], root = pc === ui.fb.root;
          return n.length > 1 ? '<td></td>' : `<td><button type="button" class="w-nn${root ? ' root' : ''}" data-act="pluck" data-midi="${midi}" aria-label="Corde de ${nm}, case ${f} : ${n}${root ? ', tonique de la gamme choisie' : ''}">${n}</button></td>`;
        }).join('') + '</tr>';
    }
    return `<section class="w-repere" aria-labelledby="wrep-t"><h2 id="wrep-t">Notes des cordes de Mi grave et de La</h2><p>Notes naturelles, cases 0 à 12. En orange : la tonalité du manche complet. Clique pour entendre.</p>
      <table><caption class="sr-only">Notes naturelles des cordes de Mi grave et de La, cases 0 à 12 ; une case vide porte un dièse ou un bémol.</caption><thead><tr><td></td><th scope="col">E<span class="sr-only"> : corde de Mi grave</span></th><th scope="col">A<span class="sr-only"> : corde de La</span></th></tr></thead><tbody>${rows}</tbody></table></section>`;
  }
  const wWeek = (k, s) => `<span class="w-week">${Core.weekDays(k).map((d, i) => { const rr = getRec(d); return `<i class="${rr.ok ? 'ok' : ''}${s.pausedDays.includes(d) ? ' pause' : ''}${d === k ? ' today' : ''}" title="${d}">${'LMMJVSD'[i]}</i>`; }).join('')}</span>`;
  function wallAccueil() {
    const k = today(), r = getRec(k), ms = missionsFor(k), b = bossState(), s = Core.computeStreak(st.days, k);
    const doneN = ms.filter((m) => r.done.includes(m.id)).length, next = ms.find((m) => !r.done.includes(m.id));
    const left = ms.filter((m) => !r.done.includes(m.id)).reduce((t, m) => t + m.min, 0);
    const a = songById(st.active) || songById('hysteria');
    let bill;
    if (next) {
      const br = BR[next.br], art = (next.song && songById(next.song)) || a;
      bill = wBill(art, `<h1>${esc(next.fun)}</h1><p class="w-meta"><b>Mission ${ms.indexOf(next) + 1} sur ${ms.length}</b> · ${esc(br.name)} · ${next.min} minutes · encore ${left} minutes aujourd'hui</p><p class="w-lede">${esc(next.text)}</p>
        <div class="w-acts"><button type="button" class="w-btn w-btn-1" data-act="session">${ICON_PLAY}${seanceLabel(next, doneN)}</button><button type="button" class="w-btn w-btn-2" data-act="mission-open" data-id="${next.id}">Voir la mission</button>${next.fb ? `<button type="button" class="w-btn w-btn-2" data-act="show-fb" data-fb="${esc(JSON.stringify(next.fb))}">Voir sur le manche</button>` : ''}</div>
        <p class="w-note">Plein écran : le chrono démarre après 3 secondes. Entrée valide, Espace met en pause.</p>`);
    } else {
      bill = wBill(a, `<h1>Séance terminée</h1><p class="w-meta"><b>${ms.length} missions sur ${ms.length}</b> · série de ${s.streak} jour${s.streak > 1 ? 's' : ''}</p><p class="w-lede">${r.chest === 'ready' ? 'Ton booster du jour t\'attend : ouvre-le pour gagner une carte bonus.' : 'Bravo. Reviens demain pour la séance suivante et un nouveau booster.'}</p>${r.chest === 'ready' ? `<div class="w-acts"><button type="button" class="w-btn w-btn-1" data-act="booster">${E('wrapped-gift', 22)}Ouvrir le booster</button></div>` : ''}`);
    }
    const tiles = ms.map((m) => { const br = BR[m.br], done = r.done.includes(m.id), cur = next && m.id === next.id; return wTile({ act: `data-act="mission-open" data-id="${m.id}"`, icon: br.icon, t: m.fun, s: `${br.name} · ${done ? 'faite' : m.min + ' min'}`, p: m.sub, cls: (done ? 'done' : '') + (cur ? ' is-focus' : '') + (cur && ui.session ? ' live' : '') }); });
    tiles.push(r.chest === 'ready' ? wTile({ act: 'data-act="booster"', icon: 'wrapped-gift', t: 'Booster du jour prêt', s: 'Ouvre-le pour gagner une carte', cls: 'gold' })
      : r.chest === 'opened' ? wTile({ icon: 'wrapped-gift', t: 'Booster ouvert', s: 'Reviens demain pour le suivant', cls: 'done', attrs: 'tabindex="-1" data-focus-after="booster"' })
        : wTile({ icon: 'wrapped-gift', t: 'Booster du jour', s: `${doneN} mission${doneN > 1 ? 's' : ''} sur ${ms.length}`, bar: Math.round(100 * doneN / ms.length), barLabel: 'Missions faites pour ouvrir le booster' }));
    const lt = st.lastTrophy && TROPHIES.find((t) => t.id === st.lastTrophy);
    const now = [wCard(a, true),
      b ? wTile({ act: `data-act="song" data-id="${b.id}"`, icon: b.first ? 'fox' : 'dragon-face', t: `${b.song.t} · ${b.song.a}`, s: `${b.first ? 'Boss final' : 'Boss'} · ${b.hp} PV sur 100`, p: 'Prochain coup : ' + bossHint(b), bar: b.hp, barLabel: 'Points de vie du boss' })
        : wTile({ act: 'data-act="next-boss"', icon: 'crown', t: 'Choisir le prochain boss', s: 'Boss vaincu' }),
      wTile({ attrs: 'role="group" aria-label="Ta semaine"', icon: 'fire', t: `Série de ${s.streak} jour${s.streak > 1 ? 's' : ''}`, s: s.jokerUsed ? 'Jour de pause utilisé cette semaine' : 'Jour de pause disponible cette semaine', extra: wWeek(k, s) }),
      wTile({ href: '#trophees', icon: lt ? lt.e : 'trophy', t: lt ? lt.n : 'Aucun trophée pour l\'instant', s: lt ? 'Dernier trophée' : 'Termine une séance complète', p: lt ? lt.g : '' })];
    const quick = [['metro', 'stopwatch', 'Métronome', Sound.metro.bpm + ' bpm'], ['tuner', 'microphone', 'Accordeur', MIC_OK ? 'Micro' : 'Micro indisponible'], ['manche', 'world-map', 'Manche', 'Gammes et positions'],
      ['oreille', 'ear', 'Jeu d\'oreille', 'Record : ' + Object.values(st.ear.best || {}).reduce((m, v) => Math.max(m, v), 0)], ['jam', 'game-die', 'Boucle d\'impro', 'La mineur'], ['check', 'bullseye', 'Contrôle de gamme', 'Micro, note par note']]
      .map(([id, ic, t, sub]) => wTile({ act: `data-act="quick" data-q="${id}"`, icon: ic, t, s: sub }));
    const pal = BRANCHES.map((br) => { const i = curIdx(br.id), L = PALIERS[br.id]; return i < L.length ? wTile({ href: '#paliers', icon: br.icon, t: L[i].t, s: `${br.name} · palier ${i + 1} sur ${L.length}`, p: 'Test : ' + L[i].test }) : ''; }).filter(Boolean);
    const songs = allSongs(), mine = songs.filter((x) => owned(x.id) || stepsOf(x.id) || pinfo(x.id).n);
    const coll = (mine.length >= 6 ? mine : mine.concat(songs.filter((x) => !mine.includes(x)).slice(0, 8 - mine.length))).map((x) => wCard(x));
    return `<div class="w-home"><div class="w-side">${repereNat()}</div><div class="w-main">${bill}<div class="w-wall">`
      + wRow('Ta séance', next ? `${left} minutes restantes` : 'terminée', tiles) + wRow('En ce moment', 'carte en cours, boss, semaine', now) + wRow('Outils', '', quick)
      + (pal.length ? wRow('Paliers à franchir', 'un par branche', pal) : '') + wRow('Ta collection', `${songs.filter((x) => owned(x.id)).length} / ${songs.length} morceaux`, coll)
      + `</div>${mancheBlock()}</div></div>`;
  }
  function wallCollection() {
    const songs = allSongs(), nS = songs.filter((x) => owned(x.id)).length, nP = skillsDone(), nB = BONUS.filter((x) => st.bonus[x.id]).length;
    const keep = (x) => ui.rar === 'all' || x.r === ui.rar;
    const a = songById(st.active) || songById('hysteria'), pa = pinfo(a.id), sa = stepsOf(a.id);
    const lede = owned(a.id) ? 'Carte acquise. Choisis une autre carte en cours depuis sa fiche.' : sa < 3 ? `Étape ${sa + 1} sur 3 : « ${esc((a.ear ? STEPS_EAR : STEPS_SONG)[sa])} ».` : `Étapes réussies. Passages en entier à 100 % : ${pa.n} sur ${PASSES_NEEDED}.`;
    const bill = wBill(a, `<h1>${esc(a.t)}</h1><p class="w-meta"><b>${esc(a.a)}</b> · ${RARITY[a.r]} · carte en cours</p><p class="w-lede">${lede}</p>
      <div class="w-acts"><button type="button" class="w-btn w-btn-1" data-act="song" data-id="${a.id}">${E('card-file-box', 22)}Ouvrir la fiche</button><button type="button" class="w-btn w-btn-2" data-act="add-song">Ajouter un morceau</button></div>
      <p class="w-note"><b class="num">${nS}</b> / ${songs.length} morceaux · <b class="num">${nP}</b> / ${ALL_PAL.length} paliers · <b class="num">${nB}</b> / ${BONUS.length} bonus</p>`);
    const chips = `<div class="w-filters" role="group" aria-label="Filtrer les morceaux par rareté">${[['all', 'Toutes'], ...Object.entries(RARITY)].map(([key, n]) => `<button type="button" data-act="rar" data-v="${key}" aria-pressed="${ui.rar === key}">${n}</button>`).join('')}<button type="button" data-act="preview" aria-pressed="${ui.preview}">Aperçu : tout en couleur</button></div>`;
    const rows = [], plural = (n, w) => `${n} ${w}${n > 1 ? 's' : ''}`;
    const started = songs.filter((x) => keep(x) && !owned(x.id) && (stepsOf(x.id) || pinfo(x.id).n));
    if (started.length) rows.push(wRow('Presque acquises', plural(started.length, 'carte') + ' commencée' + (started.length > 1 ? 's' : ''), started.map((x, i) => wCard(x, i === 0))));
    const got = songs.filter((x) => keep(x) && owned(x.id));
    if (got.length) rows.push(wRow('Acquises', plural(got.length, 'carte'), got.map((x) => wCard(x))));
    for (const rr of ['M', 'L', 'E', 'R', 'C']) {
      if (ui.rar !== 'all' && ui.rar !== rr) continue;
      const list = SONGS.filter((x) => x.r === rr);
      if (list.length) rows.push(wRow(rr === 'M' ? 'Mythique' : RARITY[rr] + 's', plural(list.length, 'carte'), list.map((x) => wCard(x))));
    }
    rows.push(wRow('Tes morceaux', 'ajoutés par toi', (st.custom || []).filter(keep).map((x) => wCard(x)).concat([wTile({ act: 'data-act="add-song"', icon: 'sparkles', t: 'Ajouter un morceau', s: 'Titre, artiste, difficulté' })])));
    rows.push(wRow('Cartes de paliers', `${nP} / ${ALL_PAL.length}`, ALL_PAL.map((p) => { const on = !!st.skills[p.id]; return wTile({ cls: `w-pc r${palierRar(p)}${on ? '' : ' todo'}`, art: on ? `<span class="w-emo" aria-hidden="true">${p.e}</span>` : E('locked', 40, 'w-lock'), t: p.t, s: `${BR[p.br].name} · palier ${p.idx + 1}${on ? '' : ' · verrouillée'}` }); })));
    rows.push(wRow('Cartes bonus', `${nB} / ${BONUS.length}`, BONUS.map((x) => { const n = st.bonus[x.id] || 0, rr = BONUS_RAR[x.r]; return n ? wTile({ act: `data-act="bonus" data-id="${x.id}"`, cls: `w-pc r${rr}`, art: `<span class="w-emo" aria-hidden="true">${x.e}</span>`, t: x.t, s: RARITY[rr] + (n > 1 ? ' ×' + n : '') }) : wTile({ cls: `w-pc r${rr} todo`, art: E('locked', 40, 'w-lock'), t: '???', s: `${RARITY[rr]} · dans un booster du jour` }); })));
    return `${bill}${chips}<div class="w-wall">${rows.join('')}</div><p class="w-foot">Une carte reste grisée tant que le morceau n'a pas été joué ${PASSES_NEEDED} fois en entier à 100 % du tempo (${PASSES_PER_DAY} passages par jour au plus), après ses 3 étapes. Illustrations : œuvres du domaine public, via Wikimedia Commons.</p>`;
  }
  function wPalierActs(p) {
    let h = '';
    if (p.fb) h += `<button type="button" class="w-btn w-btn-2 sm" data-act="show-fb" data-fb="${esc(JSON.stringify(p.fb))}">Voir sur le manche</button>`;
    if (p.br === 'ore' && p.idx < 4) h += `<button type="button" class="w-btn w-btn-2 sm" data-act="go-ear" data-mode="${earPreset(p.idx)[0]}" data-level="${earPreset(p.idx)[1]}">Ouvrir le jeu</button>`;
    h += ui.armed === p.id ? `<button type="button" class="w-btn w-btn-ok sm" data-act="palier-ok" data-id="${p.id}">Confirmer : test réussi</button><button type="button" class="w-btn w-btn-2 sm" data-act="disarm">Pas encore</button>`
      : `<button type="button" class="w-btn w-btn-1 sm" data-act="arm" data-id="${p.id}">J'ai réussi le test</button>`;
    return `<span class="w-acts">${h}</span>`;
  }
  function wallPaliers() {
    const b = bossState(), pending = BRANCHES.map((br) => ALL_PAL.find((p) => p.br === br.id && p.idx === curIdx(br.id))).filter(Boolean).sort((x, y) => x.idx - y.idx), top = pending[0];
    const bill = top ? wBill(b ? b.song : null, `<h1>${esc(top.t)}</h1><p class="w-meta"><b>${esc(BR[top.br].name)}</b> · palier ${top.idx + 1} sur ${PALIERS[top.br].length} · le plus utile contre le boss</p><p class="w-lede">${esc(top.d)}</p><p class="w-lede"><b>Test :</b> ${esc(top.test)}</p>${wPalierActs(top).replace('class="w-acts"', 'class="w-acts" id="bill-acts"')}<p class="w-note">C'est toi le jury : sois honnête, le boss ne se laisse pas tromper.</p>`)
      : wBill(b ? b.song : null, '<h1>Tous les paliers sont franchis</h1><p class="w-lede">Il ne reste que le boss.</p>');
    const rows = BRANCHES.map((br) => {
      const L = PALIERS[br.id], ci = curIdx(br.id);
      return wRow(br.name, `${ci} / ${L.length} · ${br.tag}`, L.map((p, i) => {
        if (i < ci) return wTile({ icon: i === 0 ? br.icon : null, t: p.t, s: 'Franchi', cls: 'done', extra: i === ci - 1 ? `<button type="button" class="w-link" data-act="palier-undo" data-id="${p.id}">Annuler ce palier</button>` : '' });
        if (i === ci) return wTile({ icon: br.icon, t: p.t, s: 'Prochain test', p: 'Test : ' + p.test, cls: 'is-focus w-wide', extra: p === top ? '' : wPalierActs(p) });
        return wTile({ t: p.t, s: 'Verrouillé', cls: 'lock' });
      }));
    });
    return `${bill}<div class="w-wall">${rows.join('')}</div>`;
  }
  function wallTrophees() {
    const f = facts(), a = songById(st.active) || songById('hysteria');
    const all = TROPHIES.map((t) => { const [v, g] = t.p(f); return { t, own: !!st.trophies[t.id], v, g, pct: Math.round(100 * Math.min(1, v / g)), hid: t.hidden && !st.trophies[t.id] }; });
    const got = all.filter((x) => x.own), todo = all.filter((x) => !x.own && !x.hid).sort((p, q) => q.pct - p.pct), hidden = all.filter((x) => x.hid), top = todo[0];
    const bill = top ? wBill(a, `<h1>${esc(top.t.n)}</h1><p class="w-meta"><b>${TIER[top.t.tier].n}</b> · le trophée le plus proche · <span class="num">${top.v} / ${top.g}</span></p><p class="w-lede">${esc(top.t.g)}.</p><span class="w-bar big" role="progressbar" aria-label="${esc(top.t.n)}" aria-valuemin="0" aria-valuemax="${top.g}" aria-valuenow="${top.v}"><i style="width:${top.pct}%"></i></span><p class="w-note">${got.length} trophée${got.length > 1 ? 's' : ''} sur ${TROPHIES.length} obtenu${got.length > 1 ? 's' : ''}.</p>`)
      : wBill(a, `<h1>Tous les trophées visibles sont à toi</h1><p class="w-lede">${hidden.length ? 'Les trophées cachés se dévoilent pendant le combat contre le boss.' : 'Collection complète.'}</p>`);
    const tile = (x) => wTile({ icon: x.t.e, t: x.t.n, s: `${TIER[x.t.tier].n}${x.own ? ' · obtenu' : ' · ' + x.v + ' / ' + x.g}`, p: x.t.g, bar: x.own ? null : x.pct, barLabel: x.t.n, cls: 'tier-' + x.t.tier + (x.own ? ' own' : '') });
    return `${bill}<div class="w-wall">${(got.length ? wRow('Obtenus', `${got.length} sur ${TROPHIES.length}`, got.map(tile)) : '') + (todo.length ? wRow('À débloquer', 'du plus proche au plus lointain', todo.map(tile)) : '')
      + (hidden.length ? wRow('Cachés', 'se dévoilent pendant le combat contre le boss', hidden.map(() => wTile({ icon: 'locked', t: 'Trophée caché', s: '?', cls: 'lock' }))) : '')}</div>`;
  }
  function wallProgres(li, s, b) {
    const k = today(), last = allSongs().filter((x) => owned(x.id)).pop() || songById(st.active) || songById('hysteria');
    const next = (Core.RANKS.find((r) => r[0] > li.level) || ['max'])[0];
    return wBill(last, `<h1>${esc(Core.rankFor(li.level))}</h1><p class="w-meta"><b class="num">Niveau ${li.level} · ${li.into} / ${li.need} XP</b> · série de ${s.streak} jour${s.streak > 1 ? 's' : ''} · prochain rang au niveau ${next}</p><span class="w-bar big" role="progressbar" aria-label="Expérience" aria-valuemin="0" aria-valuemax="${li.need}" aria-valuenow="${li.into}"><i style="width:${(100 * li.into / li.need).toFixed(1)}%"></i></span>`)
      + `<div class="w-wall">${wRow('Tes chiffres', '', [wTile({ icon: 'sparkles', t: `${st.xp} XP`, s: 'au total' }), wTile({ icon: 'fire', t: `${s.streak} jour${s.streak > 1 ? 's' : ''}`, s: 'de série' }), wTile({ icon: '1st-place-medal', t: `${Math.max(st.best || 0, s.streak)} jours`, s: 'record de série' }),
        wTile({ icon: 'check-mark-button', t: `${Object.values(st.days).filter((d) => d.ok).length} jours`, s: 'validés' }), wTile({ icon: 'chart-increasing', t: `${skillsDone()} / ${ALL_PAL.length}`, s: 'paliers' }), wTile({ icon: b ? 'fox' : 'crown', t: `${b ? b.hp : 0} PV`, s: 'restants au boss' })])
        + wRow('Cette semaine', s.jokerUsed ? 'jour de pause utilisé' : 'un jour de pause disponible', Core.weekDays(k).map((d, i) => { const rr = getRec(d); return wTile({ t: 'LMMJVSD'[i], s: rr.ok ? 'Validé' : d === k ? `Aujourd'hui · ${rr.done.length} mission${rr.done.length > 1 ? 's' : ''}` : d < k ? (s.pausedDays.includes(d) ? 'Pause' : 'Manqué') : 'À venir', cls: 'w-day' + (rr.ok ? ' done' : '') + (d === k ? ' is-focus' : '') + (d > k ? ' lock' : '') }); }))}</div>`;
  }

  /* ---------- Vue : accueil ---------- */
  function viewAccueil() {
    const k = today(), r = getRec(k), ms = missionsFor(k), b = bossState(), s = Core.computeStreak(st.days, k), li = Core.levelInfo(st.xp);
    const doneN = ms.filter((m) => r.done.includes(m.id)).length, allDone = doneN === ms.length;
    const bannerSong = st.banner && songById(st.banner);
    const hello = st.name ? `Salut ${esc(st.name)}, on branche ?` : 'Salut, on branche ?';
    /* Trois cartes en éventail (décoratives) : morceau du boss, morceau actif, dernière carte obtenue. */
    const lastOwned = allSongs().filter((x) => owned(x.id)).map((x) => [x, (st.passes[x.id] || []).slice().sort().pop() || '']).sort((p, q) => (p[1] < q[1] ? 1 : -1))[0];
    const lastBonusId = Object.keys(st.bonus).filter((id) => st.bonus[id]).pop(), lastBonus = lastBonusId && BONUS.find((x) => x.id === lastBonusId);
    const fanIds = [b && b.id, st.active].filter((id, i, arr) => id && songById(id) && arr.indexOf(id) === i);
    const fanHtml = fanIds.map((id) => songCardHtml(songById(id), 'fan'));
    if (lastOwned && !fanIds.includes(lastOwned[0].id)) fanHtml.push(songCardHtml(lastOwned[0], 'fan'));
    else if (lastBonus) fanHtml.push(bonusCard(lastBonus, 'static'));
    const fan = fanHtml.length ? `<div class="fan" aria-hidden="true">${fanHtml.slice(0, 3).map((h, i, a) => `<div class="fanc f${a.length === 1 ? 1 : a.length === 2 ? i * 2 : i}">${h}</div>`).join('')}</div>` : '';
    const banner = bannerSong
      ? `<section class="banner won">${songImg(bannerSong, 1200) ? `<img src="${esc(songImg(bannerSong, 1200))}" alt="${esc(songAlt(bannerSong))}"${artAttrs(bannerSong)} onerror="this.remove()">` : ''}<div class="banner-in"><div><div class="kicker">Bannière · ${esc(bannerSong.t)}</div><h1>${hello}</h1><p>Boss vaincu${st.boss.defeated.length > 1 ? 's : ' + st.boss.defeated.length : ''}. ${b ? 'Prochain boss : ' + esc(b.song.t) + '.' : 'Choisis ton prochain boss.'}</p></div>${fan || E('crown', 64)}</div></section>`
      : `<section class="banner"><div class="banner-in"><div><div class="kicker">Bannière · ${esc(Core.rankFor(li.level))}</div><h1>${hello}</h1><p>${b ? 'Bats ' + esc(b.song.t) + ' pour débloquer sa bannière.' : 'Choisis ton prochain boss.'}</p></div>${fan || `<div class="banner-emo">${E('musical-notes', 60)}${E('guitar', 60)}${E('high-voltage', 60)}</div>`}</div></section>`;
    const liveId = ui.session ? (ms.find((m) => !r.done.includes(m.id)) || {}).id : null;
    const tiles = ms.map((m) => {
      const br = BR[m.br], done = r.done.includes(m.id);
      return `<button class="mtile${done ? ' done' : ''}${m.id === liveId ? ' live' : ''}" style="--soft:${br.soft};--col:${br.color}" data-act="mission-open" data-id="${m.id}">
        <span class="mic">${done ? E('check-mark-button', 32) : E(br.icon, 32)}</span>
        <span class="mtxt"><b>${esc(m.fun)}</b><span>${esc(br.name)} · ${esc(m.sub)}</span></span>
        <span class="mmin">${done ? 'Fait' : m.min + ' min'}</span></button>`;
    }).join('');
    const sessBtn = allDone ? `<span class="pill good">${E('check-mark-button', 18)} Session terminée</span>`
      : `<button class="btn big" data-act="session">${E('person-running', 26)} ${seanceLabel(missionsFor(today()).find((x) => !getRec(today()).done.includes(x.id)), doneN)}</button>`;
    const chest = r.chest === 'ready' ? `<button class="booster ready" data-act="booster">${E('wrapped-gift', 40)}<span><b>Booster du jour prêt</b><span>Ouvre-le pour gagner une carte bonus</span></span></button>`
      : r.chest === 'opened' ? `<div class="booster" tabindex="-1" data-focus-after="booster">${E('wrapped-gift', 32)}<span><b>Booster ouvert</b><span>Reviens demain pour le suivant</span></span></div>`
        : `<div class="booster dim">${E('wrapped-gift', 32)}<span><b>Booster du jour</b><span>${doneN}/${ms.length} missions : termine-les toutes pour l'ouvrir</span></span></div>`;
    const date = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    const bossPanel = b
      ? `<section class="boss"><div class="bosstop"><div><div class="kicker">${b.first ? 'Boss final' : 'Boss'}</div><h2>${esc(b.song.t)}</h2><div>${esc(b.song.a)}</div></div>${E(b.first ? 'fox' : 'dragon-face', 72)}</div>
        <div class="hpline"><span class="hpn num">${b.hp}</span><span>PV sur 100</span></div>
        <div class="hp" role="progressbar" aria-label="Points de vie du boss" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${b.hp}"><i style="width:${b.hp}%"></i></div>
        <p>Prochain coup : ${esc(bossHint(b))}.</p><button class="btn ghost-w sm" data-act="song" data-id="${b.id}">Voir la carte du boss</button></section>`
      : `<section class="boss"><div class="bosstop"><div><div class="kicker">Boss vaincu</div><h2>Qui sera le prochain ?</h2></div>${E('crown', 72)}</div><p>Choisis un morceau de ta collection, ou ajoute-en un nouveau.</p><button class="btn ghost-w" data-act="next-boss">Choisir le prochain boss</button></section>`;
    const quick = [['metro', 'stopwatch', '#FFEFBF', 'Métronome', Sound.metro.bpm + ' bpm'], ['tuner', 'microphone', '#DBE7FF', 'Accordeur', MIC_OK ? 'Micro' : 'Micro indisponible'], ['manche', 'world-map', '#D5F5EE', 'Manche', 'Gammes et positions'],
      ['oreille', 'ear', '#F8DDF2', 'Jeu d\'oreille', 'Record : ' + Object.values(st.ear.best || {}).reduce((m, v) => Math.max(m, v), 0)], ['jam', 'game-die', '#FFE1DA', 'Boucle d\'impro', 'La mineur'], ['check', 'bullseye', '#E3DFFF', 'Contrôle de gamme', 'Micro, note par note']]
      .map(([id, ic, bg, t, sub]) => `<button class="qtile" style="--bg:${bg}" data-act="quick" data-q="${id}">${E(ic, 44)}<span><b>${t}</b><span>${esc(sub)}</span></span></button>`).join('');
    const wk = Core.weekDays(k).map((d, i) => { const rr = getRec(d), p = s.pausedDays.includes(d); return `<div class="day${rr.ok ? ' ok' : ''}${p ? ' pause' : ''}${d === k ? ' today' : ''}" title="${d}">${'LMMJVSD'[i]}</div>`; }).join('');
    const lt = st.lastTrophy && TROPHIES.find((t) => t.id === st.lastTrophy);
    const a = songById(st.active) || songById('hysteria');
    /* Le repère est à gauche du bloc central sur grand écran (dans la marge à partir de 1660 px) ; sur téléphone il reste sous la bannière (même ordre dans le code). */
    return `${banner}
      <div class="home-grid"><div class="home-side">${repereBlock()}</div><div class="home-main">
      <div class="row2">
        <section class="panel session">
          <div class="sesshead"><div><div class="kicker muted">${esc(date)}</div><h1 class="h1">Session du jour</h1><p class="muted">${ms.length} exercices, ${ms.reduce((t, m) => t + m.min, 0)} minutes. Un clic et le chrono s'enchaîne tout seul.</p></div>${sessBtn}</div>
          <div class="mtiles">${tiles}</div>
          ${chest}
        </section>
        ${bossPanel}
      </div>
      <section><h2 class="h2">Accès rapide</h2><div class="qtiles">${quick}</div></section>
      <div class="row3">
        <section class="panel"><h2 class="h3">Ta semaine</h2><div class="week">${wk}</div><p class="small muted">${s.jokerUsed ? 'Jour de pause utilisé cette semaine.' : 'Jour de pause disponible cette semaine.'} ${(r.short !== undefined ? r.short : st.short) ? 'Mode partiels actif.' : ''}</p></section>
        <section class="panel yellow"><h2 class="h3">Dernier trophée</h2>${lt ? `<div class="tline">${E(lt.e, 56)}<div><b>${esc(lt.n)}</b><div class="small">${esc(lt.g)}</div></div></div>` : `<div class="tline">${E('trophy', 56)}<div><b>Aucun pour l'instant</b><div class="small">Termine une session complète pour le premier.</div></div></div>`}<a href="#trophees" class="small strong">Voir les ${TROPHIES.length} trophées</a></section>
        <section class="panel cur"><div class="curcard">${songCardHtml(a, 'static')}</div><div><h2 class="h3">Carte en cours</h2><p class="small muted">${owned(a.id) ? esc(a.t) + ' est acquise. Choisis une autre carte en cours dans la collection.' : `${esc(a.t)} : étape ${stepsOf(a.id)}/3, ${pinfo(a.id).n}/3 passages à 100 %.`}</p><button class="link strong" data-act="song" data-id="${a.id}">Ouvrir la fiche</button></div></section>
      </div>
      ${mancheBlock()}</div></div>`;
  }

  /* ---------- Vue : paliers ---------- */
  function viewPaliers() {
    return `<section class="pagehead"><div><div class="kicker muted">Progression</div><h1 class="h1">Paliers</h1><p class="muted">Un palier se valide quand tu réussis son test. C'est toi le jury : sois honnête, le boss ne se laisse pas tromper.</p></div></section>
      <div class="branches">${BRANCHES.map((b) => {
        const list = PALIERS[b.id], ci = curIdx(b.id);
        return `<section class="panel branch" style="--col:${b.color};--soft:${b.soft}"><div class="bhead">${E(b.icon, 34)}<div><h2 class="h3">${esc(b.name)}</h2><div class="small muted">${esc(b.tag)}</div></div><span class="pill num">${ci}/${list.length}</span></div>
        <ol class="steps">${list.map((p, i) => {
          const state = i < ci ? 'done' : i === ci ? 'cur' : 'lock';
          let body = `<div class="st-t">${esc(p.t)}</div>`;
          if (state === 'cur') {
            body += `<p class="small">${esc(p.d)}</p><div class="test"><b>Test :</b> ${esc(p.test)}</div><div class="row">`;
            if (p.fb) body += `<button class="btn ghost sm" data-act="show-fb" data-fb="${esc(JSON.stringify(p.fb))}">Voir sur le manche</button>`;
            if (b.id === 'ore' && i < 4) body += `<button class="btn ghost sm" data-act="go-ear" data-mode="${earPreset(i)[0]}" data-level="${earPreset(i)[1]}">Ouvrir le jeu</button>`;
            body += ui.armed === p.id ? `<button class="btn ok sm" data-act="palier-ok" data-id="${p.id}">Confirmer : test réussi</button><button class="link" data-act="disarm">Pas encore</button>` : `<button class="btn sm" data-act="arm" data-id="${p.id}">J'ai réussi le test</button>`;
            body += '</div>';
          } else if (state === 'done' && i === ci - 1) body += `<button class="link" data-act="palier-undo" data-id="${p.id}">Annuler ce palier</button>`;
          return `<li class="step ${state}"><span class="n">${state === 'done' ? '✓' : i + 1}</span><div class="st-b">${body}</div></li>`;
        }).join('')}</ol></section>`;
      }).join('')}</div>`;
  }

  /* ---------- Vue : collection ---------- */
  function viewCollection() {
    const songs = allSongs(), nS = songs.filter((s) => owned(s.id)).length, nP = skillsDone(), nB = BONUS.filter((b) => st.bonus[b.id]).length;
    let grid = '';
    if (ui.colTab === 'songs') {
      grid = songs.filter((s) => ui.rar === 'all' || s.r === ui.rar).map((s) => songCardHtml(s)).join('')
        + `<div class="slot"><button class="card addcard" data-act="add-song">${E('sparkles', 48)}<b>Ajouter un morceau</b><span>Titre, artiste, difficulté</span></button></div>`;
    } else if (ui.colTab === 'paliers') grid = ALL_PAL.map((p) => palierCard(p)).join('');
    else grid = BONUS.map((b) => bonusCard(b)).join('');
    const filters = ui.colTab === 'songs' ? `<div class="chips">${[['all', 'Toutes'], ...Object.entries(RARITY)].map(([k, n]) => `<button class="chip${ui.rar === k ? ' on' : ''}" data-act="rar" data-v="${k}">${k === 'all' ? n : k + ' · ' + n}</button>`).join('')}<button class="chip${ui.preview ? ' on' : ''}" data-act="preview" aria-pressed="${ui.preview}">Aperçu : tout en couleur</button></div>
      <p class="small muted">Une carte reste grisée tant que le morceau n'a pas été joué ${PASSES_NEEDED} fois en entier à 100 % du tempo, à raison de ${PASSES_PER_DAY} passages maximum par jour, après ses 3 étapes. La rareté dépend de la difficulté. Clique sur une carte pour la retourner, puis clique dessus une deuxième fois pour ouvrir sa fiche.</p>` : '';
    return `<section class="pagehead"><div><div class="kicker muted">Album</div><h1 class="h1">Ma collection</h1></div>
        <div class="counts"><div><b class="num">${nS}</b><span>/ ${songs.length} morceaux</span></div><div><b class="num">${nP}</b><span>/ ${ALL_PAL.length} paliers</span></div><div><b class="num">${nB}</b><span>/ ${BONUS.length} bonus</span></div></div></section>
      <div class="tabs" role="tablist">${[['songs', 'Morceaux'], ['paliers', 'Paliers'], ['bonus', 'Bonus']].map(([k, n]) => `<button role="tab" aria-selected="${ui.colTab === k}" class="tab${ui.colTab === k ? ' on' : ''}" data-act="coltab" data-v="${k}">${n}</button>`).join('')}</div>
      ${filters}<div class="cards">${grid}</div>
      <p class="small muted">Illustrations : œuvres du domaine public, via Wikimedia Commons. L'œuvre de chaque carte est indiquée dans sa fiche.</p>`;
  }

  /* ---------- Vue : trophées ---------- */
  function viewTrophees() {
    const f = facts(), got = TROPHIES.filter((t) => st.trophies[t.id]).length;
    return `<section class="pagehead"><div><div class="kicker muted">Accomplissements</div><h1 class="h1">Trophées</h1></div><div class="counts"><div><b class="num">${got}</b><span>sur ${TROPHIES.length} obtenus</span></div></div></section>
      <div class="trophies">${TROPHIES.map((t) => {
        const own = !!st.trophies[t.id], [v, g] = t.p(f), hid = t.hidden && !own;
        const pct = Math.round(100 * Math.min(1, v / g));
        return `<div class="trophy${own ? ' own' : ''}"><div class="tt"><span class="medal" style="--m:${own ? TIER[t.tier].c : '#ECEAF4'}">${hid ? E('locked', 28) : E(t.e, 30)}</span><div><b>${hid ? 'Trophée caché' : esc(t.n)}</b><div class="small muted">${TIER[t.tier].n}</div></div></div>
          <p class="small">${hid ? 'Se dévoile pendant le combat contre le boss.' : esc(t.g)}</p>
          <div class="tbar"><span class="bar" role="progressbar" aria-label="${esc(t.n)}" aria-valuemin="0" aria-valuemax="${g}" aria-valuenow="${hid ? 0 : v}"><i style="width:${hid ? 0 : pct}%"></i></span><b class="small num">${own ? 'Obtenu' : hid ? '?' : v + ' / ' + g}</b></div></div>`;
      }).join('')}</div>`;
  }

  /* ---------- Vue : progrès ---------- */
  function radarSvg() {
    const S = 260, SW = 380, c = S / 2, R = 92, pt = (i, v) => { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; return [SW / 2 + Math.cos(a) * R * v, c + 6 + Math.sin(a) * R * v]; };
    let o = `<svg class="chart" viewBox="0 0 ${SW} ${S}" width="${SW}" height="${S}" role="img" aria-label="Avancement par branche">`;
    for (const v of [0.25, 0.5, 0.75, 1]) o += `<polygon points="${[0, 1, 2, 3, 4].map((i) => pt(i, v).map((n) => n.toFixed(1)).join(',')).join(' ')}" fill="none" stroke="#E3E1EE"/>`;
    const vals = BRANCHES.map((b) => curIdx(b.id) / PALIERS[b.id].length);
    o += `<polygon points="${vals.map((v, i) => pt(i, Math.max(0.04, v)).map((n) => n.toFixed(1)).join(',')).join(' ')}" fill="rgba(91,75,255,.18)" stroke="#5B4BFF" stroke-width="2.5"/>`;
    BRANCHES.forEach((b, i) => { const [x, y] = pt(i, 1.24), [dx, dy] = pt(i, Math.max(0.04, vals[i])); o += `<circle cx="${dx.toFixed(1)}" cy="${dy.toFixed(1)}" r="5" fill="${b.color}"/><text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" dominant-baseline="central" fill="${b.color}">${esc(b.name.split(' ')[0])} ${curIdx(b.id)}/${PALIERS[b.id].length}</text>`; });
    return o + '</svg>';
  }
  function bpmSvg() {
    const data = (st.bpm[ui.bpmExo] || []).slice(-30);
    if (!data.length) return '<p class="muted small">Aucune mesure pour cet exercice. Note ton tempo propre en validant une mission Vitesse.</p>';
    const W = 560, H = 200, L = 40, Rm = 46, T = 16, B = 28, vs = data.map((d) => d[1]);
    let lo = Math.min(...vs), hi = Math.max(...vs); if (hi - lo < 20) { const m = (hi + lo) / 2; lo = Math.floor(m - 10); hi = Math.ceil(m + 10); }
    lo = Math.floor(lo / 10) * 10; hi = Math.ceil(hi / 10) * 10;
    const x = (i) => (data.length === 1 ? (L + W - Rm) / 2 : L + i * (W - L - Rm) / (data.length - 1)), y = (v) => T + (hi - v) * (H - T - B) / (hi - lo);
    let o = `<svg class="chart" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Tempo propre atteint, ${esc(EXOS[ui.bpmExo].t)}">`;
    for (let i = 0; i <= 2; i++) { const v = lo + (hi - lo) * i / 2; o += `<line x1="${L}" x2="${W - Rm}" y1="${y(v)}" y2="${y(v)}" stroke="#E3E1EE"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${Math.round(v)}</text>`; }
    const pts = data.map((d, i) => `${x(i).toFixed(1)},${y(d[1]).toFixed(1)}`), li = data.length - 1;
    if (data.length > 1) o += `<polygon points="${L},${H - B} ${pts.join(' ')} ${x(li).toFixed(1)},${H - B}" fill="rgba(217,66,61,.12)"/><polyline points="${pts.join(' ')}" fill="none" stroke="#C22B26" stroke-width="3" stroke-linejoin="round"/>`;
    o += `<circle cx="${x(li)}" cy="${y(data[li][1])}" r="6" fill="#C22B26" stroke="#fff" stroke-width="2"/><text x="${x(li) + 10}" y="${y(data[li][1]) + 4}" class="endv">${data[li][1]}</text>`;
    const lab = (k) => k.slice(8) + '/' + k.slice(5, 7);
    o += `<text x="${L}" y="${H - 8}">${lab(data[0][0])}</text>`; if (data.length > 1) o += `<text x="${W - Rm}" y="${H - 8}" text-anchor="end">${lab(data[li][0])}</text>`;
    return o + '</svg>';
  }
  function viewProgres() {
    const li = Core.levelInfo(st.xp), s = Core.computeStreak(st.days, today()), k = today(), u = Cloud.user;
    const start = Core.addDays(Core.weekDays(k)[0], -28);
    let cal = ''; for (let i = 0; i < 35; i++) { const d = Core.addDays(start, i), r = getRec(d); cal += `<i class="${r.ok ? 'ok' : r.done.length ? 'p1' : ''}${d === k ? ' today' : ''}" title="${d}"></i>`; }
    let code = ''; try { code = btoa(unescape(encodeURIComponent(JSON.stringify(st)))); } catch (e) { code = ''; }
    const b = bossState();
    const head = `<section class="pagehead"><div><div class="kicker muted">Niveau ${li.level}</div><h1 class="h1">${esc(Core.rankFor(li.level))}</h1><p class="muted">Prochain rang au niveau ${(Core.RANKS.find((r) => r[0] > li.level) || ['max'])[0]}.</p></div></section>`;
    const tiles = `<div class="tiles">
        <div class="tile" style="--bg:#E3DFFF">${E('sparkles', 28)}<b class="num">${st.xp}</b><span>XP au total</span></div>
        <div class="tile" style="--bg:#FFE1DA">${E('fire', 28)}<b class="num">${s.streak}</b><span>jours de série</span></div>
        <div class="tile" style="--bg:#FFEFBF">${E('1st-place-medal', 28)}<b class="num">${Math.max(st.best || 0, s.streak)}</b><span>record de série</span></div>
        <div class="tile" style="--bg:#D5F5EE">${E('check-mark-button', 28)}<b class="num">${Object.values(st.days).filter((d) => d.ok).length}</b><span>jours validés</span></div>
        <div class="tile" style="--bg:#DBE7FF">${E('chart-increasing', 28)}<b class="num">${skillsDone()}/${ALL_PAL.length}</b><span>paliers</span></div>
        <div class="tile" style="--bg:#F8DDF2">${E(b ? 'fox' : 'crown', 28)}<b class="num">${b ? b.hp : 0}</b><span>PV restants au boss</span></div>
      </div>`;
    const rest = `<div class="row2b">
        <section class="panel"><h2 class="h3">Tes cinq branches</h2>${radarSvg()}</section>
        <section class="panel"><h2 class="h3">5 dernières semaines</h2><div class="cal">${cal}</div><div class="legend"><span><i style="background:#177750"></i>Jour validé</span><span><i style="background:#9FDCC2"></i>Commencé</span></div></section>
      </div>
      <section class="panel"><div class="row between"><h2 class="h3">Vitesse : tempo propre atteint</h2><select id="bpm-exo" data-change="bpm-exo" aria-label="Exercice">${Object.entries(EXOS).map(([id, x]) => `<option value="${id}"${id === ui.bpmExo ? ' selected' : ''}>${esc(x.t)}</option>`).join('')}</select></div><div class="chartbox">${bpmSvg()}</div></section>
      <div class="row2b">
        <section class="panel"><h2 class="h3">Réglages</h2>
          <div class="row between"><div><b>Mode partiels</b><p class="small muted">2 missions et 10 minutes par jour, la série continue. S'applique au prochain jour non commencé.</p></div><button class="btn ${st.short ? 'ok' : 'ghost'} sm" data-act="short" aria-pressed="${st.short}">${st.short ? 'Activé' : 'Désactivé'}</button></div>
          <div class="row between"><div><b>Illustrations Wikimedia</b><p class="small muted">Les œuvres des cartes sont chargées depuis Wikimedia Commons, qui reçoit alors ton adresse IP. Désactive pour ne rien charger depuis ce site.</p></div><button class="btn ${st.noArt ? 'ghost' : 'ok'} sm" data-act="no-art" aria-pressed="${!st.noArt}">${st.noArt ? 'Désactivées' : 'Activées'}</button></div>
          <div class="field"><label for="pseudo">Ton prénom (affiché sur l'accueil)</label><div class="row"><input id="pseudo" type="text" maxlength="24" value="${esc(st.name)}" autocomplete="given-name"><button class="btn ghost sm" data-act="save-name">Enregistrer</button></div></div>
        </section>
        <section class="panel" id="compte"><h2 class="h3">Compte et sauvegarde</h2>
          <p><span class="pill" id="sync-status">${esc(syncLabel())}</span></p>
          ${u ? `<p class="small">Connecté avec <b>${esc(u.email || '')}</b>.</p><div class="row"><button class="btn ghost sm" data-act="logout">Se déconnecter</button>${ui.armed === 'delacc' ? '<button class="btn danger sm" data-act="delacc-ok">Confirmer : supprimer définitivement mon compte</button><button class="link" data-act="disarm">Annuler</button>' : '<button class="link" data-act="arm" data-id="delacc">Supprimer mon compte</button>'}</div>${ui.armed === 'delacc' ? '<p class="small err">Ton compte, ton adresse e-mail et ta sauvegarde en ligne seront effacés tout de suite, sans retour possible. La progression enregistrée sur cet appareil sera aussi effacée.</p>' : ''}` : `<p class="small muted">Avec un compte, ta série, tes cartes et tes trophées suivent sur ton PC et ton téléphone.</p><div><button class="btn sm" data-act="login-open">Se connecter</button></div>`}
          <details><summary class="small strong">Code de sauvegarde (copie manuelle)</summary>
            <label for="code-out" class="small">Ton code</label><textarea id="code-out" readonly>${code}</textarea>
            <div class="row"><button class="btn ghost sm" data-act="copy">Copier le code</button><span class="small muted" id="copy-msg"></span></div>
            <label for="code-in" class="small">Importer un code</label><textarea id="code-in" placeholder="Colle un code de sauvegarde ici"></textarea>
            <div class="row">${ui.armed === 'import' ? '<button class="btn danger sm" data-act="import-ok">Confirmer : remplacer ma progression</button><button class="link" data-act="disarm">Annuler</button>' : '<button class="btn ghost sm" data-act="arm" data-id="import">Importer</button>'}<span class="small err">${esc(ui.importMsg)}</span></div>
          </details>
          <div>${ui.armed === 'reset' ? '<button class="btn danger sm" data-act="reset-ok">Confirmer : tout effacer</button> <button class="link" data-act="disarm">Annuler</button>' : '<button class="link" data-act="arm" data-id="reset">Tout remettre à zéro</button>'}</div>
        </section>
      </div>
      <p class="small muted">Illustrations des cartes : œuvres du domaine public via Wikimedia Commons. Emoji : Fluent Emoji de Microsoft (licence MIT).</p>`;
    return isDark() ? wallProgres(li, s, b) + `<div class="w-classic">${rest}</div>` : head + tiles + rest;
  }

  /* ---------- Vue : manche ---------- */
  /* opts.letters : notes en lettres (C, D…) ; opts.stringNames : lettres des cordes à vide à gauche du sillet ;
     opts.rootAccent : toniques en orange. Sans ces options, rendu identique à l'onglet Manche. */
  function fretboardSvg(fb, opts = {}) {
    const notes = Core.fretboardNotes(fb.root, fb.scale), NM = opts.letters ? Core.NOTE_EN : Core.NOTE_FR;
    const X0 = opts.stringNames ? 76 : 52, FW = opts.compact ? 44 : 52, W = X0 + Core.MAXFRET * FW + 14, Y0 = 26, SH = opts.compact ? 28 : 32, H = Y0 + 5 * SH + 42;
    const x = (f) => (f === 0 ? X0 - 26 : X0 + (f - 0.5) * FW), y = (s) => Y0 + (5 - s) * SH;
    let o = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="group" aria-label="Manche : ${esc(Core.SCALES[fb.scale].name)} de ${NM[fb.root]}"><defs>`;
    for (let a = 0; a < 5; a++) for (let b = a + 1; b < 5; b++) { const [l, r] = a === 0 && b === 4 ? [b, a] : [a, b]; o += `<linearGradient id="gp${a}${b}" x1="0" y1="0" x2="1" y2="0"><stop offset="50%" stop-color="${POS_COL[l]}"/><stop offset="50%" stop-color="${POS_COL[r]}"/></linearGradient>`; }
    o += `</defs><rect x="${X0}" y="${Y0 - 12}" width="${Core.MAXFRET * FW}" height="${5 * SH + 24}" rx="4" fill="#2A2044"/>`;
    for (const f of [3, 5, 7, 9, 15, 17]) o += `<circle cx="${x(f)}" cy="${Y0 + 2.5 * SH}" r="7" fill="#3D3163"/>`;
    o += `<circle cx="${x(12)}" cy="${Y0 + 1.5 * SH}" r="7" fill="#3D3163"/><circle cx="${x(12)}" cy="${Y0 + 3.5 * SH}" r="7" fill="#3D3163"/>`;
    for (let f = 0; f <= Core.MAXFRET; f++) o += `<line x1="${X0 + f * FW}" y1="${Y0 - 12}" x2="${X0 + f * FW}" y2="${Y0 + 5 * SH + 12}" stroke="${f === 0 ? '#F6F2FF' : '#6A5F96'}" stroke-width="${f === 0 ? 5 : 2}"/>`;
    for (let s = 0; s < 6; s++) o += `<line x1="${X0}" y1="${y(s)}" x2="${W - 14}" y2="${y(s)}" stroke="#C9C2E6" stroke-width="${3 - s * 0.4}" opacity=".8"/>`;
    for (const f of [3, 5, 7, 9, 12, 15, 17]) o += `<text x="${x(f)}" y="${H - 12}" fill="#B0A7D6">${f}</text>`;
    if (opts.stringNames) for (let s = 0; s < 6; s++) o += `<text class="sname" x="16" y="${y(s)}" fill="#EDEAE4">${'EADGBE'[s]}</text>`;
    const tgt = !opts.compact && ui.check && !ui.check.done ? ui.check.seq[ui.check.i] : null;
    for (const n of notes) {
      const sel = n.pos.filter((p) => fb.pos.includes(p)), cx = x(n.f), cy = y(n.s);
      if (!sel.length) { o += `<circle class="nt" data-act="pluck" data-midi="${n.midi}" cx="${cx}" cy="${cy}" r="5" fill="#7D74A8" opacity=".7"/>`; continue; }
      const fill = opts.rootAccent && n.isRoot ? '#FF4D2E' : sel.length === 1 ? POS_COL[sel[0]] : `url(#gp${Math.min(sel[0], sel[1])}${Math.max(sel[0], sel[1])})`;
      if (tgt && tgt.s === n.s && tgt.f === n.f) o += `<circle class="pulse" cx="${cx}" cy="${cy}" r="18"/>`;
      o += `<circle class="nt" data-act="pluck" data-midi="${n.midi}" tabindex="0" role="button" aria-label="Écouter ${NM[n.pc]}" cx="${cx}" cy="${cy}" r="12.5" fill="${fill}" stroke="${n.isRoot ? '#fff' : 'rgba(0,0,0,.4)'}" stroke-width="${n.isRoot ? 3.5 : 1}"/><text x="${cx}" y="${cy + 0.5}" fill="#17132B">${fb.labels === 'deg' ? Core.DEG_LABEL[n.iv] : NM[n.pc]}</text>`;
    }
    return o + '</svg>';
  }
  function micPanel() {
    if (!MIC_OK) return `<section class="panel"><h2 class="h3">${E('microphone', 26)} Correction au micro</h2><p class="muted">Le micro n'est pas disponible dans ce navigateur. Ouvre le site en https dans Chrome, Edge ou Safari.</p></section>`;
    const m = ui.mic, c = ui.check, fb = ui.fb;
    if (!m.on) return `<section class="panel" id="micpanel"><h2 class="h3">${E('microphone', 26)} Correction au micro</h2><p class="muted">Branche ta guitare dans la Focusrite, son clair, puis active le micro. Le jeu écoute et te dit si chaque note est la bonne. Il sert aussi d'accordeur et de juge pour tes bends.</p>${m.err ? `<p class="err">${esc(m.err)}</p>` : ''}<div><button class="btn" data-act="mic-on">Activer le micro</button></div></section>`;
    let status = 'Choisis une position, puis lance le contrôle.';
    if (c) {
      const exp = c.seq[Math.min(c.i, c.seq.length - 1)];
      status = c.done ? (c.errors ? `Terminé avec ${c.errors} fausse${c.errors > 1 ? 's' : ''} note${c.errors > 1 ? 's' : ''} en ${c.time.toFixed(1)} s. Recommence pour le sans-faute.` : `Sans faute en ${c.time.toFixed(1)} s. Propre.`)
        : `Note ${c.i + 1}/${c.seq.length} : joue ${Core.noteName(exp.midi)} (corde de ${Core.STRING_FR[exp.s]}, case ${exp.f}).${c.wrong ? ' ' + c.wrong : ''}`;
    }
    return `<section class="panel" id="micpanel"><div class="row between"><h2 class="h3">${E('microphone', 26)} Correction au micro</h2><button class="btn ghost sm" data-act="mic-off">Couper le micro</button></div>
      ${m.devices.length > 1 ? `<div class="row"><label for="mic-dev">Entrée</label><select id="mic-dev" data-change="mic-dev">${m.devices.map((d, i) => `<option value="${esc(d.deviceId)}"${d.deviceId === m.device ? ' selected' : ''}>${esc(d.label || 'Entrée ' + (i + 1))}</option>`).join('')}</select></div>` : ''}
      <div class="tuner"><div class="tnote" id="tuner-note">·</div><div><div class="cents"><i id="tuner-needle"></i></div><div class="row between small muted"><span>trop bas</span><span id="tuner-cents" class="num">en attente d'une note</span><span>trop haut</span></div></div></div>
      <div class="check-status ${c && c.done && !c.errors ? 'good' : c && c.wrong && !c.done ? 'bad' : ''}">${esc(status)}</div>
      <div class="row"><button class="btn" data-act="check-start">${c && !c.done ? 'Recommencer' : 'Contrôler la position ' + (Math.min(...fb.pos) + 1)}</button>${c ? '<button class="btn ghost sm" data-act="check-stop">Arrêter</button>' : ''}</div></section>`;
  }
  function viewManche() {
    const fb = ui.fb, sc = Core.SCALES[fb.scale], all = fb.pos.length === 5, word = sc.penta || sc.blues ? 'Position' : 'Zone';
    return `<section class="pagehead"><div><div class="kicker muted">Outils</div><h1 class="h1">Le manche</h1></div><button class="btn ghost" data-act="dice">${E('game-die', 22)} Dé des tonalités</button></section>
      <section class="panel">
        <div class="row"><label for="fb-root">Tonalité</label><select id="fb-root" data-change="fb-root">${Core.NOTE_FR.map((n, i) => `<option value="${i}"${i === fb.root ? ' selected' : ''}>${n}</option>`).join('')}</select>
          <label for="fb-scale">Gamme</label><select id="fb-scale" data-change="fb-scale">${Object.entries(Core.SCALES).map(([k, s]) => `<option value="${k}"${k === fb.scale ? ' selected' : ''}>${s.name}</option>`).join('')}</select>
          <div class="chips" role="group" aria-label="Affichage"><button class="chip${fb.labels === 'notes' ? ' on' : ''}" data-act="fb-labels" data-v="notes">Notes</button><button class="chip${fb.labels === 'deg' ? ' on' : ''}" data-act="fb-labels" data-v="deg">Degrés</button></div></div>
        <div class="chips" role="group" aria-label="Positions"><button class="chip${all ? ' on' : ''}" data-act="fb-all">Toutes</button>${[0, 1, 2, 3, 4].map((p) => `<button class="chip${!all && fb.pos.includes(p) ? ' on' : ''}" data-act="fb-pos" data-p="${p}" style="${!all && fb.pos.includes(p) ? `background:${POS_COL[p]};border-color:${POS_COL[p]};color:#17132B` : ''}">${word} ${p + 1}</button>`).join('')}</div>
        <div class="fb-wrap" tabindex="0" aria-label="Manche, défilement horizontal">${fretboardSvg(fb)}</div>
        <div class="legend">${[0, 1, 2, 3, 4].map((p) => `<span><i style="background:${POS_COL[p]}"></i>${word} ${p + 1}</span>`).join('')}<span><i style="background:#fff;border:3px solid #1B1733"></i>Tonique</span></div>
        <p class="small muted">${sc.penta ? 'Les pastilles bicolores appartiennent à deux positions : ce sont tes ponts pour passer de l\'une à l\'autre. ' : ''}Clique sur une note pour l'entendre. Corde de Mi grave en bas, comme sur une tablature.</p>
      </section>${micPanel()}`;
  }

  /* ---------- Vue : oreille ---------- */
  const A_PENTA = [57, 60, 62, 64, 67, 69, 72];
  function posHint(midi) { for (let s = 0; s < 6; s++) { const f = midi - Core.OPEN_MIDI[s]; if (f >= 5 && f <= 8) return `corde de ${Core.STRING_FR[s]}, case ${f}`; } return ''; }
  function newQuestion() {
    const e = ui.ear, R = (n) => Math.floor(Math.random() * n), last = e.q;
    let q;
    if (e.mode === 'note') {
      const pool = e.level === 1 ? [60, 62, 64, 67, 69, 72] : [58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70];
      let t; do { t = pool[R(pool.length)]; } while (last && last.type === 'note' && last.target === t);
      q = { type: 'note', root: 57, target: t };
    } else if (e.mode === 'inter') {
      const ivs = e.level === 1 ? [3, 4, 7, 12] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      let stp; do { stp = ivs[R(ivs.length)]; } while (last && last.type === 'inter' && last.st === stp && ivs.length > 1);
      q = { type: 'inter', root: 50 + R(10), st: stp, opts: ivs };
    } else {
      const len = 2 + e.level; let i = R(2) ? 0 : 5; const notes = [A_PENTA[i]];
      while (notes.length < len) { const j = i + [-2, -1, 1, 2][R(4)]; if (j < 0 || j >= A_PENTA.length) continue; i = j; notes.push(A_PENTA[i]); }
      q = { type: 'melo', root: 57, notes };
    }
    e.q = q; e.result = null; e.tries = []; e.revealed = false;
  }
  function playQuestion() {
    const q = ui.ear.q; if (!q) return;
    if (q.type === 'note') Sound.playOverDrone(q.root, [q.target], 0.9, 1.4);
    else if (q.type === 'inter') Sound.playOverDrone(q.root, [q.root, q.root + q.st], 0.9, 1.3);
    else Sound.playOverDrone(q.root, q.notes, 0.55, 0.9);
  }
  function earAnswer(good) {
    const e = ui.ear; if (!e.q || e.result) return;
    e.result = good ? 'good' : 'bad'; st.ear.total++;
    const key = e.mode + e.level;
    if (good) {
      e.streak++; st.ear.best[key] = Math.max(st.ear.best[key] || 0, e.streak);
      const k = today(), r = mutRec(k); r.ear = (r.ear || 0) + 1; gain(XP.ear, '', true); Sound.chime(true);
      const m = missionsFor(k).find((x) => x.id === 'ore');
      if (m && m.auto && r.ear >= 8 && !r.done.includes('ore')) { save(); completeMission('ore'); return; }
    } else { e.streak = 0; Sound.chime(false); }
    commit();
  }
  function viewOreille() {
    const e = ui.ear, q = e.q, r = getRec(today()), key = e.mode + e.level;
    const levels = { note: [[1, 'Penta de La'], [2, 'Toutes les notes']], inter: [[1, '4 intervalles'], [2, 'Les 12']], melo: [[1, '3 notes'], [2, '4 notes'], [3, '5 notes']] }[e.mode];
    const intro = { note: 'Un bourdon installe la tonalité de La, puis une note mystère arrive. Chante-la, cherche-la sur ta guitare, puis réponds.', inter: 'Un bourdon installe la tonalité, puis tu entends la tonique et une deuxième note. Chante la deuxième note avant de répondre : quel intervalle les sépare ?', melo: 'Une courte phrase dans la penta de La mineur, sur un bourdon, entre la case 5 et la case 8. Chante-la, rejoue-la, puis vérifie.' }[e.mode];
    let body;
    if (!q) body = `<p class="muted">${intro}</p><div><button class="btn" data-act="ear-new">Lancer une question</button></div>`;
    else {
      let ans = '';
      if (q.type === 'note') {
        const opts = e.level === 1 ? [0, 2, 4, 7, 9] : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
        ans = `<div class="answers">${opts.map((pc) => `<button class="btn ghost" data-act="ear-pick" data-v="${pc}"${e.result ? ' disabled' : ''}>${Core.NOTE_FR[pc]}</button>`).join('')}</div>`;
      } else if (q.type === 'inter') {
        ans = `<div class="answers">${q.opts.map((s) => `<button class="btn ghost" data-act="ear-pick" data-v="${s}"${e.result ? ' disabled' : ''}>${INTERVALS[s - 1].n}<br><span class="small">${s} case${s > 1 ? 's' : ''}</span></button>`).join('')}</div>`;
      } else if (!e.result) {
        ans = e.revealed ? `<p><b>Réponse :</b> ${q.notes.map((m) => Core.noteName(m)).join(' → ')}</p><p class="small muted">${q.notes.map((m) => posHint(m)).join(' · ')}</p><div class="row"><button class="btn ok" data-act="ear-self" data-v="1">Je l'avais</button><button class="btn danger" data-act="ear-self" data-v="0">Raté</button></div>`
          : '<div class="row"><button class="btn ghost" data-act="ear-reveal">Révéler la réponse</button></div>';
      }
      let verdict = '';
      if (e.result) {
        const sol = q.type === 'note' ? `${Core.noteName(q.target)} (${posHint(q.target)})` : q.type === 'inter' ? `${INTERVALS[q.st - 1].n}, ${q.st} case${q.st > 1 ? 's' : ''} sur la même corde` : q.notes.map((m) => Core.noteName(m)).join(' → ');
        verdict = `<div class="verdict ${e.result}">${e.result === 'good' ? 'Dans le mille' : 'Raté'}</div><p>C'était : <b>${esc(sol)}</b></p><div><button class="btn" data-act="ear-new">Question suivante</button></div>`;
      }
      const micLine = ui.mic.on && q.type !== 'inter' && !e.result ? `<p class="pill warn">Micro actif : réponds en jouant. ${e.tries.length ? 'Entendu : ' + e.tries.map((m) => Core.noteName(m)).join(', ') : ''}</p>` : '';
      body = `<p class="small muted">${intro}</p><div class="row"><button class="btn" data-act="ear-play">${E('headphone', 22)} Réécouter</button></div>${micLine}${ans}${verdict}`;
    }
    return `<section class="pagehead"><div><div class="kicker muted">Outils</div><h1 class="h1">Jeu d'oreille</h1></div><div class="counts"><div><b class="num">${e.streak}</b><span>série</span></div><div><b class="num">${st.ear.best[key] || 0}</b><span>record</span></div><div><b class="num">${r.ear || 0}</b><span>aujourd'hui</span></div></div></section>
      <section class="panel">
        <div class="chips" role="group" aria-label="Jeu">${Object.entries(EAR_NAME).map(([k, n]) => `<button class="chip${e.mode === k ? ' on' : ''}" data-act="ear-mode" data-v="${k}">${n}</button>`).join('')}</div>
        <div class="chips" role="group" aria-label="Niveau">${levels.map(([l, n]) => `<button class="chip${e.level === l ? ' on' : ''}" data-act="ear-level" data-v="${l}">Niveau ${l} · ${n}</button>`).join('')}</div>
        ${body}</section>
      <section class="panel"><h2 class="h3">${E('detective', 26)} Retrouver un morceau à l'oreille</h2><p class="muted small">1. Chante la première note et cherche-la sur une seule corde. 2. La note suivante monte ou descend, de peu ou de beaucoup ? 3. Avance par morceaux de 3 ou 4 notes. 4. Une fois la mélodie trouvée, cherche dans quelle position de penta elle tombe : c'est souvent la tonalité.</p>
        <div class="cards">${SONGS.filter((s) => s.ear).map((s) => songCardHtml(s)).join('')}</div></section>`;
  }

  /* ---------- Documentation : guides « Comment bien faire l'exo » et fiches de base ---------- */
  const GUIDE_ICON = { trem: 'bird', penta16: 'rocket', seq3: 'person-running', saut: 'rabbit-face', legato: 'water-wave', araignee: 'spider' };
  const guideTitle = (id) => (EXOS[id] ? EXOS[id].t : GUIDES[id].t);
  const guideIcon = (id) => GUIDE_ICON[id] || GUIDES[id].e || 'scroll';
  const ytSearch = (q) => 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q);
  /* Schémas : SVG décoratifs (aria-hidden), tout est décrit dans la légende. Couleurs par classes gf-*, thémées en CSS. */
  const STR_FR = ['Mi', 'Si', 'Sol', 'Ré', 'La', 'Mi'];
  function gFb(from, to, dots, extra = '') {
    const fw = 62, ss = 22, x0 = 42, y0 = 16, nF = to - from + 1, W = x0 + nF * fw + (extra ? 64 : 12), H = y0 + 5 * ss + 34;
    let o = `<svg class="gf" viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false"><rect class="gf-wood" x="${x0}" y="${y0 - 8}" width="${nF * fw}" height="${5 * ss + 16}" rx="4"/>`;
    if (from === 1) o += `<rect class="gf-nut" x="${x0 - 4}" y="${y0 - 8}" width="6" height="${5 * ss + 16}"/>`;
    for (let i = from === 1 ? 1 : 0; i <= nF; i++) o += `<line class="gf-fret" x1="${x0 + i * fw}" y1="${y0 - 8}" x2="${x0 + i * fw}" y2="${y0 + 5 * ss + 8}"/>`;
    for (let s = 0; s < 6; s++) o += `<line class="gf-str" x1="${x0}" y1="${y0 + s * ss}" x2="${x0 + nF * fw}" y2="${y0 + s * ss}" stroke-width="${1 + s * 0.35}"/><text class="gf-tx" x="${x0 - 8}" y="${y0 + s * ss + 4}" text-anchor="end">${STR_FR[s]}</text>`;
    for (let f = from; f <= to; f++) o += `<text class="gf-tx" x="${x0 + (f - from + 0.5) * fw}" y="${H - 6}" text-anchor="middle">case ${f}</text>`;
    for (const d of dots) { const x = x0 + (d.f - from + 0.5) * fw, y = y0 + (d.s - 1) * ss; o += `<circle class="gf-dot ${d.c || ''}" cx="${x}" cy="${y}" r="9.5"/><text class="gf-dt ${d.c || ''}" x="${x}" y="${y + 4}" text-anchor="middle">${d.l}</text>`; }
    return o + (extra ? extra(x0 + nF * fw + 14, y0, ss) : '') + '</svg>';
  }
  const PENTA1 = [[6, 5, 1], [6, 8, 4], [5, 5, 1], [5, 7, 3], [4, 5, 1], [4, 7, 3], [3, 5, 1], [3, 7, 3], [2, 5, 1], [2, 8, 4], [1, 5, 1], [1, 8, 4]];
  const arrowV = (x, y1, y2, cls) => `<line class="${cls}" x1="${x}" y1="${y1}" x2="${x}" y2="${y2}"/><path class="${cls} gf-head" d="M${x - 4} ${y2 + (y2 > y1 ? -6 : 6)} L${x} ${y2} L${x + 4} ${y2 + (y2 > y1 ? -6 : 6)}"/>`;
  const fig1 = (svg, cap, tone) => `<figure class="g-pane${tone ? ' ' + tone : ''}">${svg}<figcaption>${cap}</figcaption></figure>`;
  function pickSvg(good) {
    const top = good ? 52 : 56, h = good ? 60 : 30, tip = good ? 124 : 140, cls = good ? 'gf-good' : 'gf-bad', ax = good ? [104, 136] : [44, 196];
    /* La corde (point) est à côté de la pointe, à la hauteur où une pointe courte vient juste l'accrocher. */
    return `<svg class="gf" viewBox="0 0 240 170" aria-hidden="true" focusable="false"><line class="gf-body" x1="10" y1="156" x2="230" y2="156"/>
      <path class="gf-pick" d="M96 ${tip - 62} Q120 ${tip - 70} 144 ${tip - 62} Q149 ${tip - 54} 141 ${tip - 40} L124 ${tip - 3} Q120 ${tip + 3} 116 ${tip - 3} L99 ${tip - 40} Q91 ${tip - 54} 96 ${tip - 62} Z"/>
      <rect class="gf-hand" x="84" y="${top}" width="72" height="${h}" rx="22"/><text class="gf-tx" x="120" y="${top + h / 2 + 4}" text-anchor="middle">doigts</text><circle class="gf-string" cx="104" cy="120" r="6"/><text class="gf-tx" x="92" y="124" text-anchor="end">corde</text>
      <line class="${cls}" x1="164" y1="${top + h}" x2="164" y2="${tip}"/><line class="${cls}" x1="158" y1="${top + h}" x2="170" y2="${top + h}"/><line class="${cls}" x1="158" y1="${tip}" x2="170" y2="${tip}"/>
      <text class="gf-tx ${cls}" x="176" y="${(top + h + tip) / 2 + 4}">${good ? '1 à 2 mm' : 'trop long'}</text>
      <line class="${cls}" x1="${ax[0]}" y1="30" x2="${ax[1]}" y2="30"/><path class="${cls} gf-head" d="M${ax[0] + 7} 25 L${ax[0]} 30 L${ax[0] + 7} 35 M${ax[1] - 7} 25 L${ax[1]} 30 L${ax[1] - 7} 35"/>
      <text class="gf-tx" x="120" y="18" text-anchor="middle">${good ? 'petit mouvement' : 'grand mouvement'}</text></svg>`;
  }
  /* Coupe des 6 cordes vue depuis le chevalet : Mi grave à gauche, Mi aigu à droite. */
  function crossSvg(inner, w = 240) {
    const xs = [30, 66, 102, 138, 174, 210].map((x) => x * w / 240);
    return `<svg class="gf" viewBox="0 0 ${w} 160" aria-hidden="true" focusable="false"><rect class="gf-wood" x="8" y="122" width="${w - 16}" height="12" rx="6"/>${inner(xs)}${xs.map((x, i) => `<text class="gf-tx" x="${x}" y="154" text-anchor="middle">${['Mi', 'La', 'Ré', 'Sol', 'Si', 'Mi'][i]}</text>`).join('')}</svg>`;
  }
  const strDots = (xs, hot) => xs.map((x, i) => `<circle class="gf-string${hot.includes(i) ? ' hot' : ''}" cx="${x}" cy="110" r="${hot.includes(i) ? 7 : 5.5}"/>`).join('');
  function guideFig(kind) {
    let panes = '';
    if (kind === 'pick') panes = fig1(pickSvg(true), '<b>Bien :</b> seule la pointe dépasse et le médiator ne s\'éloigne que de quelques millimètres de la corde.', 'good')
      + fig1(pickSvg(false), '<b>À éviter :</b> trop de pointe qui s\'enfonce dans la corde et un grand mouvement qui fait perdre du temps.', 'bad');
    else if (kind === 'penta') panes = fig1(gFb(5, 8, PENTA1.map(([s, f, l]) => ({ s, f, l, c: (s === 6 || s === 1) && f === 5 || s === 4 && f === 7 ? 'root' : '' })),
      (x, y0, ss) => [0, 1, 2, 3, 4, 5].map((s) => arrowV(x + 6, y0 + s * ss - 7, y0 + s * ss + 7, 'gf-ink') + arrowV(x + 30, y0 + s * ss + 7, y0 + s * ss - 7, 'gf-ink')).join('')),
    'Position 1 de la penta de La mineur. Le chiffre est le doigt : 1 index, 3 annulaire, 4 auriculaire. En orange, les La. À droite : sur chaque corde, un coup vers le bas puis un coup vers le haut.');
    else if (kind === 'seq') panes = fig1(gFb(5, 8, PENTA1.map(([s, f], i) => ({ s, f, l: i + 1, c: i < 3 ? 'root' : '' }))),
      'Les notes de la position numérotées de la plus grave (1) à la plus aiguë (12). Premier groupe en orange : 1-2-3. Puis 2-3-4, 3-4-5, et ainsi de suite.');
    else if (kind === 'skip') panes = fig1(crossSvg((xs) => strDots(xs, [0, 2]) + `<path class="gf-good gf-arc" d="M${xs[0]} 100 Q${xs[1]} 74 ${xs[2]} 100"/><path class="gf-good gf-head" d="M${xs[2] - 9} 95 L${xs[2]} 100 L${xs[2] - 2} 90"/>`),
      '<b>Bien :</b> un arc bas qui passe juste au-dessus de la corde de La pour aller du Mi grave au Ré.', 'good')
      + fig1(crossSvg((xs) => strDots(xs, [0, 2]) + `<path class="gf-bad gf-arc dash" d="M${xs[0]} 100 Q${xs[1]} 0 ${xs[2]} 100"/>`), '<b>À éviter :</b> un arc haut, lent et imprécis.', 'bad');
    else if (kind === 'legato') panes = fig1(`<svg class="gf" viewBox="0 0 240 160" aria-hidden="true" focusable="false"><rect class="gf-wood" x="10" y="112" width="220" height="26" rx="4"/>${[60, 130, 200].map((x) => `<rect class="gf-fretb" x="${x - 3}" y="102" width="6" height="10" rx="2"/>`).join('')}<line class="gf-strl" x1="10" y1="100" x2="230" y2="100"/>
        <rect class="gf-hand" x="38" y="44" width="20" height="56" rx="10"/><rect class="gf-hand hot" x="104" y="38" width="22" height="58" rx="11"/>${arrowV(115, 6, 30, 'gf-good')}<text class="gf-tx" x="132" y="22">frappe</text>
        <text class="gf-tx" x="48" y="36" text-anchor="middle">index</text><text class="gf-tx" x="115" y="152" text-anchor="middle">annulaire</text><text class="gf-tx" x="200" y="152" text-anchor="middle">frette</text></svg>`,
    '<b>Hammer-on :</b> l\'index tient la note grave, l\'annulaire tombe vite sur le bout du doigt, juste derrière la frette.', 'good')
      + fig1(crossSvg((xs) => strDots(xs, [3]) + `<rect class="gf-hand hot" x="${xs[3] - 11}" y="40" width="22" height="64" rx="11"/><path class="gf-good gf-arc" d="M${xs[3] + 14} 96 Q${xs[4]} 112 ${xs[5] - 4} 100"/><path class="gf-good gf-head" d="M${xs[5] - 13} 98 L${xs[5] - 4} 100 L${xs[5] - 9} 108"/><text class="gf-tx" x="232" y="80" text-anchor="end">vers le sol</text>`),
      '<b>Pull-off :</b> vu depuis le chevalet. Le doigt tire la corde de Sol un peu vers le sol avant de la lâcher, au lieu de se lever tout droit.', 'good');
    else if (kind === 'spider') panes = fig1(gFb(1, 4, [6, 5, 4, 3, 2, 1].flatMap((s) => [1, 2, 3, 4].map((f) => ({ s, f, l: f, c: s === 6 ? 'root' : s > 4 ? '' : 'ghost' })))),
      'Un doigt par case : index case 1, majeur 2, annulaire 3, auriculaire 4. On commence sur le Mi grave (en orange), puis corde par corde jusqu\'au Mi aigu, et retour.');
    else if (kind === 'mute') panes = fig1(crossSvg((xs) => `<rect class="gf-zone r" x="${xs[0] - 16}" y="88" width="${xs[2] - xs[0] + 32}" height="40" rx="14"/><rect class="gf-zone l" x="${xs[4] - 16}" y="88" width="${xs[5] - xs[4] + 32}" height="40" rx="14"/>${strDots(xs, [3])}
        <text class="gf-tx" x="${xs[1]}" y="76" text-anchor="middle">paume droite</text><text class="gf-tx" x="${(xs[4] + xs[5]) / 2}" y="76" text-anchor="middle">doigts gauches</text><text class="gf-tx gf-strong" x="${xs[3]}" y="40" text-anchor="middle">jouée</text>${arrowV(xs[3], 48, 96, 'gf-ink')}`, 300),
      'Vu depuis le chevalet, en jouant la corde de Sol : la paume droite couvre les cordes plus graves, les doigts de la main gauche effleurent les plus aiguës.');
    return panes ? `<div class="g-fig${panes.split('<figure').length > 2 ? ' two' : ''}">${panes}</div>` : '';
  }
  /* Contenu d'un guide, commun à la fenêtre et au tiroir du mode séance. */
  function guideBody(id) {
    const g = GUIDES[id], ex = EXOS[id], li = (a) => a.map((x) => `<li>${esc(x)}</li>`).join('');
    return `<p class="g-goal">${esc(g.goal)}</p>${guideFig(g.fig)}
      <section class="g-sec"><h3 class="h3">${ex ? 'Avant de commencer : position des mains' : 'Les repères'}</h3><ul class="g-list">${li(g.setup)}</ul></section>
      <section class="g-sec"><h3 class="h3">${ex ? 'Le mouvement, étape par étape' : 'Pour t\'entraîner'}</h3><ol class="g-steps">${li(g.steps)}</ol></section>
      <section class="g-sec"><h3 class="h3">Erreurs fréquentes</h3><ul class="g-err">${g.errors.map(([bad, fix]) => `<li><p class="g-bad"><b>À éviter :</b> ${esc(bad)}</p><p class="g-fix"><b>Correction :</b> ${esc(fix)}</p></li>`).join('')}</ul></section>
      <section class="g-sec g-okbox"><h3 class="h3">${E('check-mark-button', 22)} Tu le fais bien si…</h3><ul class="g-list">${li(g.check)}</ul></section>
      ${g.src ? `<p class="small muted g-src">D'après <cite>${esc(BOOK.t)}</cite>, de ${esc(BOOK.a)} (${esc(g.src)}). Conseils reformulés pour Gratte Quest, sans reproduire le livre.</p>` : ''}
      <div class="g-video"><a class="btn ghost sm" href="${esc(ytSearch(g.yt))}" target="_blank" rel="noopener noreferrer">${E('eye', 20)} Voir des démonstrations vidéo<span class="sr-only"> sur YouTube, nouvel onglet</span></a><span class="small muted">Recherche YouTube, dans un nouvel onglet. Les vidéos ne sont pas choisies par Gratte Quest.</span></div>`;
  }
  function guideSheet(id, from) {
    const g = GUIDES[id], ex = EXOS[id], b = BR.vit, col = ex ? b.color : 'var(--accent)', soft = ex ? b.soft : '#ECEAFF';
    return `<div class="sheet msheet gsheet" style="--col:${col};--soft:${soft}">
      <div class="mhead"><span class="mic">${E(guideIcon(id), 40)}</span><div><div class="kicker" style="color:${col}">${ex ? 'Comment bien faire l\'exo · ' + esc(ex.fun) : g.kind === 'book' ? 'Documentation · D\'après le livre' : 'Documentation · Les bases'}</div><h2 class="h2" id="g-title">${esc(guideTitle(id))}</h2></div></div>
      ${guideBody(id)}
      <div class="row between foot">${from ? `<button class="btn" data-act="mission-open" data-id="${esc(from)}" data-back="1">Retour à la mission</button>` : '<span></span>'}<button class="link" data-act="close">Fermer</button></div></div>`;
  }
  /* Exercice de vitesse de la séance du jour (pour le mettre en avant dans la Documentation). */
  const todayExo = () => { const m = missionsFor(today()).find((x) => x.exo); return m ? m.exo : null; };
  const EXO_IDS = Object.keys(EXOS);
  function viewDoc() {
    const te = todayExo();
    const tile = (id) => `<button type="button" class="gtile${id === te ? ' today' : ''}" data-act="guide" data-id="${id}">${E(guideIcon(id), 40)}<span class="gt-t"><b>${esc(EXOS[id] ? EXOS[id].fun : guideTitle(id))}</b>${EXOS[id] ? `<span class="gt-s">${esc(EXOS[id].t)}</span>` : ''}<span class="gt-p">${esc(GUIDES[id].goal)}</span></span>${id === te ? '<span class="pill">Exercice du jour</span>' : ''}</button>`;
    return `<section class="pagehead"><div><div class="kicker muted">Apprendre</div><h1 class="h1">Documentation</h1><p class="muted">Avant de lancer un exercice : la position des mains, le mouvement étape par étape et les erreurs qui bloquent la progression.</p></div></section>
      <section class="panel"><h2 class="h3">${E('high-voltage', 26)} Exercices de vitesse</h2><div class="gtiles">${EXO_IDS.map(tile).join('')}</div></section>
      <section class="panel"><h2 class="h3">${E('scroll', 26)} Les bases</h2><div class="gtiles">${GUIDE_BASES.map(tile).join('')}</div></section>
      <section class="panel"><h2 class="h3">${E('musical-score', 26)} D'après le livre</h2><p class="small muted">Les conseils de <cite>${esc(BOOK.t)}</cite> (${esc(BOOK.a)}), reformulés avec nos mots. Pour tout le détail, le livre reste la référence.</p><div class="gtiles">${GUIDE_BOOK.map(tile).join('')}</div></section>`;
  }
  function wallDoc() {
    const te = todayExo(), art = songById('johnny');
    const tile = (id) => wTile({ act: `data-act="guide" data-id="${id}"`, icon: guideIcon(id), t: EXOS[id] ? EXOS[id].fun : guideTitle(id), s: EXOS[id] ? EXOS[id].t + (id === te ? ' · exercice du jour' : '') : GUIDES[id].kind === 'book' ? 'D\'après le livre' : 'Les bases', p: GUIDES[id].goal, cls: id === te ? 'is-focus' : '' });
    return wBill(art, `<h1>Documentation</h1><p class="w-lede">Avant de lancer un exercice : la position des mains, le mouvement étape par étape et les erreurs qui bloquent la progression.</p>${te ? `<div class="w-acts"><button type="button" class="w-btn w-btn-1" data-act="guide" data-id="${te}">${E(guideIcon(te), 22)}Guide de l'exercice du jour</button></div><p class="w-note">${esc(EXOS[te].fun)} · ${esc(EXOS[te].t)}</p>` : ''}`)
      + `<div class="w-wall">${wRow('Exercices de vitesse', `${EXO_IDS.length} guides`, EXO_IDS.map(tile))}${wRow('Les bases', '', GUIDE_BASES.map(tile))}${wRow('D\'après le livre', BOOK.t, GUIDE_BOOK.map(tile))}</div>`;
  }

  /* ---------- Modales ---------- */
  function missionSheet(m) {
    const k = today(), r = getRec(k), done = r.done.includes(m.id), b = BR[m.br], t = ui.timer && ui.timer.mid === m.id ? ui.timer : null;
    const timer = done ? '' : `<div class="timerbox"><span class="bigtime num" ${t && t.running ? 'data-timer' : ''}>${t ? (t.over ? 'Temps écoulé' : fmt(t.left)) : fmt(m.min * 60)}</span>
      ${t && t.running ? '<button class="btn ghost" data-act="timer-pause">Pause</button>' : `<button class="btn ghost" data-act="timer" data-id="${m.id}">${E('stopwatch', 20)} ${t && !t.over && t.left > 0 ? 'Reprendre' : 'Lancer le chrono'}</button>`}</div>`;
    let tool = '';
    if (m.exo) tool = `<div class="tool"><div class="row"><span class="bpm num" id="sheet-bpm">${Sound.metro.bpm}</span><span class="muted">bpm</span>${[-5, -1, 1, 5].map((v) => `<button class="btn ghost sm" data-act="metro-step" data-v="${v}">${v > 0 ? '+' : ''}${v}</button>`).join('')}<button class="btn sm" data-act="metro-toggle">${Sound.metroLoop.on ? 'Stop' : 'Métronome'}</button></div>
      ${done ? '' : `<div class="field"><label for="bpm-in">Tempo propre atteint (enregistré à la validation)</label><input type="number" id="bpm-in" inputmode="numeric" min="30" max="320" placeholder="bpm" value="${esc(ui.bpmDraft)}" data-input="bpm"></div>`}</div>`;
    if (m.fb) { const [scale, root, pos] = m.fb; tool = `<div class="tool"><div class="fb-wrap compact">${fretboardSvg({ root, scale, pos, labels: 'notes' }, { compact: true })}</div><button class="btn ghost sm" data-act="show-fb" data-fb="${esc(JSON.stringify(m.fb))}">Ouvrir le manche et le contrôle au micro</button></div>`; }
    if (m.game) tool = `<div class="tool"><button class="btn" data-act="go-ear" data-mode="${m.game[0]}" data-level="${m.game[1]}">${E('ear', 22)} Jouer (${Math.min(8, r.ear || 0)}/8)</button></div>`;
    if (m.jam) tool = `<div class="tool"><div class="row"><select id="jam-root2" data-change="jam-root" aria-label="Tonalité de la boucle">${Core.NOTE_FR.map((n, i) => `<option value="${i}"${i === Sound.jam.root ? ' selected' : ''}>${n} mineur</option>`).join('')}</select><button class="btn sm" data-act="jam-toggle">${Sound.jamLoop.on ? 'Stop la boucle' : 'Lancer la boucle'}</button></div></div>`;
    if (m.song) { const s = songById(m.song); tool = `<div class="tool songtool"><div class="minicard">${songCardHtml(s, 'static')}</div><div class="col"><b>${esc(s.t)}</b><span class="small muted">${esc(s.a)}</span>${links(s)}<button class="btn ghost sm" data-act="song" data-id="${s.id}">Ouvrir la fiche du morceau</button></div></div>`; }
    return `<div class="sheet msheet" style="--col:${b.color};--soft:${b.soft}">
      <div class="mhead"><span class="mic">${E(b.icon, 40)}</span><div><div class="kicker" style="color:${b.color}">${esc(b.name)} · ${esc(m.sub)}</div><h2 class="h2">${esc(m.fun)}</h2></div><span class="mmin">${m.min} min</span></div>
      <p>${esc(m.text)}</p><p class="why">${E('brain', 20)} <span><b>Pourquoi :</b> ${esc(m.why)}</span></p>
      ${m.exo && GUIDES[m.exo] ? `<button type="button" class="howto" data-act="guide" data-id="${m.exo}" data-from="${m.id}">${E('scroll', 28)}<span><b>Comment bien faire l'exo</b><span>Position des mains, mouvement, erreurs à éviter</span></span><span class="howto-go" aria-hidden="true">→</span></button>` : ''}
      ${timer}${tool}
      <div class="row between foot">${done ? `<span class="pill good">${E('check-mark-button', 18)} Mission validée</span>` : m.auto ? '<span class="small muted">Se valide toute seule à 8 bonnes réponses.</span>' : `<button class="btn ok" data-act="mission" data-id="${m.id}">${E('check-mark-button', 20)} Mission validée</button>`}<button class="link" data-act="close">Fermer</button></div></div>`;
  }
  function links(s) {
    if (s.custom && !s.a) return '';
    const q = encodeURIComponent(s.t.replace(', version rock', '') + ' ' + s.a.replace(', avec ton groupe', '').replace('Zelda : ', 'Zelda '));
    return `<div class="row links"><a class="btn ghost sm" href="https://www.songsterr.com/?pattern=${q}" target="_blank" rel="noopener noreferrer">Tablature Songsterr</a><a class="btn ghost sm" href="https://www.youtube.com/results?search_query=${q}%20guitar%20lesson" target="_blank" rel="noopener noreferrer">Leçons YouTube</a>${s.ear ? '' : `<a class="btn ghost sm" href="https://www.youtube.com/results?search_query=${q}%20backing%20track" target="_blank" rel="noopener noreferrer">Backing track</a>`}</div>`;
  }
  function songSheet(s) {
    const stp = stepsOf(s.id), pi = pinfo(s.id), steps = s.ear ? STEPS_EAR : STEPS_SONG;
    const passBtn = pi.owned ? `<span class="pill good">${E('check-mark-button', 18)} Carte acquise</span>`
      : stp < 3 ? '<span class="small muted">Termine d\'abord les 3 étapes.</span>'
        : !pi.canPass ? `<span class="small muted">Limite du jour atteinte (${PASSES_PER_DAY} passages). Reviens demain.</span>` : `<button class="btn" data-act="pass" data-id="${s.id}">Joué en entier à 100 %</button>`;
    return `<div class="sheet ssheet"><div class="ssgrid"><div class="bigcard">${songCardHtml(s, 'big')}</div><div class="col">
      <div class="kicker muted">${isDefeated(s.id) ? 'Alt-mythique' : RARITY[s.r]}${st.boss.current === s.id ? ' · boss actuel' : ''}</div><h2 class="h2">${esc(s.t)}</h2><p class="muted">${esc(s.a)}</p>${s.why ? `<p>${esc(s.why)}</p>` : ''}
      <ol class="steps">${steps.map((t, i) => `<li class="step ${i < stp ? 'done' : i === stp ? 'cur' : 'lock'}"><span class="n">${i < stp ? '✓' : i + 1}</span><div class="st-b"><div class="st-t">${esc(t)}</div>${i === stp ? `<div><button class="btn sm" data-act="step" data-id="${s.id}">Étape réussie</button></div>` : ''}${i === stp - 1 && !pi.n ? `<button class="link" data-act="step-undo" data-id="${s.id}">Annuler cette étape</button>` : ''}</div></li>`).join('')}</ol>
      <div class="passes"><b>Passages à 100 %</b>${dots(pi.n)}<span class="small muted">${pi.n}/3 · aujourd'hui ${pi.today}/${PASSES_PER_DAY}</span></div>
      <div>${passBtn}</div>
      ${links(s)}
      <details><summary class="small strong">Changer l'illustration</summary>
        <div class="field"><label for="img-url">Lien d'une image</label><div class="row"><input id="img-url" type="url" placeholder="https://..."><button class="btn ghost sm" data-act="img-url" data-id="${s.id}">Appliquer</button></div></div>
        <div class="row"><label class="btn ghost sm filebtn">Importer un fichier<input type="file" accept="image/*" data-change="img-file" data-id="${s.id}" hidden></label><a class="btn ghost sm" href="https://commons.wikimedia.org/w/index.php?search=${encodeURIComponent(s.t)}&title=Special:MediaSearch&type=image" target="_blank" rel="noopener noreferrer">Chercher une image libre</a>${st.img[s.id] ? `<button class="btn ghost sm" data-act="img-reset" data-id="${s.id}">${s.art ? 'Illustration d\'origine' : 'Retirer l\'image'}</button>` : ''}</div>
        <p class="small muted">L'image choisie reste dans ta sauvegarde, visible par toi seul.</p></details>
      ${s.art && !st.img[s.id] ? `<p class="small muted">Illustration : ${esc(s.art[1])} (${esc(s.art[2])}). <a href="${commonsPage(s.art[0])}" target="_blank" rel="noopener noreferrer">Voir sur Wikimedia Commons</a></p>` : ''}
      <div class="row between foot">${st.active === s.id ? '<span class="pill">Carte en cours</span>' : `<button class="btn ghost sm" data-act="set-active" data-id="${s.id}">Définir comme carte en cours</button>`}
        ${s.custom && st.boss.current !== s.id ? (ui.armed === 'del-' + s.id ? `<button class="btn danger sm" data-act="del-song" data-id="${s.id}">Confirmer la suppression</button>` : `<button class="link" data-act="arm" data-id="del-${s.id}">Supprimer ce morceau</button>`) : ''}
        <button class="link" data-act="close">Fermer</button></div></div></div></div>`;
  }
  let modalOpener = null, modalOpenedAt = 0, lastModalType = null;
  /* Annonce pour les lecteurs d'écran (région aria-live permanente). */
  function announce(msg) { const el = $('#sr'); if (!el) return; el.textContent = ''; setTimeout(() => { el.textContent = msg; }, 60); }
  function revealBooster(skip) {
    const m = ui.modal; if (!m || m.type !== 'booster' || m.stage === 'revealed') return;
    m.stage = 'revealed';
    const sh = document.querySelector('.bsheet'); if (!sh) { render(); return; }
    if (skip) sh.classList.add('skip');
    sh.classList.add('revealed');
    const f = sh.querySelector('.bfront'); if (f) f.removeAttribute('aria-hidden');
    const b = BONUS.find((x) => x.id === m.card);
    announce(`${m.dupe ? 'Doublon' : 'Nouvelle carte'} : ${b.t}, ${RARITY[BONUS_RAR[b.r]]}. Défi : ${b.d}`);
    const c = sh.querySelector('[data-act="close"]'); if (c) c.focus({ preventScroll: true });
  }
  function renderModal() {
    const el = $('#modal'), m = ui.modal;
    if (!m) {
      const was = el.classList.contains('on'); el.className = ''; el.innerHTML = '';
      if (was && modalOpener) { /* rend le focus à l'élément qui a ouvert la fenêtre (ou à son équivalent après rafraîchissement) */
        const o = modalOpener, id = o.dataset && o.dataset.id;
        const cands = [document.contains(o) ? o : null, o.dataset && o.dataset.act ? document.querySelector(`[data-act="${o.dataset.act}"]` + (id ? `[data-id="${CSS.escape(id)}"]` : '')) : null, id ? document.querySelector(`.card[data-id="${CSS.escape(id)}"] .flip-hit`) : null, o.dataset && o.dataset.act ? document.querySelector(`[data-focus-after="${o.dataset.act}"]`) : null, lastModalType ? document.querySelector(`[data-focus-after="${lastModalType}"]`) : null];
        const t = cands.find((c) => c && c.getClientRects().length && getComputedStyle(c).visibility !== 'hidden'); if (t) t.focus({ preventScroll: true });
      }
      return;
    }
    let inner = '';
    if (m.type === 'mission') { const ms = missionsFor(today()).find((x) => x.id === m.id); if (!ms) { ui.modal = null; el.className = ''; el.innerHTML = ''; return; } inner = missionSheet(ms); }
    else if (m.type === 'song') { const s = songById(m.id); if (!s) { ui.modal = null; el.className = ''; el.innerHTML = ''; return; } inner = songSheet(s); }
    else if (m.type === 'guide') { if (!GUIDES[m.id]) { ui.modal = null; el.className = ''; el.innerHTML = ''; return; } inner = guideSheet(m.id, m.from); }
    else if (m.type === 'booster') {
      /* Séquence : le paquet tremble, le sceau se fissure, flash, carte face cachée ; au clic (ou Entrée/Espace) elle se retourne et le bandeau de rareté s'envole. */
      const b = BONUS.find((x) => x.id === m.card), r = BONUS_RAR[b.r], done = m.stage === 'revealed';
      inner = `<div class="sheet center bsheet r${r}${done ? ' revealed skip' : ''}"><h2 class="h2">${m.dupe ? 'Doublon' : 'Nouvelle carte'}</h2>
        <button type="button" class="btn ghost-w sm bskip" data-act="bskip">Passer</button>
        <div class="bstage">
          <div class="bpack" aria-hidden="true">${E('guitar', 44)}<span class="bseal"></span></div>
          <div class="bflash" aria-hidden="true"></div>
          <div class="bslot"><div class="bflip"><div class="bback" aria-hidden="true"><span>?</span></div><div class="bfront"${done ? '' : ' aria-hidden="true"'}>${bonusCard(b, 'big')}</div></div>
            <button type="button" class="bhit" data-act="bflip" aria-label="Carte face cachée : la retourner"></button></div>
          <div class="bbanner" aria-hidden="true">${RARITY[r]}</div>
        </div>
        <p class="bhint">Clique sur la carte pour la retourner.</p>
        <div class="bres"><p><b>Défi de la carte :</b> ${esc(b.d)}</p>${m.dupe ? `<p class="small muted">Tu l'avais déjà : +${XP.dupe} XP.</p>` : ''}<button class="btn gold" data-act="close">Continuer</button></div></div>`;
    }
    else if (m.type === 'bonus') { const b = BONUS.find((x) => x.id === m.id); inner = `<div class="sheet center">${bonusCard(b, 'big')}<p><b>Défi de la carte :</b> ${esc(b.d)}</p><button class="btn" data-act="close">Fermer</button></div>`; }
    else if (m.type === 'palier') { const p = ALL_PAL.find((x) => x.id === m.id), b = bossState(); inner = `<div class="sheet center"><h2 class="h2">Palier franchi</h2><div class="flipin">${palierCard(p, 'big')}</div><p>${b ? `${esc(b.song.t)} encaisse : il lui reste <b>${b.hp} PV</b>.` : 'Bien joué.'}</p><button class="btn" data-act="close">Continuer</button></div>`; }
    else if (m.type === 'boss-win') { const s = songById(m.id); inner = `<div class="sheet center win">${E('crown', 72)}<h2 class="h2">Boss vaincu : ${esc(s.t)}</h2><p>Tu débloques la <b>bannière ${esc(s.t)}</b> et la carte passe en version <b>alt-mythique</b>.</p><div class="flipin">${songCardHtml(s, 'big')}</div><button class="btn" data-act="next-boss">Choisir le prochain boss</button><button class="link" data-act="close">Plus tard</button></div>`; }
    else if (m.type === 'next-boss') {
      const opts = allSongs().filter((s) => !owned(s.id) && !isDefeated(s.id)).sort((a, b) => 'MLERC'.indexOf(a.r) - 'MLERC'.indexOf(b.r));
      inner = `<div class="sheet"><h2 class="h2">${E('dragon-face', 36)} Prochain boss</h2><p class="muted">Ses PV baissent avec ses étapes et ses passages à 100 %. Tu le bats en acquérant sa carte.</p>
        <div class="bosslist">${opts.map((s) => `<button class="bossopt r${s.r}" data-act="pick-boss" data-id="${s.id}"><span class="badge">${s.r}</span><span><b>${esc(s.t)}</b><span class="small muted">${esc(s.a)} · ${RARITY[s.r]}</span></span></button>`).join('') || '<p class="muted">Toutes tes cartes sont acquises : ajoute un morceau.</p>'}</div>
        <div class="row between foot"><button class="btn ghost" data-act="add-song" data-boss="1">${E('sparkles', 20)} Ajouter un morceau</button><button class="link" data-act="close">Fermer</button></div></div>`;
    } else if (m.type === 'add-song') {
      inner = `<div class="sheet"><h2 class="h2">Ajouter un morceau</h2><form id="add-form" class="col">
        <div class="field"><label for="ns-t">Titre</label><input id="ns-t" required maxlength="60"></div>
        <div class="field"><label for="ns-a">Artiste</label><input id="ns-a" maxlength="60"></div>
        <div class="field"><label for="ns-r">Difficulté (rareté de la carte)</label><select id="ns-r">${['C', 'R', 'E', 'L'].map((r) => `<option value="${r}"${r === 'E' ? ' selected' : ''}>${RARITY[r]}</option>`).join('')}</select></div>
        <div class="field"><label for="ns-img">Lien d'image (facultatif)</label><input id="ns-img" type="url" placeholder="https://..."></div>
        <div class="row between foot"><button class="btn" type="submit">Ajouter${m.boss ? ' et en faire le boss' : ''}</button><button class="link" type="button" data-act="close">Annuler</button></div></form></div>`;
    } else if (m.type === 'merge') {
      const r = m.remote;
      inner = `<div class="sheet"><h2 class="h2">Deux progressions trouvées</h2><p>Cet appareil et ton compte ont chacun une progression. Laquelle garder ?</p>
        <div class="row"><button class="btn" data-act="merge" data-v="local">Cet appareil · ${st.xp} XP</button><button class="btn ghost" data-act="merge" data-v="remote">Mon compte · ${r.xp} XP</button></div><p class="small muted">L'autre sera remplacée.</p></div>`;
    }
    const wasOpen = el.classList.contains('on'), act = document.activeElement, inside = el.contains(act);
    const key = inside && act.dataset && act.dataset.act ? `[data-act="${act.dataset.act}"]` + (act.dataset.id ? `[data-id="${CSS.escape(act.dataset.id)}"]` : '') : null;
    if (!wasOpen) { modalOpenedAt = Date.now(); }
    lastModalType = m.type;
    el.className = 'on' + (Date.now() - modalOpenedAt < 400 ? ' enter' : ''); el.innerHTML = inner;
    /* Focus clavier : à l'ouverture sur la fenêtre, après une action on revient sur le même bouton s'il existe encore. */
    if (!wasOpen || inside || !el.contains(document.activeElement)) {
      const sh = el.querySelector('.sheet'); if (sh) sh.setAttribute('tabindex', '-1');
      const first = m.type === 'booster' ? el.querySelector(m.stage === 'revealed' ? '[data-act="close"]' : '.bhit') : null;
      /* Retour d'un guide vers sa mission : le focus revient sur le bouton « Comment bien faire l'exo ». */
      const back = m.focusSel ? el.querySelector(m.focusSel) : null; m.focusSel = null;
      const target = back || (key && el.querySelector(key)) || first || sh;
      if (target && (!wasOpen || inside)) target.focus({ preventScroll: true });
    }
  }

  /* ---------- Dock : métronome et boucle ---------- */
  function renderDock() {
    const d = $('#dock');
    if (!ui.dock) { d.innerHTML = ''; return; }
    const m = Sound.metro, j = Sound.jam;
    d.innerHTML = `<div class="panel dockin"><div class="row between"><h2 class="h3">${E('stopwatch', 24)} Métronome</h2><button class="link" data-act="dock">Fermer</button></div>
      <div class="row between"><span class="bpm num" id="metro-bpm">${m.bpm}</span><span class="beats" id="beats">${[0, 1, 2, 3].map((i) => `<i class="${ui.beat === i ? 'on' : ''}"></i>`).join('')}</span></div>
      <input type="range" id="metro-range" min="40" max="240" value="${m.bpm}" data-input="metro" aria-label="Tempo du métronome">
      <div class="row">${[-5, -1, 1, 5].map((v) => `<button class="btn ghost sm" data-act="metro-step" data-v="${v}">${v > 0 ? '+' : ''}${v}</button>`).join('')}<button class="btn sm" data-act="metro-toggle">${Sound.metroLoop.on ? 'Stop' : 'Lancer'}</button></div>
      <h2 class="h3">${E('game-die', 24)} Boucle d'impro</h2>
      <div class="row"><select id="jam-root" data-change="jam-root" aria-label="Tonalité de la boucle">${Core.NOTE_FR.map((n, i) => `<option value="${i}"${i === j.root ? ' selected' : ''}>${n} mineur</option>`).join('')}</select>
      <select id="jam-style" data-change="jam-style" aria-label="Style de la boucle"><option value="rock"${j.style === 'rock' ? ' selected' : ''}>Grille rock</option><option value="drone"${j.style === 'drone' ? ' selected' : ''}>Bourdon</option></select></div>
      <div class="row"><label for="jam-bpm">Tempo</label><input type="number" id="jam-bpm" min="50" max="180" value="${j.bpm}" data-input="jam-bpm" style="width:84px"><button class="btn sm" data-act="jam-toggle">${Sound.jamLoop.on ? 'Stop' : 'Lancer'}</button></div></div>`;
  }

  /* ---------- Connexion ---------- */
  function renderLogin() {
    const el = $('#login'), L = ui.login;
    if (!L.show) { el.hidden = true; el.innerHTML = ''; return; }
    el.hidden = false;
    const avail = Cloud.available;
    el.innerHTML = `<div class="loginin">
      <div class="brand big">${E('guitar', 40)}<span>Gratte Quest</span></div>
      <div><h1 class="h1">Retrouve ta progression</h1><p class="muted">Une seule fois sur cet appareil. Ensuite tu arrives directement sur ta session du jour.</p></div>
      ${L.state === 'sent' ? `<div class="panel"><p>${E('sparkles', 24)} Lien envoyé à <b>${esc(L.email)}</b>. Ouvre l'e-mail sur cet appareil et clique sur le lien.</p><button class="link" data-act="login-retry">Changer d'adresse ou renvoyer</button></div>`
        : `<form class="panel col" id="login-form"><div class="field"><label for="login-email">Adresse e-mail</label><input id="login-email" type="email" autocomplete="email" required placeholder="toi@exemple.fr" value="${esc(L.email)}"${avail ? '' : ' disabled'}></div>
          <button class="btn big" type="submit"${avail && L.state !== 'sending' ? '' : ' disabled'}>${L.state === 'sending' ? 'Envoi…' : 'Recevoir mon lien de connexion'}</button>
          <p class="small muted">Pas de mot de passe : tu cliques sur le lien reçu par e-mail.</p><p class="small muted">Ton adresse sert uniquement à t'envoyer ce lien et à retrouver ta sauvegarde. Jamais de pub ni de revente. En créant un compte, tu acceptes les <a href="cgu.html">conditions d'utilisation</a>. Détails et droits : <a href="confidentialite.html">politique de confidentialité</a>.</p>${L.msg ? `<p class="err small">${esc(L.msg)}</p>` : ''}${avail ? '' : '<p class="err small">Service de connexion injoignable pour l\'instant.</p>'}</form>`}
      <button class="btn ghost big" data-act="guest">Jouer sans compte sur cet appareil</button>
      <p class="small muted">Avec un compte, ta série, tes cartes et tes trophées suivent sur ton PC et ton téléphone.</p>${legalLinks()}</div>`;
  }
  function legalLinks() {
    return `<nav class="legal small" aria-label="Informations légales (écran de connexion)"><a href="mentions-legales.html">Mentions légales</a><a href="confidentialite.html">Confidentialité</a><a href="cookies.html">Cookies et stockage</a><a href="cgu.html">Conditions d'utilisation</a><a href="accessibilite.html">Accessibilité</a></nav>`;
  }

  /* ---------- Rendu global ---------- */
  function renderView() {
    /* Mode sombre : Accueil, Collection, Paliers et Trophées en « Mur de cartes » ; Progrès bascule lui-même ; Manche et Oreille gardent leur mise en page. */
    /* Sombre : Mur sur Accueil, Collection, Paliers, Trophées et Docs. Clair : Mur sur l'Accueil seulement (choix du 22 novembre 2026). */
    const wall = isDark() ? { accueil: wallAccueil, paliers: wallPaliers, collection: wallCollection, trophees: wallTrophees, doc: wallDoc } : { accueil: wallAccueil };
    const v = wall[ui.tab] || { accueil: viewAccueil, paliers: viewPaliers, collection: viewCollection, trophees: viewTrophees, doc: viewDoc, progres: viewProgres, manche: viewManche, oreille: viewOreille }[ui.tab] || viewAccueil;
    const el = $('#view'), a = document.activeElement;
    /* Après un rafraîchissement, le focus clavier revient sur la même commande (menu, puce, bouton). */
    let sel = null;
    if (a && a !== el && el.contains(a)) {
      if (a.id) sel = '#' + CSS.escape(a.id);
      else if (a.dataset && a.dataset.act) sel = `[data-act="${a.dataset.act}"]` + ['id', 'v', 'p', 'q'].filter((k) => a.dataset[k] !== undefined).map((k) => `[data-${k}="${CSS.escape(a.dataset[k])}"]`).join('');
    }
    el.innerHTML = v();
    if (sel) { const t = el.querySelector(sel); if (t) t.focus({ preventScroll: true }); }
    if (ui.tab !== lastViewTab) { /* apparition décalée des blocs, seulement au changement de vue */
      lastViewTab = ui.tab; el.classList.remove('enter'); void el.offsetWidth; el.classList.add('enter');
      clearTimeout(enterTimer); enterTimer = setTimeout(() => el.classList.remove('enter'), 900);
    }
  }
  let lastViewTab = null, enterTimer = null;
  /* Fait défiler chaque manche jusqu'aux positions affichées (utile sur téléphone). */
  function scrollFretboards() {
    document.querySelectorAll('.fb-wrap:not([data-keep-scroll])').forEach((w) => { /* le manche de l'Accueil reste calé sur le sillet et les noms des cordes */
      const xs = [...w.querySelectorAll('circle[r="12.5"]')].map((c) => Number(c.getAttribute('cx')));
      if (!xs.length || w.scrollWidth <= w.clientWidth) return;
      const lo = Math.min(...xs), hi = Math.max(...xs);
      w.scrollLeft = Math.max(0, (hi - lo < w.clientWidth - 60 ? (lo + hi) / 2 - w.clientWidth / 2 : lo - 30));
    });
  }
  function render() { renderHeader(); renderSessionBar(); renderView(); renderDock(); renderModal(); renderSeance(); renderLogin(); scrollFretboards(); }

  /* ---------- Micro ---------- */
  const mic = { stream: null, analyser: null, buf: null, timer: null, tracker: new Core.NoteTracker(3, 4) };
  async function micStart(deviceId) {
    micStop(true);
    try {
      const c = Sound.ac();
      mic.stream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: deviceId ? { exact: deviceId } : undefined, echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      const src = c.createMediaStreamSource(mic.stream);
      mic.analyser = c.createAnalyser(); mic.analyser.fftSize = 4096; src.connect(mic.analyser);
      mic.buf = new Float32Array(4096); mic.tracker = new Core.NoteTracker(3, 4);
      mic.timer = setInterval(micTick, 45);
      ui.mic.on = true; ui.mic.err = '';
      try { ui.mic.devices = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'audioinput'); } catch (e) { ui.mic.devices = []; }
      const tr = mic.stream.getAudioTracks()[0]; ui.mic.device = (tr && tr.getSettings && tr.getSettings().deviceId) || deviceId || '';
    } catch (e) { ui.mic.on = false; ui.mic.err = 'Micro refusé ou introuvable. Autorise le micro pour ce site (icône à gauche de l\'adresse), vérifie que la Focusrite est branchée, puis réessaie.'; }
    render();
  }
  function micStop(silent) {
    clearInterval(mic.timer); mic.timer = null;
    if (mic.stream) mic.stream.getTracks().forEach((t) => t.stop());
    mic.stream = null; ui.mic.on = false; ui.check = null;
    if (!silent) render();
  }
  function micTick() {
    if (!mic.analyser) return;
    mic.analyser.getFloatTimeDomainData(mic.buf);
    const r = Core.detectPitch(mic.buf, Sound.ctx.sampleRate);
    const mf = r && r.clarity > 0.8 ? Core.freqToMidi(r.freq) : null;
    const nEl = $('#tuner-note');
    if (nEl && mf != null) {
      const m = Math.round(mf), cents = Math.round((mf - m) * 100);
      nEl.textContent = Core.noteName(m);
      $('#tuner-needle').style.left = (50 + Math.max(-50, Math.min(50, cents))) + '%';
      $('#tuner-cents').textContent = Math.abs(cents) <= 6 ? 'juste' : (cents > 0 ? '+' : '') + cents + ' cents';
    }
    const ev = mic.tracker.feed(mf);
    if (ev != null) onMicNote(ev);
  }
  function onMicNote(midi) {
    const pc = Core.mod(midi, 12);
    if (ui.tab === 'manche' && ui.check && !ui.check.done) {
      const c = ui.check, exp = Core.mod(c.seq[c.i].midi, 12);
      if (pc === exp) {
        if (c.i === 0) c.t0 = performance.now();
        c.i++; c.wrong = '';
        if (c.i >= c.seq.length) {
          c.done = true; c.time = (performance.now() - c.t0) / 1000;
          if (!c.errors) {
            st.stats.micClean = (st.stats.micClean || 0) + 1;
            const r = mutRec(today()); if ((r.micXp || 0) < 50) { r.micXp = (r.micXp || 0) + XP.mic; gain(XP.mic, 'sans-faute au micro'); }
            Sound.chime(true); commit(); return;
          }
        }
      } else if (c.i > 0 && pc === Core.mod(c.seq[c.i - 1].midi, 12)) return;
      else { c.errors++; c.wrong = `Tu as joué ${Core.NOTE_FR[pc]}.`; }
      render(); return;
    }
    const e = ui.ear;
    if (ui.tab === 'oreille' && e.q && !e.result && e.q.type !== 'inter') {
      e.tries.push(midi);
      if (e.q.type === 'note') earAnswer(pc === Core.mod(e.q.target, 12));
      else {
        const i = e.tries.length - 1;
        if (pc !== Core.mod(e.q.notes[i], 12)) earAnswer(false);
        else if (e.tries.length === e.q.notes.length) earAnswer(true);
        else render();
      }
    }
  }

  /* ---------- Images importées ---------- */
  function fileToSmallDataUrl(file) {
    return new Promise((resolve, reject) => {
      const rd = new FileReader();
      rd.onload = () => { const im = new Image(); im.onload = () => { const s = Math.min(1, 480 / Math.max(im.width, im.height)); const c = document.createElement('canvas'); c.width = Math.round(im.width * s); c.height = Math.round(im.height * s); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); resolve(c.toDataURL('image/jpeg', 0.78)); }; im.onerror = reject; im.src = rd.result; };
      rd.onerror = reject; rd.readAsDataURL(file);
    });
  }

  /* ---------- Événements ---------- */
  function go(tab) { ui.tab = VIEWS.includes(tab) ? tab : 'accueil'; ui.armed = null; ui.flipped = null; if (location.hash !== '#' + ui.tab) history.replaceState(null, '', '#' + ui.tab); render(); window.scrollTo(0, 0); }
  const ACT = {
    account() { if (Cloud.user) go('progres'); else { ui.login.show = true; render(); } },
    'login-open'() { ui.login.show = true; render(); },
    'login-retry'() { ui.login.state = 'idle'; render(); },
    guest() { try { localStorage.setItem(LS_GUEST, '1'); } catch (e) { /* rien */ } ui.login.show = false; render(); },
    async 'delacc-ok'() {
      try { await Cloud.deleteAccount(); } catch (e) { ui.armed = null; render(); toast('Suppression impossible : vérifie ta connexion et réessaie.', 'locked'); return; }
      try { localStorage.removeItem(LS); localStorage.removeItem(LS_GUEST); } catch (e) { /* rien */ }
      st = fresh(); ui.armed = null; ui.session = null; ui.sync = 'local'; stopTimer(); render(); toast('Compte et données supprimés.', 'check-mark-button');
    },
    async logout() { await Cloud.signOut(); ui.sync = 'local'; render(); toast('Déconnecté. Ta progression reste sur cet appareil.', 'link'); },
    dock() { ui.dock = !ui.dock; render(); },
    session() { startSession(); },
    'session-stop'() { seanceStop(); },
    'seance-ok'() { seanceValidate(); },
    'seance-pause'() { const s = ui.session, m = seanceCur(); if (!s || !m) return; if (s.count) { seanceHold(); return; } if (ui.timer && ui.timer.mid === m.id && ui.timer.running) { pauseTimer(); seanceToolsOff(); render(); } else { seanceStartTimer(m); render(); } },
    'seance-now'() { seanceCountDone(); },
    'seance-hold'() { seanceHold(); },
    'seance-undo'() { seanceUndo(); },
    'seance-min'() { seanceMin(); },
    'seance-guide'() { if (!ui.session) return; ui.session.drawer = !ui.session.drawer; render(); const d = $('#sx-drawer'); if (ui.session.drawer && d) d.querySelector('button').focus({ preventScroll: true }); else { const sx = $('#sx'); if (sx) sx.focus({ preventScroll: true }); } }, /* guide fermé : le focus revient sur l'écran pour qu'Entrée valide */
    'seance-booster'() { ui.session = null; openBooster(); render(); },
    'seance-close'() { ui.session = null; go('accueil'); },
    'mission-open'(d) { ui.modal = { type: 'mission', id: d.id, focusSel: d.back ? '[data-act="guide"]' : null }; render(); },
    guide(d) { ui.modal = { type: 'guide', id: d.id, from: d.from || null }; render(); },
    mission(d) { completeMission(d.id); },
    timer(d) { const m = missionsFor(today()).find((x) => x.id === d.id); if (m) startTimer(m.id, m.min); },
    'timer-pause'() { pauseTimer(); },
    booster() { openBooster(); },
    theme() { try { localStorage.setItem(LS_THEME, isDark() ? 'light' : 'dark'); } catch (e) { /* stockage indisponible : le choix vaut pour cette visite */ document.documentElement.dataset.theme = isDark() ? 'light' : 'dark'; render(); return; } applyTheme(); render(); toast(isDark() ? 'Mode sombre activé' : 'Mode clair activé', isDark() ? 'card-file-box' : 'sunrise'); },
    bflip() { revealBooster(false); },
    bskip() { revealBooster(true); },
    close() { ui.modal = null; ui.armed = null; render(); },
    arm(d) { ui.armed = d.id; ui.importMsg = ''; const keep = $('#code-in') ? $('#code-in').value : ''; render(); if ($('#code-in')) $('#code-in').value = keep; },
    disarm() { ui.armed = null; render(); },
    'palier-ok'(d) { validatePalier(d.id); },
    'palier-undo'(d) { undoPalier(d.id); },
    song(d) { ui.modal = { type: 'song', id: d.id }; ui.armed = null; render(); },
    bonus(d) { ui.modal = { type: 'bonus', id: d.id }; render(); },
    flip(d, src) {
      /* Carte déjà retournée : un clic n'importe où au dos ouvre la fiche (seul le lien « Retourner la carte » la remet à l'endroit). */
      if (src && src.classList.contains('card') && ui.flipped === d.id) { ui.modal = { type: 'song', id: d.id }; ui.armed = null; render(); return; }
      ui.flipped = ui.flipped === d.id ? null : d.id; const el = document.querySelector(`.card[data-id="${CSS.escape(d.id)}"]`); document.querySelectorAll('.card.flipped').forEach((c) => { if (c !== el) c.classList.remove('flipped'); }); if (el) { el.classList.toggle('flipped', ui.flipped === d.id); const kb = document.activeElement && el.contains(document.activeElement); if (kb) { const f = el.querySelector(ui.flipped === d.id ? '.cbtn' : '.flip-hit'); if (f) f.focus(); } } },
    step(d) { songStep(d.id, 1); },
    'step-undo'(d) { songStep(d.id, -1); },
    pass(d) { passSong(d.id); },
    'set-active'(d) { st.active = d.id; commit(); toast('Carte en cours : ' + songById(d.id).t, 'guitar'); },
    'next-boss'() { ui.modal = { type: 'next-boss' }; render(); },
    'pick-boss'(d) { st.boss.current = d.id; ui.modal = null; commit(); toast('Nouveau boss : ' + songById(d.id).t, 'dragon-face'); go('accueil'); },
    'add-song'(d) { ui.modal = { type: 'add-song', boss: d.boss === '1' }; render(); setTimeout(() => { const i = $('#ns-t'); if (i) i.focus(); }, 30); },
    'del-song'(d) { st.custom = st.custom.filter((s) => s.id !== d.id); delete st.steps[d.id]; delete st.passes[d.id]; delete st.img[d.id]; if (st.active === d.id) st.active = 'hysteria'; ui.modal = null; ui.armed = null; commit(); },
    'img-url'(d) { const v = ($('#img-url').value || '').trim(); if (!/^https?:\/\//i.test(v)) { toast('Colle un lien qui commence par https://', 'locked'); return; } st.img[d.id] = v; commit(); },
    'img-reset'(d) { delete st.img[d.id]; commit(); },
    coltab(d) { ui.colTab = d.v; ui.flipped = null; render(); },
    rar(d) { ui.rar = d.v; ui.flipped = null; render(); },
    preview() { ui.preview = !ui.preview; render(); },
    quick(d) {
      Sound.ac();
      if (d.q === 'metro') { ui.dock = true; render(); }
      else if (d.q === 'jam') { ui.dock = true; Sound.jam.root = 9; if (!Sound.jamLoop.on) { Sound.metroLoop.stop(); Sound.jamLoop.start(); } render(); }
      else if (d.q === 'manche') go('manche');
      else if (d.q === 'oreille') go('oreille');
      else if (d.q === 'tuner' || d.q === 'check') { if (d.q === 'check') ui.fb.pos = [Math.min(...ui.fb.pos)]; go('manche'); if (MIC_OK && !ui.mic.on) micStart(ui.mic.device); setTimeout(() => { const p = $('#micpanel'); if (p) p.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 60); }
    },
    'show-fb'(d) { if (seanceOn()) seanceMin(); const [scale, root, pos] = JSON.parse(d.fb); ui.fb.scale = scale; ui.fb.root = root; ui.fb.pos = pos.slice(); ui.check = null; ui.modal = null; go('manche'); },
    'fb-labels'(d) { ui.fb.labels = d.v; render(); },
    'fb-all'() { ui.fb.pos = [0, 1, 2, 3, 4]; ui.check = null; render(); },
    'fb-pos'(d) { const p = Number(d.p), f = ui.fb; if (f.pos.length === 5) f.pos = [p]; else if (f.pos.includes(p)) { f.pos = f.pos.filter((x) => x !== p); if (!f.pos.length) f.pos = [0, 1, 2, 3, 4]; } else f.pos = f.pos.concat(p).sort(); ui.check = null; render(); },
    dice() { let r; do { r = Math.floor(Math.random() * 12); } while (r === ui.fb.root); ui.fb.root = r; ui.check = null; toast('Tonalité : ' + Core.NOTE_FR[r], 'game-die'); render(); },
    pluck(d, el) { Sound.pluck(Number(d.midi)); if (el) { el.classList.remove('hit'); void el.getBoundingClientRect(); el.classList.add('hit'); setTimeout(() => el.classList.remove('hit'), 450); } },
    'fb-play'() {
      const f = ui.fb, p = f.pos.length === 5 ? 0 : Math.min(...f.pos), seq = Core.sequenceForPosition(f.root, f.scale, p).map((n) => n.midi);
      if (!seq.length) { toast('Cette position ne tient pas sur le manche dans cette tonalité', 'locked'); return; }
      Sound.playSeq(seq, 0.3, 0.7);
    },
    'go-ear'(d) { if (seanceOn()) seanceMin(); ui.ear.mode = d.mode; ui.ear.level = Number(d.level); ui.ear.q = null; ui.ear.result = null; ui.modal = null; go('oreille'); },
    'ear-mode'(d) { ui.ear.mode = d.v; ui.ear.level = 1; ui.ear.q = null; ui.ear.streak = 0; render(); },
    'ear-level'(d) { ui.ear.level = Number(d.v); ui.ear.q = null; ui.ear.streak = 0; render(); },
    'ear-new'() { newQuestion(); render(); playQuestion(); },
    'ear-play'() { playQuestion(); },
    'ear-pick'(d) { const q = ui.ear.q; if (!q) return; earAnswer(q.type === 'note' ? Number(d.v) === Core.mod(q.target, 12) : Number(d.v) === q.st); },
    'ear-reveal'() { ui.ear.revealed = true; render(); },
    'ear-self'(d) { earAnswer(d.v === '1'); },
    'metro-step'(d) { Sound.metro.bpm = Math.max(40, Math.min(240, Sound.metro.bpm + Number(d.v))); document.querySelectorAll('#metro-bpm, #sheet-bpm').forEach((el) => { el.textContent = Sound.metro.bpm; }); const rg = $('#metro-range'); if (rg) rg.value = Sound.metro.bpm; },
    'metro-toggle'() { if (Sound.metroLoop.on) { Sound.metroLoop.stop(); ui.beat = -1; } else { Sound.jamLoop.stop(); Sound.metroLoop.start(); } render(); },
    'jam-toggle'() { if (Sound.jamLoop.on) Sound.jamLoop.stop(); else { Sound.metroLoop.stop(); ui.beat = -1; Sound.jamLoop.start(); } render(); },
    'mic-on'() { micStart(ui.mic.device); },
    'mic-off'() { micStop(); },
    'check-start'() { const p = Math.min(...ui.fb.pos); ui.fb.pos = [p]; const seq = Core.sequenceForPosition(ui.fb.root, ui.fb.scale, p); ui.check = seq.length ? { seq, i: 0, errors: 0, wrong: '', done: false, t0: 0, time: 0 } : null; mic.tracker = new Core.NoteTracker(3, 4); render(); },
    'check-stop'() { ui.check = null; render(); },
    short() { st.short = !st.short; commit(); },
    'no-art'() { st.noArt = !st.noArt; commit(); },
    'save-name'() { st.name = ($('#pseudo').value || '').trim().slice(0, 24); commit(); toast('Prénom enregistré', 'check-mark-button'); },
    copy() { const t = $('#code-out'), msg = $('#copy-msg'); const done = (ok) => { if (msg) msg.textContent = ok ? 'Copié.' : 'Copie impossible : sélectionne le texte et copie-le à la main.'; }; try { navigator.clipboard.writeText(t.value).then(() => done(true), () => { t.select(); done(false); }); } catch (e) { t.select(); done(false); } },
    'import-ok'() {
      let o = null;
      try { o = normalize(JSON.parse(decodeURIComponent(escape(atob($('#code-in').value.trim()))))); } catch (e) { o = null; }
      ui.armed = null;
      if (!o) { ui.importMsg = 'Code illisible. Recopie-le en entier depuis l\'autre appareil.'; render(); return; }
      st = o; ui.importMsg = ''; commit(); toast('Progression importée', 'check-mark-button');
    },
    'reset-ok'() { st = fresh(); ui.armed = null; ui.session = null; stopTimer(); commit(); toast('Progression remise à zéro', 'repeat-button'); },
    merge(d) { const r = ui.modal && ui.modal.remote; ui.modal = null; if (d.v === 'remote' && r) { st = r; st.syncedUser = Cloud.user && Cloud.user.id; saveLocal(); render(); } else { save(); push(); render(); } },
  };
  document.addEventListener('click', (ev) => {
    const t = ev.target;
    if (t.closest('a[target="_blank"]')) return;
    const el = t.closest('[data-act]');
    if (!el) { if (t.id === 'modal') { ui.modal = null; render(); } return; }
    if (!ui.modal) modalOpener = el;
    const fn = ACT[el.dataset.act], inSx = seanceOn() && $('#seance').contains(el);
    if (fn) { if (el.dataset.act !== 'account') Sound.ac(); fn(el.dataset, el); }
    /* Après un clic souris dans la séance, le focus revient sur l'écran : Espace et Entrée restent des raccourcis. */
    if (inSx && ev.detail > 0 && !ui.modal && seanceOn() && el.dataset.act !== 'seance-guide' && !el.matches('input, select')) { const sx = $('#sx'); if (sx) sx.focus({ preventScroll: true }); }
  });
  document.addEventListener('keydown', (ev) => {
    /* Mode séance : Échap, Tab gardé dans l'écran, Espace, Entrée, G, M, Ctrl+Z (pas pendant la saisie d'un tempo). */
    if (seanceOn() && !ui.modal && !ui.login.show) {
      const s = ui.session, onCtl = ev.target.closest && ev.target.closest('button, a, input, select, textarea'), typing = ev.target.matches && ev.target.matches('input, select, textarea');
      if (ev.key === 'Escape') { ev.preventDefault(); if (s.drawer) { s.drawer = false; render(); const sx = $('#sx'); if (sx) sx.focus({ preventScroll: true }); } else if (s.view === 'recap') { ui.session = null; go('accueil'); } else seanceMin(); return; }
      if (ev.key === 'Tab') {
        const box = $('#seance'), f = [...box.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter((x) => !x.disabled && x.getClientRects().length && getComputedStyle(x).visibility !== 'hidden');
        if (!f.length) return;
        const a = document.activeElement, first = f[0], last = f[f.length - 1];
        if (!box.contains(a) || a.id === 'sx') { ev.preventDefault(); (ev.shiftKey ? last : first).focus(); } else if (ev.shiftKey && a === first) { ev.preventDefault(); last.focus(); } else if (!ev.shiftKey && a === last) { ev.preventDefault(); first.focus(); }
        return;
      }
      if (s.view !== 'full' || typing) return;
      if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'z') { ev.preventDefault(); seanceUndo(); return; }
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
      const m = seanceCur();
      if (ev.key === ' ' && !onCtl) { ev.preventDefault(); ACT['seance-pause'](); return; }
      if (ev.key === 'Enter' && !onCtl) { ev.preventDefault(); if (s.count) seanceCountDone(); else seanceValidate(); return; }
      if ((ev.key === 'g' || ev.key === 'G') && m && m.exo && GUIDES[m.exo]) { ACT['seance-guide'](); return; }
      if ((ev.key === 'm' || ev.key === 'M') && m) { if (m.exo) ACT['metro-toggle'](); else if (m.jam) ACT['jam-toggle'](); return; }
      return;
    }
    if (ev.key === 'Escape' && ui.modal) { ui.modal = null; render(); return; }
    if (ev.key === 'Tab' && ui.modal) { /* le focus reste dans la fenêtre */
      const box = $('#modal'), f = [...box.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter((x) => !x.disabled && x.getClientRects().length && getComputedStyle(x).visibility !== 'hidden');
      if (!f.length) return;
      const a = document.activeElement, first = f[0], last = f[f.length - 1];
      if (!box.contains(a)) { ev.preventDefault(); first.focus(); } else if (ev.shiftKey && (a === first || !f.includes(a))) { ev.preventDefault(); last.focus(); } else if (!ev.shiftKey && a === last) { ev.preventDefault(); first.focus(); }
      return;
    }
    if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.matches && ev.target.matches('[data-act][tabindex]:not(button):not(a):not(input):not(select):not(textarea)')) { ev.preventDefault(); ev.target.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
  });
  document.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    if (ev.target.id === 'login-form') {
      const email = ($('#login-email').value || '').trim();
      if (!email) return;
      ui.login.email = email; ui.login.state = 'sending'; ui.login.msg = ''; render();
      try { await Cloud.sendLink(email); ui.login.state = 'sent'; } catch (e) { ui.login.state = 'idle'; const msg = e.message || ''; ui.login.msg = /rate|limit|seconds/i.test(msg) ? 'Trop de demandes rapprochées : attends une minute avant de redemander un lien.' : /fetch|network/i.test(msg) ? 'Pas de connexion internet, ou service de connexion injoignable. Réessaie dans un moment.' : /invalid.*email|email.*invalid/i.test(msg) ? 'Adresse e-mail invalide.' : 'Envoi impossible : ' + msg; }
      render();
    } else if (ev.target.id === 'add-form') {
      const t = ($('#ns-t').value || '').trim(); if (!t) return;
      const s = { id: 'c-' + Date.now().toString(36), t: t.slice(0, 60), a: ($('#ns-a').value || '').trim().slice(0, 60), r: $('#ns-r').value, custom: true, why: '' };
      const img = ($('#ns-img').value || '').trim();
      st.custom.push(s); if (/^https?:\/\//i.test(img)) st.img[s.id] = img;
      const asBoss = ui.modal && ui.modal.boss; if (asBoss) st.boss.current = s.id;
      ui.modal = { type: 'song', id: s.id }; commit(); toast(asBoss ? 'Nouveau boss : ' + s.t : 'Morceau ajouté : ' + s.t, 'sparkles');
    }
  });
  document.addEventListener('input', (ev) => {
    const k = ev.target.dataset && ev.target.dataset.input;
    if (k === 'bpm') ui.bpmDraft = ev.target.value;
    else if (k === 'metro') { Sound.metro.bpm = Number(ev.target.value); document.querySelectorAll('#metro-bpm, #sheet-bpm').forEach((el) => { el.textContent = Sound.metro.bpm; }); }
    else if (k === 'jam-bpm') { const v = Number(ev.target.value); if (v >= 50 && v <= 180) Sound.jam.bpm = v; }
  });
  document.addEventListener('change', async (ev) => {
    const k = ev.target.dataset && ev.target.dataset.change, v = ev.target.value;
    if (k === 'fb-root') { ui.fb.root = Number(v); ui.check = null; render(); }
    else if (k === 'fb-scale') { ui.fb.scale = v; ui.check = null; render(); }
    else if (k === 'bpm-exo') { ui.bpmExo = v; render(); }
    else if (k === 'jam-root') Sound.jam.root = Number(v);
    else if (k === 'jam-style') Sound.jam.style = v;
    else if (k === 'mic-dev') micStart(v);
    else if (k === 'img-file') { const f = ev.target.files && ev.target.files[0]; if (!f) return; try { st.img[ev.target.dataset.id] = await fileToSmallDataUrl(f); commit(); } catch (e) { toast('Image illisible', 'locked'); } }
  });
  document.addEventListener('pointermove', (ev) => {
    if (ev.pointerType === 'touch') return;
    const c = ev.target.closest && ev.target.closest('.card'); if (!c || c.classList.contains('static')) return;
    const r = c.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width - 0.5, y = (ev.clientY - r.top) / r.height - 0.5;
    c.style.setProperty('--ry', (x * 14).toFixed(1) + 'deg'); c.style.setProperty('--rx', (-y * 14).toFixed(1) + 'deg'); c.style.setProperty('--sx', (120 - (x + 0.5) * 240).toFixed(0) + '%');
  });
  document.addEventListener('pointerout', (ev) => { const c = ev.target.closest && ev.target.closest('.card'); if (c && !c.contains(ev.relatedTarget)) { c.style.removeProperty('--rx'); c.style.removeProperty('--ry'); c.style.removeProperty('--sx'); } });
  Sound.metro.onBeat = (b) => { ui.beat = b; document.querySelectorAll('#beats, #sx-beats').forEach((el) => [...el.children].forEach((c, i) => c.classList.toggle('on', i === b))); };
  /* Page fermée pendant le compte à rebours : la mission validée est enregistrée quand même. */
  window.addEventListener('pagehide', () => { if (ui.session && ui.session.pending) { if (ui.session.count) clearTimeout(ui.session.count.t); ui.session.count = null; seanceCommit(); save(); } });
  function readHash() { const h = location.hash.replace('#', ''); ui.tab = VIEWS.includes(h) ? h : 'accueil'; ui.armed = null; ui.flipped = null; }
  window.addEventListener('hashchange', () => { const prev = ui.tab; readHash(); if (ui.tab !== prev) { render(); window.scrollTo(0, 0); } });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { pullIfNewer(); if (lastDay !== today()) { lastDay = today(); render(); } } });
  let lastDay = today();
  setInterval(() => { if (lastDay !== today()) { lastDay = today(); render(); } }, 60000);

  /* ---------- Démarrage ---------- */
  loadLocal(); readHash(); render();
  Cloud.onChange((u) => { if (u) { ui.login.show = false; ui.login.state = 'idle'; render(); syncNow(); } else render(); });
  Cloud.init().then((u) => {
    let guest = false; try { guest = localStorage.getItem(LS_GUEST) === '1'; } catch (e) { guest = false; }
    if (u) { syncNow(); render(); }
    else if (!guest) { ui.login.show = true; render(); }
    if (/access_token|error_description/.test(location.hash)) { readHash(); history.replaceState(null, '', location.pathname + '#accueil'); render(); }
  });
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => { /* hors ligne non disponible */ });
  window.GQ = { get state() { return st; }, ui, missionsFor, onMicNote, render, bossState, facts, passSong, songStep, ACT };
})();
