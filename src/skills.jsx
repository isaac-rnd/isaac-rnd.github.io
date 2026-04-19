// Skills — interactive draggable constellation with physics-like behavior
const { useState, useEffect, useRef } = React;

const SKILLS = [
  // Frontend
  { id: 'angular', label: 'Angular', cat: 'Frontend', size: 1.1 },
  { id: 'react', label: 'React', cat: 'Frontend', size: 1.1 },
  { id: 'typescript', label: 'TypeScript', cat: 'Frontend', size: 1.0 },
  { id: 'tailwind', label: 'Tailwind', cat: 'Frontend', size: 0.9 },
  { id: 'bootstrap', label: 'Bootstrap', cat: 'Frontend', size: 0.85 },
  // Backend
  { id: 'springboot', label: 'Spring Boot', cat: 'Backend', size: 1.15 },
  { id: 'java', label: 'Java', cat: 'Backend', size: 1.1 },
  { id: 'django', label: 'Django', cat: 'Backend', size: 0.95 },
  { id: 'graphql', label: 'GraphQL', cat: 'Backend', size: 0.95 },
  { id: 'python', label: 'Python', cat: 'Backend', size: 1.1 },
  // Big Data / AI
  { id: 'spark', label: 'Apache Spark', cat: 'Big Data · AI', size: 1.25 },
  { id: 'databricks', label: 'Databricks', cat: 'Big Data · AI', size: 1.15 },
  { id: 'tensorflow', label: 'TensorFlow', cat: 'Big Data · AI', size: 1.05 },
  { id: 'pandas', label: 'pandas', cat: 'Big Data · AI', size: 0.95 },
  { id: 'genai', label: 'GenAI / LLMs', cat: 'Big Data · AI', size: 1.1 },
  // DevOps
  { id: 'azure', label: 'Azure', cat: 'DevOps', size: 1.2 },
  { id: 'docker', label: 'Docker', cat: 'DevOps', size: 1.0 },
  { id: 'kubernetes', label: 'Kubernetes', cat: 'DevOps', size: 1.05 },
  { id: 'terraform', label: 'Terraform', cat: 'DevOps', size: 0.9 },
  { id: 'jenkins', label: 'Jenkins', cat: 'DevOps', size: 0.85 },
  // Data
  { id: 'mongo', label: 'MongoDB', cat: 'Data', size: 1.0 },
  { id: 'postgres', label: 'PostgreSQL', cat: 'Data', size: 1.0 },
  { id: 'mysql', label: 'MySQL', cat: 'Data', size: 0.9 },
  { id: 'elastic', label: 'Elasticsearch', cat: 'Data', size: 0.95 },
];

const CATEGORIES = ['Frontend', 'Backend', 'Big Data · AI', 'DevOps', 'Data'];

