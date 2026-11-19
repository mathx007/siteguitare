// Chaque illustration doit avoir son dossier Wikimedia (MD5 du nom de fichier), sinon la carte s'affiche sans image.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const crypto = require('crypto');
const vm = require('vm');
const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(__dirname + '/../js/data.js', 'utf8') + '\n;this.SONGS = SONGS; this.ART_PATH = ART_PATH;', ctx);
test('chaque œuvre a un chemin Wikimedia correct', () => {
  const arts = ctx.SONGS.filter((s) => s.art).map((s) => s.art[0]);
  assert.ok(arts.length >= 26);
  for (const f of arts) {
    const h = crypto.createHash('md5').update(f.replace(/ /g, '_'), 'utf8').digest('hex');
    assert.strictEqual(ctx.ART_PATH[f], h[0] + '/' + h.slice(0, 2), f);
  }
});
