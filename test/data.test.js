// Chaque illustration doit avoir son dossier Wikimedia (MD5 du nom de fichier), sinon la carte s'affiche sans image.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const crypto = require('crypto');
const vm = require('vm');
const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(__dirname + '/../js/data.js', 'utf8') + '\n;this.SONGS = SONGS; this.ART_PATH = ART_PATH; this.EXOS = EXOS; this.GUIDES = GUIDES; this.GUIDE_BASES = GUIDE_BASES;', ctx);
test('les fichiers CSS et JS de index.html portent le numéro de version du CACHE de sw.js', () => {
  // Sans ce numéro, un navigateur peut garder jusqu'à 10 minutes l'ancienne version après une mise en ligne.
  const v = (fs.readFileSync(__dirname + '/../sw.js', 'utf8').match(/gratte-quest-v(\d+)/) || [])[1];
  const html = fs.readFileSync(__dirname + '/../index.html', 'utf8');
  const local = [...html.matchAll(/(?:href|src)="((?:app\.css|assets\/fonts\/fonts\.css|js\/[a-z]+\.js|vendor\/[a-z]+\.js)[^"]*)"/g)].map((m) => m[1]);
  assert.ok(v && local.length >= 8, 'CACHE ou fichiers introuvables');
  for (const u of local) assert.ok(u.endsWith('?v=' + v), `${u} devrait finir par ?v=${v}`);
});
test('chaque œuvre a un chemin Wikimedia correct', () => {
  const arts = ctx.SONGS.filter((s) => s.art).map((s) => s.art[0]);
  assert.ok(arts.length >= 26);
  for (const f of arts) {
    const h = crypto.createHash('md5').update(f.replace(/ /g, '_'), 'utf8').digest('hex');
    assert.strictEqual(ctx.ART_PATH[f], h[0] + '/' + h.slice(0, 2), f);
  }
});
test('chaque exercice de vitesse a son guide « Comment bien faire l\'exo », complet', () => {
  const ids = Object.keys(ctx.EXOS).concat(ctx.GUIDE_BASES);
  for (const id of Object.keys(ctx.EXOS)) assert.strictEqual(ctx.GUIDES[id] && ctx.GUIDES[id].kind, 'exo', id);
  for (const id of ctx.GUIDE_BASES) assert.ok(ctx.GUIDES[id] && ctx.GUIDES[id].kind === 'base' && ctx.GUIDES[id].t && ctx.GUIDES[id].e, id);
  assert.deepStrictEqual(Object.keys(ctx.GUIDES).sort(), ids.sort(), 'guide orphelin');
  for (const id of ids) {
    const g = ctx.GUIDES[id];
    assert.ok(g.goal && g.yt, id);
    for (const k of ['setup', 'steps', 'check']) assert.ok(Array.isArray(g[k]) && g[k].length >= 2 && g[k].every((x) => typeof x === 'string' && x.length > 10), `${id}.${k}`);
    assert.ok(g.errors.length >= 3 && g.errors.every((e) => e.length === 2 && e[0] && e[1]), `${id}.errors`);
  }
});
