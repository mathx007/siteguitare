/* Gratte Quest : vitrine des trophées en 3D (disques d'or, d'argent et de bronze sur pied, vitrine en noyer et laiton).
   Module chargé seulement à l'ouverture de l'onglet Trophées. Un seul canevas WebGL, déplacé d'un rendu de la page à l'autre.
   Glisser fait tourner la vitrine (angle limité) ; le disque survolé ou choisi tourne sur lui-même (pas si le mouvement réduit est demandé). */
import * as THREE from '../vendor/three.module.min.js';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';

const reduce = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let R = null;

/* ---------- matières ---------- */
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
function woodTex(base, rep) {
  const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 160; i++) {
    const x = rnd() * 512, w = 1 + rnd() * 4; g.fillStyle = `rgba(20,8,2,${0.04 + rnd() * 0.14})`; g.beginPath(); g.moveTo(x, 0);
    for (let y = 0; y <= 512; y += 16) g.lineTo(x + Math.sin(y / 70 + i) * 7, y);
    for (let y = 512; y >= 0; y -= 16) g.lineTo(x + w + Math.sin(y / 70 + i) * 7, y);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); t.anisotropy = 8; return t;
}
/* Reflets de la vitre : voile très léger et bandes diagonales plus claires (canal alpha). */
function streakTex() {
  const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d');
  g.fillStyle = '#101010'; g.fillRect(0, 0, 512, 512); g.translate(256, 256); g.rotate(-0.5); g.translate(-256, -256);
  for (const [x, w, a] of [[120, 70, 0.5], [215, 18, 0.36], [360, 40, 0.28]]) {
    const v = Math.round(255 * a), gr = g.createLinearGradient(x, 0, x + w, 0);
    gr.addColorStop(0, '#101010'); gr.addColorStop(0.5, `rgb(${v},${v},${v})`); gr.addColorStop(1, '#101010'); g.fillStyle = gr; g.fillRect(x, -300, w, 1200);
  }
  return new THREE.CanvasTexture(c);
}
function grooveTex() {
  const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d');
  g.fillStyle = '#777'; g.fillRect(0, 0, 512, 512);
  for (let r = 250; r > 70; r -= 2.2) { g.strokeStyle = r % 6.6 < 2.2 ? '#cfcfcf' : '#5a5a5a'; g.lineWidth = 1.2; g.beginPath(); g.arc(256, 256, r, 0, Math.PI * 2); g.stroke(); }
  return new THREE.CanvasTexture(c);
}
const METAL = { or: [0xd99a1e, 0.2], argent: [0xd6dbe3, 0.18], bronze: [0xb8692f, 0.28], lock: [0x2e2c3a, 0.6] };
function materials() {
  const metal = {}, face = {}, groove = grooveTex();
  for (const [k, [c, r]] of Object.entries(METAL)) {
    metal[k] = new THREE.MeshStandardMaterial({ color: c, metalness: k === 'lock' ? 0.55 : 1, roughness: r });
    face[k] = new THREE.MeshStandardMaterial({ color: c, metalness: k === 'lock' ? 0.55 : 1, roughness: 0.42, roughnessMap: groove, envMapIntensity: 1 });
  }
  return {
    metal, face,
    wood: new THREE.MeshStandardMaterial({ map: woodTex('#4e2f1a', [2, 1]), roughness: 0.62 }),
    woodDark: new THREE.MeshStandardMaterial({ map: woodTex('#4a2e1b', [2, 1]), roughness: 0.6 }),
    shelf: new THREE.MeshStandardMaterial({ map: woodTex('#7a5033', [3, 1]), roughness: 0.5 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xc9a15a, metalness: 1, roughness: 0.28 }),
    lacquer: new THREE.MeshStandardMaterial({ color: 0x17132b, metalness: 0.2, roughness: 0.35 }),
    label: new THREE.MeshStandardMaterial({ color: 0x17132b, roughness: 0.5 }),
    labelLock: new THREE.MeshStandardMaterial({ color: 0x3a3850, roughness: 0.5 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.02, transparent: true, alphaMap: streakTex(), clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 2.2, depthWrite: false }),
    led: new THREE.MeshStandardMaterial({ color: 0xffe7b0, emissive: 0xffd9a0, emissiveIntensity: 3 }),
  };
}

