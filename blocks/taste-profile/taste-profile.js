/**
 * Taste Profile block.
 *
 * Authoring model (rows):
 *   Row 1: copy — eyebrow, heading, lede, optional list. Rendered as-is on the left.
 *   Row 2+: each row is a profile with cells:
 *     - cell 1: profile label (button text, e.g. "After dinner")
 *     - cell 2: readout title (e.g. "The after-dinner cup")   [optional]
 *     - cell 3: readout description                            [optional]
 *     - cell 4: six comma-separated 0–1 values for the radar   [optional]
 *               (Strength, Body, Sweetness, Smoothness, Warmth, Crema)
 *
 * The radar visualisation, its per-axis values and the readout copy mirror the
 * source site, where they are defined in JS rather than the document. When the
 * document omits a title / description / values for a known profile label, the
 * canonical dataset below fills them in (matching the original site).
 *
 * Renders the copy on the left and, on the right, an animated six-axis radar
 * chart with toggle buttons that morph the shape and swap the readout.
 */

const AXES = ['Strength', 'Body', 'Sweetness', 'Smoothness', 'Warmth', 'Crema'];

// Point-list labels from the source. Each list item flattens to
// "<Label> <description>" during import; we split it back into a label +
// description so the two-column layout can be restored.
const POINT_LABELS = ['Remembered', 'Adaptive', 'Yours everywhere'];

// Canonical profiles from the source site, keyed by normalised label.
const PROFILE_DATA = {
  weekday: {
    title: 'The weekday cup',
    note: 'Brisk and a little bolder. Enough to meet the day, never so much it rushes you.',
    values: [0.92, 0.62, 0.34, 0.5, 0.66, 0.82],
  },
  'slow-sunday': {
    title: 'The slow Sunday',
    note: 'Softer and rounder, made for lingering. It knows there is nowhere you need to be.',
    values: [0.58, 0.8, 0.6, 0.88, 0.84, 0.62],
  },
  'after-dinner': {
    title: 'The after-dinner cup',
    note: 'Gentle and sweet, half the strength. A quiet close to the evening, not a second start.',
    values: [0.34, 0.7, 0.78, 0.74, 0.9, 0.5],
  },
};

const SVGNS = 'http://www.w3.org/2000/svg';
const CENTER = { x: 210, y: 206 };
const RADIUS = 138;
const RINGS = [0.25, 0.5, 0.75, 1];

const toKey = (s) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
// axis i angle: start at top (-90deg) then clockwise every 60deg
const angleFor = (i) => ((-90 + i * 60) * Math.PI) / 180;
const pointFor = (i, v) => ({
  x: CENTER.x + RADIUS * v * Math.cos(angleFor(i)),
  y: CENTER.y + RADIUS * v * Math.sin(angleFor(i)),
});

function el(name, attrs = {}) {
  const node = document.createElementNS(SVGNS, name);
  Object.entries(attrs).forEach(([k, val]) => node.setAttribute(k, val));
  return node;
}

function buildRadar() {
  const svg = el('svg', {
    viewBox: '0 0 420 420',
    role: 'img',
    'aria-label': 'Flavour profile radar showing six taste dimensions.',
  });
  svg.classList.add('taste-profile-radar');

  // grid rings
  const grid = el('g', { class: 'tp-grid' });
  RINGS.forEach((r, idx) => {
    const pts = AXES.map((_, i) => {
      const p = pointFor(i, r);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    }).join(' ');
    grid.append(el('polygon', {
      points: pts,
      fill: 'none',
      stroke: 'var(--line)',
      'stroke-width': idx === RINGS.length - 1 ? '1.4' : '1',
    }));
  });
  svg.append(grid);

  // axes + labels
  const axes = el('g', { class: 'tp-axes' });
  AXES.forEach((label, i) => {
    const outer = pointFor(i, 1);
    axes.append(el('line', {
      x1: CENTER.x,
      y1: CENTER.y,
      x2: outer.x.toFixed(1),
      y2: outer.y.toFixed(1),
      stroke: 'var(--line)',
      'stroke-width': '1',
    }));
    const lp = pointFor(i, 1.19);
    let anchor = 'middle';
    if (lp.x > CENTER.x + 1) anchor = 'start';
    else if (lp.x < CENTER.x - 1) anchor = 'end';
    const text = el('text', {
      x: lp.x.toFixed(1),
      y: lp.y.toFixed(1),
      'text-anchor': anchor,
      'dominant-baseline': 'middle',
      class: 'tp-label',
    });
    text.textContent = label;
    axes.append(text);
  });
  svg.append(axes);

  // data area + dots (start collapsed at centre, animate outward)
  const area = el('polygon', {
    class: 'tp-area',
    points: '',
    fill: 'var(--terracotta-fill)',
    stroke: 'var(--terracotta)',
    'stroke-width': '2',
  });
  svg.append(area);
  const dots = AXES.map(() => {
    const c = el('circle', {
      cx: CENTER.x, cy: CENTER.y, r: '3.6', class: 'tp-dot',
    });
    svg.append(c);
    return c;
  });

  return { svg, area, dots };
}

