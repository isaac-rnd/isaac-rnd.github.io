// UI wiring: loader, cursor, reveal, marquee, tweaks, edit-mode protocol

(function () {
  // ---------- Loader ----------
  const loader = document.getElementById('loader');
  const loadNum = document.getElementById('load-num');
  const loadBar = document.getElementById('load-bar');
  const loadMsg = document.getElementById('load-msg');
  const messages = [
    'warming the runtime',
    'spinning up shaders',
    'loading particle field',
    'sharpening the type',
    'syncing with orbit',
  ];
  let p = 0;
  const startLoad = () => {
    const id = setInterval(() => {
      p += Math.random() * 7 + 2;
      if (p >= 100) { p = 100; clearInterval(id); finishLoad(); }
      loadNum.textContent = String(Math.floor(p)).padStart(2, '0');
      loadBar.style.width = p + '%';
      loadMsg.textContent = messages[Math.min(messages.length - 1, Math.floor(p / 22))];
    }, 80);
  };
  function finishLoad() {
    setTimeout(() => {
      loader.classList.add('done');
      revealCheck();
    }, 300);
  }
  window.addEventListener('load', () => {
    setTimeout(startLoad, 100);
  });

  // ---------- Custom cursor ----------
  const cursor = document.getElementById('cursor');
  let cx = window.innerWidth / 2, cy = window.innerHeight / 2;
  let tx = cx, ty = cy;
  window.addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; });
  function loop() {
    cx += (tx - cx) * 0.25;
    cy += (ty - cy) * 0.25;
    cursor.style.left = cx + 'px';
    cursor.style.top = cy + 'px';
    requestAnimationFrame(loop);
  }
  loop();
  document.addEventListener('pointerover', (e) => {
    const t = e.target;
    if (t.closest('a, button, .cta-btn, .cert, input, .sw')) cursor.classList.add('hover');
    else cursor.classList.remove('hover');
  });

  // ---------- Reveal on scroll ----------
  function revealCheck() {
    const els = document.querySelectorAll('[data-reveal]:not(.shown)');
    const vh = window.innerHeight;
    els.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.88) el.classList.add('shown');
    });
  }
  window.addEventListener('scroll', revealCheck, { passive: true });
  window.addEventListener('resize', revealCheck);
  revealCheck();

  // ---------- Tweaks panel ----------
  const panel = document.getElementById('tweaks');
  const TWEAKS = window.TWEAKS || {};

  function applyTweaks() {
    document.documentElement.style.setProperty('--accent', TWEAKS.accent);
    const hex = TWEAKS.accent.replace('#', '');
    const r = parseInt(hex.substr(0,2),16), g = parseInt(hex.substr(2,2),16), b = parseInt(hex.substr(4,2),16);
    const lum = (0.299*r + 0.587*g + 0.114*b) / 255;
    document.documentElement.style.setProperty('--accent-ink', lum > 0.6 ? '#0a0a0a' : '#f4f3ee');
    window.dispatchEvent(new Event('tweak:accent'));

    if (TWEAKS.invert) {
      document.documentElement.style.setProperty('--bg', '#f4f3ee');
      document.documentElement.style.setProperty('--bg-soft', '#eae9e2');
      document.documentElement.style.setProperty('--ink', '#0a0a0a');
      document.documentElement.style.setProperty('--ink-dim', '#565651');
      document.documentElement.style.setProperty('--ink-faint', '#aaaaa0');
      document.documentElement.style.setProperty('--rule', '#d8d6cc');
    } else {
      document.documentElement.style.setProperty('--bg', '#0a0a0a');
      document.documentElement.style.setProperty('--bg-soft', '#111111');
      document.documentElement.style.setProperty('--ink', '#f4f3ee');
      document.documentElement.style.setProperty('--ink-dim', '#9a9a93');
      document.documentElement.style.setProperty('--ink-faint', '#565651');
      document.documentElement.style.setProperty('--rule', '#1d1d1a');
    }

    document.querySelectorAll('#sw-row .sw').forEach(el => {
      el.classList.toggle('sel', el.dataset.c.toLowerCase() === TWEAKS.accent.toLowerCase());
    });
    const gBtn = document.getElementById('grid-toggle');
    if (gBtn) { gBtn.classList.toggle('on', !!TWEAKS.showGrid); gBtn.textContent = TWEAKS.showGrid ? 'GRID · ON' : 'GRID · OFF'; }
    const iBtn = document.getElementById('invert-toggle');
    if (iBtn) { iBtn.classList.toggle('on', !!TWEAKS.invert); iBtn.textContent = TWEAKS.invert ? 'LIGHT · ON' : 'DARK · ON'; }
    const mv = document.getElementById('motion-val');
    if (mv) mv.textContent = TWEAKS.motion;
    const ms = document.getElementById('motion-slider');
    if (ms) ms.value = TWEAKS.motion;
  }
  applyTweaks();

  function persistEdit(edits) {
    Object.assign(TWEAKS, edits);
    applyTweaks();
    window.parent?.postMessage({ type: '__edit_mode_set_keys', edits }, '*');
  }

  document.querySelectorAll('#sw-row .sw').forEach(el => {
    el.addEventListener('click', () => persistEdit({ accent: el.dataset.c }));
  });
  const ms = document.getElementById('motion-slider');
  if (ms) ms.addEventListener('input', (e) => persistEdit({ motion: +e.target.value }));
  const gBtn = document.getElementById('grid-toggle');
  if (gBtn) gBtn.addEventListener('click', () => persistEdit({ showGrid: !TWEAKS.showGrid }));
  const iBtn = document.getElementById('invert-toggle');
  if (iBtn) iBtn.addEventListener('click', () => persistEdit({ invert: !TWEAKS.invert }));

  window.addEventListener('message', (e) => {
    if (!e.data) return;
    if (e.data.type === '__activate_edit_mode') panel.classList.add('on');
    if (e.data.type === '__deactivate_edit_mode') panel.classList.remove('on');
  });
  window.parent?.postMessage({ type: '__edit_mode_available' }, '*');
})();