/* ---------- textures d'icône et de plaque ---------- */
const imgs = {};
function loadImg(name) {
  if (!imgs[name]) imgs[name] = new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = `assets/emoji/${name}.svg`; });
  return imgs[name];
}
function iconTex(name, lock) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  loadImg(name).then((img) => { if (!img) return; const g = c.getContext('2d'); if (lock) g.filter = 'grayscale(1) brightness(.75)'; g.drawImage(img, 28, 28, 200, 200); t.needsUpdate = true; kick(); });
  return t;
}
function plateTex(name, sub) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, '#f3dca0'); gr.addColorStop(1, '#b98f44'); g.fillStyle = gr; g.fillRect(0, 0, 512, 128);
  g.fillStyle = '#3b2414'; g.textAlign = 'center';
  let size = 46; g.font = `800 ${size}px Inter, Arial, sans-serif`; while (g.measureText(name).width > 480 && size > 26) { size -= 2; g.font = `800 ${size}px Inter, Arial, sans-serif`; }
  g.fillText(name, 256, 60); g.font = '700 34px Inter, Arial, sans-serif'; g.fillText(sub, 256, 104);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

/* ---------- disque sur pied ---------- */
function disc(M, item) {
  const k = item.own ? item.tier : 'lock', g = new THREE.Group(), lacq = M.lacquer;
  const pl = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.1, 0.42), lacq); pl.position.y = 0.05; pl.castShadow = pl.receiveShadow = true;
  const band = new THREE.Mesh(new THREE.BoxGeometry(0.424, 0.018, 0.424), M.brass); band.position.y = 0.08;
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.014, 72, 1, true), M.metal[k]); rim.rotation.x = Math.PI / 2;
  const front = new THREE.Mesh(new THREE.CircleGeometry(0.23, 72), M.face[k]); front.position.z = 0.007;
  const back = front.clone(); back.position.z = -0.007; back.rotation.y = Math.PI;
  const lab = new THREE.Mesh(new THREE.CircleGeometry(0.078, 48), k === 'lock' ? M.labelLock : M.label); lab.position.z = 0.0075;
  const icon = new THREE.Mesh(new THREE.PlaneGeometry(0.095, 0.095), new THREE.MeshStandardMaterial({ map: iconTex(item.icon, !item.own), transparent: true }));
  icon.position.z = 0.008;
  const d = new THREE.Group(); d.add(rim, front, back, lab, icon); d.position.y = 0.35; d.children.forEach((o) => { o.castShadow = true; });
  const tilt = new THREE.Group(); tilt.rotation.x = -0.12; tilt.add(d);
  const prop = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.26, 0.02), M.brass); prop.position.set(0, 0.22, -0.07); prop.rotation.x = 0.35;
  const lip = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.03, 0.05), M.brass); lip.position.set(0, 0.115, 0.04);
  g.add(pl, band, tilt, prop, lip);
  g.userData = { id: item.id, disc: d };
  return g;
}