function SkillsConstellation() {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const [activeCat, setActiveCat] = useState(null);
  const [dims, setDims] = useState({ w: 1200, h: 640 });
  const bodiesRef = useRef([]);
  const draggingRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0, active: false });
  const rafRef = useRef(0);

  // Init bodies
  useEffect(() => {
    const w = wrapRef.current.clientWidth;
    const h = wrapRef.current.clientHeight || 640;
    setDims({ w, h });
    const cx = w / 2, cy = h / 2;
    bodiesRef.current = SKILLS.map((s, i) => {
      const angle = (i / SKILLS.length) * Math.PI * 2;
      const r = Math.min(w, h) * 0.3 + Math.random() * 40;
      return {
        ...s,
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        vx: 0, vy: 0,
        r: 40 * s.size,
      };
    });
  }, []);

  // Resize
  useEffect(() => {
    const onResize = () => {
      if (!wrapRef.current) return;
      const w = wrapRef.current.clientWidth;
      setDims(d => ({ w, h: d.h }));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Simulation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = dims.w * dpr;
    canvas.height = dims.h * dpr;
    canvas.style.width = dims.w + 'px';
    canvas.style.height = dims.h + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    function getAccent() {
      return getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#c8ff3a';
    }

    function step() {
      const bodies = bodiesRef.current;
      const cx = dims.w / 2, cy = dims.h / 2;
      const motion = (window.TWEAKS?.motion ?? 8) / 10;

      for (const b of bodies) {
        if (draggingRef.current === b.id) continue;
        const dx = cx - b.x, dy = cy - b.y;
        const dist = Math.hypot(dx, dy) + 0.001;
        const attract = 0.0006 * motion;
        b.vx += (dx / dist) * (dist - 240) * attract;
        b.vy += (dy / dist) * (dist - 240) * attract;

        if (activeCat && b.cat === activeCat) {
          b.vx += (cx - b.x) * 0.002 * motion;
          b.vy += (cy - b.y) * 0.002 * motion;
        }

        if (mouseRef.current.active) {
          const mdx = b.x - mouseRef.current.x;
          const mdy = b.y - mouseRef.current.y;
          const md = Math.hypot(mdx, mdy);
          if (md < 120 && md > 0.1) {
            const f = (1 - md / 120) * 0.8;
            b.vx += (mdx / md) * f;
            b.vy += (mdy / md) * f;
          }
        }

        for (const o of bodies) {
          if (o === b) continue;
          const odx = b.x - o.x, ody = b.y - o.y;
          const od = Math.hypot(odx, ody);
          const minD = b.r + o.r + 4;
          if (od < minD && od > 0.1) {
            const f = (minD - od) * 0.04;
            b.vx += (odx / od) * f;
            b.vy += (ody / od) * f;
          }
        }

        b.vx *= 0.88;
        b.vy *= 0.88;
        b.x += b.vx;
        b.y += b.vy;

        if (b.x < b.r) { b.x = b.r; b.vx *= -0.5; }
        if (b.x > dims.w - b.r) { b.x = dims.w - b.r; b.vx *= -0.5; }
        if (b.y < b.r) { b.y = b.r; b.vy *= -0.5; }
        if (b.y > dims.h - b.r) { b.y = dims.h - b.r; b.vy *= -0.5; }
      }

      ctx.clearRect(0, 0, dims.w, dims.h);
      const accent = getAccent();

      ctx.lineWidth = 1;
      for (let i = 0; i < bodies.length; i++) {
        for (let j = i+1; j < bodies.length; j++) {
          const a = bodies[i], c = bodies[j];
          if (a.cat !== c.cat) continue;
          const d = Math.hypot(a.x - c.x, a.y - c.y);
          if (d < 260) {
            const op = (1 - d / 260) * 0.25;
            const highlight = activeCat && a.cat === activeCat;
            ctx.strokeStyle = highlight
              ? `${accent}${Math.round(op * 255).toString(16).padStart(2,'0')}`
              : `rgba(244,243,238,${op * 0.6})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(c.x, c.y);
            ctx.stroke();
          }
        }
      }

      for (const b of bodies) {
        const isActive = activeCat === b.cat;
        const dimmed = activeCat && !isActive;
        ctx.globalAlpha = dimmed ? 0.25 : 1;

        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = isActive ? accent : '#0a0a0a';
        ctx.strokeStyle = isActive ? accent : '#2d2d2a';
        ctx.lineWidth = 1;
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isActive ? '#0a0a0a' : '#f4f3ee';
        ctx.font = `${11 * b.size}px 'JetBrains Mono', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(b.label, b.x, b.y);

        ctx.globalAlpha = 1;
      }

      rafRef.current = requestAnimationFrame(step);
    }
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [dims, activeCat]);

  // Mouse handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function getPos(e) {
      const rect = canvas.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
      return { x, y };
    }
    function findBody(x, y) {
      return bodiesRef.current.find(b => Math.hypot(b.x - x, b.y - y) < b.r);
    }

    function onDown(e) {
      const p = getPos(e);
      const b = findBody(p.x, p.y);
      if (b) {
        draggingRef.current = b.id;
        canvas.style.cursor = 'grabbing';
      }
    }
    function onMove(e) {
      const p = getPos(e);
      mouseRef.current = { x: p.x, y: p.y, active: true };
      if (draggingRef.current) {
        const b = bodiesRef.current.find(x => x.id === draggingRef.current);
        if (b) { b.x = p.x; b.y = p.y; b.vx = 0; b.vy = 0; }
      } else {
        const hover = findBody(p.x, p.y);
        canvas.style.cursor = hover ? 'grab' : 'default';
      }
    }
    function onUp() {
      draggingRef.current = null;
      canvas.style.cursor = 'default';
    }
    function onLeave() {
      mouseRef.current.active = false;
      draggingRef.current = null;
    }

    canvas.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointerleave', onLeave);
    return () => {
      canvas.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <div className="skills-wrap" ref={wrapRef} style={{
      width: '100%', height: 640, position: 'relative',
      borderTop: '1px solid var(--rule)',
      borderBottom: '1px solid var(--rule)',
    }}>
      <div style={{
        position: 'absolute', top: 24, left: 40, zIndex: 2,
        display: 'flex', gap: 12, flexWrap: 'wrap',
      }}>
        <button
          onClick={() => setActiveCat(null)}
          style={pillStyle(activeCat === null)}
        >All</button>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setActiveCat(c === activeCat ? null : c)} style={pillStyle(activeCat === c)}>
            {c}
          </button>
        ))}
      </div>

      <div style={{
        position: 'absolute', top: 24, right: 40, zIndex: 2,
        fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.15em',
        color: 'var(--ink-dim)', textTransform: 'uppercase',
      }}>
        ◇ Drag · Hover to scatter · Filter by cluster
      </div>

      <canvas ref={canvasRef} />

      <div style={{
        position: 'absolute', bottom: 16, left: 40, right: 40, zIndex: 2,
        display: 'flex', justifyContent: 'space-between',
        fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.15em',
        color: 'var(--ink-faint)', textTransform: 'uppercase',
      }}>
        <span>[{SKILLS.length} nodes / {CATEGORIES.length} clusters]</span>
        <span>Sim · 60fps · force-directed</span>
      </div>
    </div>
  );
}

function pillStyle(active) {
  return {
    background: active ? 'var(--accent)' : 'transparent',
    color: active ? 'var(--accent-ink)' : 'var(--ink)',
    border: `1px solid ${active ? 'var(--accent)' : 'var(--rule)'}`,
    padding: '8px 14px',
    fontFamily: 'var(--mono)',
    fontSize: 10,
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    transition: 'all 0.2s',
  };
}

const mount = document.getElementById('skills-mount');
if (mount) {
  ReactDOM.createRoot(mount).render(<SkillsConstellation />);
}
