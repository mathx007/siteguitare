// Chaque illustration doit avoir son dossier Wikimedia (MD5 du nom de fichier), sinon la carte s'affiche sans image.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const crypto = require('crypto');
const vm = require('vm');
const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(__dirname + '/../js/data.js', 'utf8') + '\n;this.SONGS = SONGS; this.ART_PATH = ART_PATH;', ctx);
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