/* ---------- vitrine ---------- */
const SW = 0.66, SH = 0.92, D = 0.72, T = 0.06;
function disposeTree(o, keep) {
  o.traverse((n) => {
    if (n.geometry) n.geometry.dispose();
    if (n.material && !keep.has(n.material)) { if (n.material.map) n.material.map.dispose(); n.material.dispose(); }
  });
}
function build(data) {
  const { scene, M } = R;
  if (R.cab) { scene.remove(R.cab); disposeTree(R.cab, R.shared); }
  R.lights.forEach((l) => scene.remove(l)); R.lights = [];
  const per = data.per, rows = data.shelves, W = per * SW + 0.16, H = rows.length * SH + 0.06;
  const cab = new THREE.Group(); R.cab = cab; R.discs = []; R.W = W; R.H = H;
  const box = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.receiveShadow = true; cab.add(o); return o; };
  box(W, H, T, M.wood, 0, H / 2, -D / 2);
  box(T, H, D, M.woodDark, -W / 2 - T / 2, H / 2, 0); box(T, H, D, M.woodDark, W / 2 + T / 2, H / 2, 0);
  box(W + 2 * T, T, D + 0.04, M.woodDark, 0, H + T / 2, 0); box(W + 2 * T, T, D, M.shelf, 0, -T / 2, 0);
  box(W + 0.36, 0.28, D + 0.16, M.woodDark, 0, -T - 0.14, 0.02);
  const fz = D / 2 + 0.02;
  box(W + 2 * T + 0.04, 0.07, 0.05, M.brass, 0, H + T, fz); box(W + 2 * T + 0.04, 0.07, 0.05, M.brass, 0, -T, fz);
  box(0.07, H + 0.14, 0.05, M.brass, -W / 2 - T, H / 2, fz); box(0.07, H + 0.14, 0.05, M.brass, W / 2 + T, H / 2, fz);
  box(W - 0.3, 0.02, 0.02, M.led, 0, H - 0.03, D / 2 - 0.12);
  rows.forEach((row, i) => {
    const y = H - 0.06 - (i + 1) * SH + 0.06, floor = i === rows.length - 1;
    const baseY = floor ? 0 : y;
    if (!floor) { box(W, 0.045, D - 0.04, M.shelf, 0, baseY - 0.0225, -0.01); box(W, 0.06, 0.05, M.brass, 0, baseY - 0.015, fz - 0.03); }
    const light = new THREE.PointLight(0xffd8a0, 0.9, 1.9, 2); light.position.set(0, baseY + SH - 0.14, 0.15); R.lights.push(light);
    row.forEach((item, j) => {
      const x = -W / 2 + 0.08 + SW * (j + 0.5), t = disc(M, item);
      t.position.set(x, baseY, 0); t.rotation.y = 0.32; t.scale.setScalar(1.1); cab.add(t); R.discs.push(t);
      const pm = new THREE.MeshStandardMaterial({ map: plateTex(item.name, item.state), metalness: 0.6, roughness: 0.35 });
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.11, 0.012), pm);
      plate.position.set(x, floor ? -0.13 : baseY - 0.08, floor ? D / 2 + 0.105 : fz + 0.005); cab.add(plate);
    });
  });
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(W + 2 * T, H + T), M.glass); glass.position.set(0, H / 2, fz + 0.03); glass.renderOrder = 2; cab.add(glass);
  R.lights.forEach((l) => cab.add(l));
  cab.rotation.set(R.pitch, R.yaw, 0);
  scene.add(cab);
  const k = R.key; k.shadow.camera.left = -W / 2 - 0.5; k.shadow.camera.right = W / 2 + 0.5; k.shadow.camera.top = H + 0.6; k.shadow.camera.bottom = -0.6; k.shadow.camera.updateProjectionMatrix();
}

