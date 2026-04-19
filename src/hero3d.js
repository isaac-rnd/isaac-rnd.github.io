// Hero 3D scene — Three.js wireframe icosahedron + particle field
import * as THREE from 'three';

const canvas = document.getElementById('hero-canvas');
if (!canvas) console.warn('no canvas');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x0a0a0a, 8, 22);

const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
camera.position.set(0, 0, 10);

function resize() {
  const rect = canvas.getBoundingClientRect();
  const w = rect.width || window.innerWidth;
  const h = rect.height || window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
resize();
window.addEventListener('resize', resize);

// Accent color from tweak
function getAccent() {
  const c = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#c8ff3a';
  return new THREE.Color(c);
}
let accent = getAccent();

// ---------- Wireframe icosahedron ----------
const geoIco = new THREE.IcosahedronGeometry(2.6, 1);
const matIco = new THREE.MeshBasicMaterial({
  color: 0xf4f3ee,
  wireframe: true,
  transparent: true,
  opacity: 0.28,
});
const ico = new THREE.Mesh(geoIco, matIco);
scene.add(ico);

// Inner glowing wireframe
const geoIco2 = new THREE.IcosahedronGeometry(1.5, 0);
const matIco2 = new THREE.MeshBasicMaterial({
  color: accent,
  wireframe: true,
  transparent: true,
  opacity: 0.7,
});
const ico2 = new THREE.Mesh(geoIco2, matIco2);
scene.add(ico2);

// Vertex dots on outer
const vertGeo = new THREE.BufferGeometry();
vertGeo.setAttribute('position', geoIco.getAttribute('position').clone());
const vertMat = new THREE.PointsMaterial({
  color: 0xf4f3ee,
  size: 0.04,
  sizeAttenuation: true,
});
const vertPts = new THREE.Points(vertGeo, vertMat);
scene.add(vertPts);

// ---------- Particle field ----------
const N = 1400;
const pGeo = new THREE.BufferGeometry();
const positions = new Float32Array(N * 3);
const basePos = new Float32Array(N * 3);
const speeds = new Float32Array(N);
for (let i = 0; i < N; i++) {
  const r = 4 + Math.random() * 7;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const x = r * Math.sin(phi) * Math.cos(theta);
  const y = r * Math.sin(phi) * Math.sin(theta);
  const z = r * Math.cos(phi);
  positions[i*3] = x; positions[i*3+1] = y; positions[i*3+2] = z;
  basePos[i*3] = x; basePos[i*3+1] = y; basePos[i*3+2] = z;
  speeds[i] = 0.4 + Math.random() * 0.8;
}
pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

const pMat = new THREE.PointsMaterial({
  color: 0xf4f3ee,
  size: 0.022,
  sizeAttenuation: true,
  transparent: true,
  opacity: 0.65,
});
const particles = new THREE.Points(pGeo, pMat);
scene.add(particles);

// ---------- Accent particles (smaller, colored) ----------
const N2 = 80;
const pGeo2 = new THREE.BufferGeometry();
const pos2 = new Float32Array(N2 * 3);
for (let i = 0; i < N2; i++) {
  const r = 3 + Math.random() * 5;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  pos2[i*3] = r * Math.sin(phi) * Math.cos(theta);
  pos2[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
  pos2[i*3+2] = r * Math.cos(phi);
}
pGeo2.setAttribute('position', new THREE.BufferAttribute(pos2, 3));
const pMat2 = new THREE.PointsMaterial({
  color: accent,
  size: 0.06,
  sizeAttenuation: true,
  transparent: true,
  opacity: 0.95,
});
const accentParticles = new THREE.Points(pGeo2, pMat2);
scene.add(accentParticles);

// ---------- Ring ----------
const ringGeo = new THREE.RingGeometry(3.6, 3.62, 128);
const ringMat = new THREE.MeshBasicMaterial({
  color: accent,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.4,
});
const ring = new THREE.Mesh(ringGeo, ringMat);
ring.rotation.x = Math.PI / 2.3;
scene.add(ring);

// ---------- Mouse ----------
const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
window.addEventListener('pointermove', (e) => {
  mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.ty = -(e.clientY / window.innerHeight) * 2 + 1;
});

// ---------- Scroll progress (fade out on scroll) ----------
let scrollY = 0;
window.addEventListener('scroll', () => { scrollY = window.scrollY; });

// ---------- Animate ----------
const clock = new THREE.Clock();
function animate() {
  const t = clock.getElapsedTime();
  clock.getDelta();
  const motion = (window.TWEAKS?.motion ?? 8) / 10;

  mouse.x += (mouse.tx - mouse.x) * 0.05;
  mouse.y += (mouse.ty - mouse.y) * 0.05;

  ico.rotation.x = t * 0.15 * motion;
  ico.rotation.y = t * 0.2 * motion + mouse.x * 0.4;
  ico.rotation.z = mouse.y * 0.2;

  ico2.rotation.x = -t * 0.3 * motion;
  ico2.rotation.y = -t * 0.4 * motion - mouse.x * 0.3;
  vertPts.rotation.copy(ico.rotation);

  particles.rotation.y = t * 0.02 * motion;
  particles.rotation.x = mouse.y * 0.1;
  accentParticles.rotation.y = -t * 0.04 * motion;

  ring.rotation.z = t * 0.05 * motion;

  // Subtle breathing on particle positions
  const arr = pGeo.getAttribute('position').array;
  for (let i = 0; i < N; i++) {
    const bx = basePos[i*3], by = basePos[i*3+1], bz = basePos[i*3+2];
    const s = Math.sin(t * speeds[i] * 0.3 * motion + i) * 0.15;
    arr[i*3] = bx + bx * s * 0.03;
    arr[i*3+1] = by + by * s * 0.03;
    arr[i*3+2] = bz + bz * s * 0.03;
  }
  pGeo.getAttribute('position').needsUpdate = true;

  // Fade by scroll
  const fade = Math.max(0, 1 - scrollY / 800);
  matIco.opacity = 0.28 * fade;
  matIco2.opacity = 0.7 * fade;
  pMat.opacity = 0.65 * fade;
  pMat2.opacity = 0.95 * fade;
  ringMat.opacity = 0.4 * fade;
  vertMat.opacity = fade;

  camera.position.x += (mouse.x * 0.8 - camera.position.x) * 0.03;
  camera.position.y += (mouse.y * 0.4 - camera.position.y) * 0.03;
  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

// Accent sync
window.addEventListener('tweak:accent', () => {
  accent = getAccent();
  matIco2.color.copy(accent);
  pMat2.color.copy(accent);
  ringMat.color.copy(accent);
});