export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  // First row is the editorial copy.
  const copyRow = rows.shift();
  const copy = document.createElement('div');
  copy.className = 'taste-profile-copy';
  while (copyRow.firstElementChild) copy.append(copyRow.firstElementChild);

  // Restore the two-column point list: split each "<Label> <description>" item
  // into a terracotta label span + a description span.
  copy.querySelectorAll('ul > li').forEach((item) => {
    const text = item.textContent.trim();
    const match = POINT_LABELS.find((l) => text.toLowerCase().startsWith(l.toLowerCase()));
    if (!match) return;
    const rest = text.slice(match.length).trim();
    item.textContent = '';
    const labelEl = document.createElement('span');
    labelEl.className = 'taste-profile-pt-label';
    labelEl.textContent = match;
    const descEl = document.createElement('span');
    descEl.className = 'taste-profile-pt-text';
    descEl.textContent = rest;
    item.append(labelEl, descEl);
  });

  // Remaining rows are profiles. Merge document content with the canonical dataset.
  const profiles = rows.map((row) => {
    const cells = [...row.children];
    const label = cells[0]?.textContent.trim() || '';
    const key = toKey(label);
    const data = PROFILE_DATA[key] || {};
    // For known profiles the source defines the readout in JS, so the canonical
    // title/note win; otherwise fall back to whatever the document provides.
    const title = data.title || cells[1]?.textContent.trim() || label;
    const note = data.note || cells[2]?.textContent.trim() || '';
    let { values } = data;
    const rawValues = cells[3]?.textContent.trim();
    if (rawValues) {
      const parsed = rawValues.split(',').map((n) => parseFloat(n)).filter((n) => !Number.isNaN(n));
      if (parsed.length === AXES.length) values = parsed;
    }
    if (!values) values = AXES.map(() => 0.5);
    const active = /active/i.test(row.className) || !!cells[0]?.querySelector('strong');
    return {
      label, title, note, values, active,
    };
  });

  // Build the visualisation panel.
  const viz = document.createElement('div');
  viz.className = 'taste-profile-viz';

  const frame = document.createElement('div');
  frame.className = 'taste-profile-frame';
  const { svg, area, dots } = buildRadar();
  frame.append(svg);

  const readout = document.createElement('div');
  readout.className = 'taste-profile-readout';
  const readoutTitle = document.createElement('h4');
  const readoutNote = document.createElement('p');
  readout.append(readoutTitle, readoutNote);
  frame.append(readout);

  const controls = document.createElement('div');
  controls.className = 'taste-profile-controls';

  // Animate the radar shape from its current values to the target profile.
  let current = AXES.map(() => 0);
  let raf = null;
  const easeQuint = (t) => 1 - (1 - t) ** 5;
  const render = (vals) => {
    const pts = vals.map((v, i) => {
      const p = pointFor(i, v);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    });
    area.setAttribute('points', pts.join(' '));
    dots.forEach((dot, i) => {
      const p = pointFor(i, vals[i]);
      dot.setAttribute('cx', p.x.toFixed(1));
      dot.setAttribute('cy', p.y.toFixed(1));
    });
  };
  const animateTo = (target) => {
    if (raf) cancelAnimationFrame(raf);
    const from = current.slice();
    const start = performance.now();
    const dur = 620;
    const step = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const e = easeQuint(t);
      current = from.map((v, i) => v + (target[i] - v) * e);
      render(current);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  };

  const setActive = (profile, btn) => {
    readoutTitle.textContent = profile.title;
    readoutNote.textContent = profile.note;
    controls.querySelectorAll('button').forEach((b) => {
      b.classList.remove('is-active');
      b.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('is-active');
    btn.setAttribute('aria-pressed', 'true');
    animateTo(profile.values);
  };

  let activeIndex = profiles.findIndex((p) => p.active);
  if (activeIndex < 0) activeIndex = 0;

  const buttons = profiles.map((profile) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'taste-profile-btn';
    btn.textContent = profile.label;
    btn.setAttribute('aria-pressed', 'false');
    btn.addEventListener('click', () => setActive(profile, btn));
    controls.append(btn);
    return btn;
  });

  viz.append(frame, controls);
  block.textContent = '';
  block.append(copy, viz);

  // Set the initial readout without animating; animate outward when scrolled in.
  const initial = profiles[activeIndex];
  readoutTitle.textContent = initial.title;
  readoutNote.textContent = initial.note;
  buttons[activeIndex].classList.add('is-active');
  buttons[activeIndex].setAttribute('aria-pressed', 'true');

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateTo(initial.values);
        obs.disconnect();
      }
    });
  }, { threshold: 0.35 });
  observer.observe(block);
}