/* ---------- cadrage, taille et rendu ---------- */
function fit() {
  const w = R.host.clientWidth || 600, h = Math.round(Math.min(Math.max(w * (R.H + 0.75) / (R.W + 0.55), 300), 1400));
  R.canvas.style.height = h + 'px';
  R.renderer.setSize(w, h, false); R.camera.aspect = w / h;
  const vf = Math.tan(THREE.MathUtils.degToRad(R.camera.fov / 2)), dist = Math.max((R.H + 0.55) / 2 / vf, (R.W + 0.45) / 2 / (vf * R.camera.aspect)) + D * 0.6;
  const target = new THREE.Vector3(0, R.H / 2 - 0.16, 0), dir = new THREE.Vector3(0.24, 0.16, 1).normalize();
  R.camera.position.copy(target).addScaledVector(dir, dist); R.camera.lookAt(target); R.camera.updateProjectionMatrix();
}
function frame(now) {
  R.raf = 0;
  if (!R.canvas.isConnected || document.hidden) return;
  const dt = Math.min(0.05, (now - (R.last || now)) / 1000); R.last = now;
  let moving = false;
  for (const t of R.discs) {
    const d = t.userData.disc, active = !reduce() && (t.userData.id === R.sel || t.userData.id === R.hover);
    if (active) { d.rotation.y += dt * 1.1; moving = true; }
    else if (Math.abs(d.rotation.y) > 0.002) { let a = ((d.rotation.y + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; d.rotation.y = a * 0.88; moving = true; }
    else d.rotation.y = 0;
  }
  R.renderer.render(R.scene, R.camera);
  if (moving) R.raf = requestAnimationFrame(frame); else R.last = 0;
}
function kick() { if (R && !R.raf) R.raf = requestAnimationFrame(frame); }

/* ---------- pointeur : glisser pour tourner, survoler et cliquer pour choisir ---------- */
function pick(ev) {
  const r = R.canvas.getBoundingClientRect(), p = new THREE.Vector2(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
  R.ray.setFromCamera(p, R.camera);
  const hit = R.ray.intersectObjects(R.discs, true)[0];
  let o = hit && hit.object; while (o && !(o.userData && o.userData.id)) o = o.parent;
  return o ? o.userData.id : null;
}
function events() {
  const c = R.canvas; let down = null;
  c.addEventListener('pointerdown', (ev) => { down = { x: ev.clientX, y: ev.clientY, yaw: R.yaw, pitch: R.pitch, moved: false }; c.setPointerCapture(ev.pointerId); });
  c.addEventListener('pointermove', (ev) => {
    if (down) {
      const dx = ev.clientX - down.x, dy = ev.clientY - down.y;
      if (Math.abs(dx) + Math.abs(dy) > 5) down.moved = true;
      if (down.moved) { R.yaw = Math.max(-0.65, Math.min(0.4, down.yaw + dx * 0.005)); R.pitch = Math.max(-0.14, Math.min(0.14, down.pitch + dy * 0.002)); R.cab.rotation.set(R.pitch, R.yaw, 0); kick(); }
      return;
    }
    if (ev.pointerType !== 'mouse') return;
    const id = pick(ev); c.style.cursor = id ? 'pointer' : 'grab';
    if (id !== R.hover) { R.hover = id; kick(); }
  });
  const up = (ev) => { if (down && !down.moved) { const id = pick(ev); if (id && R.onSelect) R.onSelect(id); } down = null; };
  c.addEventListener('pointerup', up);
  c.addEventListener('pointercancel', () => { down = null; });
  c.addEventListener('pointerleave', () => { if (R.hover) { R.hover = null; kick(); } });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); });
}

function setup() {
  const canvas = document.createElement('canvas'); canvas.className = 'vt3d-canvas'; canvas.setAttribute('role', 'img');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene(), pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture; pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xfff1dc, 0x2a1a10, 0.35));
  const key = new THREE.DirectionalLight(0xfff0d8, 1.6); key.position.set(2.5, 6, 5); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 0.5; key.shadow.camera.far = 20; key.shadow.bias = -0.0004; scene.add(key);
  const M = materials(), shared = new Set([M.wood, M.woodDark, M.shelf, M.brass, M.lacquer, M.label, M.labelLock, M.glass, M.led, ...Object.values(M.metal), ...Object.values(M.face)]);
  R = { canvas, renderer, scene, camera: new THREE.PerspectiveCamera(30, 1, 0.1, 60), key, M, shared, lights: [], discs: [], cab: null, sig: '', sel: null, hover: null, raf: 0, last: 0, yaw: -0.16, pitch: 0, ray: new THREE.Raycaster(), host: null, onSelect: null };
  events();
}

/* Place la vitrine dans host (la reconstruit si les trophées ont changé). data : { per, shelves: [[{ id, name, state, tier, own, icon }]], sel, label, onSelect }. */
export async function attach(host, data) {
  if (!R) { setup(); if (document.fonts && document.fonts.ready) await document.fonts.ready; }
  if (R.canvas.parentElement !== host) host.appendChild(R.canvas);
  if (R.host !== host) { R.host = host; if (R.ro) R.ro.disconnect(); R.ro = new ResizeObserver(() => { if (R.canvas.isConnected) { fit(); kick(); } }); R.ro.observe(host); }
  const sig = JSON.stringify([data.per, data.shelves]);
  if (sig !== R.sig) { R.sig = sig; build(data); }
  R.sel = data.sel; R.onSelect = data.onSelect; R.canvas.setAttribute('aria-label', data.label);
  fit(); kick();
}
